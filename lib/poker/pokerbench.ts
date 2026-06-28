import type { TrainingSpot } from "@/lib/poker/types";

export type PokerBenchLibrary = {
  importedAt: string;
  license: "Apache-2.0";
  source: string;
  spots: TrainingSpot[];
  total?: number;
};

export async function loadPokerBench({
  dailySeed,
  position = "All",
  shuffle = false,
  street = "All",
}: {
  dailySeed?: number;
  position?: string;
  shuffle?: boolean;
  street?: string;
} = {}): Promise<PokerBenchLibrary> {
  const params = new URLSearchParams({ limit: dailySeed === undefined ? "80" : "1", position, street });
  if (dailySeed !== undefined) params.set("dailySeed", String(dailySeed));
  if (shuffle) params.set("shuffle", "true");
  const response = await fetch(`/api/poker/training?${params}`);
  if (!response.ok) throw new Error("PokerBench could not be loaded.");
  return response.json() as Promise<PokerBenchLibrary>;
}
