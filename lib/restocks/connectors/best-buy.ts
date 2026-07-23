import type { RestockConnector } from "@/lib/restocks/connectors/connector";
import type { ConnectorStatus, RestockEvent } from "@/lib/restocks/types";

type BestBuyProduct = {
  addToCartUrl?: string;
  name: string;
  onlineAvailability?: boolean;
  regularPrice?: number;
  salePrice?: number;
  sku: number;
  url?: string;
};

type BestBuyResponse = { products?: BestBuyProduct[] };

export class BestBuyConnector implements RestockConnector {
  readonly id = "best-buy" as const;
  readonly name = "Best Buy";

  getStatus(): ConnectorStatus {
    const ready = Boolean(process.env.BEST_BUY_API_KEY);
    return {
      id: this.id,
      name: this.name,
      support: "official-api",
      health: ready ? "ready" : "needs-setup",
      cadence: ready ? "On dashboard refresh" : "Not polling",
      detail: ready
        ? "Official product API connected."
        : "Add BEST_BUY_API_KEY to enable the official product API.",
      lastCheckedAt: null,
    };
  }

  async check(): Promise<RestockEvent[]> {
    const apiKey = process.env.BEST_BUY_API_KEY;
    if (!apiKey) return [];

    const query = encodeURIComponent("search=pokemon&search=trading&search=card");
    const url = `https://api.bestbuy.com/v1/products(${query})?apiKey=${apiKey}&format=json&show=sku,name,url,addToCartUrl,regularPrice,salePrice,onlineAvailability&pageSize=25`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`Best Buy returned ${response.status}.`);

    const payload = (await response.json()) as BestBuyResponse;
    const detectedAt = new Date().toISOString();

    return (payload.products ?? []).map((product) => {
      const currentPrice = product.salePrice ?? product.regularPrice ?? null;
      const msrp = product.regularPrice ?? null;
      return {
        id: `best-buy-${product.sku}`,
        retailerId: this.id,
        retailerName: this.name,
        productName: product.name,
        productUrl: product.addToCartUrl ?? product.url ?? "https://www.bestbuy.com/",
        msrp,
        currentPrice,
        stockStatus: product.onlineAvailability ? "in-stock" : "out-of-stock",
        priceStatus: currentPrice !== null && msrp !== null && currentPrice <= msrp ? "msrp" : "unknown",
        detectedAt,
        sourceLabel: "Best Buy Products API",
        sourceSupport: "official-api",
        confidence: "high",
      } satisfies RestockEvent;
    });
  }
}
