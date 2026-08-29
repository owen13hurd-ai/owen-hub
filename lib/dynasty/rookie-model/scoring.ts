import type {
  RookieMetricDefinition,
  RookieMetricInput,
  RookieMetricReference,
  RookieModelConfiguration,
  RookieScoreContext,
  RookieScoreResult,
} from "@/types/rookie-engine";

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function percentile(values: number[], quantile: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const index = (sorted.length - 1) * quantile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function normalizeRookieMetric(
  value: number,
  referenceValues: number[],
  metric: RookieMetricDefinition,
  bounds: RookieModelConfiguration["winsorization"],
) {
  const finiteValues = referenceValues.filter(Number.isFinite);
  if (finiteValues.length === 0) return null;

  const lower = percentile(finiteValues, bounds.lower);
  const upper = percentile(finiteValues, bounds.upper);
  if (lower === null || upper === null) return null;
  if (upper === lower) return 50;

  const winsorized = clamp(value, lower, upper);
  const ascending = ((winsorized - lower) / (upper - lower)) * 100;
  return Number((metric.direction === "higher" ? ascending : 100 - ascending).toFixed(2));
}

export function calculateRookieScore(
  configuration: RookieModelConfiguration,
  inputs: RookieMetricInput[],
  references: RookieMetricReference[],
  context: RookieScoreContext,
): RookieScoreResult {
  const inputByKey = new Map(inputs.map((input) => [input.key, input]));
  const referenceByKey = new Map(references.map((reference) => [reference.key, reference.values]));
  const components = configuration.prospectFamilies.flatMap((family) => {
    const available = family.metrics.filter((metric) => inputByKey.get(metric.key)?.value != null);
    const availableWeight = available.reduce((total, metric) => total + metric.weight, 0);

    return family.metrics.map((metric) => {
      const input = inputByKey.get(metric.key);
      const rawValue = input?.value ?? null;
      const normalizedValue =
        rawValue === null
          ? null
          : normalizeRookieMetric(
              rawValue,
              referenceByKey.get(metric.key) ?? [],
              metric,
              configuration.winsorization,
            );
      const adjustedWeight = availableWeight > 0 && rawValue !== null ? metric.weight / availableWeight : 0;
      const contribution = normalizedValue === null ? null : normalizedValue * adjustedWeight;

      return {
        contribution,
        explanation:
          rawValue === null
            ? `${metric.label} is missing and receives no neutral value.`
            : normalizedValue === null
              ? `${metric.label} cannot be normalized because its reference cohort is empty.`
              : `${metric.label} scored ${normalizedValue.toFixed(1)} within the configured ${configuration.normalization} cohort.`,
        familyKey: family.key,
        familyLabel: family.label,
        key: metric.key,
        label: metric.label,
        missing: rawValue === null,
        normalizedValue,
        rawValue,
        sourceId: input?.sourceId ?? null,
        weight: adjustedWeight,
      };
    });
  });

  const families = configuration.prospectFamilies.map((family) => {
    const applicable = !family.applicabilityMetricKey || inputByKey.get(family.applicabilityMetricKey)?.value !== 0;
    const familyComponents = components.filter((component) => component.familyKey === family.key);
    const availableCount = familyComponents.filter((component) => component.normalizedValue !== null).length;
    const coverage = availableCount / family.metrics.length;
    const suppressed = !applicable || coverage < family.minimumCoverage;
    const score = suppressed
      ? null
      : familyComponents.reduce((total, component) => total + (component.contribution ?? 0), 0);
    return { applicable, coverage, key: family.key, label: family.label, score, suppressed, weight: family.weight };
  });

  const scoredFamilies = families.filter((family) => family.score !== null);
  const missingRequiredFamily = configuration.prospectFamilies.some((definition) =>
    definition.required && families.find((family) => family.key === definition.key)?.score === null,
  );
  const availableFamilyWeight = scoredFamilies.reduce((total, family) => total + family.weight, 0);
  const prospectScore =
    missingRequiredFamily || availableFamilyWeight === 0
      ? null
      : scoredFamilies.reduce(
          (total, family) => total + (family.score ?? 0) * (family.weight / availableFamilyWeight),
          0,
        );
  const applicableFamilies = families.filter((family) => family.applicable);
  const applicableWeight = applicableFamilies.reduce((total, family) => total + family.weight, 0);
  const coverage = applicableWeight === 0 ? 0 : applicableFamilies.reduce(
    (total, family) => total + family.coverage * (family.weight / applicableWeight),
    0,
  );

  const overallParts = [
    { value: prospectScore, weight: configuration.overallWeights.prospect },
    { value: context.draftCapital, weight: configuration.overallWeights.draftCapital },
    { value: context.market, weight: configuration.overallWeights.market },
    { value: context.situation, weight: configuration.overallWeights.situation },
  ].filter((part): part is { value: number; weight: number } => part.value !== null);
  const overallAvailableWeight = overallParts.reduce((total, part) => total + part.weight, 0);
  const overallScore =
    prospectScore === null || overallAvailableWeight === 0
      ? null
      : overallParts.reduce((total, part) => total + part.value * (part.weight / overallAvailableWeight), 0);
  const tier =
    overallScore === null
      ? null
      : configuration.tierThresholds.find((threshold) => overallScore >= threshold.minimum)?.label ?? null;

  return {
    components,
    coverage: Number((coverage * 100).toFixed(1)),
    draftCapitalScore: context.draftCapital,
    families,
    marketScore: context.market,
    normalization: configuration.normalization,
    overallScore: overallScore === null ? null : Number(overallScore.toFixed(2)),
    prospectScore: prospectScore === null ? null : Number(prospectScore.toFixed(2)),
    situationScore: context.situation,
    tier,
  };
}
