export type SleeperLeagueSummary = {
  id: string;
  name: string;
  avatar: string | null;
  totalRosters: number | null;
};

export type SleeperRosterAsset = {
  id: string;
  leagueId: string;
  leagueName: string;
  playerId: string;
  name: string;
  position: string;
  team: string | null;
};

export type SleeperPortfolioData = {
  displayName: string;
  leagues: SleeperLeagueSummary[];
  rosterAssets: SleeperRosterAsset[];
  season: string;
  username: string;
};

type SleeperUser = {
  display_name?: string;
  user_id?: string;
  username?: string;
};

type SleeperLeague = {
  avatar?: string | null;
  league_id?: string;
  name?: string;
  total_rosters?: number;
};

type SleeperRoster = {
  co_owners?: string[] | null;
  owner_id?: string | null;
  players?: string[] | null;
  roster_id?: number;
};

type SleeperPlayer = {
  first_name?: string;
  full_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
};

const sleeperBaseUrl = "https://api.sleeper.app/v1";

async function fetchSleeperJson<T>(path: string, revalidateSeconds: number) {
  const response = await fetch(`${sleeperBaseUrl}${path}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Sleeper returned ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

function getPlayerName(playerId: string, player?: SleeperPlayer) {
  if (!player) {
    return `Unknown player ${playerId}`;
  }

  if (player.full_name) {
    return player.full_name;
  }

  return [player.first_name, player.last_name].filter(Boolean).join(" ");
}

export async function getSleeperPortfolio({
  season,
  username,
}: {
  season: string;
  username: string;
}): Promise<SleeperPortfolioData> {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    throw new Error("Enter a Sleeper username.");
  }

  const user = await fetchSleeperJson<SleeperUser | null>(
    `/user/${encodeURIComponent(trimmedUsername)}`,
    60 * 60,
  );

  if (!user?.user_id) {
    throw new Error("Sleeper user was not found.");
  }

  const [leagues, players] = await Promise.all([
    fetchSleeperJson<SleeperLeague[]>(
      `/user/${user.user_id}/leagues/nfl/${season}`,
      60 * 10,
    ),
    fetchSleeperJson<Record<string, SleeperPlayer>>("/players/nfl", 60 * 60 * 24),
  ]);

  const leagueSummaries: SleeperLeagueSummary[] = [];
  const rosterAssets: SleeperRosterAsset[] = [];

  await Promise.all(
    leagues.map(async (league) => {
      if (!league.league_id) {
        return;
      }

      const leagueName = league.name ?? league.league_id;
      const rosters = await fetchSleeperJson<SleeperRoster[]>(
        `/league/${league.league_id}/rosters`,
        60 * 10,
      );
      const userRoster = rosters.find((roster) => {
        return (
          roster.owner_id === user.user_id ||
          roster.co_owners?.includes(user.user_id ?? "")
        );
      });

      leagueSummaries.push({
        id: league.league_id,
        name: leagueName,
        avatar: league.avatar ?? null,
        totalRosters: league.total_rosters ?? null,
      });

      userRoster?.players?.forEach((playerId) => {
        const player = players[playerId];

        rosterAssets.push({
          id: `${league.league_id}-${playerId}`,
          leagueId: league.league_id ?? "",
          leagueName,
          playerId,
          name: getPlayerName(playerId, player),
          position: player?.position ?? "UNK",
          team: player?.team ?? null,
        });
      });
    }),
  );

  return {
    displayName: user.display_name ?? user.username ?? trimmedUsername,
    leagues: leagueSummaries.sort((a, b) => a.name.localeCompare(b.name)),
    rosterAssets,
    season,
    username: trimmedUsername,
  };
}
