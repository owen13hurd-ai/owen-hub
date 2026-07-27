import { z } from "zod";

import type { RookieModelConfiguration } from "@/types/rookie-engine";

const metricSchema = z.object({
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
    position: z.enum(["RB", "WR"]),
    prospectFamilies: z.array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        minimumCoverage: z.number().min(0).max(1),
        metrics: z.array(metricSchema).min(1),
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
  overallWeights: { draftCapital: 0.3, market: 0.15, prospect: 0.5, situation: 0.05 },
  tierThresholds,
  version: "mvp-4",
  winsorization: { lower: 0.02, upper: 0.98 },
};

export const wrModelConfiguration: RookieModelConfiguration = {
  ...shared,
  label: "WR explainable model",
  position: "WR",
  prospectFamilies: [
    {
      key: "production",
      label: "Production and target earning",
      minimumCoverage: 0.5,
      weight: 0.55,
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
      weight: 0.2,
      metrics: [
        { key: "age_at_draft", label: "Age at draft", description: "Player age on draft day.", direction: "lower", family: "age", weight: 0.65 },
        { key: "early_declare", label: "Early declare", description: "Entered the NFL draft before exhausting eligibility.", direction: "higher", family: "age", weight: 0.35 },
      ],
    },
    {
      key: "athletic_size",
      label: "Athleticism and size",
      minimumCoverage: 0.34,
      weight: 0.15,
      metrics: [
        { key: "ras", label: "RAS", description: "Position-relative athletic testing composite.", direction: "higher", family: "athletic_size", weight: 0.5 },
        { key: "bmi", label: "BMI", description: "Body-mass index from verified height and weight.", direction: "higher", family: "athletic_size", weight: 0.2 },
        { key: "speed_score", label: "Speed Score", description: "Weight-adjusted forty-yard speed.", direction: "higher", family: "athletic_size", weight: 0.3 },
      ],
    },
    {
      key: "recruiting_context",
      label: "Recruiting and context",
      minimumCoverage: 0.5,
      weight: 0.1,
      metrics: [
        { key: "recruiting_rating", label: "Recruiting rating", description: "Pre-college recruiting rating from an approved source.", direction: "higher", family: "recruiting_context", weight: 0.7 },
        { key: "conference_strength", label: "Conference strength", description: "Versioned competition context score.", direction: "higher", family: "recruiting_context", weight: 0.3 },
      ],
    },
  ],
};

export const rbModelConfiguration: RookieModelConfiguration = {
  ...shared,
  label: "RB explainable model",
  position: "RB",
  prospectFamilies: [
    {
      key: "production",
      label: "Normalized production",
      minimumCoverage: 0.5,
      weight: 0.45,
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
      label: "Receiving profile",
      minimumCoverage: 0.5,
      weight: 0.2,
      metrics: [
        { key: "receptions_per_game", label: "Receptions per game", description: "College receptions normalized by games played.", direction: "higher", family: "receiving", weight: 0.4 },
        { key: "receiving_ppa", label: "Final-season receiving PPA", description: "Average predicted points added on CFBD passing plays involving the back.", direction: "higher", family: "receiving", weight: 0.2 },
        { key: "career_receiving_ppa", label: "Career receiving PPA", description: "Average of documented CFBD season-level receiving PPA values.", direction: "higher", family: "receiving", weight: 0.2 },
        { key: "best_receiving_ppa", label: "Best receiving PPA", description: "Best documented CFBD receiving PPA season.", direction: "higher", family: "receiving", weight: 0.2 },
      ],
    },
    {
      key: "athletic_size",
      label: "Athleticism and size",
      minimumCoverage: 0.34,
      weight: 0.25,
      metrics: [
        { key: "ras", label: "RAS", description: "Position-relative athletic testing composite.", direction: "higher", family: "athletic_size", weight: 0.4 },
        { key: "speed_score", label: "Speed Score", description: "Weight-adjusted forty-yard speed.", direction: "higher", family: "athletic_size", weight: 0.4 },
        { key: "bmi", label: "BMI", description: "Body-mass index from verified height and weight.", direction: "higher", family: "athletic_size", weight: 0.2 },
      ],
    },
    {
      key: "age_recruiting",
      label: "Age, declaration, and recruiting",
      minimumCoverage: 0.34,
      weight: 0.1,
      metrics: [
        { key: "age_at_draft", label: "Age at draft", description: "Player age on draft day.", direction: "lower", family: "age_recruiting", weight: 0.45 },
        { key: "early_declare", label: "Early declare", description: "Entered the NFL draft before exhausting eligibility.", direction: "higher", family: "age_recruiting", weight: 0.3 },
        { key: "recruiting_rating", label: "Recruiting rating", description: "Pre-college recruiting rating from an approved source.", direction: "higher", family: "age_recruiting", weight: 0.25 },
      ],
    },
  ],
};

export function validateRookieModelConfiguration(configuration: RookieModelConfiguration) {
  return rookieModelConfigurationSchema.parse(configuration);
}

validateRookieModelConfiguration(wrModelConfiguration);
validateRookieModelConfiguration(rbModelConfiguration);
