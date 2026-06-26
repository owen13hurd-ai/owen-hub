import type { RookieProspect } from "@/types/rookies";

export const rookieModelWeights = {
  ageScore: 0.12,
  athleticScore: 0.16,
  draftCapitalScore: 0.28,
  landingSpotScore: 0.1,
  productionScore: 0.24,
  riskScore: 0.1,
};

export const starterRookieProspects: RookieProspect[] = [
  {
    ageScore: 7,
    athleticScore: 7,
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
