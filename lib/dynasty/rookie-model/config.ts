import { z } from "zod";

import type { RookieModelConfiguration } from "@/types/rookie-engine";

const metricSchema = z.object({
  buckets: z.array(z.object({ minimum: z.number(), score: z.number().min(0).max(100) })).min(1).optional(),
  description: z.string().min(1),
  direction: z.enum(["higher", "lower"]),
  family: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  weight: z.number().positive(),
});

export const rookieModelConfigurationSchema = z
  .object({
    label: z.string().min(1),
    normalization: z.enum(["class-relative", "historical-percentile"]),
    overallWeights: z.object({
      draftCapital: z.number().nonnegative(),
      market: z.number().nonnegative(),
      prospect: z.number().nonnegative(),
      situation: z.number().nonnegative(),
    }),
    position: z.enum(["QB", "RB", "WR", "TE"]),
    prospectFamilies: z.array(
      z.object({
        applicabilityMetricKey: z.string().min(1).optional(),
        key: z.string().min(1),
        label: z.string().min(1),
        minimumCoverage: z.number().min(0).max(1),
        metrics: z.array(metricSchema).min(1),
        optionalEvidence: z.boolean().optional(),
        required: z.boolean().optional(),
        weight: z.number().positive(),
      }),
    ),
    tierThresholds: z.array(
      z.object({ label: z.string().min(1), minimum: z.number().min(0).max(100) }),
    ),
    version: z.string().min(1),
    winsorization: z.object({
      lower: z.number().min(0).max(1),
      upper: z.number().min(0).max(1),
    }),
  })
  .superRefine((configuration, context) => {
    const familyWeight = configuration.prospectFamilies.reduce(
      (total, family) => total + family.weight,
      0,
    );
    const overallWeight = Object.values(configuration.overallWeights).reduce(
      (total, weight) => total + weight,
      0,
    );

    if (Math.abs(familyWeight - 1) > 0.0001) {
      context.addIssue({ code: "custom", message: "Prospect family weights must total 1." });
    }
    if (Math.abs(overallWeight - 1) > 0.0001) {
      context.addIssue({ code: "custom", message: "Overall weights must total 1." });
    }
    if (configuration.winsorization.lower >= configuration.winsorization.upper) {
      context.addIssue({ code: "custom", message: "Winsorization bounds are invalid." });
    }
    configuration.prospectFamilies.forEach((family) => {
      const metricWeight = family.metrics.reduce((total, metric) => total + metric.weight, 0);
      if (Math.abs(metricWeight - 1) > 0.0001) {
        context.addIssue({ code: "custom", message: `${family.label} metric weights must total 1.` });
      }
    });
  });

const tierThresholds = [
  { label: "Tier 1", minimum: 85 },
  { label: "Tier 2", minimum: 75 },
  { label: "Tier 3", minimum: 65 },
  { label: "Tier 4", minimum: 50 },
  { label: "Tier 5", minimum: 0 },
];

const shared = {
  normalization: "class-relative" as const,
  // Stein-inspired, but limited to reproducible inputs. Draft capital remains
  // separate from Prospect Score; market and landing spot stay visible as
  // standalone context instead of changing the pre-draft model score.
  overallWeights: { draftCapital: 0.4, market: 0, prospect: 0.6, situation: 0 },
  tierThresholds,
  version: "mvp-5",
  winsorization: { lower: 0.02, upper: 0.98 },
};

export const wrModelConfiguration: RookieModelConfiguration = {
  ...shared,
  label: "WR explainable model",
  position: "WR",
  version: "mvp-10",
  prospectFamilies: [
    {
      key: "production",
      label: "Production and receiving quality",
      minimumCoverage: 0.5,
      required: true,
      // 20% production thresholds + 10% workload-weighted receiving quality.
      // The reproducible WR prospect inputs total 48 points, so 30 / 48.
      weight: 0.697917,
      metrics: [
        { key: "pass_play_usage", label: "Final-season pass-play usage", description: "CFBD share of team passing plays involving the player; retained separately from true target share.", direction: "higher", family: "production", weight: 0.2 },
        { key: "best_pass_play_usage", label: "Best pass-play usage", description: "Best documented CFBD pass-play usage season.", direction: "higher", family: "production", weight: 0.15 },
        { key: "receiving_yard_share", label: "Receiving-yard share", description: "Share of team receiving yards produced.", direction: "higher", family: "production", weight: 0.25 },
        { key: "receiving_ppa", label: "Final-season receiving PPA", description: "Average predicted points added on CFBD passing plays involving the receiver.", direction: "higher", family: "production", weight: 0.15 },
        { key: "career_receiving_ppa", label: "Career receiving PPA", description: "Average of documented CFBD season-level receiving PPA values.", direction: "higher", family: "production", weight: 0.125 },
        { key: "best_receiving_ppa", label: "Best receiving PPA", description: "Best documented CFBD receiving PPA season.", direction: "higher", family: "production", weight: 0.125 },
      ],
    },
    {
      key: "age",
      label: "Age and declaration",
      minimumCoverage: 0.4,
      // Transparent replacement for the source model's 13% experience score.
      weight: 0.302083,
      metrics: [
        { key: "age_at_draft", label: "Age at draft", description: "Player age on draft day.", direction: "lower", family: "age", weight: 0.65 },
        { key: "early_declare", label: "Early declare", description: "Entered the NFL draft before exhausting eligibility.", direction: "higher", family: "age", weight: 0.35 },
      ],
    },
  ],
};

export const rbModelConfiguration: RookieModelConfiguration = {
  ...shared,
  label: "RB explainable model",
  position: "RB",
  version: "mvp-10",
  prospectFamilies: [
    {
      key: "production",
      label: "Normalized production",
      minimumCoverage: 0.5,
      required: true,
      weight: 0.46875,
      metrics: [
        { key: "scrimmage_yards_per_game", label: "Scrimmage yards per game", description: "Rushing and receiving yards normalized by games played.", direction: "higher", family: "production", weight: 0.25 },
        { key: "rushing_yard_share", label: "Rushing-yard share", description: "Share of team rushing yards produced.", direction: "higher", family: "production", weight: 0.2 },
        { key: "rushing_ppa", label: "Final-season rushing PPA", description: "Average predicted points added on CFBD rushing plays.", direction: "higher", family: "production", weight: 0.2 },
        { key: "career_rushing_ppa", label: "Career rushing PPA", description: "Average of documented CFBD season-level rushing PPA values.", direction: "higher", family: "production", weight: 0.175 },
        { key: "best_rushing_ppa", label: "Best rushing PPA", description: "Best documented CFBD rushing PPA season.", direction: "higher", family: "production", weight: 0.175 },
      ],
    },
    {
      key: "receiving",
      label: "Receiving and workload quality",
      minimumCoverage: 0.5,
      // Production and receiving combine to 62.5% of the reproducible RB
      // prospect score (30 source-model points out of 48).
      weight: 0.229167,
      metrics: [
        { key: "receptions_per_game", label: "Receptions per game", description: "College receptions normalized by games played.", direction: "higher", family: "receiving", weight: 0.4 },
        { key: "receiving_ppa", label: "Final-season receiving PPA", description: "Average predicted points added on CFBD passing plays involving the back.", direction: "higher", family: "receiving", weight: 0.2 },
        { key: "career_receiving_ppa", label: "Career receiving PPA", description: "Average of documented CFBD season-level receiving PPA values.", direction: "higher", family: "receiving", weight: 0.2 },
        { key: "best_receiving_ppa", label: "Best receiving PPA", description: "Best documented CFBD receiving PPA season.", direction: "higher", family: "receiving", weight: 0.2 },
      ],
    },
    {
      key: "age_recruiting",
      label: "Age and declaration",
      minimumCoverage: 0.34,
      weight: 0.302083,
      metrics: [
        { key: "age_at_draft", label: "Age at draft", description: "Player age on draft day.", direction: "lower", family: "age_recruiting", weight: 0.65 },
        { key: "early_declare", label: "Early declare", description: "Entered the NFL draft before exhausting eligibility.", direction: "higher", family: "age_recruiting", weight: 0.35 },
      ],
    },
  ],
};

export const qbModelConfiguration: RookieModelConfiguration = {
  ...shared,
  label: "QB explainable model",
  position: "QB",
  version: "mvp-7",
  prospectFamilies: [
    {
      key: "passing_rushing_quality",
      label: "Passing and rushing quality",
      minimumCoverage: 0.5,
      required: true,
      // Reproducible QB production/grade inputs are 30 of 45 source-model points.
      weight: 0.666667,
      metrics: [
        { key: "passing_ppa", label: "Final-season passing PPA", description: "Average predicted points added on documented passing plays.", direction: "higher", family: "passing_rushing_quality", weight: 0.16 },
        { key: "career_passing_ppa", label: "Career passing PPA", description: "Average of documented season-level passing PPA values.", direction: "higher", family: "passing_rushing_quality", weight: 0.14 },
        { key: "best_passing_ppa", label: "Best passing PPA", description: "Best documented passing PPA season.", direction: "higher", family: "passing_rushing_quality", weight: 0.12 },
        { key: "rushing_ppa", label: "Final-season rushing PPA", description: "Average predicted points added on documented quarterback rushing plays.", direction: "higher", family: "passing_rushing_quality", weight: 0.08 },
        { key: "best_rushing_ppa", label: "Best rushing PPA", description: "Best documented quarterback rushing PPA season.", direction: "higher", family: "passing_rushing_quality", weight: 0.05 },
        { key: "qbr", label: "ESPN QBR", description: "Opponent-adjusted quarterback efficiency published in the Stein workbook.", direction: "higher", family: "passing_rushing_quality", weight: 0.12 },
        { key: "adjusted_yards_per_attempt", label: "Adjusted yards per attempt", description: "Passing efficiency incorporating touchdowns and interceptions.", direction: "higher", family: "passing_rushing_quality", weight: 0.1 },
        { key: "pff_passing_grade", label: "PFF passing grade", description: "Attributed final-season passing grade from the Stein workbook.", direction: "higher", family: "passing_rushing_quality", weight: 0.1 },
        { key: "epa_per_dropback", label: "EPA per dropback", description: "Final-season expected points added per quarterback dropback.", direction: "higher", family: "passing_rushing_quality", weight: 0.08 },
        { key: "adjusted_completion_percentage", label: "Adjusted completion percentage", description: "Completion rate adjusted for receiver drops and non-aimed throws.", direction: "higher", family: "passing_rushing_quality", weight: 0.05 },
      ],
    },
    {
      key: "age",
      label: "Age and declaration",
      minimumCoverage: 0.4,
      weight: 0.333333,
      metrics: [
        { key: "age_at_draft", label: "Age at draft", description: "Player age on draft day.", direction: "lower", family: "age", weight: 0.65 },
        { key: "early_declare", label: "Early declare", description: "Entered the NFL draft before exhausting eligibility.", direction: "higher", family: "age", weight: 0.35 },
      ],
    },
  ],
};

export const teModelConfiguration: RookieModelConfiguration = {
  ...shared,
  label: "TE explainable model",
  position: "TE",
  version: "mvp-12",
  prospectFamilies: [
    {
      key: "production",
      label: "Production and receiving quality",
      minimumCoverage: 0.4,
      required: true,
      // Common base path: production remains comparable for tested and
      // documented non-testing prospects.
      weight: 0.5,
      metrics: [
        { key: "career_yprr", label: "Career YPRR", description: "Career receiving yards per route run from an approved route source.", direction: "higher", family: "production", weight: 0.15 },
        { key: "best_yprr", label: "Best-season YPRR", description: "Best documented receiving yards per route run season.", direction: "higher", family: "production", weight: 0.12 },
        { key: "receiving_yprr", label: "Final-season YPRR", description: "Final-season receiving yards per route run.", direction: "higher", family: "production", weight: 0.12 },
        { key: "target_share", label: "Target share", description: "Share of documented team targets.", direction: "higher", family: "production", weight: 0.1 },
        { key: "receiving_yard_share", label: "Receiving-yard share", description: "Share of team receiving yards produced.", direction: "higher", family: "production", weight: 0.12 },
        { key: "receiving_ppa", label: "Final-season receiving PPA", description: "Average predicted points added on passing plays involving the tight end.", direction: "higher", family: "production", weight: 0.08 },
        { key: "career_receiving_ppa", label: "Career receiving PPA", description: "Average of documented season-level receiving PPA values.", direction: "higher", family: "production", weight: 0.06 },
        { key: "best_receiving_ppa", label: "Best receiving PPA", description: "Best documented receiving PPA season.", direction: "higher", family: "production", weight: 0.05 },
        { key: "pff_receiving_grade", label: "PFF receiving grade", description: "Attributed final-season receiving grade from the Stein workbook.", direction: "higher", family: "production", weight: 0.07 },
        { key: "receiving_epa_per_play", label: "Receiving EPA per play", description: "Expected points added per documented passing play involving the tight end.", direction: "higher", family: "production", weight: 0.05 },
        { key: "weighted_dominator", label: "Weighted dominator", description: "Weighted share of team receiving yards and touchdowns.", direction: "higher", family: "production", weight: 0.04 },
        { key: "receiving_yards_per_team_pass_attempt", label: "Receiving yards per team pass attempt", description: "Receiving yards normalized by team pass attempts.", direction: "higher", family: "production", weight: 0.04 },
      ],
    },
    {
      key: "age",
      label: "Age and declaration",
      minimumCoverage: 0.4,
      weight: 0.5,
      metrics: [
        { key: "age_at_draft", label: "Age at draft", description: "Player age on draft day.", direction: "lower", family: "age", weight: 0.65 },
        { key: "early_declare", label: "Early declare", description: "Entered the NFL draft before exhausting eligibility.", direction: "higher", family: "age", weight: 0.35 },
      ],
    },
  ],
};

export function validateRookieModelConfiguration(configuration: RookieModelConfiguration) {
  return rookieModelConfigurationSchema.parse(configuration);
}

validateRookieModelConfiguration(wrModelConfiguration);
validateRookieModelConfiguration(rbModelConfiguration);
validateRookieModelConfiguration(qbModelConfiguration);
validateRookieModelConfiguration(teModelConfiguration);

export const rookieModelConfigurations = [qbModelConfiguration, rbModelConfiguration, wrModelConfiguration, teModelConfiguration];
