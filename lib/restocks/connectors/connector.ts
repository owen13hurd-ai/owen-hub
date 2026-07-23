import type { ConnectorStatus, RestockEvent, RetailerId } from "@/lib/restocks/types";

export interface RestockConnector {
  readonly id: RetailerId;
  readonly name: string;
  getStatus(): ConnectorStatus;
  check(): Promise<RestockEvent[]>;
}

export function unavailableStatus(
  id: RetailerId,
  name: string,
  detail: string,
): ConnectorStatus {
  return {
    id,
    name,
    support: "official-page",
    health: "needs-setup",
    cadence: "Not polling",
    detail,
    lastCheckedAt: null,
  };
}
