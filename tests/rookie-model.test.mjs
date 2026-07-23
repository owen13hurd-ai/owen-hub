import assert from "node:assert/strict";
import test from "node:test";

import { previewRookieCsv } from "../lib/dynasty/rookie-model/import.ts";
import { findRookieDuplicateCandidates, rookieNameSimilarity } from "../lib/dynasty/rookie-model/matching.ts";
import { calculateRookieScore, normalizeRookieMetric } from "../lib/dynasty/rookie-model/scoring.ts";

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

test("previews valid and invalid MVP CSV rows without committing", () => {
  const preview = previewRookieCsv(
    "name,position,class_year,school,career_yprr,early_declare\nAlpha Receiver,WR,2026,Example,2.75,yes\nBad Quarterback,QB,2026,Example,,no",
  );
  assert.equal(preview.validRows, 1);
  assert.equal(preview.invalidRows, 1);
  assert.equal(preview.rows[0].metrics.find((metric) => metric.key === "early_declare").value, 1);
  assert.match(preview.rows[1].errors[0], /RB or WR/);
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
