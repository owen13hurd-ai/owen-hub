export type RetailerId =
  | "pokemon-center"
  | "best-buy"
  | "target"
  | "gamestop"
  | "walmart"
  | "costco"
  | "sams-club"
  | "local";

export type StockStatus = "in-stock" | "out-of-stock" | "unknown";
export type PriceStatus = "msrp" | "above-msrp" | "unknown";
export type SourceSupport = "official-api" | "official-page" | "community" | "manual";
export type ConnectorHealth = "ready" | "needs-setup" | "limited" | "error";

export type RestockEvent = {
  id: string;
  retailerId: RetailerId;
  retailerName: string;
  productName: string;
  productUrl: string;
  imageUrl?: string;
  msrp: number | null;
  currentPrice: number | null;
  stockStatus: StockStatus;
  priceStatus: PriceStatus;
  detectedAt: string;
  sourceLabel: string;
  sourceSupport: SourceSupport;
  confidence: "high" | "medium" | "low";
};

export type Release = {
  id: string;
  name: string;
  releaseDate: string;
  preorderDate: string | null;
  expectedMsrp: string;
  products: string[];
  pokemonCenterStatus: string;
  bigBoxStatus: string;
  sourceUrl: string;
};

export type WatchlistItem = {
  id: string;
  name: string;
  kind: "set" | "sealed-product" | "card";
  maxPricePercent: number;
  enabled: boolean;
};

export type ConnectorStatus = {
  id: string;
  name: string;
  support: SourceSupport;
  health: ConnectorHealth;
  cadence: string;
  detail: string;
  lastCheckedAt: string | null;
};

export type RestockSnapshot = {
  events: RestockEvent[];
  releases: Release[];
  connectors: ConnectorStatus[];
  checkedAt: string;
};
