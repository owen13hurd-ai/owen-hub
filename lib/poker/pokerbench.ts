import type { TrainingSpot } from "@/lib/poker/types";

export type PokerBenchLibrary = {
  importedAt: string;
  license: "Apache-2.0";
  source: string;
  spots: TrainingSpot[];
};

export async function loadPokerBench(): Promise<PokerBenchLibrary> {
  const response = await fetch("/data/pokerbench-test.json");
  if (!response.ok) throw new Error("PokerBench could not be loaded.");
  return response.json() as Promise<PokerBenchLibrary>;
}
