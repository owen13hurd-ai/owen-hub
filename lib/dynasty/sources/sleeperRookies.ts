import { normalizePlayerName } from "@/lib/dynasty/sources/nameMatch";

export type SleeperRookie = {
  age: number | null;
  id: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  searchRank: number | null;
  team: string;
};

type SleeperPlayer = {
  active?: boolean;
  age?: number;
  full_name?: string;
  player_id?: string;
  position?: string;
  search_rank?: number;
  status?: string;
  team?: string | null;
  years_exp?: number;
};

const validPositions = new Set<SleeperRookie["position"]>(["QB", "RB", "WR", "TE"]);

export async function getSleeperRookies() {
  try {
    const response = await fetch("https://api.sleeper.app/v1/players/nfl", {
      next: { revalidate: 60 * 60 * 6 },
    });

    if (!response.ok) throw new Error(`Sleeper returned ${response.status}`);

    const directory = (await response.json()) as Record<string, SleeperPlayer>;
    const values = new Map<string, SleeperRookie>();

    Object.entries(directory).forEach(([directoryId, player]) => {
      const position = player.position as SleeperRookie["position"];
      if (
        !player.full_name ||
        !player.team ||
        player.years_exp !== 0 ||
        player.status !== "Active" ||
        player.active === false ||
        !validPositions.has(position)
      ) return;

      values.set(normalizePlayerName(player.full_name), {
        age: player.age ?? null,
        id: player.player_id ?? directoryId,
        name: player.full_name,
        position,
        searchRank: player.search_rank ?? null,
        team: player.team,
      });
    });

    return {
      status: {
        detail: `${values.size} active NFL rookies loaded`,
        label: "Sleeper rookie pool",
        status: "live" as const,
      },
      values,
    };
  } catch {
    return {
      status: {
        detail: "Sleeper rookie directory unavailable",
        label: "Sleeper rookie pool",
        status: "error" as const,
      },
      values: new Map<string, SleeperRookie>(),
    };
  }
}
