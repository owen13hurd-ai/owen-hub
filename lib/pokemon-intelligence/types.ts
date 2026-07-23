export type Confidence = "high" | "medium" | "low";
export type ProductType = "sealed" | "card" | "set" | "accessory";
export type WatchPriority = "critical" | "high" | "medium" | "low";
export type StockStatus = "in-stock" | "out-of-stock" | "unknown";

export type PokemonIntelligenceSet = {
  id: string;
  name: string;
  release_date: string | null;
  era: string | null;
  notes: string | null;
  created_at: string;
};

export type PokemonIntelligenceProduct = {
  id: string;
  name: string;
  product_type: ProductType | string;
  set_name: string | null;
  msrp: number | null;
  pack_count: number | null;
  release_date: string | null;
  image_url: string | null;
  source_url: string | null;
  notes: string | null;
  created_at: string;
};

export type PokemonIntelligenceCard = {
  id: string;
  external_id: string | null;
  name: string;
  set_name: string | null;
  number: string | null;
  rarity: string | null;
  supertype: string | null;
  subtypes: string[];
  image_url: string | null;
  source_url: string | null;
  notes: string | null;
  created_at: string;
};

export type PokemonCollectionItem = {
  id: string;
  product_id: string | null;
  item_name: string;
  item_kind: string;
  quantity: number;
  condition: string;
  storage_location: string | null;
  estimated_value: number | null;
  notes: string | null;
  acquired_at: string | null;
  created_at: string;
};

export type PokemonPurchase = {
  id: string;
  product_id: string | null;
  product_name: string;
  retailer: string | null;
  quantity: number;
  item_price: number;
  tax: number;
  shipping: number;
  fees: number;
  total_cost: number;
  purchase_date: string;
  purpose: string;
  source_url: string | null;
  notes: string | null;
  jarvis_note_path: string | null;
  created_at: string;
};

export type PokemonPriceObservation = {
  id: string;
  product_id: string | null;
  product_name: string;
  source: string;
  price: number;
  shipping: number;
  observed_at: string;
  confidence: Confidence;
  source_url: string | null;
  notes: string | null;
  created_at: string;
};

export type PokemonWatchlistItem = {
  id: string;
  name: string;
  target_type: string;
  max_price: number | null;
  priority: WatchPriority;
  enabled: boolean;
  notes: string | null;
  created_at: string;
};

export type PokemonRestockObservation = {
  id: string;
  product_id: string | null;
  product_name: string;
  retailer: string;
  stock_status: StockStatus;
  current_price: number | null;
  msrp: number | null;
  confidence: Confidence;
  source_url: string | null;
  observed_at: string;
  notes: string | null;
  created_at: string;
};

export type PokemonIntelligenceSnapshot = {
  sets: PokemonIntelligenceSet[];
  cards: PokemonIntelligenceCard[];
  products: PokemonIntelligenceProduct[];
  collectionItems: PokemonCollectionItem[];
  purchases: PokemonPurchase[];
  priceObservations: PokemonPriceObservation[];
  watchlist: PokemonWatchlistItem[];
  restockObservations: PokemonRestockObservation[];
};

export type PurchaseCalculatorInput = {
  estimatedResalePrice: number;
  feesPercent: number;
  itemPrice: number;
  quantity: number;
  shipping: number;
  tax: number;
  extraFees: number;
};

export type PurchaseCalculatorResult = {
  landedCost: number;
  resaleGross: number;
  marketplaceFees: number;
  netProceeds: number;
  estimatedProfit: number;
  roiPercent: number;
  breakEvenUnitPrice: number;
};
