export type Position = "ALL" | "QB" | "RB" | "WR" | "TE";

export type DynastyBoardPlayerRow = {
  id: string;
  playerId: string;
  type: "player";
};

export type DynastyBoardTierRow = {
  id: string;
  tierId: string;
  type: "tier";
};

export type DynastyBoardRow = DynastyBoardPlayerRow | DynastyBoardTierRow;

export type DynastyRowsByScope = Record<Position, DynastyBoardRow[]>;

export type DynastyOwnershipSummary = {
  exposure: number;
  leagueCount: number;
  percent: number;
};

export type DynastyRanking = {
  id: string;
  rookiePick: string;
  importedTier: string;
  position: Exclude<Position, "ALL">;
  positionRank: string;
  player: string;
  age: number | null;
  team: string;
  overallRank: number;
  ktcRank: number | null;
  ktcDelta: number | null;
  marketPosition: string;
  marketPositionRank: number | null;
  buySellHold: string;
  relativeBaseValue: number | null;
  fantasyCalcRank: number | null;
  fantasyCalcValue: number | null;
  fantasyCalcTrend30Day: number | null;
  isRookie?: boolean;
  yearsExperience?: number | null;
};

export type DynastyTier = {
  id: string;
  scope: Position;
  label: string;
  pickValueLabel: string;
  playerCount: number;
  pickValue: number | null;
};

export type SourceStatus = {
  label: string;
  status: "live" | "fallback" | "missing" | "error";
  detail: string;
};

export type MarketSourceSummary = {
  ktc: SourceStatus;
  fantasyCalc: SourceStatus;
};
