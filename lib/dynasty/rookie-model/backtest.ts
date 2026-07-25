export type RookieBacktestObservation = {
  classYear: number;
  consensusRank: number | null;
  draftCapitalScore: number | null;
  fantasyPoints: number | null;
  fantasyPpg: number | null;
  games: number | null;
  marketScore: number | null;
  peakDynastyValue: number | null;
  playerId: string;
  positionFinish: number | null;
  prospectScore: number | null;
  scoringDate: string;
};

export type RookieBacktestReport = {
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
  return {
    calibrationBuckets: bucketDefinitions.map(([minimum, maximum, label]) => {
      const bucket = classified.filter((observation) => (observation.prospectScore ?? -1) >= minimum && (observation.prospectScore ?? -1) <= maximum);
      return { count: bucket.length, label, observedTop24Rate: bucket.length ? bucket.filter((observation) => (observation.positionFinish ?? 999) <= 24).length / bucket.length : null };
    }),
    classification: { precision: predicted.length ? truePositive / predicted.length : null, recall: actualPositive ? truePositive / actualPositive : null, scoreThreshold: 65, target: "Top-24 positional finish" },
    cohortCount: cohort.length,
    excludedForLeakage,
    excludedWithoutOutcome,
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
  };
}
