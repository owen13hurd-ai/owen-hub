import { normalizePlayerName } from "@/lib/dynasty/sources/nameMatch";

export type FantasyProsWeeklyProjection = {
  halfPpr: number | null;
  name: string;
  ppr: number | null;
  standard: number | null;
};

type FantasyProsProjectionResponse = {
  players?: Array<{
    name?: string;
    player_name?: string;
    stats?: {
      points?: number | string | null;
      points_half?: number | string | null;
      points_ppr?: number | string | null;
    };
  }>;
};

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getFantasyProsWeeklyProjections({
  season,
  week,
}: {
  season: string;
  week: number;
}) {
  const apiKey = process.env.FANTASYPROS_API_KEY?.trim();

  if (!apiKey) {
    return {
      status: {
        detail: "Add FANTASYPROS_API_KEY to activate weekly projections.",
        label: "FantasyPros",
        status: "missing" as const,
      },
      values: new Map<string, FantasyProsWeeklyProjection>(),
    };
  }

  try {
    const url = new URL(
      `https://api.fantasypros.com/public/v2/json/nfl/${encodeURIComponent(season)}/projections`,
    );
    url.searchParams.set("week", String(week));
    url.searchParams.set("positions", "QB:RB:WR:TE");
    url.searchParams.set("scoring", "PPR");

    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
      next: { revalidate: 60 * 15 },
    });

    if (!response.ok) {
      throw new Error(`FantasyPros returned ${response.status}`);
    }

    const payload = (await response.json()) as FantasyProsProjectionResponse;
    const values = new Map<string, FantasyProsWeeklyProjection>();

    (payload.players ?? []).forEach((player) => {
      const name = player.name ?? player.player_name;
      if (!name) return;

      values.set(normalizePlayerName(name), {
        halfPpr: numberOrNull(player.stats?.points_half),
        name,
        ppr: numberOrNull(player.stats?.points_ppr),
        standard: numberOrNull(player.stats?.points),
      });
    });

    return {
      status: {
        detail: `${values.size} Week ${week} projections loaded.`,
        label: "FantasyPros",
        status: "live" as const,
      },
      values,
    };
  } catch (error) {
    return {
      status: {
        detail: error instanceof Error ? error.message : "Weekly projections unavailable.",
        label: "FantasyPros",
        status: "error" as const,
      },
      values: new Map<string, FantasyProsWeeklyProjection>(),
    };
  }
}
