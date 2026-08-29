export type RookieBacktestObservation = {
  classYear: number;
  consensusRank: number | null;
  draftCapitalScore: number | null;
  fantasyPoints: number | null;
  fantasyPpg: number | null;
  games: number | null;
  marketScore: number | null;
  overallScore?: number | null;
  peakDynastyValue: number | null;
  playerId: string;
  playerName?: string;
  positionFinish: number | null;
  prospectScore: number | null;
  familyScores?: Record<string, number>;
  metricScores?: Record<string, number>;
  scoringDate: string;
  outcomeAvailableDate?: string;
};

export type RookieSeasonOutcome = {
  fantasy_points: number | null;
  fantasy_ppg: number | null;
  games: number | null;
  nfl_season: number;
  peak_dynasty_value: number | null;
  player_id: string;
  position_finish: number | null;
};

export function aggregateThreeYearOutcomes(outcomes: RookieSeasonOutcome[], classYearByPlayer: Map<string, number>, completedSeasons = [...new Set(outcomes.map((row) => row.nfl_season))]) {
  const covered = new Set(completedSeasons);
  const grouped = new Map<string, RookieSeasonOutcome[]>();
  outcomes.forEach((outcome) => grouped.set(outcome.player_id, [...(grouped.get(outcome.player_id) ?? []), outcome]));
  return [...classYearByPlayer.entries()].flatMap(([playerId, classYear]) => {
    if (![classYear, classYear + 1, classYear + 2].every((year) => covered.has(year))) return [];
    const rows = grouped.get(playerId) ?? [];
    const window = rows.filter((row) => row.nfl_season >= classYear && row.nfl_season <= classYear + 2);
    if (new Set(window.map((row) => row.nfl_season)).size !== window.length) throw new Error(`Duplicate outcome season for ${playerId}`);
    const finite = (values: Array<number | null>) => values.filter((value): value is number => value !== null);
    const ppg = finite(window.map((row) => row.fantasy_ppg));
    const finishes = finite(window.map((row) => row.position_finish));
    const peaks = finite(window.map((row) => row.peak_dynasty_value));
    return [{
      fantasy_points: window.length ? finite(window.map((row) => row.fantasy_points)).reduce((sum, value) => sum + value, 0) : null,
      fantasy_ppg: ppg.length === 3 ? Math.max(...ppg) : null,
      games: window.length ? finite(window.map((row) => row.games)).reduce((sum, value) => sum + value, 0) : null,
      nfl_season: classYear + 2,
      peak_dynasty_value: peaks.length ? Math.max(...peaks) : null,
      player_id: playerId,
      position_finish: finishes.length === 3 ? Math.min(...finishes) : null,
      outcome_available_date: `${classYear + 3}-04-01`,
      missing_seasons: 3 - window.length,
    }];
  });
}

export type RookieBacktestReport = {
  outcomeAudit?: { mode: string; seasons: number[]; immaturePlayers: number; missingEntireWindow: number; missingSomeSeasons: number; maturedPlayers: number };
  calibrationBuckets: Array<{ count: number; label: string; observedTop24Rate: number | null }>;
  cohortCount: number;
  excludedForLeakage: number;
  excludedWithoutOutcome: number;
  metrics: {
    averageFantasyPpg: number | null;
    averageGames: number | null;
    averagePeakDynastyValue: number | null;
    top12Rate: number | null;
    top24Rate: number | null;
    top12Interval: [number, number] | null;
    top24Interval: [number, number] | null;
  };
  classification: { precision: number | null; recall: number | null; scoreThreshold: number; target: string };
  rankCorrelations: {
    draftCapitalToPpg: number | null;
    marketToPpg: number | null;
    prospectToPpg: number | null;
    consensusToPpg: number | null;
  };
  rollingOrigin: {
    combinedPpgMae: number | null;
    combinedTop24Brier: number | null;
    draftCapitalPpgMae: number | null;
    draftCapitalTop24Brier: number | null;
    evaluatedCount: number;
    prospectPpgMae: number | null;
    prospectTop24Brier: number | null;
    testClasses: number[];
  };
  familyAblations: Array<{
    combinedPpgMae: number | null;
    combinedTop24Brier: number | null;
    draftCapitalPpgMae: number | null;
    draftCapitalTop24Brier: number | null;
    evaluatedCount: number;
    familyKey: string;
    familyPpgMae: number | null;
    familyTop24Brier: number | null;
  }>;
  historicalLeaders: Array<{
    classYear: number;
    fantasyPpg: number | null;
    overallScore: number;
    playerId: string;
    playerName: string;
    positionFinish: number | null;
    prospectScore: number | null;
  }>;
  metricAblations: Array<{
    combinedPpgMae: number | null;
    combinedTop24Brier: number | null;
    draftCapitalPpgMae: number | null;
    draftCapitalTop24Brier: number | null;
    evaluatedCount: number;
    metricKey: string;
    metricPpgMae: number | null;
    metricTop24Brier: number | null;
  }>;
};

export function wilsonInterval(successes: number, total: number): [number, number] | null {
  if (total === 0) return null;
  const z = 1.96;
  const proportion = successes / total;
  const denominator = 1 + z ** 2 / total;
  const center = (proportion + z ** 2 / (2 * total)) / denominator;
  const margin = z * Math.sqrt((proportion * (1 - proportion) + z ** 2 / (4 * total)) / total) / denominator;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function ranks(values: number[]) {
  const sorted = values.map((value, index) => ({ index, value })).sort((first, second) => first.value - second.value);
  const result = Array<number>(values.length);
  for (let index = 0; index < sorted.length;) {
    let end = index;
    while (end + 1 < sorted.length && sorted[end + 1].value === sorted[index].value) end += 1;
    const rank = (index + end + 2) / 2;
    for (let cursor = index; cursor <= end; cursor += 1) result[sorted[cursor].index] = rank;
    index = end + 1;
  }
  return result;
}

export function spearmanCorrelation(pairs: Array<[number, number]>) {
  if (pairs.length < 3) return null;
  const firstRanks = ranks(pairs.map(([first]) => first));
  const secondRanks = ranks(pairs.map(([, second]) => second));
  const firstMean = average(firstRanks) ?? 0;
  const secondMean = average(secondRanks) ?? 0;
  const numerator = firstRanks.reduce((total, first, index) => total + (first - firstMean) * (secondRanks[index] - secondMean), 0);
  const firstScale = Math.sqrt(firstRanks.reduce((total, value) => total + (value - firstMean) ** 2, 0));
  const secondScale = Math.sqrt(secondRanks.reduce((total, value) => total + (value - secondMean) ** 2, 0));
  return firstScale && secondScale ? numerator / (firstScale * secondScale) : null;
}

function fitLinear(pairs: Array<[number, number]>) {
  const model = fitTwoFeatureLinear(pairs.map(([x, y]) => ({ x: [x, 0], y })));
  if (!model) return null;
  const slope = model.weights[0] / model.scales[0];
  return { intercept: model.intercept - slope * model.means[0], slope };
}

function fitLogistic(pairs: Array<[number, number]>) {
  if (pairs.length < 20 || new Set(pairs.map(([, y]) => y)).size < 2) return null;
  const mean = average(pairs.map(([x]) => x)) ?? 0;
  const scale = Math.sqrt(average(pairs.map(([x]) => (x - mean) ** 2)) ?? 0) || 1;
  let intercept = 0;
  let slope = 0;
  for (let iteration = 0; iteration < 1500; iteration += 1) {
    let interceptGradient = 0;
    let slopeGradient = 0;
    for (const [x, y] of pairs) {
      const standardized = (x - mean) / scale;
      const probability = 1 / (1 + Math.exp(-(intercept + slope * standardized)));
      interceptGradient += probability - y;
      slopeGradient += (probability - y) * standardized;
    }
    intercept -= 0.05 * interceptGradient / pairs.length;
    slope -= 0.05 * (slopeGradient + slope) / pairs.length;
  }
  return { intercept, mean, scale, slope };
}

function fitTwoFeatureLinear(rows: Array<{ x: [number, number]; y: number }>) {
  if (rows.length < 20) return null;
  const means: [number, number] = [average(rows.map((row) => row.x[0])) ?? 0, average(rows.map((row) => row.x[1])) ?? 0];
  const scales: [number, number] = means.map((mean, index) => Math.sqrt(average(rows.map((row) => (row.x[index] - mean) ** 2)) ?? 0) || 1) as [number, number];
  const standardized = rows.map((row) => ({ x: row.x.map((value, index) => (value - means[index]) / scales[index]) as [number, number], y: row.y }));
  const yMean = average(rows.map((row) => row.y)) ?? 0;
  const a = standardized.reduce((total, row) => total + row.x[0] ** 2, 0) + 1;
  const b = standardized.reduce((total, row) => total + row.x[0] * row.x[1], 0);
  const d = standardized.reduce((total, row) => total + row.x[1] ** 2, 0) + 1;
  const c = standardized.reduce((total, row) => total + row.x[0] * (row.y - yMean), 0);
  const e = standardized.reduce((total, row) => total + row.x[1] * (row.y - yMean), 0);
  const determinant = a * d - b * b;
  if (!determinant) return null;
  return { intercept: yMean, means, scales, weights: [(c * d - b * e) / determinant, (a * e - b * c) / determinant] as [number, number] };
}

function fitTwoFeatureLogistic(rows: Array<{ x: [number, number]; y: number }>) {
  if (rows.length < 20 || new Set(rows.map((row) => row.y)).size < 2) return null;
  const means: [number, number] = [average(rows.map((row) => row.x[0])) ?? 0, average(rows.map((row) => row.x[1])) ?? 0];
  const scales: [number, number] = means.map((mean, index) => Math.sqrt(average(rows.map((row) => (row.x[index] - mean) ** 2)) ?? 0) || 1) as [number, number];
  let intercept = 0;
  const weights: [number, number] = [0, 0];
  for (let iteration = 0; iteration < 1500; iteration += 1) {
    const gradients: [number, number] = [0, 0];
    let interceptGradient = 0;
    for (const row of rows) {
      const x = row.x.map((value, index) => (value - means[index]) / scales[index]);
      const probability = 1 / (1 + Math.exp(-(intercept + weights[0] * x[0] + weights[1] * x[1])));
      interceptGradient += probability - row.y;
      gradients[0] += (probability - row.y) * x[0];
      gradients[1] += (probability - row.y) * x[1];
    }
    intercept -= 0.05 * interceptGradient / rows.length;
    weights[0] -= 0.05 * (gradients[0] + weights[0]) / rows.length;
    weights[1] -= 0.05 * (gradients[1] + weights[1]) / rows.length;
  }
  return { intercept, means, scales, weights };
}

function rollingOriginEvaluation(cohort: RookieBacktestObservation[]) {
  // Both candidates use identical players, target availability, and training-only scaling.
  cohort = cohort.filter((row) => Number.isFinite(row.prospectScore) && Number.isFinite(row.draftCapitalScore) && Number.isFinite(row.fantasyPpg) && Number.isFinite(row.positionFinish));
  const classes = [...new Set(cohort.map((observation) => observation.classYear))].sort((a, b) => a - b);
  const predictions = { combined: [] as Array<{ actualPpg: number; actualTop24: number; ppg: number; top24: number }>, draft: [] as Array<{ actualPpg: number; actualTop24: number; ppg: number; top24: number }>, prospect: [] as Array<{ actualPpg: number; actualTop24: number; ppg: number; top24: number }> };
  const testClasses = new Set<number>();
  for (const testClass of classes) {
    const training = cohort.filter((observation) => observation.classYear < testClass && (observation.outcomeAvailableDate ?? `${observation.classYear + 3}-04-01`) <= `${testClass}-09-01`);
    const testing = cohort.filter((observation) => observation.classYear === testClass);
    for (const [label, key] of [["prospect", "prospectScore"], ["draft", "draftCapitalScore"]] as const) {
      const ppgModel = fitLinear(training.flatMap((observation) => observation[key] === null || observation.fantasyPpg === null ? [] : [[observation[key], observation.fantasyPpg] as [number, number]]));
      const hitModel = fitLogistic(training.flatMap((observation) => observation[key] === null || observation.positionFinish === null ? [] : [[observation[key], observation.positionFinish <= 24 ? 1 : 0] as [number, number]]));
      if (!ppgModel || !hitModel) continue;
      for (const observation of testing) {
        const score = observation[key];
        if (score === null || observation.fantasyPpg === null || observation.positionFinish === null) continue;
        const standardized = (score - hitModel.mean) / hitModel.scale;
        predictions[label].push({
          actualPpg: observation.fantasyPpg,
          actualTop24: observation.positionFinish <= 24 ? 1 : 0,
          ppg: ppgModel.intercept + ppgModel.slope * score,
          top24: 1 / (1 + Math.exp(-(hitModel.intercept + hitModel.slope * standardized))),
        });
        testClasses.add(testClass);
      }
    }
    const combinedTraining = training.filter((observation) => observation.prospectScore !== null && observation.draftCapitalScore !== null);
    const combinedPpg = fitTwoFeatureLinear(combinedTraining.flatMap((observation) => observation.fantasyPpg === null ? [] : [{ x: [observation.prospectScore!, observation.draftCapitalScore!] as [number, number], y: observation.fantasyPpg }]));
    const combinedHit = fitTwoFeatureLogistic(combinedTraining.flatMap((observation) => observation.positionFinish === null ? [] : [{ x: [observation.prospectScore!, observation.draftCapitalScore!] as [number, number], y: observation.positionFinish <= 24 ? 1 : 0 }]));
    if (combinedPpg && combinedHit) for (const observation of testing) {
      if (observation.prospectScore === null || observation.draftCapitalScore === null || observation.fantasyPpg === null || observation.positionFinish === null) continue;
      const x: [number, number] = [observation.prospectScore, observation.draftCapitalScore];
      const linearX = x.map((value, index) => (value - combinedPpg.means[index]) / combinedPpg.scales[index]);
      const logisticX = x.map((value, index) => (value - combinedHit.means[index]) / combinedHit.scales[index]);
      predictions.combined.push({ actualPpg: observation.fantasyPpg, actualTop24: observation.positionFinish <= 24 ? 1 : 0, ppg: combinedPpg.intercept + combinedPpg.weights[0] * linearX[0] + combinedPpg.weights[1] * linearX[1], top24: 1 / (1 + Math.exp(-(combinedHit.intercept + combinedHit.weights[0] * logisticX[0] + combinedHit.weights[1] * logisticX[1]))) });
      testClasses.add(testClass);
    }
  }
  const mae = (rows: typeof predictions.prospect) => average(rows.map((row) => Math.abs(row.ppg - row.actualPpg)));
  const brier = (rows: typeof predictions.prospect) => average(rows.map((row) => (row.top24 - row.actualTop24) ** 2));
  return {
    combinedPpgMae: mae(predictions.combined),
    combinedTop24Brier: brier(predictions.combined),
    draftCapitalPpgMae: mae(predictions.draft),
    draftCapitalTop24Brier: brier(predictions.draft),
    evaluatedCount: Math.min(predictions.prospect.length, predictions.draft.length, predictions.combined.length),
    prospectPpgMae: mae(predictions.prospect),
    prospectTop24Brier: brier(predictions.prospect),
    testClasses: [...testClasses],
  };
}

function rollingFamilyEvaluation(cohort: RookieBacktestObservation[], familyKey: string) {
  const aligned = cohort.filter((observation) => observation.familyScores?.[familyKey] !== undefined && observation.draftCapitalScore !== null);
  const remapped = aligned.map((observation) => ({ ...observation, prospectScore: observation.familyScores![familyKey] }));
  const result = rollingOriginEvaluation(remapped);
  return {
    combinedPpgMae: result.combinedPpgMae,
    combinedTop24Brier: result.combinedTop24Brier,
    draftCapitalPpgMae: result.draftCapitalPpgMae,
    draftCapitalTop24Brier: result.draftCapitalTop24Brier,
    evaluatedCount: result.evaluatedCount,
    familyKey,
    familyPpgMae: result.prospectPpgMae,
    familyTop24Brier: result.prospectTop24Brier,
  };
}

function rollingMetricEvaluation(cohort: RookieBacktestObservation[], metricKey: string) {
  const aligned = cohort.filter((observation) => observation.metricScores?.[metricKey] !== undefined && observation.draftCapitalScore !== null);
  const remapped = aligned.map((observation) => ({ ...observation, prospectScore: observation.metricScores![metricKey] }));
  const result = rollingOriginEvaluation(remapped);
  return {
    combinedPpgMae: result.combinedPpgMae,
    combinedTop24Brier: result.combinedTop24Brier,
    draftCapitalPpgMae: result.draftCapitalPpgMae,
    draftCapitalTop24Brier: result.draftCapitalTop24Brier,
    evaluatedCount: result.evaluatedCount,
    metricKey,
    metricPpgMae: result.prospectPpgMae,
    metricTop24Brier: result.prospectTop24Brier,
  };
}

export function buildRookieBacktestReport(observations: RookieBacktestObservation[]): RookieBacktestReport {
  let excludedForLeakage = 0;
  let excludedWithoutOutcome = 0;
  const cohort = observations.filter((observation) => {
    const cutoff = `${observation.classYear}-09-01`;
    if (observation.scoringDate > cutoff) { excludedForLeakage += 1; return false; }
    if (observation.fantasyPpg === null && observation.positionFinish === null && observation.peakDynastyValue === null) { excludedWithoutOutcome += 1; return false; }
    return true;
  });
  const ppg = cohort.flatMap((observation) => observation.fantasyPpg === null ? [] : [observation.fantasyPpg]);
  const games = cohort.flatMap((observation) => observation.games === null ? [] : [observation.games]);
  const peak = cohort.flatMap((observation) => observation.peakDynastyValue === null ? [] : [observation.peakDynastyValue]);
  const finishes = cohort.flatMap((observation) => observation.positionFinish === null ? [] : [observation.positionFinish]);
  const classified = cohort.filter((observation) => observation.prospectScore !== null && observation.positionFinish !== null);
  const predicted = classified.filter((observation) => (observation.prospectScore ?? 0) >= 65);
  const truePositive = predicted.filter((observation) => (observation.positionFinish ?? 999) <= 24).length;
  const actualPositive = classified.filter((observation) => (observation.positionFinish ?? 999) <= 24).length;
  const bucketDefinitions = [[0, 49.999, "0–49"], [50, 64.999, "50–64"], [65, 74.999, "65–74"], [75, 84.999, "75–84"], [85, 100, "85–100"]] as const;
  const correlation = (key: "draftCapitalScore" | "marketScore" | "prospectScore") => spearmanCorrelation(cohort.flatMap((observation) => observation[key] === null || observation.fantasyPpg === null ? [] : [[observation[key], observation.fantasyPpg] as [number, number]]));
  const familyKeys = [...new Set(cohort.flatMap((observation) => Object.keys(observation.familyScores ?? {})))].sort();
  const metricKeys = [...new Set(cohort.flatMap((observation) => Object.keys(observation.metricScores ?? {})))].sort();
  const recentClasses = [...new Set(cohort.map((observation) => observation.classYear))].sort((a, b) => b - a).slice(0, 3);
  const uniquePlayers = [...new Map(cohort.map((observation) => [observation.playerId, observation])).values()];
  return {
    calibrationBuckets: bucketDefinitions.map(([minimum, maximum, label]) => {
      const bucket = classified.filter((observation) => (observation.prospectScore ?? -1) >= minimum && (observation.prospectScore ?? -1) <= maximum);
      return { count: bucket.length, label, observedTop24Rate: bucket.length ? bucket.filter((observation) => (observation.positionFinish ?? 999) <= 24).length / bucket.length : null };
    }),
    classification: { precision: predicted.length ? truePositive / predicted.length : null, recall: actualPositive ? truePositive / actualPositive : null, scoreThreshold: 65, target: "Top-24 positional finish" },
    cohortCount: cohort.length,
    excludedForLeakage,
    excludedWithoutOutcome,
    familyAblations: familyKeys.map((familyKey) => rollingFamilyEvaluation(cohort, familyKey)),
    historicalLeaders: recentClasses.flatMap((classYear) => uniquePlayers
      .filter((observation) => observation.classYear === classYear && observation.overallScore !== null && observation.overallScore !== undefined)
      .sort((first, second) => (second.overallScore ?? -1) - (first.overallScore ?? -1))
      .slice(0, 5)
      .map((observation) => ({
        classYear,
        fantasyPpg: observation.fantasyPpg,
        overallScore: observation.overallScore!,
        playerId: observation.playerId,
        playerName: observation.playerName ?? "Unknown player",
        positionFinish: observation.positionFinish,
        prospectScore: observation.prospectScore,
      }))),
    metricAblations: metricKeys.map((metricKey) => rollingMetricEvaluation(cohort, metricKey)),
    metrics: {
      averageFantasyPpg: average(ppg),
      averageGames: average(games),
      averagePeakDynastyValue: average(peak),
      top12Rate: finishes.length ? finishes.filter((finish) => finish <= 12).length / finishes.length : null,
      top24Rate: finishes.length ? finishes.filter((finish) => finish <= 24).length / finishes.length : null,
      top12Interval: wilsonInterval(finishes.filter((finish) => finish <= 12).length, finishes.length),
      top24Interval: wilsonInterval(finishes.filter((finish) => finish <= 24).length, finishes.length),
    },
    rankCorrelations: {
      draftCapitalToPpg: correlation("draftCapitalScore"),
      marketToPpg: correlation("marketScore"),
      prospectToPpg: correlation("prospectScore"),
      consensusToPpg: spearmanCorrelation(cohort.flatMap((observation) => observation.consensusRank === null || observation.fantasyPpg === null ? [] : [[-observation.consensusRank, observation.fantasyPpg] as [number, number]])),
    },
    rollingOrigin: rollingOriginEvaluation(cohort),
  };
}
