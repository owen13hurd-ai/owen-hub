import type {
  PokemonIntelligenceSnapshot,
  PokemonPriceObservation,
  PokemonRestockObservation,
  PokemonWatchlistItem,
} from "./types";

export type OpportunityMatch = {
  id: string;
  ageDays: number;
  confidence: "high" | "medium" | "low";
  currentPrice: number;
  matchedName: string;
  source: string;
  sourceUrl: string | null;
  status: "buy-zone" | "watch" | "avoid" | "stale";
  targetPrice: number | null;
  title: string;
  type: "price" | "restock";
  valueDelta: number | null;
};

export type DuplicateWarning = {
  count: number;
  ids: string[];
  name: string;
  totalQuantity: number;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function daysOld(date: string, now = new Date()) {
  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return 999;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86_400_000));
}

function watchMatches(watch: PokemonWatchlistItem, candidateName: string) {
  const watchName = normalize(watch.name);
  const candidate = normalize(candidateName);
  return Boolean(watch.enabled && watchName && (candidate.includes(watchName) || watchName.includes(candidate)));
}

function statusFor(price: number, targetPrice: number | null, ageDays: number): OpportunityMatch["status"] {
  if (ageDays > 14) return "stale";
  if (targetPrice === null) return "watch";
  if (price <= targetPrice) return "buy-zone";
  if (price <= targetPrice * 1.1) return "watch";
  return "avoid";
}

function matchPriceObservation(
  watch: PokemonWatchlistItem,
  observation: PokemonPriceObservation,
  now: Date,
): OpportunityMatch | null {
  if (!watchMatches(watch, observation.product_name)) return null;
  const currentPrice = observation.price + observation.shipping;
  const age = daysOld(observation.observed_at, now);
  const targetPrice = watch.max_price;
  return {
    ageDays: age,
    confidence: observation.confidence,
    currentPrice,
    id: `price-${observation.id}-${watch.id}`,
    matchedName: watch.name,
    source: observation.source,
    sourceUrl: observation.source_url,
    status: statusFor(currentPrice, targetPrice, age),
    targetPrice,
    title: observation.product_name,
    type: "price",
    valueDelta: targetPrice === null ? null : Math.round((targetPrice - currentPrice) * 100) / 100,
  };
}

function matchRestockObservation(
  watch: PokemonWatchlistItem,
  observation: PokemonRestockObservation,
  now: Date,
): OpportunityMatch | null {
  if (!watchMatches(watch, observation.product_name)) return null;
  const currentPrice = observation.current_price ?? observation.msrp;
  if (currentPrice === null) return null;
  const age = daysOld(observation.observed_at, now);
  const targetPrice = watch.max_price ?? observation.msrp;
  const baseStatus = statusFor(currentPrice, targetPrice, age);
  return {
    ageDays: age,
    confidence: observation.confidence,
    currentPrice,
    id: `restock-${observation.id}-${watch.id}`,
    matchedName: watch.name,
    source: observation.retailer,
    sourceUrl: observation.source_url,
    status: observation.stock_status === "in-stock" ? baseStatus : "avoid",
    targetPrice,
    title: observation.product_name,
    type: "restock",
    valueDelta: targetPrice === null ? null : Math.round((targetPrice - currentPrice) * 100) / 100,
  };
}

function rank(status: OpportunityMatch["status"]) {
  if (status === "buy-zone") return 0;
  if (status === "watch") return 1;
  if (status === "stale") return 2;
  return 3;
}

export function findOpportunityMatches(snapshot: PokemonIntelligenceSnapshot, now = new Date()) {
  const matches = snapshot.watchlist.flatMap((watch) => [
    ...snapshot.priceObservations
      .map((observation) => matchPriceObservation(watch, observation, now))
      .filter((match): match is OpportunityMatch => Boolean(match)),
    ...snapshot.restockObservations
      .map((observation) => matchRestockObservation(watch, observation, now))
      .filter((match): match is OpportunityMatch => Boolean(match)),
  ]);

  return matches.sort((a, b) => rank(a.status) - rank(b.status) || a.ageDays - b.ageDays || a.currentPrice - b.currentPrice);
}

export function findCollectionDuplicates(snapshot: PokemonIntelligenceSnapshot) {
  const grouped = new Map<string, DuplicateWarning>();

  for (const item of snapshot.collectionItems) {
    const key = normalize(`${item.item_name}-${item.condition}-${item.storage_location ?? ""}`);
    const existing = grouped.get(key) ?? { count: 0, ids: [], name: item.item_name, totalQuantity: 0 };
    existing.count += 1;
    existing.ids.push(item.id);
    existing.totalQuantity += item.quantity;
    grouped.set(key, existing);
  }

  return [...grouped.values()].filter((warning) => warning.count > 1).sort((a, b) => b.count - a.count);
}
