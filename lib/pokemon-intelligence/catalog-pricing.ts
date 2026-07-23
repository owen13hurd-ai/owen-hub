type PriceShape = Record<string, { market?: number; mid?: number; low?: number; high?: number } | undefined>;

export type CatalogPriceSummary = {
  label: string;
  price: number;
};

function round(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function labelFor(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function bestCatalogMarketPrice(prices: PriceShape | null | undefined): CatalogPriceSummary | null {
  if (!prices) return null;

  const priority = ["holofoil", "reverseHolofoil", "normal", "1stEditionHolofoil", "unlimitedHolofoil"];

  for (const key of priority) {
    const market = prices[key]?.market;
    if (typeof market === "number" && market > 0) return { label: labelFor(key), price: round(market) };
  }

  for (const [key, value] of Object.entries(prices)) {
    const fallback = value?.market ?? value?.mid ?? value?.low;
    if (typeof fallback === "number" && fallback > 0) return { label: labelFor(key), price: round(fallback) };
  }

  return null;
}
