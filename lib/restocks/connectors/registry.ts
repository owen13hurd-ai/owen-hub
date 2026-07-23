import { BestBuyConnector } from "@/lib/restocks/connectors/best-buy";
import { unavailableStatus, type RestockConnector } from "@/lib/restocks/connectors/connector";
import type { ConnectorStatus, RestockEvent, RestockSnapshot, RetailerId } from "@/lib/restocks/types";

const bestBuy = new BestBuyConnector();
const connectors: RestockConnector[] = [bestBuy];

const planned: Array<[RetailerId, string, string]> = [
  ["pokemon-center", "Pokémon Center", "Official product pages require a respectful, low-frequency availability check."],
  ["target", "Target", "No supported public consumer inventory API is configured."],
  ["gamestop", "GameStop", "No supported public consumer inventory API is configured."],
  ["walmart", "Walmart", "Partner APIs are not a general consumer inventory feed."],
  ["costco", "Costco", "Local stock is best handled through saved locations and verified community sightings."],
  ["sams-club", "Sam's Club", "Local stock is best handled through saved locations and verified community sightings."],
];

export async function getRestockSnapshot(): Promise<RestockSnapshot> {
  const checkedAt = new Date().toISOString();
  const results = await Promise.allSettled(connectors.map((connector) => connector.check()));
  const events: RestockEvent[] = [];
  const statuses: ConnectorStatus[] = connectors.map((connector, index) => {
    const base = connector.getStatus();
    const result = results[index];
    if (result.status === "fulfilled") {
      events.push(...result.value);
      return { ...base, lastCheckedAt: base.health === "ready" ? checkedAt : null };
    }
    return { ...base, health: "error", detail: result.reason instanceof Error ? result.reason.message : "Connector failed.", lastCheckedAt: checkedAt };
  });

  statuses.push(...planned.map(([id, name, detail]) => unavailableStatus(id, name, detail)));

  return {
    checkedAt,
    events: events.sort((a, b) => Number(b.stockStatus === "in-stock") - Number(a.stockStatus === "in-stock")),
    releases: [],
    connectors: statuses,
  };
}
