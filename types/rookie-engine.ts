export type RookieEnginePosition = "RB" | "WR";

export type RookieMetricDirection = "higher" | "lower";

export type RookieMetricDefinition = {
  description: string;
  direction: RookieMetricDirection;
  family: string;
  key: string;
  label: string;
  weight: number;
};

export type RookieFamilyDefinition = {
  key: string;
  label: string;
  minimumCoverage: number;
  metrics: RookieMetricDefinition[];
  weight: number;
};

export type RookieModelConfiguration = {
  label: string;
  normalization: "class-relative" | "historical-percentile";
  overallWeights: {
    draftCapital: number;
    market: number;
    prospect: number;
    situation: number;
  };
  position: RookieEnginePosition;
  prospectFamilies: RookieFamilyDefinition[];
  tierThresholds: Array<{ label: string; minimum: number }>;
  version: string;
  winsorization: { lower: number; upper: number };
};

export type RookieMetricInput = {
  key: string;
  sourceId?: string | null;
  value: number | null;
};

export type RookieScoreContext = {
  draftCapital: number | null;
  market: number | null;
  situation: number | null;
};

export type RookieMetricReference = {
  key: string;
  values: number[];
};

export type RookieMetricContribution = {
  contribution: number | null;
  explanation: string;
  familyKey: string;
  familyLabel: string;
  key: string;
  label: string;
  missing: boolean;
  normalizedValue: number | null;
  rawValue: number | null;
  sourceId: string | null;
  weight: number;
};

export type RookieFamilyScore = {
  coverage: number;
  key: string;
  label: string;
  score: number | null;
  suppressed: boolean;
  weight: number;
};

export type RookieScoreResult = {
  components: RookieMetricContribution[];
  coverage: number;
  draftCapitalScore: number | null;
  families: RookieFamilyScore[];
  marketScore: number | null;
  normalization: RookieModelConfiguration["normalization"];
  overallScore: number | null;
  prospectScore: number | null;
  situationScore: number | null;
  tier: string | null;
};

export type RookieImportRow = {
  ageAtDraft: number | null;
  classYear: number;
  earlyDeclare: boolean | null;
  errors: string[];
  externalId: string | null;
  metrics: RookieMetricInput[];
  name: string;
  position: RookieEnginePosition | null;
  rawData: Record<string, string>;
  school: string | null;
  sourceRow: number;
};

export type RookieImportPreview = {
  invalidRows: number;
  rows: RookieImportRow[];
  validRows: number;
};
