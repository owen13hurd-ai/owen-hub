export type RookiePosition = "QB" | "RB" | "WR" | "TE";

export type RookieProspect = {
  ageScore: number;
  athleticScore: number;
  draftCapitalScore: number;
  id: string;
  landingSpotScore: number;
  name: string;
  notes: string;
  position: RookiePosition;
  productionScore: number;
  projectedPick: string;
  riskScore: number;
  school: string;
  tier: string;
};
