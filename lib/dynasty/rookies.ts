import type { RookieProspect } from "@/types/rookies";

export const rookieModelWeights = {
  ageScore: 0.12,
  athleticScore: 0.16,
  draftCapitalScore: 0.28,
  landingSpotScore: 0.1,
  productionScore: 0.24,
  riskScore: 0.1,
};

export const rookieModelFactors = [
  {
    description: "NFL draft capital is the strongest signal because it predicts opportunity.",
    key: "draftCapitalScore",
    label: "Draft capital",
    weight: rookieModelWeights.draftCapitalScore,
  },
  {
    description: "College production shows whether the player actually earned touches or targets.",
    key: "productionScore",
    label: "Production",
    weight: rookieModelWeights.productionScore,
  },
  {
    description: "Athleticism helps separate ceiling bets from replacement-level profiles.",
    key: "athleticScore",
    label: "Athleticism",
    weight: rookieModelWeights.athleticScore,
  },
  {
    description: "Younger breakouts usually get more forgiveness and long-term value.",
    key: "ageScore",
    label: "Age",
    weight: rookieModelWeights.ageScore,
  },
  {
    description: "Landing spot matters, but it should not overpower talent.",
    key: "landingSpotScore",
    label: "Landing spot",
    weight: rookieModelWeights.landingSpotScore,
  },
  {
    description: "Risk subtracts for profile holes, role uncertainty, injuries, or bad assumptions.",
    key: "riskScore",
    label: "Risk",
    weight: rookieModelWeights.riskScore,
  },
] as const;

export const rookiePositionModelNotes = [
  {
    label: "QB",
    note: "Prioritize draft capital, rushing upside, and job security. Landing spot matters less if the team invests premium capital.",
  },
  {
    label: "RB",
    note: "Prioritize draft capital, athleticism, and early touch path. Age cliffs come faster, so immediate role matters more.",
  },
  {
    label: "WR",
    note: "Prioritize early production, target earning, and draft capital. Landing spot can change quickly.",
  },
  {
    label: "TE",
    note: "Prioritize elite traits and patience. Most TEs need a development discount unless the profile is special.",
  },
] as const;

export const starterRookieProspects: RookieProspect[] = [
  {
    ageScore: 7,
    athleticScore: 7,
    classYear: "2025",
    draftCapitalScore: 7,
    id: "rookie-qb-1",
    landingSpotScore: 5,
    name: "Rookie QB 1",
    notes: "Replace this starter row with a real prospect.",
    position: "QB",
    productionScore: 7,
    projectedPick: "1.01",
    riskScore: 5,
    school: "TBD",
    tier: "Tier 1",
  },
  {
    ageScore: 8,
    athleticScore: 8,
    classYear: "2025",
    draftCapitalScore: 6,
    id: "rookie-rb-1",
    landingSpotScore: 5,
    name: "Rookie RB 1",
    notes: "Good place to track profile plus draft capital later.",
    position: "RB",
    productionScore: 8,
    projectedPick: "1.02",
    riskScore: 6,
    school: "TBD",
    tier: "Tier 1",
  },
  {
    ageScore: 8,
    athleticScore: 8,
    classYear: "2025",
    draftCapitalScore: 6,
    id: "rookie-wr-1",
    landingSpotScore: 5,
    name: "Rookie WR 1",
    notes: "Use model score as a guide, not a replacement for your rank.",
    position: "WR",
    productionScore: 8,
    projectedPick: "1.03",
    riskScore: 5,
    school: "TBD",
    tier: "Tier 1",
  },
  {
    ageScore: 6,
    athleticScore: 7,
    classYear: "2025",
    draftCapitalScore: 5,
    id: "rookie-te-1",
    landingSpotScore: 5,
    name: "Rookie TE 1",
    notes: "TEs usually need a separate patience lens.",
    position: "TE",
    productionScore: 6,
    projectedPick: "2.01",
    riskScore: 7,
    school: "TBD",
    tier: "Tier 2",
  },
];

export function calculateRookieModelScore(prospect: RookieProspect) {
  const positiveScore =
    prospect.draftCapitalScore * rookieModelWeights.draftCapitalScore +
    prospect.productionScore * rookieModelWeights.productionScore +
    prospect.athleticScore * rookieModelWeights.athleticScore +
    prospect.ageScore * rookieModelWeights.ageScore +
    prospect.landingSpotScore * rookieModelWeights.landingSpotScore;
  const riskPenalty = prospect.riskScore * rookieModelWeights.riskScore;

  return Math.max(0, Math.min(10, positiveScore + (10 - riskPenalty) * 0.1));
}

export function getRookieModelBreakdown(prospect: RookieProspect) {
  const score = calculateRookieModelScore(prospect);
  const weightedUpside =
    prospect.draftCapitalScore * rookieModelWeights.draftCapitalScore +
    prospect.productionScore * rookieModelWeights.productionScore +
    prospect.athleticScore * rookieModelWeights.athleticScore;
  const contextScore =
    prospect.ageScore * rookieModelWeights.ageScore +
    prospect.landingSpotScore * rookieModelWeights.landingSpotScore;
  const riskAdjustment = (10 - prospect.riskScore) * rookieModelWeights.riskScore;

  return {
    contextScore,
    riskAdjustment,
    score,
    weightedUpside,
  };
}
