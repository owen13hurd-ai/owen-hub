import { getDynastyRankings } from "@/lib/dynasty/rankings";
import type { DynastyRanking } from "@/types/dynasty";

export type SleeperLeagueSummary = {
  id: string;
  name: string;
  avatar: string | null;
  totalRosters: number | null;
};

export type SleeperRosterAsset = {
  id: string;
  age: number | null;
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

export type SleeperLeaguemateMatch = {
  avatar: string | null;
  displayName: string;
  isSharedLeague: boolean;
  leagueId: string;
  leagueName: string;
  rosterId: number;
  teamName: string | null;
  userId: string;
  username: string | null;
};

export type SleeperLeaguematePlayer = {
  age: number | null;
  exposure: number;
  leagueNames: string[];
  name: string;
  playerId: string;
  position: string;
  team: string | null;
};

export type SleeperLeaguemateTradePlayer = {
  count: number;
  name: string;
  playerId: string;
  position: string;
  team: string | null;
};

export type SleeperLeaguemateInsights = {
  averageAge: number | null;
  matches: SleeperLeaguemateMatch[];
  playerCount: number;
  players: SleeperLeaguematePlayer[];
  positionCounts: Record<string, number>;
  profileLabels: string[];
  searchedName: string;
  season: string;
  sharedLeagueCount: number;
  totalLeagueCount: number;
  topAcquiredPlayers: SleeperLeaguemateTradePlayer[];
  topTradedAwayPlayers: SleeperLeaguemateTradePlayer[];
  tradeCount: number;
};

export type SleeperLeaguemateSearchOption = {
  displayName: string;
  leagueCount: number;
  leagueNames: string[];
  searchLabel: string;
  teamNames: string[];
  userId: string;
};

export type SleeperLeagueRosterRole = "starter" | "bench";

export type SleeperLeagueRosterPlayer = SleeperRosterAsset & {
  personalRank: number | null;
  positionRank: string | null;
  rosterRole: SleeperLeagueRosterRole;
  starterSlot: string | null;
  value: number | null;
};

export type SleeperLeagueRosterTeam = {
  averageAge: number | null;
  ownerName: string;
  playersByPosition: Record<string, SleeperLeagueRosterPlayer[]>;
  rosterId: number;
  starterCount: number;
  starterValue: number;
  teamName: string | null;
  totalValue: number;
  username: string | null;
};

export type SleeperLeagueRosterBoard = {
  leagues: SleeperLeagueSummary[];
  rosterPositions: string[];
  season: string;
  selectedLeague: SleeperLeagueSummary;
  starterSlots: string[];
  teams: SleeperLeagueRosterTeam[];
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
  roster_positions?: string[] | null;
  total_rosters?: number;
};

type SleeperRoster = {
  co_owners?: string[] | null;
  owner_id?: string | null;
  players?: string[] | null;
  roster_id?: number;
};

type SleeperLeagueUser = {
  avatar?: string | null;
  display_name?: string | null;
  metadata?: {
    team_name?: string;
  } | null;
  user_id?: string;
  username?: string | null;
};

type SleeperPlayer = {
  age?: number;
  first_name?: string;
  full_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
};

type SleeperTransaction = {
  adds?: Record<string, number> | null;
  drops?: Record<string, number> | null;
  roster_ids?: number[] | null;
  status?: string;
  type?: string;
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

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePlayerMatchText(value: string) {
  return normalizeSearchText(value)
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLeagueSummary(league: SleeperLeague): SleeperLeagueSummary {
  return {
    id: league.league_id ?? "",
    name: league.name ?? league.league_id ?? "Sleeper league",
    avatar: league.avatar ?? null,
    totalRosters: league.total_rosters ?? null,
  };
}

function getRankingByPlayerName(rankings: DynastyRanking[]) {
  const rankingsByName = new Map<string, DynastyRanking>();

  rankings.forEach((ranking) => {
    const fullNameKey = normalizeSearchText(ranking.player);
    const suffixlessNameKey = normalizePlayerMatchText(ranking.player);

    rankingsByName.set(fullNameKey, ranking);

    if (!rankingsByName.has(suffixlessNameKey)) {
      rankingsByName.set(suffixlessNameKey, ranking);
    }
  });

  return rankingsByName;
}

function sortRosterPlayers(
  firstPlayer: SleeperLeagueRosterPlayer,
  secondPlayer: SleeperLeagueRosterPlayer,
) {
  const firstRank = firstPlayer.personalRank ?? Number.POSITIVE_INFINITY;
  const secondRank = secondPlayer.personalRank ?? Number.POSITIVE_INFINITY;

  return firstRank - secondRank || firstPlayer.name.localeCompare(secondPlayer.name);
}

function getEligiblePositions(slot: string) {
  const normalizedSlot = slot.toUpperCase();

  if (["QB", "RB", "WR", "TE"].includes(normalizedSlot)) {
    return [normalizedSlot];
  }

  if (
    [
      "FLEX",
      "REC_FLEX",
      "WRRB_FLEX",
      "WRRB",
      "WRT",
      "WRTE_FLEX",
      "WRTE",
    ].includes(normalizedSlot)
  ) {
    return ["RB", "WR", "TE"];
  }

  if (
    ["SUPER_FLEX", "SUPERFLEX", "OP", "OFFENSIVE_PLAYER"].includes(
      normalizedSlot,
    )
  ) {
    return ["QB", "RB", "WR", "TE"];
  }

  return [];
}

function isStarterSlot(slot: string) {
  return !["BN", "IR", "TAXI"].includes(slot.toUpperCase());
}

function assignRosterRoles(
  players: SleeperLeagueRosterPlayer[],
  starterSlots: string[],
) {
  const remainingPlayers = [...players].sort(sortRosterPlayers);
  const starters: SleeperLeagueRosterPlayer[] = [];

  starterSlots.forEach((slot) => {
    const eligiblePositions = getEligiblePositions(slot);
    const nextPlayerIndex = remainingPlayers.findIndex((player) =>
      eligiblePositions.includes(player.position),
    );

    if (nextPlayerIndex === -1) {
      return;
    }

    const [starter] = remainingPlayers.splice(nextPlayerIndex, 1);
    starters.push({
      ...starter,
      rosterRole: "starter",
      starterSlot: slot,
    });
  });

  const bench = remainingPlayers.map((player) => ({
    ...player,
    rosterRole: "bench" as const,
  }));

  return [...starters, ...bench].sort(sortRosterPlayers);
}

function getPlayerAsset({
  leagueId,
  leagueName,
  playerId,
  player,
}: {
  leagueId: string;
  leagueName: string;
  player?: SleeperPlayer;
  playerId: string;
}): SleeperRosterAsset {
  return {
    age: player?.age ?? null,
    id: `${leagueId}-${playerId}`,
    leagueId,
    leagueName,
    playerId,
    name: getPlayerName(playerId, player),
    position: player?.position ?? "UNK",
    team: player?.team ?? null,
  };
}

function sortTradePlayers(
  counts: Map<string, number>,
  players: Record<string, SleeperPlayer>,
) {
  return Array.from(counts.entries())
    .map(([playerId, count]) => {
      const player = players[playerId];

      return {
        count,
        name: getPlayerName(playerId, player),
        playerId,
        position: player?.position ?? "UNK",
        team: player?.team ?? null,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8);
}

function incrementPlayerCount(counts: Map<string, number>, playerId: string) {
  counts.set(playerId, (counts.get(playerId) ?? 0) + 1);
}

function getLeagueUserSearchText(leagueUser: SleeperLeagueUser) {
  const metadataValues = Object.values(leagueUser.metadata ?? {}).filter(
    (value): value is string => typeof value === "string",
  );

  return normalizeSearchText(
    [
      leagueUser.display_name,
      leagueUser.username,
      leagueUser.metadata?.team_name,
      ...metadataValues,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function isLeagueUserMatch(leagueUser: SleeperLeagueUser, searchText: string) {
  const haystack = getLeagueUserSearchText(leagueUser);
  const searchTokens = searchText.split(" ").filter(Boolean);

  return (
    haystack.includes(searchText) ||
    searchTokens.every((token) => haystack.includes(token))
  );
}

function getProfileLabels({
  averageAge,
  playerCount,
  positionCounts,
  tradeCount,
}: {
  averageAge: number | null;
  playerCount: number;
  positionCounts: Record<string, number>;
  tradeCount: number;
}) {
  const labels: string[] = [];
  const qbRate = playerCount > 0 ? (positionCounts.QB ?? 0) / playerCount : 0;
  const rbRate = playerCount > 0 ? (positionCounts.RB ?? 0) / playerCount : 0;
  const wrRate = playerCount > 0 ? (positionCounts.WR ?? 0) / playerCount : 0;

  if (averageAge !== null && averageAge <= 25.5) {
    labels.push("Young asset collector");
  } else if (averageAge !== null && averageAge >= 27.5) {
    labels.push("Veteran-leaning roster");
  } else {
    labels.push("Age-balanced roster");
  }

  if (qbRate >= 0.22) {
    labels.push("QB investor");
  }

  if (rbRate >= 0.34) {
    labels.push("RB-heavy build");
  }

  if (wrRate >= 0.42) {
    labels.push("WR-heavy build");
  }

  if (tradeCount >= 6) {
    labels.push("Active trader");
  } else if (tradeCount > 0) {
    labels.push("Selective trader");
  } else {
    labels.push("Quiet trader");
  }

  return labels;
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

        rosterAssets.push(
          getPlayerAsset({
            leagueId: league.league_id ?? "",
            leagueName,
            player,
            playerId,
          }),
        );
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

export async function getSleeperLeaguemateSearchOptions({
  season,
  username,
}: {
  season: string;
  username: string;
}): Promise<SleeperLeaguemateSearchOption[]> {
  const myPortfolio = await getSleeperPortfolio({ season, username });
  const optionsByUserId = new Map<
    string,
    {
      displayName: string;
      leagueNames: Set<string>;
      teamNames: Set<string>;
      userId: string;
    }
  >();

  await Promise.all(
    myPortfolio.leagues.map(async (league) => {
      const [leagueUsers, rosters] = await Promise.all([
        fetchSleeperJson<SleeperLeagueUser[]>(
          `/league/${league.id}/users`,
          60 * 10,
        ),
        fetchSleeperJson<SleeperRoster[]>(`/league/${league.id}/rosters`, 60 * 10),
      ]);
      const rosterOwnerIds = new Set<string>();

      rosters.forEach((roster) => {
        if (roster.owner_id) {
          rosterOwnerIds.add(roster.owner_id);
        }

        roster.co_owners?.forEach((coOwnerId) => {
          rosterOwnerIds.add(coOwnerId);
        });
      });

      leagueUsers.forEach((leagueUser) => {
        if (!leagueUser.user_id || !rosterOwnerIds.has(leagueUser.user_id)) {
          return;
        }

        const existingOption = optionsByUserId.get(leagueUser.user_id) ?? {
          displayName:
            leagueUser.display_name ??
            leagueUser.username ??
            leagueUser.metadata?.team_name ??
            "Unknown manager",
          leagueNames: new Set<string>(),
          teamNames: new Set<string>(),
          userId: leagueUser.user_id,
        };

        existingOption.leagueNames.add(league.name);

        if (leagueUser.metadata?.team_name) {
          existingOption.teamNames.add(leagueUser.metadata.team_name.trim());
        }

        optionsByUserId.set(leagueUser.user_id, existingOption);
      });
    }),
  );

  return Array.from(optionsByUserId.values())
    .map((option) => {
      const teamNames = Array.from(option.teamNames).filter(Boolean).sort();

      return {
        displayName: option.displayName,
        leagueCount: option.leagueNames.size,
        leagueNames: Array.from(option.leagueNames).sort(),
        searchLabel: [option.displayName, teamNames[0]]
          .filter(Boolean)
          .join(" - "),
        teamNames,
        userId: option.userId,
      };
    })
    .sort((a, b) => {
      return b.leagueCount - a.leagueCount || a.displayName.localeCompare(b.displayName);
    });
}

export async function getSleeperLeaguemateInsights({
  managerUserId,
  managerName,
  season,
  username,
}: {
  managerUserId?: string;
  managerName: string;
  season: string;
  username: string;
}): Promise<SleeperLeaguemateInsights> {
  const searchedName = managerName.trim();
  const searchedUserId = managerUserId?.trim();

  if (!searchedName && !searchedUserId) {
    throw new Error("Enter a leaguemate name, username, or team name.");
  }

  const myPortfolio = await getSleeperPortfolio({ season, username });
  const players = await fetchSleeperJson<Record<string, SleeperPlayer>>(
    "/players/nfl",
    60 * 60 * 24,
  );
  const normalizedSearch = normalizeSearchText(searchedName);
  const matches: SleeperLeaguemateMatch[] = [];
  const rosterAssets: SleeperRosterAsset[] = [];
  const acquiredCounts = new Map<string, number>();
  const tradedAwayCounts = new Map<string, number>();
  const targetUsers = new Map<
    string,
    {
      avatar: string | null;
      displayName: string;
      teamName: string | null;
      userId: string;
      username: string | null;
    }
  >();
  const matchKeys = new Set<string>();
  const sharedLeagueIds = new Set(myPortfolio.leagues.map((league) => league.id));
  let tradeCount = 0;

  await Promise.all(
    myPortfolio.leagues.map(async (league) => {
      const [leagueUsers, rosters] = await Promise.all([
        fetchSleeperJson<SleeperLeagueUser[]>(
          `/league/${league.id}/users`,
          60 * 10,
        ),
        fetchSleeperJson<SleeperRoster[]>(`/league/${league.id}/rosters`, 60 * 10),
      ]);

      const matchingUsers = leagueUsers.filter((leagueUser) => {
        if (searchedUserId) {
          return leagueUser.user_id === searchedUserId;
        }

        return isLeagueUserMatch(leagueUser, normalizedSearch);
      });

      matchingUsers.forEach((leagueUser) => {
        if (!leagueUser.user_id) {
          return;
        }

        const roster = rosters.find((candidate) => {
          return (
            candidate.owner_id === leagueUser.user_id ||
            candidate.co_owners?.includes(leagueUser.user_id ?? "")
          );
        });

        if (!roster?.roster_id) {
          return;
        }

        targetUsers.set(leagueUser.user_id, {
          avatar: leagueUser.avatar ?? null,
          displayName:
            leagueUser.display_name ??
            leagueUser.username ??
            leagueUser.metadata?.team_name ??
            "Unknown manager",
          teamName: leagueUser.metadata?.team_name ?? null,
          userId: leagueUser.user_id,
          username: leagueUser.username ?? null,
        });
      });
    }),
  );

  if (targetUsers.size === 0 && searchedName) {
    const searchedUser = await fetchSleeperJson<SleeperUser | null>(
      `/user/${encodeURIComponent(searchedName)}`,
      60 * 60,
    ).catch(() => null);

    if (searchedUser?.user_id) {
      targetUsers.set(searchedUser.user_id, {
        avatar: null,
        displayName: searchedUser.display_name ?? searchedUser.username ?? searchedName,
        teamName: null,
        userId: searchedUser.user_id,
        username: searchedUser.username ?? null,
      });
    }
  }

  async function addLeagueRoster({
    fallbackUser,
    league,
    roster,
    user,
  }: {
    fallbackUser: {
      avatar: string | null;
      displayName: string;
      teamName: string | null;
      userId: string;
      username: string | null;
    };
    league: SleeperLeagueSummary;
    roster: SleeperRoster;
    user?: SleeperLeagueUser;
  }) {
    if (!roster.roster_id) {
      return;
    }

    const targetRosterId = roster.roster_id;
    const matchKey = `${league.id}-${targetRosterId}`;

    if (matchKeys.has(matchKey)) {
      return;
    }

    matchKeys.add(matchKey);

    matches.push({
      avatar: user?.avatar ?? fallbackUser.avatar,
      displayName:
        user?.display_name ??
        user?.username ??
        user?.metadata?.team_name ??
        fallbackUser.displayName,
      isSharedLeague: sharedLeagueIds.has(league.id),
      leagueId: league.id,
      leagueName: league.name,
      rosterId: targetRosterId,
      teamName: user?.metadata?.team_name ?? fallbackUser.teamName,
      userId: fallbackUser.userId,
      username: user?.username ?? fallbackUser.username,
    });

    roster.players?.forEach((playerId) => {
      rosterAssets.push(
        getPlayerAsset({
          leagueId: league.id,
          leagueName: league.name,
          player: players[playerId],
          playerId,
        }),
      );
    });

    const transactionWeeks = Array.from({ length: 18 }, (_, index) => index + 1);
    const transactionsByWeek = await Promise.all(
      transactionWeeks.map((week) =>
        fetchSleeperJson<SleeperTransaction[]>(
          `/league/${league.id}/transactions/${week}`,
          60 * 10,
        ).catch(() => []),
      ),
    );

    transactionsByWeek.flat().forEach((transaction) => {
      if (
        transaction.type !== "trade" ||
        transaction.status !== "complete" ||
        !transaction.roster_ids?.includes(targetRosterId)
      ) {
        return;
      }

      tradeCount += 1;

      Object.entries(transaction.adds ?? {}).forEach(
        ([playerId, destinationRosterId]) => {
          if (destinationRosterId === targetRosterId) {
            incrementPlayerCount(acquiredCounts, playerId);
          }
        },
      );

      Object.entries(transaction.drops ?? {}).forEach(([playerId, sourceRosterId]) => {
        if (sourceRosterId === targetRosterId) {
          incrementPlayerCount(tradedAwayCounts, playerId);
        }
      });
    });
  }

  await Promise.all(
    Array.from(targetUsers.values()).map(async (targetUser) => {
      const targetLeagues = await fetchSleeperJson<SleeperLeague[]>(
        `/user/${targetUser.userId}/leagues/nfl/${season}`,
        60 * 10,
      ).catch(() => []);

      await Promise.all(
        targetLeagues
          .filter((league) => Boolean(league.league_id))
          .map(async (league) => {
            const leagueSummary = getLeagueSummary(league);
            const [leagueUsers, rosters] = await Promise.all([
              fetchSleeperJson<SleeperLeagueUser[]>(
                `/league/${leagueSummary.id}/users`,
                60 * 10,
              ).catch(() => []),
              fetchSleeperJson<SleeperRoster[]>(
                `/league/${leagueSummary.id}/rosters`,
                60 * 10,
              ).catch(() => []),
            ]);
            const leagueUser = leagueUsers.find((candidate) => {
              return candidate.user_id === targetUser.userId;
            });
            const roster = rosters.find((candidate) => {
              return (
                candidate.owner_id === targetUser.userId ||
                candidate.co_owners?.includes(targetUser.userId)
              );
            });

            if (!roster) {
              return;
            }

            await addLeagueRoster({
              fallbackUser: targetUser,
              league: leagueSummary,
              roster,
              user: leagueUser,
            });
          }),
      );
    }),
  );

  const playersById = new Map<string, SleeperLeaguematePlayer>();

  rosterAssets.forEach((asset) => {
    const existingPlayer = playersById.get(asset.playerId);

    if (existingPlayer) {
      existingPlayer.exposure += 1;
      existingPlayer.leagueNames.push(asset.leagueName);
      return;
    }

    playersById.set(asset.playerId, {
      age: asset.age,
      exposure: 1,
      leagueNames: [asset.leagueName],
      name: asset.name,
      playerId: asset.playerId,
      position: asset.position,
      team: asset.team,
    });
  });

  const insightPlayers = Array.from(playersById.values()).sort((a, b) => {
    return b.exposure - a.exposure || a.name.localeCompare(b.name);
  });
  const knownAges = insightPlayers
    .map((player) => player.age)
    .filter((age): age is number => typeof age === "number");
  const averageAge =
    knownAges.length > 0
      ? Number(
          (
            knownAges.reduce((total, age) => total + age, 0) / knownAges.length
          ).toFixed(1),
        )
      : null;
  const positionCounts = insightPlayers.reduce<Record<string, number>>(
    (counts, player) => {
      counts[player.position] = (counts[player.position] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return {
    averageAge,
    matches: matches.sort((a, b) => a.leagueName.localeCompare(b.leagueName)),
    playerCount: insightPlayers.length,
    players: insightPlayers,
    positionCounts,
    profileLabels: getProfileLabels({
      averageAge,
      playerCount: insightPlayers.length,
      positionCounts,
      tradeCount,
    }),
    searchedName,
    season,
    sharedLeagueCount: matches.filter((match) => match.isSharedLeague).length,
    totalLeagueCount: matches.length,
    topAcquiredPlayers: sortTradePlayers(acquiredCounts, players),
    topTradedAwayPlayers: sortTradePlayers(tradedAwayCounts, players),
    tradeCount,
  };
}

export async function getSleeperLeagueRosterBoard({
  leagueId,
  season,
  username,
}: {
  leagueId?: string;
  season: string;
  username: string;
}): Promise<SleeperLeagueRosterBoard> {
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

  const [userLeagues, players] = await Promise.all([
    fetchSleeperJson<SleeperLeague[]>(
      `/user/${user.user_id}/leagues/nfl/${season}`,
      60 * 10,
    ),
    fetchSleeperJson<Record<string, SleeperPlayer>>("/players/nfl", 60 * 60 * 24),
  ]);
  const leagues = userLeagues
    .filter((league) => Boolean(league.league_id))
    .map(getLeagueSummary)
    .sort((a, b) => a.name.localeCompare(b.name));
  const selectedLeague =
    leagues.find((league) => league.id === leagueId) ?? leagues[0];

  if (!selectedLeague) {
    throw new Error(`No Sleeper leagues were found for ${season}.`);
  }

  const [leagueDetails, leagueUsers, rosters] = await Promise.all([
    fetchSleeperJson<SleeperLeague>(
      `/league/${selectedLeague.id}`,
      60 * 10,
    ).catch(() => null),
    fetchSleeperJson<SleeperLeagueUser[]>(
      `/league/${selectedLeague.id}/users`,
      60 * 10,
    ),
    fetchSleeperJson<SleeperRoster[]>(
      `/league/${selectedLeague.id}/rosters`,
      60 * 10,
    ),
  ]);
  const rosterPositions =
    leagueDetails?.roster_positions?.filter(Boolean) ??
    userLeagues.find((league) => league.league_id === selectedLeague.id)
      ?.roster_positions?.filter(Boolean) ??
    ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "SUPER_FLEX", "BN"];
  const starterSlots = rosterPositions.filter(isStarterSlot);
  const rankingsByName = getRankingByPlayerName(getDynastyRankings());
  const leagueUsersById = new Map(
    leagueUsers
      .filter((leagueUser) => Boolean(leagueUser.user_id))
      .map((leagueUser) => [leagueUser.user_id ?? "", leagueUser]),
  );

  const teams = rosters
    .filter((roster) => typeof roster.roster_id === "number")
    .map((roster) => {
      const owner = roster.owner_id
        ? leagueUsersById.get(roster.owner_id)
        : undefined;
      const ownerName =
        owner?.display_name ??
        owner?.username ??
        owner?.metadata?.team_name ??
        `Roster ${roster.roster_id}`;
      const basePlayers = (roster.players ?? [])
        .map((playerId) => {
          const asset = getPlayerAsset({
            leagueId: selectedLeague.id,
            leagueName: selectedLeague.name,
            player: players[playerId],
            playerId,
          });
          const ranking =
            rankingsByName.get(normalizeSearchText(asset.name)) ??
            rankingsByName.get(normalizePlayerMatchText(asset.name));

          return {
            ...asset,
            personalRank: ranking?.overallRank ?? null,
            positionRank: ranking?.positionRank ?? null,
            rosterRole: "bench" as const,
            starterSlot: null,
            value: ranking?.relativeBaseValue ?? null,
          };
        })
        .filter((player) => ["QB", "RB", "WR", "TE"].includes(player.position));
      const rolePlayers = assignRosterRoles(basePlayers, starterSlots);
      const playersByPosition = rolePlayers.reduce<
        Record<string, SleeperLeagueRosterPlayer[]>
      >((positions, player) => {
        positions[player.position] = positions[player.position] ?? [];
        positions[player.position].push(player);
        return positions;
      }, {});
      const knownAges = rolePlayers
        .map((player) => player.age)
        .filter((age): age is number => typeof age === "number");
      const averageAge =
        knownAges.length > 0
          ? Number(
              (
                knownAges.reduce((total, age) => total + age, 0) /
                knownAges.length
              ).toFixed(1),
            )
          : null;
      const totalValue = rolePlayers.reduce(
        (total, player) => total + (player.value ?? 0),
        0,
      );
      const starterValue = rolePlayers.reduce((total, player) => {
        return player.rosterRole === "starter"
          ? total + (player.value ?? 0)
          : total;
      }, 0);

      return {
        averageAge,
        ownerName,
        playersByPosition,
        rosterId: roster.roster_id ?? 0,
        starterCount: rolePlayers.filter(
          (player) => player.rosterRole === "starter",
        ).length,
        starterValue,
        teamName: owner?.metadata?.team_name ?? null,
        totalValue,
        username: owner?.username ?? null,
      };
    })
    .sort((a, b) => {
      return b.starterValue - a.starterValue || a.ownerName.localeCompare(b.ownerName);
    });

  return {
    leagues,
    rosterPositions,
    season,
    selectedLeague,
    starterSlots,
    teams,
    username: trimmedUsername,
  };
}
