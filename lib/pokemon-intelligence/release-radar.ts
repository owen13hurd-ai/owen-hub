import type { PokemonIntelligenceSnapshot } from "./types";

export type ReleaseRadarItem = {
  id: string;
  daysUntil: number | null;
  isWatched: boolean;
  kind: "product" | "set";
  name: string;
  releaseDate: string | null;
  status: "upcoming" | "recent" | "past" | "unscheduled";
  subtitle: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((dateOnly(to).getTime() - dateOnly(from).getTime()) / 86_400_000);
}

function statusFor(daysUntil: number | null): ReleaseRadarItem["status"] {
  if (daysUntil === null) return "unscheduled";
  if (daysUntil >= 0) return "upcoming";
  if (daysUntil >= -30) return "recent";
  return "past";
}

function watched(snapshot: PokemonIntelligenceSnapshot, name: string) {
  const candidate = normalize(name);
  return snapshot.watchlist.some((item) => {
    const watchName = normalize(item.name);
    return item.enabled && watchName && (candidate.includes(watchName) || watchName.includes(candidate));
  });
}

export function buildReleaseRadar(snapshot: PokemonIntelligenceSnapshot, now = new Date()): ReleaseRadarItem[] {
  const setItems: ReleaseRadarItem[] = snapshot.sets.map((set) => {
    const releaseDate = set.release_date;
    const parsed = releaseDate ? new Date(`${releaseDate}T00:00:00`) : null;
    const daysUntil = parsed && !Number.isNaN(parsed.getTime()) ? daysBetween(now, parsed) : null;
    return {
      daysUntil,
      id: `set-${set.id}`,
      isWatched: watched(snapshot, set.name),
      kind: "set",
      name: set.name,
      releaseDate,
      status: statusFor(daysUntil),
      subtitle: set.era ?? "Set",
    };
  });

  const productItems: ReleaseRadarItem[] = snapshot.products.map((product) => {
    const releaseDate = product.release_date;
    const parsed = releaseDate ? new Date(`${releaseDate}T00:00:00`) : null;
    const daysUntil = parsed && !Number.isNaN(parsed.getTime()) ? daysBetween(now, parsed) : null;
    return {
      daysUntil,
      id: `product-${product.id}`,
      isWatched: watched(snapshot, product.name) || Boolean(product.set_name && watched(snapshot, product.set_name)),
      kind: "product",
      name: product.name,
      releaseDate,
      status: statusFor(daysUntil),
      subtitle: [product.set_name, product.product_type, product.msrp ? `$${product.msrp}` : null].filter(Boolean).join(" · ") || "Product",
    };
  });

  return [...setItems, ...productItems].sort((a, b) => {
    const rank = { upcoming: 0, recent: 1, unscheduled: 2, past: 3 };
    return rank[a.status] - rank[b.status] || (a.daysUntil ?? 9999) - (b.daysUntil ?? 9999) || a.name.localeCompare(b.name);
  });
}

export function findUnwatchedUpcoming(snapshot: PokemonIntelligenceSnapshot, now = new Date()) {
  return buildReleaseRadar(snapshot, now).filter((item) => item.status === "upcoming" && !item.isWatched);
}
