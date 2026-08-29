import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parse } from "csv-parse/sync";

const CFBD_BASE = "https://api.collegefootballdata.com";
const DRAFT_URL = "https://github.com/nflverse/nflverse-data/releases/download/draft_picks/draft_picks.csv";
const COMBINE_URL = "https://github.com/nflverse/nflverse-data/releases/download/combine/combine.csv";
const CFB_RECEIVING_URL = "https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_cfb_receiving";
const EARLY_ENTRY_URLS = new Map([
  [2020, "https://www.nfl.com/news/list-of-underclassmen-granted-eligibility-for-2020-nfl-draft-0ap3000001098109"],
  [2021, "https://www.nfl.com/news/2021-nfl-draft-underclassmen-tracker-who-intends-to-enter"],
  [2022, "https://www.nfl.com/news/2022-nfl-draft-underclassmen-tracker-who-intends-to-enter"],
  [2023, "https://www.nfl.com/news/list-of-underclassmen-granted-eligibility-for-2023-nfl-draft"],
  [2024, "https://www.nfl.com/news/twenty-additional-players-granted-special-eligibility-for-2024-nfl-draft-for-total-of-54-players"],
  [2025, "https://www.nfl.com/news/fifty-five-players-granted-special-eligibility-for-2025-nfl-draft"],
  [2026, "https://www.nfl.com/news/forty-two-players-granted-special-eligibility-for-2026-nfl-draft"],
]);
const POSITIONS = new Set(["QB", "RB", "WR", "TE"]);
const METRIC_FIELDS = [
  "pass_play_usage", "best_pass_play_usage", "passing_ppa", "career_passing_ppa",
  "best_passing_ppa", "receiving_ppa", "career_receiving_ppa",
  "best_receiving_ppa", "rushing_ppa", "career_rushing_ppa", "best_rushing_ppa",
  "career_yprr", "best_yprr", "target_share", "receiving_yard_share", "age_at_draft",
  "early_declare", "ras", "bmi", "speed_score", "recruiting_rating", "conference_strength",
  "scrimmage_yards_per_game", "rushing_yard_share", "yards_after_contact_per_attempt",
  "missed_tackles_per_attempt", "receptions_per_game", "receiving_yprr",
];
const OUTPUT_FIELDS = [
  "name", "position", "class_year", "school", "external_id", "scoring_date", "draft_round",
  "overall_pick", "nfl_team", ...METRIC_FIELDS,
];

function argument(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

const startYear = Number(argument("start", "2020"));
const endYear = Number(argument("end", "2026"));
const outputPath = resolve(argument("output", `data/rookies-${startYear}-${endYear}.csv`));
const reportPath = resolve(argument("report", `data/rookies-${startYear}-${endYear}-coverage.json`));
const enrichmentJsonPath = resolve(`data/rookie-enrichments-${startYear}-${endYear}.json`);
const historicalOutputPath = resolve(`data/rookies-${startYear}-${Math.min(endYear, 2024)}-historical-import.csv`);
const currentOutputPath = resolve(`data/rookies-${Math.max(startYear, 2025)}-${endYear}-current-import.csv`);
const identityFields = ["name", "position", "class_year", "school", "external_id", "scoring_date"];
const apiKey = process.env.CFBD_API_KEY?.trim();
if (!apiKey) throw new Error("CFBD_API_KEY is required.");
if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear > endYear) {
  throw new Error("Use valid --start and --end draft years.");
}

function normalizeName(value) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "").replace(/[^a-z0-9]/g, "");
}

function decodeHtml(value) {
  return value.replaceAll("&apos;", "'").replaceAll("&#x27;", "'").replaceAll("’", "'")
    .replaceAll("&amp;", "&").replace(/<[^>]+>/g, " ");
}

function number(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mean(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((total, value) => total + value, 0) / finite.length : null;
}

function maximum(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? Math.max(...finite) : null;
}

async function fetchText(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url} returned ${response.status}.`);
  return response.text();
}

async function fetchCfbd(path) {
  const response = await fetch(`${CFBD_BASE}${path}`, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) throw new Error(`CFBD ${path} returned ${response.status}.`);
  return response.json();
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function conferenceScore(conference) {
  const key = String(conference ?? "").toUpperCase();
  if (["SEC", "BIG TEN"].includes(key)) return 100;
  if (["ACC", "BIG 12"].includes(key)) return 85;
  if (["PAC-12", "PAC-10"].includes(key)) return 80;
  if (["AMERICAN ATHLETIC", "MOUNTAIN WEST", "SUN BELT"].includes(key)) return 65;
  if (["CONFERENCE USA", "MID-AMERICAN"].includes(key)) return 55;
  if (key.includes("FCS")) return 40;
  return null;
}

const draftRows = parse(await fetchText(DRAFT_URL), { columns: true, skip_empty_lines: true });
const combineRows = parse(await fetchText(COMBINE_URL), { columns: true, skip_empty_lines: true });
const combineByKey = new Map();
for (const row of combineRows) {
  const year = number(row.draft_year ?? row.season);
  const position = String(row.pos ?? "").toUpperCase();
  if (!year || year < startYear || year > endYear || !POSITIONS.has(position)) continue;
  combineByKey.set(`${year}:${position}:${normalizeName(row.player_name)}`, row);
}

const players = draftRows.flatMap((row) => {
  const classYear = number(row.season);
  const position = String(row.position ?? "").toUpperCase();
  if (!classYear || classYear < startYear || classYear > endYear || !POSITIONS.has(position)) return [];
  const name = String(row.pfr_player_name ?? "").trim();
  const combine = combineByKey.get(`${classYear}:${position}:${normalizeName(name)}`);
  const heightText = String(combine?.ht ?? "");
  const heightParts = heightText.split("-").map(Number);
  const height = heightParts.length === 2 && heightParts.every(Number.isFinite)
    ? heightParts[0] * 12 + heightParts[1]
    : number(combine?.ht);
  const weight = number(combine?.wt);
  const forty = number(combine?.forty);
  return [{
    name, position, class_year: classYear, school: row.college || combine?.school || null,
    external_id: row.gsis_id || row.pfr_player_id || `${classYear}-${position}-${normalizeName(name)}`,
    scoring_date: `${classYear}-04-30`, draft_round: number(row.round), overall_pick: number(row.pick),
    nfl_team: row.team || null, age_at_draft: number(row.age), bmi: height && weight ? weight * 703 / (height ** 2) : null,
    speed_score: weight && forty ? weight * 200 / (forty ** 4) : null,
    _conference: null, _seasons: [], _usage: [], _receivingPpa: [], _rushingPpa: [],
  }];
});

const earlyEntriesByYear = new Map();
for (const [year, url] of EARLY_ENTRY_URLS) {
  if (year < startYear || year > endYear) continue;
  console.log(`Fetching NFL ${year} early-entry list...`);
  try {
    const html = decodeHtml(await fetchText(url));
    const names = new Set();
    for (const match of html.matchAll(/([A-Z][A-Za-z.'’\- ]{1,45}),\s*(?:RB|WR)(?:\b|\/)/g)) names.add(normalizeName(match[1]));
    earlyEntriesByYear.set(year, names);
  } catch (error) {
    console.warn(`Skipping NFL early-entry list for ${year}: ${error instanceof Error ? error.message : error}`);
  }
}

const draftedKeys = new Set(players.map((player) => `${player.class_year}:${player.position}:${normalizeName(player.name)}`));
for (const row of combineRows) {
  const classYear = number(row.draft_year ?? row.season);
  const position = String(row.pos ?? "").toUpperCase();
  const name = String(row.player_name ?? "").trim();
  const key = `${classYear}:${position}:${normalizeName(name)}`;
  if (!classYear || classYear < startYear || classYear > endYear || !POSITIONS.has(position) || !name || draftedKeys.has(key)) continue;
  const heightText = String(row.ht ?? "");
  const heightParts = heightText.split("-").map(Number);
  const height = heightParts.length === 2 && heightParts.every(Number.isFinite) ? heightParts[0] * 12 + heightParts[1] : number(row.ht);
  const weight = number(row.wt);
  const forty = number(row.forty);
  players.push({
    name, position, class_year: classYear, school: row.school || null,
    external_id: row.pfr_id || row.cfb_id || `${classYear}-${position}-${normalizeName(name)}`,
    scoring_date: `${classYear}-04-30`, draft_round: number(row.draft_round), overall_pick: number(row.draft_ovr),
    nfl_team: row.draft_team || null, age_at_draft: null,
    bmi: height && weight ? weight * 703 / (height ** 2) : null,
    speed_score: weight && forty ? weight * 200 / (forty ** 4) : null,
    _conference: null, _seasons: [], _usage: [], _receivingPpa: [], _rushingPpa: [],
  });
  draftedKeys.add(key);
}

const playersByName = new Map();
const teamTotals = new Map();
const teamGames = new Map();
const receivingTargets = new Map();
for (const player of players) {
  const key = normalizeName(player.name);
  playersByName.set(key, [...(playersByName.get(key) ?? []), player]);
}

for (let season = Math.max(2015, startYear - 5); season < endYear; season += 1) {
  console.log(`Fetching CFBD ${season} production, usage, and PPA...`);
  const [receiving, rushing, usage, ppa, games] = await Promise.all([
    fetchCfbd(`/stats/player/season?year=${season}&category=receiving`),
    fetchCfbd(`/stats/player/season?year=${season}&category=rushing`),
    fetchCfbd(`/player/usage?year=${season}`),
    fetchCfbd(`/ppa/players/season?year=${season}`),
    fetchCfbd(`/games?year=${season}&seasonType=regular`),
  ]);
  for (const game of games) {
    for (const team of [game.homeTeam, game.awayTeam]) {
      if (!team) continue;
      const key = `${season}:${team}`;
      teamGames.set(key, (teamGames.get(key) ?? 0) + 1);
    }
  }
  const stats = new Map();
  for (const row of [...receiving, ...rushing]) {
    const totalKey = `${season}:${row.team}`;
    const totals = teamTotals.get(totalKey) ?? { receiving: 0, rushing: 0 };
    const category = String(row.category ?? "").toLowerCase();
    const statType = String(row.statType ?? "").toUpperCase();
    if (category === "receiving" && statType === "YDS") totals.receiving += number(row.stat) ?? 0;
    if (category === "rushing" && statType === "YDS") totals.rushing += number(row.stat) ?? 0;
    teamTotals.set(totalKey, totals);
    const candidates = playersByName.get(normalizeName(row.player)) ?? [];
    const eligible = candidates.filter((player) => season < player.class_year && season >= player.class_year - 6);
    if (eligible.length !== 1) continue;
    const player = eligible[0];
    const key = `${player.external_id}:${season}:${row.team}`;
    const current = stats.get(key) ?? { team: row.team, conference: row.conference, playerId: row.playerId ? String(row.playerId) : null, season };
    if (category === "receiving" && statType === "REC") current.receptions = number(row.stat);
    if (category === "receiving" && statType === "YDS") current.receivingYards = number(row.stat);
    if (category === "rushing" && ["ATT", "CAR"].includes(statType)) current.carries = number(row.stat);
    if (category === "rushing" && statType === "YDS") current.rushingYards = number(row.stat);
    stats.set(key, current);
    player._conference ||= row.conference ?? null;
  }
  for (const [key, value] of stats) {
    const externalId = key.split(":")[0];
    players.find((player) => player.external_id === externalId)?._seasons.push(value);
  }
  for (const row of usage) {
    const candidates = (playersByName.get(normalizeName(row.name)) ?? []).filter((player) => season < player.class_year && season >= player.class_year - 6);
    if (candidates.length === 1 && number(row.usage?.pass) !== null) candidates[0]._usage.push(number(row.usage.pass));
  }
  for (const row of ppa) {
    const candidates = (playersByName.get(normalizeName(row.name)) ?? []).filter((player) => season < player.class_year && season >= player.class_year - 6);
    if (candidates.length !== 1) continue;
    const receivingPpa = number(row.averagePPA?.pass);
    const rushingPpa = number(row.averagePPA?.rush);
    if (receivingPpa !== null) candidates[0]._receivingPpa.push(receivingPpa);
    if (rushingPpa !== null) candidates[0]._rushingPpa.push(rushingPpa);
  }
}

for (let season = Math.max(2015, startYear - 5); season < endYear; season += 1) {
  console.log(`Fetching cfbfastR ${season} receiving targets...`);
  try {
    const rows = parse(await fetchText(`${CFB_RECEIVING_URL}/cfb_receiving_${season}.csv`), { columns: true, skip_empty_lines: true });
    const teamTargets = new Map();
    for (const row of rows) {
      const targets = number(row.targets);
      if (targets === null) continue;
      const teamKey = `${season}:${row.pos_team}`;
      teamTargets.set(teamKey, (teamTargets.get(teamKey) ?? 0) + targets);
    }
    for (const row of rows) {
      const targets = number(row.targets);
      const total = teamTargets.get(`${season}:${row.pos_team}`) ?? 0;
      if (targets === null || total <= 0) continue;
      receivingTargets.set(`${season}:${row.pos_team}:${normalizeName(row.receiver_player_name)}`, targets / total);
    }
  } catch (error) {
    console.warn(`Skipping cfbfastR receiving targets for ${season}: ${error instanceof Error ? error.message : error}`);
  }
}

for (let recruitingYear = Math.max(2014, startYear - 7); recruitingYear <= endYear - 2; recruitingYear += 1) {
  console.log(`Fetching CFBD ${recruitingYear} recruiting...`);
  const recruits = await fetchCfbd(`/recruiting/players?year=${recruitingYear}`);
  for (const recruit of recruits) {
    const candidates = playersByName.get(normalizeName(recruit.name)) ?? [];
    if (candidates.length !== 1 || number(recruit.rating) === null) continue;
    candidates[0].recruiting_rating = Math.max(candidates[0].recruiting_rating ?? 0, number(recruit.rating));
  }
}

const overviewTargets = players.flatMap((player) => {
  const finalSeason = [...player._seasons].sort((a, b) => b.season - a.season)[0];
  return finalSeason?.playerId ? [{ finalSeason, player }] : [];
});
console.log(`Fetching ${overviewTargets.length} final-season game counts...`);
for (let index = 0; index < overviewTargets.length; index += 10) {
  const chunk = overviewTargets.slice(index, index + 10);
  const results = await Promise.all(chunk.map(async ({ finalSeason }) => {
    try {
      return await fetchCfbd(`/player/season/overview?year=${finalSeason.season}&playerId=${encodeURIComponent(finalSeason.playerId)}`);
    } catch {
      return null;
    }
  }));
  results.forEach((overview, offset) => {
    const games = number(overview?.games);
    if (games !== null && games > 0) chunk[offset].player._games = games;
  });
}

for (const player of players) {
  const seasons = player._seasons;
  const finalSeason = [...seasons].sort((a, b) => b.season - a.season)[0];
  if (!player._games && finalSeason) player._games = teamGames.get(`${finalSeason.season}:${finalSeason.team}`) ?? null;
  const finalTeamTotals = finalSeason ? teamTotals.get(`${finalSeason.season}:${finalSeason.team}`) : null;
  const teamReceiving = finalTeamTotals?.receiving ?? 0;
  const teamRushing = finalTeamTotals?.rushing ?? 0;
  player.receiving_yard_share = finalSeason?.receivingYards != null && teamReceiving ? finalSeason.receivingYards / teamReceiving : null;
  player.target_share = finalSeason ? receivingTargets.get(`${finalSeason.season}:${finalSeason.team}:${normalizeName(player.name)}`) ?? null : null;
  player.rushing_yard_share = finalSeason?.rushingYards != null && teamRushing ? finalSeason.rushingYards / teamRushing : null;
  player.pass_play_usage = player._usage.at(-1) ?? null;
  player.best_pass_play_usage = maximum(player._usage);
  player.receiving_ppa = player._receivingPpa.at(-1) ?? null;
  player.career_receiving_ppa = mean(player._receivingPpa);
  player.best_receiving_ppa = maximum(player._receivingPpa);
  player.passing_ppa = player.position === "QB" ? player._receivingPpa.at(-1) ?? null : null;
  player.career_passing_ppa = player.position === "QB" ? mean(player._receivingPpa) : null;
  player.best_passing_ppa = player.position === "QB" ? maximum(player._receivingPpa) : null;
  player.rushing_ppa = player._rushingPpa.at(-1) ?? null;
  player.career_rushing_ppa = mean(player._rushingPpa);
  player.best_rushing_ppa = maximum(player._rushingPpa);
  player.conference_strength = conferenceScore(player._conference);
  const earlyEntries = earlyEntriesByYear.get(player.class_year);
  player.early_declare = earlyEntries ? earlyEntries.has(normalizeName(player.name)) : null;
  if (finalSeason && player._games) {
    player.scrimmage_yards_per_game = ((finalSeason.rushingYards ?? 0) + (finalSeason.receivingYards ?? 0)) / player._games;
    player.receptions_per_game = finalSeason.receptions == null ? null : finalSeason.receptions / player._games;
  }
}

players.sort((a, b) => a.class_year - b.class_year || a.position.localeCompare(b.position) || (a.overall_pick ?? 999) - (b.overall_pick ?? 999));
const toCsv = (rows) => [OUTPUT_FIELDS.join(","), ...rows.map((player) => OUTPUT_FIELDS.map((field) => csvEscape(player[field])).join(","))].join("\n") + "\n";
const enrichmentCsv = (rows, metric) => {
  const fields = [...identityFields, metric];
  return [fields.join(","), ...rows.map((player) => fields.map((field) => csvEscape(player[field])).join(","))].join("\n") + "\n";
};
const csv = toCsv(players);
const coverage = Object.fromEntries(OUTPUT_FIELDS.map((field) => [field, {
  count: players.filter((player) => player[field] !== null && player[field] !== undefined && player[field] !== "").length,
  percent: Number((players.filter((player) => player[field] !== null && player[field] !== undefined && player[field] !== "").length / players.length * 100).toFixed(1)),
}]));
const report = {
  generated_at: new Date().toISOString(), cohort: { end_year: endYear, positions: [...POSITIONS], start_year: startYear },
  limitations: [
    "Cohort contains drafted QB/RB/WR/TE players plus undrafted NFL combine participants; non-combine undrafted prospects require another approved identity source.",
    "RAS, YPRR, yards after contact, and missed tackles are null until an approved licensed source is added.",
    "Name-only CFBD joins are accepted only when exactly one eligible drafted player matches.",
    "Receiving and rushing shares use CFBD player-stat team totals for the final matched college season.",
    "Per-game metrics prefer CFBD player game counts and fall back to the final college team's regular-season game count.",
    "Target share is final-season player targets divided by team targets from the cfbfastR ESPN receiving dataset.",
    "Early-declare status is matched to the NFL's annual underclassmen and special-eligibility lists; an unavailable annual list remains null rather than inferred.",
  ],
  player_count: players.length, by_class: Object.fromEntries(Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index).map((year) => [year, players.filter((player) => player.class_year === year).length])), coverage,
};
await mkdir(dirname(outputPath), { recursive: true });
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(outputPath, csv);
if (startYear <= 2024) await writeFile(historicalOutputPath, toCsv(players.filter((player) => player.class_year <= 2024)));
if (endYear >= 2025) await writeFile(currentOutputPath, toCsv(players.filter((player) => player.class_year >= 2025)));
for (const metric of ["target_share", "early_declare"]) {
  if (startYear <= 2024) await writeFile(resolve(`data/rookies-${startYear}-${Math.min(endYear, 2024)}-${metric}-import.csv`), enrichmentCsv(players.filter((player) => player.class_year <= 2024), metric));
  if (endYear >= 2025) await writeFile(resolve(`data/rookies-${Math.max(startYear, 2025)}-${endYear}-${metric}-import.csv`), enrichmentCsv(players.filter((player) => player.class_year >= 2025), metric));
}
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
await writeFile(enrichmentJsonPath, JSON.stringify(players.map((player) => ({
  classYear: player.class_year,
  earlyDeclare: player.early_declare ?? null,
  externalId: player.external_id,
  name: player.name,
  position: player.position,
  targetShare: player.target_share ?? null,
})), null, 2) + "\n");
console.log(JSON.stringify({ outputPath, historicalOutputPath, currentOutputPath, reportPath, players: players.length, byClass: report.by_class }, null, 2));
