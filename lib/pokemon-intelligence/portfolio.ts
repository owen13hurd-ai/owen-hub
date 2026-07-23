import type { PokemonCollectionItem, PokemonIntelligenceSnapshot } from "./types";

export type PortfolioBucket = {
  count: number;
  label: string;
  quantity: number;
  value: number;
};

export type PortfolioTopItem = {
  condition: string;
  location: string | null;
  name: string;
  quantity: number;
  value: number;
};

export type PortfolioSummary = {
  estimatedValue: number;
  itemCount: number;
  profitLoss: number;
  profitLossPercent: number;
  purchaseSpend: number;
  quantity: number;
  topItems: PortfolioTopItem[];
  valueByKind: PortfolioBucket[];
  valueByLocation: PortfolioBucket[];
};

function round(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function itemValue(item: PokemonCollectionItem) {
  return (item.estimated_value ?? 0) * item.quantity;
}

function addToBucket(map: Map<string, PortfolioBucket>, label: string, item: PokemonCollectionItem) {
  const bucket = map.get(label) ?? { count: 0, label, quantity: 0, value: 0 };
  bucket.count += 1;
  bucket.quantity += item.quantity;
  bucket.value += itemValue(item);
  map.set(label, bucket);
}

function sortedBuckets(map: Map<string, PortfolioBucket>) {
  return [...map.values()]
    .map((bucket) => ({ ...bucket, value: round(bucket.value) }))
    .sort((a, b) => b.value - a.value || b.quantity - a.quantity);
}

export function summarizePokemonPortfolio(snapshot: PokemonIntelligenceSnapshot): PortfolioSummary {
  const byKind = new Map<string, PortfolioBucket>();
  const byLocation = new Map<string, PortfolioBucket>();
  const estimatedValue = snapshot.collectionItems.reduce((sum, item) => sum + itemValue(item), 0);
  const purchaseSpend = snapshot.purchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
  const quantity = snapshot.collectionItems.reduce((sum, item) => sum + item.quantity, 0);

  for (const item of snapshot.collectionItems) {
    addToBucket(byKind, item.item_kind || "unknown", item);
    addToBucket(byLocation, item.storage_location || "Unassigned", item);
  }

  const topItems = snapshot.collectionItems
    .map((item) => ({
      condition: item.condition,
      location: item.storage_location,
      name: item.item_name,
      quantity: item.quantity,
      value: round(itemValue(item)),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const profitLoss = estimatedValue - purchaseSpend;
  const profitLossPercent = purchaseSpend > 0 ? (profitLoss / purchaseSpend) * 100 : 0;

  return {
    estimatedValue: round(estimatedValue),
    itemCount: snapshot.collectionItems.length,
    profitLoss: round(profitLoss),
    profitLossPercent: round(profitLossPercent),
    purchaseSpend: round(purchaseSpend),
    quantity,
    topItems,
    valueByKind: sortedBuckets(byKind),
    valueByLocation: sortedBuckets(byLocation),
  };
}
