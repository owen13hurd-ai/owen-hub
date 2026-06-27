import { normalizePlayerName } from "@/lib/dynasty/sources/nameMatch";

export type FantasyCalcMarketValue = {
  age: number | null;
  name: string;
  position: string;
  positionRank: number | null;
  team: string;
  rank: number | null;
  value: number | null;
  trend30Day: number | null;
  tier: number | null;
  yearsExperience: number | null;
};

type FantasyCalcApiPlayer = {
  player?: {
    name?: string;
    position?: string;
    maybeTeam?: string;
    maybeAge?: number;
    maybeYoe?: number;
  };
  overallRank?: number;
  positionRank?: number;
  value?: number;
  trend30Day?: number;
  maybeTier?: number;
};

const fantasyCalcUrl =
  "https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=0.5";

export async function getFantasyCalcValues() {
  try {
    const response = await fetch(fantasyCalcUrl, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      throw new Error(`FantasyCalc returned ${response.status}`);
    }

    const data = (await response.json()) as FantasyCalcApiPlayer[];
    const values = new Map<string, FantasyCalcMarketValue>();

    data.forEach((item) => {
      const name = item.player?.name;

      if (!name) {
        return;
      }

      values.set(normalizePlayerName(name), {
        age: item.player?.maybeAge ?? null,
        name,
        position: item.player?.position ?? "",
        positionRank: item.positionRank ?? null,
        team: item.player?.maybeTeam ?? "",
        rank: item.overallRank ?? null,
        value: item.value ?? null,
        trend30Day: item.trend30Day ?? null,
        tier: item.maybeTier ?? null,
        yearsExperience: item.player?.maybeYoe ?? null,
      });
    });

    return {
      status: {
        label: "FantasyCalc",
        status: "live" as const,
        detail: `${values.size} live values loaded`,
      },
      values,
    };
  } catch {
    return {
      status: {
        label: "FantasyCalc",
        status: "error" as const,
        detail: "Live API unavailable; showing blanks",
      },
      values: new Map<string, FantasyCalcMarketValue>(),
    };
  }
}
