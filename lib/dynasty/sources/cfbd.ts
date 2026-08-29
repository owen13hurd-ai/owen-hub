const CFBD_API_URL = "https://api.collegefootballdata.com";

export type CfbdPlayerSeasonStat = {
  category: string;
  conference: string | null;
  player: string;
  playerId: string | null;
  stat: number;
  statType: string;
  team: string;
};

export type CfbdPlayerSeason = {
  attempts: number | null;
  carries: number | null;
  conference: string | null;
  player: string;
  playerId: string | null;
  receivingYards: number | null;
  receptions: number | null;
  rushingYards: number | null;
  season: number;
  team: string;
  touchdowns: number | null;
};

export type CfbdPlayerPpa = {
  name: string;
  passingPpa: number | null;
  rushingPpa: number | null;
  team: string | null;
};

function finiteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCfbdPlayerStats(input: unknown): CfbdPlayerSeasonStat[] {
  if (!Array.isArray(input)) throw new Error("CFBD returned an unexpected player-stat response.");
  return input.flatMap((row): CfbdPlayerSeasonStat[] => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    const stat = finiteNumber(value.stat);
    const player = String(value.player ?? "").trim();
    const team = String(value.team ?? "").trim();
    const statType = String(value.statType ?? value.stat_type ?? "").trim().toUpperCase();
    if (stat === null || !player || !team || !statType) return [];
    return [{
      category: String(value.category ?? "").trim().toLowerCase(),
      conference: value.conference ? String(value.conference) : null,
      player,
      playerId: value.playerId === null || value.playerId === undefined ? null : String(value.playerId),
      stat,
      statType,
      team,
    }];
  });
}

export function aggregateCfbdPlayerSeasons(stats: CfbdPlayerSeasonStat[], season: number): CfbdPlayerSeason[] {
  const players = new Map<string, CfbdPlayerSeason>();
  for (const row of stats) {
    const key = row.playerId ?? `${row.team.toLowerCase()}::${row.player.toLowerCase()}`;
    const current = players.get(key) ?? {
      attempts: null, carries: null, conference: row.conference, player: row.player,
      playerId: row.playerId, receivingYards: null, receptions: null, rushingYards: null,
      season, team: row.team, touchdowns: null,
    };
    const isReceiving = row.category === "receiving";
    const isRushing = row.category === "rushing";
    if (isReceiving && row.statType === "REC") current.receptions = row.stat;
    if (isReceiving && row.statType === "YDS") current.receivingYards = row.stat;
    if (isRushing && ["CAR", "ATT"].includes(row.statType)) current.carries = row.stat;
    if (isRushing && row.statType === "YDS") current.rushingYards = row.stat;
    if (isRushing && row.statType === "ATT") current.attempts = row.stat;
    if (["TD", "TDS"].includes(row.statType)) current.touchdowns = (current.touchdowns ?? 0) + row.stat;
    players.set(key, current);
  }
  return [...players.values()].filter((player) =>
    player.receivingYards !== null || player.receptions !== null || player.rushingYards !== null || player.carries !== null,
  );
}

async function fetchCategory(apiKey: string, season: number, category: "receiving" | "rushing") {
  const response = await fetch(`${CFBD_API_URL}/stats/player/season?year=${season}&category=${category}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const detail = response.status === 401 ? "The CFBD API key was rejected." : `CFBD returned ${response.status}.`;
    throw new Error(detail);
  }
  return parseCfbdPlayerStats(await response.json());
}

export async function fetchCfbdPlayerSeasons(apiKey: string, season: number) {
  if (!apiKey.trim()) throw new Error("Add CFBD_API_KEY to .env.local before importing public college data.");
  const [receiving, rushing] = await Promise.all([
    fetchCategory(apiKey, season, "receiving"),
    fetchCategory(apiKey, season, "rushing"),
  ]);
  return aggregateCfbdPlayerSeasons([...receiving, ...rushing], season);
}

export async function fetchCfbdPlayerPpa(apiKey: string, season: number): Promise<CfbdPlayerPpa[]> {
  const response = await fetch(`${CFBD_API_URL}/ppa/players/season?year=${season}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`CFBD PPA ${season} returned ${response.status}.`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error("CFBD returned an unexpected PPA response.");
  return payload.flatMap((raw): CfbdPlayerPpa[] => {
    if (!raw || typeof raw !== "object") return [];
    const row = raw as Record<string, unknown>;
    const average = row.averagePPA && typeof row.averagePPA === "object"
      ? row.averagePPA as Record<string, unknown>
      : {};
    const name = String(row.name ?? "").trim();
    if (!name) return [];
    return [{
      name,
      passingPpa: finiteNumber(average.pass),
      rushingPpa: finiteNumber(average.rush),
      team: row.team ? String(row.team) : null,
    }];
  });
}
