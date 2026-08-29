import assert from "node:assert/strict";
import test from "node:test";

import { previewHistoricalRookieCsv, previewRookieCsv } from "../lib/dynasty/rookie-model/import.ts";
import { aggregateThreeYearOutcomes, buildRookieBacktestReport, spearmanCorrelation, wilsonInterval } from "../lib/dynasty/rookie-model/backtest.ts";
import { findRookieDuplicateCandidates, rookieNameSimilarity } from "../lib/dynasty/rookie-model/matching.ts";
import { parseGoogleSheetRookieIdentities } from "../lib/dynasty/rookie-model/google-sheet-adapter.ts";
import { qbModelConfiguration, rbModelConfiguration, rookieModelConfigurations, teModelConfiguration, wrModelConfiguration } from "../lib/dynasty/rookie-model/config.ts";
import { calculateRookieScore, normalizeRookieMetric } from "../lib/dynasty/rookie-model/scoring.ts";
import { aggregateCfbdPlayerSeasons, parseCfbdPlayerStats } from "../lib/dynasty/sources/cfbd.ts";

const configuration = {
  label: "Test WR model",
  normalization: "class-relative",
  overallWeights: { draftCapital: 0.3, market: 0.15, prospect: 0.5, situation: 0.05 },
  position: "WR",
  prospectFamilies: [
    {
      key: "production",
      label: "Production",
      minimumCoverage: 0.5,
      metrics: [
        { description: "Higher is better.", direction: "higher", family: "production", key: "yprr", label: "YPRR", weight: 0.5 },
        { description: "Higher is better.", direction: "higher", family: "production", key: "target_share", label: "Target share", weight: 0.5 },
      ],
      weight: 1,
    },
  ],
  tierThresholds: [{ label: "Tier 1", minimum: 80 }, { label: "Tier 2", minimum: 0 }],
  version: "test-1",
  winsorization: { lower: 0.02, upper: 0.98 },
};

test("published defaults use the reproducible position-weighted scoring profile", () => {
  for (const model of rookieModelConfigurations) {
    assert.equal(model.version, model.position === "QB" ? "mvp-7" : model.position === "TE" ? "mvp-10" : "mvp-8");
    assert.deepEqual(model.overallWeights, {
      draftCapital: 0.4,
      market: 0,
      prospect: 0.6,
      situation: 0,
    });
    assert.ok(Math.abs(model.prospectFamilies.reduce((sum, family) => sum + family.weight, 0) - 1) < 1e-9);
    assert.equal(model.prospectFamilies.some((family) => family.key === "recruiting_context"), false);
  }

  assert.equal(wrModelConfiguration.prospectFamilies.find((family) => family.key === "production").weight, 0.625);
  assert.equal(rbModelConfiguration.prospectFamilies.find((family) => family.key === "athletic_size").weight, 0.104167);
  assert.equal(qbModelConfiguration.prospectFamilies.find((family) => family.key === "passing_rushing_quality").weight, 0.666667);
  assert.equal(teModelConfiguration.prospectFamilies.find((family) => family.key === "athletic_size").weight, 0.1);
});

test("normalizes metrics in both directions and winsorizes outliers", () => {
  const metric = configuration.prospectFamilies[0].metrics[0];
  const high = normalizeRookieMetric(999, [1, 2, 3, 4, 5], metric, configuration.winsorization);
  const lowDirection = normalizeRookieMetric(5, [1, 2, 3, 4, 5], { ...metric, direction: "lower" }, configuration.winsorization);
  assert.equal(high, 100);
  assert.equal(lowDirection, 0);
});

test("renormalizes available metrics instead of imputing a neutral value", () => {
  const result = calculateRookieScore(
    configuration,
    [{ key: "yprr", value: 4, sourceId: "source-1" }, { key: "target_share", value: null }],
    [{ key: "yprr", values: [1, 2, 3, 4, 5] }, { key: "target_share", values: [10, 20, 30] }],
    { draftCapital: null, market: null, situation: null },
  );
  assert.equal(result.components[0].weight, 1);
  assert.equal(result.components[1].contribution, null);
  assert.match(result.components[1].explanation, /no neutral value/);
  assert.equal(result.coverage, 50);
  assert.equal(result.overallScore, result.prospectScore);
});

test("suppresses a family below its required coverage", () => {
  const strict = {
    ...configuration,
    prospectFamilies: [{ ...configuration.prospectFamilies[0], minimumCoverage: 1 }],
  };
  const result = calculateRookieScore(
    strict,
    [{ key: "yprr", value: 3 }, { key: "target_share", value: null }],
    [{ key: "yprr", values: [1, 2, 3] }, { key: "target_share", values: [10, 20, 30] }],
    { draftCapital: null, market: null, situation: null },
  );
  assert.equal(result.prospectScore, null);
  assert.equal(result.families[0].suppressed, true);
});

test("does not create a market-only overall score when the required prospect score is missing", () => {
  const result = calculateRookieScore(
    wrModelConfiguration,
    [{ key: "early_declare", value: 1 }],
    [{ key: "early_declare", values: [0, 1] }],
    { draftCapital: 95, market: 90, situation: 85 },
  );

  assert.equal(result.prospectScore, null);
  assert.equal(result.overallScore, null);
  assert.equal(result.tier, null);
});

test("previews valid and invalid MVP CSV rows without committing", () => {
  const preview = previewRookieCsv(
    "name,position,class_year,school,career_yprr,pass_play_usage,receiving_ppa,early_declare\nAlpha Receiver,WR,2026,Example,2.75,0.24,0.51,yes\nBad Specialist,K,2026,Example,,,,no",
  );
  assert.equal(preview.validRows, 1);
  assert.equal(preview.invalidRows, 1);
  assert.equal(preview.rows[0].metrics.find((metric) => metric.key === "early_declare").value, 1);
  assert.equal(preview.rows[0].metrics.find((metric) => metric.key === "pass_play_usage").value, 0.24);
  assert.equal(preview.rows[0].metrics.find((metric) => metric.key === "receiving_ppa").value, 0.51);
  assert.match(preview.rows[1].errors[0], /QB, RB, WR, or TE/);
});

test("historical CSV requires one leakage-safe pre-draft scoring date", () => {
  const preview = previewHistoricalRookieCsv(
    "name,position,class_year,scoring_date,overall_pick,career_yprr\nSafe Receiver,WR,2020,2020-04-20,260,2.5\nLate Receiver,WR,2020,2020-10-01,,2.4\nCurrent Receiver,WR,2025,2025-04-20,,2.7",
  );
  assert.equal(preview.validRows, 1);
  assert.equal(preview.invalidRows, 2);
  assert.equal(preview.rows[0].asOfDate, "2020-04-20");
  assert.match(preview.rows[1].errors.join(" "), /September 1/);
  assert.match(preview.rows[2].errors.join(" "), /2010 and 2024/);
});

test("Google Sheet adapter imports identity and manual tier without model metrics", () => {
  const identities = parseGoogleSheetRookieIdentities(
    ',,QB,RB,WR,TE\n,"Tier 1 (90+)",Quarterback,Runner One,Receiver One (94),\n,"Tier 2 (80-89)",,Runner Two,,',
    2026,
  );
  assert.deepEqual(identities.map(({ name, position, tier }) => ({ name, position, tier })), [
    { name: "Quarterback", position: "QB", tier: "Tier 1" },
    { name: "Runner One", position: "RB", tier: "Tier 1" },
    { name: "Receiver One", position: "WR", tier: "Tier 1" },
    { name: "Runner Two", position: "RB", tier: "Tier 2" },
  ]);
  assert.equal(identities[2].sheetScore, 94);
  assert.equal("prospectScore" in identities[2], false);
});

test("CFBD adapter preserves raw season totals without inventing unavailable metrics", () => {
  const rows = parseCfbdPlayerStats([
    { category: "receiving", playerId: 42, player: "Test Receiver", team: "Example", conference: "ACC", statType: "REC", stat: "60" },
    { category: "receiving", playerId: 42, player: "Test Receiver", team: "Example", conference: "ACC", statType: "YDS", stat: "900" },
    { category: "rushing", playerId: 42, player: "Test Receiver", team: "Example", conference: "ACC", statType: "ATT", stat: "8" },
  ]);
  const season = aggregateCfbdPlayerSeasons(rows, 2025)[0];
  assert.equal(season.playerId, "42");
  assert.equal(season.receptions, 60);
  assert.equal(season.receivingYards, 900);
  assert.equal(season.carries, 8);
  assert.equal("routes" in season, false);
  assert.equal("yardsPerRouteRun" in season, false);
});

test("flags close same-cohort names but never exact names as fuzzy duplicates", () => {
  const players = [
    { classYear: 2026, id: "one", name: "Owen Receiver", position: "WR", school: "Example" },
    { classYear: 2025, id: "two", name: "Owen Reciever", position: "WR", school: "Other" },
  ];
  assert.ok(rookieNameSimilarity("Owen Reciever", "Owen Receiver") >= 0.82);
  assert.equal(findRookieDuplicateCandidates("Owen Reciever", 2026, "WR", players)[0].id, "one");
  assert.equal(findRookieDuplicateCandidates("Owen Receiver", 2026, "WR", players).length, 0);
  assert.equal(findRookieDuplicateCandidates("Owen Reciever", 2025, "RB", players).length, 0);
});

test("backtests exclude post-cutoff scores and report multiple outcomes", () => {
  const base = { classYear: 2025, consensusRank: 10, draftCapitalScore: 70, fantasyPoints: 200, fantasyPpg: 12, games: 16, marketScore: 65, peakDynastyValue: 80, positionFinish: 20, prospectScore: 75 };
  const report = buildRookieBacktestReport([
    { ...base, playerId: "one", scoringDate: "2025-04-20" },
    { ...base, fantasyPpg: 18, playerId: "two", positionFinish: 8, scoringDate: "2025-05-01" },
    { ...base, playerId: "late", scoringDate: "2025-10-01" },
  ]);
  assert.equal(report.cohortCount, 2);
  assert.equal(report.excludedForLeakage, 1);
  assert.equal(report.metrics.top12Rate, 0.5);
  assert.equal(report.metrics.top24Rate, 1);
  assert.equal(report.metrics.averageFantasyPpg, 15);
  assert.equal(report.classification.precision, 1);
  assert.equal(report.classification.recall, 1);
  assert.equal(report.calibrationBuckets.find((bucket) => bucket.label === "75–84").count, 2);
  assert.ok(report.metrics.top24Interval[0] < report.metrics.top24Interval[1]);
  assert.equal(report.rollingOrigin.evaluatedCount, 0);
});

test("rolling-origin validation trains only on earlier draft classes and compares draft capital", () => {
  const training = Array.from({ length: 24 }, (_, index) => ({
    classYear: 2020,
    consensusRank: null,
    draftCapitalScore: index * 3,
    fantasyPoints: null,
    fantasyPpg: index / 2,
    games: 16,
    familyScores: { production: index * 2 },
    marketScore: null,
    peakDynastyValue: null,
    playerId: `train-${index}`,
    positionFinish: index >= 12 ? 20 : 40,
    prospectScore: index * 4,
    scoringDate: "2020-04-20",
  }));
  const testing = Array.from({ length: 6 }, (_, index) => ({
    ...training[index + 12],
    classYear: 2023,
    playerId: `test-${index}`,
    scoringDate: "2023-04-20",
  }));
  const report = buildRookieBacktestReport([...training, ...testing]);
  assert.equal(report.rollingOrigin.evaluatedCount, 6);
  assert.deepEqual(report.rollingOrigin.testClasses, [2023]);
  assert.ok(report.rollingOrigin.prospectPpgMae !== null);
  assert.ok(report.rollingOrigin.draftCapitalTop24Brier !== null);
  assert.ok(report.rollingOrigin.combinedPpgMae !== null);
  assert.ok(report.rollingOrigin.combinedTop24Brier !== null);
  assert.equal(report.familyAblations[0].familyKey, "production");
  assert.equal(report.familyAblations[0].evaluatedCount, 6);
  assert.ok(report.familyAblations[0].combinedPpgMae !== null);
  const immature = training.map((row) => ({ ...row, classYear: 2021, scoringDate: "2021-04-20", playerId: `immature-${row.playerId}`, fantasyPpg: 1000 }));
  assert.deepEqual(buildRookieBacktestReport([...training, ...testing, ...immature]).rollingOrigin, report.rollingOrigin);
  const missingDraft = { ...testing[0], playerId: "missing-draft", draftCapitalScore: null, fantasyPpg: 1000 };
  assert.deepEqual(buildRookieBacktestReport([...training, ...testing, missingDraft]).rollingOrigin, report.rollingOrigin);
});

test("missing player seasons remain unknown and cannot become silent failures", () => {
  const row = { player_id: "partial", nfl_season: 2020, fantasy_points: 100, fantasy_ppg: 10, games: 10, position_finish: 20, peak_dynasty_value: null };
  const result = aggregateThreeYearOutcomes([row], new Map([["partial", 2020], ["absent", 2020], ["future", 2024]]), [2020, 2021, 2022, 2023, 2024, 2025]);
  assert.equal(result.length, 2);
  assert.equal(result[0].fantasy_ppg, null);
  assert.equal(result[0].position_finish, null);
  assert.equal(result[1].games, null);
  assert.equal(result[1].missing_seasons, 3);
  assert.equal(result[0].outcome_available_date, "2023-04-01");
  assert.throws(() => aggregateThreeYearOutcomes([row, row], new Map([["partial", 2020]]), [2020, 2021, 2022]), /Duplicate/);
  assert.equal(aggregateThreeYearOutcomes([row], new Map([["partial", 2020]]), [2020, 2022]).length, 0);
});

test("three-year outcomes create one record per player and exclude incomplete windows", () => {
  const row = (player_id, nfl_season, fantasy_ppg, position_finish) => ({ fantasy_points: fantasy_ppg * 10, fantasy_ppg, games: 10, nfl_season, peak_dynasty_value: null, player_id, position_finish });
  const aggregated = aggregateThreeYearOutcomes([
    row("complete", 2021, 8, 40), row("complete", 2022, 12, 20), row("complete", 2023, 10, 30),
    row("incomplete", 2023, 15, 10), row("latest", 2025, 1, 100),
  ], new Map([["complete", 2021], ["incomplete", 2024], ["latest", 2025]]));
  assert.equal(aggregated.length, 1);
  assert.equal(aggregated[0].player_id, "complete");
  assert.equal(aggregated[0].fantasy_ppg, 12);
  assert.equal(aggregated[0].position_finish, 20);
  assert.equal(aggregated[0].games, 30);
});

test("Wilson intervals stay within probability bounds", () => {
  assert.equal(wilsonInterval(0, 0), null);
  const interval = wilsonInterval(5, 10);
  assert.ok(interval[0] >= 0 && interval[1] <= 1);
  assert.ok(interval[0] < 0.5 && interval[1] > 0.5);
});

test("spearman correlation requires three pairs and respects rank order", () => {
  assert.equal(spearmanCorrelation([[1, 2], [2, 3]]), null);
  assert.ok(Math.abs(spearmanCorrelation([[1, 10], [2, 20], [3, 30]]) - 1) < 1e-12);
  assert.ok(Math.abs(spearmanCorrelation([[1, 30], [2, 20], [3, 10]]) + 1) < 1e-12);
});
