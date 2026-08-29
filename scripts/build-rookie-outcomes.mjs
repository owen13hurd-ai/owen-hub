import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parse } from "csv-parse/sync";

const STATS_BASE = "https://github.com/nflverse/nflverse-data/releases/download/stats_player";
const inputPath = resolve(process.argv.find((value) => value.startsWith("--input="))?.slice(8) ?? "data/rookies-2020-2026.csv");
const outputPath = resolve(process.argv.find((value) => value.startsWith("--output="))?.slice(9) ?? "data/rookie-outcomes-2020-2025.csv");
const jsonOutputPath = outputPath.replace(/\.csv$/, ".json");

function number(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const seasons = [2020, 2021, 2022, 2023, 2024, 2025];
const scheduleUrl = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv";
const scheduleResponse = await fetch(scheduleUrl);
if (!scheduleResponse.ok) throw new Error(`Schedule fetch failed: ${scheduleResponse.status}`);
const schedules = parse(await scheduleResponse.text(), { columns: true, skip_empty_lines: true });
const sources = await Promise.all(seasons.map(async (season) => {
  const url = `${STATS_BASE}/stats_player_week_${season}.csv`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${season} player stats returned ${response.status}.`);
  const rows = parse(await response.text(), { columns: true, skip_empty_lines: true }).filter((row) => row.season_type === "REG" && Number(row.season) === season);
  const gameIds = new Set(rows.map((row) => row.game_id));
  const expected = schedules.filter((row) => Number(row.season) === season && row.game_type === "REG" && number(row.result) !== null);
  if (expected.length < 250 || expected.some((game) => !gameIds.has(game.game_id)) || gameIds.size !== expected.length) throw new Error(`${season}: incomplete regular-season game coverage.`);
  return { rows, audit: { season, url, games: gameIds.size, rows: rows.length, complete: true } };
}));
const prospectsCsv = await readFile(inputPath, "utf8");
const prospects = parse(prospectsCsv, { columns: true, skip_empty_lines: true });
const prospectById = new Map(prospects.filter((player) => String(player.external_id).startsWith("00-")).map((player) => [player.external_id, player]));
const weekly = sources.flatMap((source) => source.rows).filter((row) => ["QB", "RB", "WR", "TE"].includes(row.position));
const grouped = new Map();
const seenPlayerGames = new Set();
for (const row of weekly) {
  const season = number(row.season);
  const prospect = prospectById.get(row.player_id);
  if (!season || season > 2025) continue;
  const playerGame = `${row.player_id}:${row.game_id}`;
  if (seenPlayerGames.has(playerGame)) throw new Error(`Duplicate player/game: ${playerGame}`);
  seenPlayerGames.add(playerGame);
  const key = `${row.player_id}:${season}`;
  const current = grouped.get(key) ?? { fantasy_points: 0, games: 0, nfl_season: season, player_id: row.player_id, player_name: prospect?.name ?? row.player_display_name, position: row.position };
  const points = number(row.fantasy_points_ppr);
  const opportunities = (number(row.carries) ?? 0) + (number(row.targets) ?? 0);
  if (opportunities > 0 || points !== null) current.games += 1;
  current.fantasy_points += points ?? 0;
  grouped.set(key, current);
}

const allRows = [...grouped.values()];
for (const row of allRows) row.fantasy_ppg = row.games ? row.fantasy_points / row.games : null;
for (const season of new Set(allRows.map((row) => row.nfl_season))) {
  for (const position of ["QB", "RB", "WR", "TE"]) {
    allRows.filter((row) => row.nfl_season === season && row.position === position)
      .sort((a, b) => b.fantasy_points - a.fantasy_points)
      .forEach((row, index) => { row.position_finish = index + 1; });
  }
}
const rows = allRows.filter((row) => {
  const prospect = prospectById.get(row.player_id);
  return prospect && row.nfl_season >= number(prospect.class_year);
});

rows.sort((a, b) => a.nfl_season - b.nfl_season || a.position.localeCompare(b.position) || a.position_finish - b.position_finish);
const fields = ["player_id", "player_name", "position", "nfl_season", "games", "fantasy_points", "fantasy_ppg", "position_finish"];
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, [fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n") + "\n");
await writeFile(jsonOutputPath, JSON.stringify(rows.map((row) => ({
  fantasyPoints: row.fantasy_points,
  fantasyPpg: row.fantasy_ppg,
  games: row.games,
  nflSeason: row.nfl_season,
  playerId: row.player_id,
  positionFinish: row.position_finish,
})), null, 2) + "\n");
await writeFile(outputPath.replace(/\.csv$/, "-audit.json"), JSON.stringify({
  generatedAt: new Date().toISOString(), scheduleUrl, seasons: sources.map((source) => source.audit),
  missingPolicy: "Absent player-season rows remain unknown; never silently converted to zero. PPG denominator is statistical appearances, not roster games.",
  unmatchedPlayers: [...prospectById.values()].filter((player) => Number(player.class_year) <= 2023 && !rows.some((row) => row.player_id === player.external_id && row.nfl_season >= Number(player.class_year) && row.nfl_season <= Number(player.class_year) + 2)).map((player) => ({ name: player.name, externalId: player.external_id, classYear: Number(player.class_year) })),
}, null, 2) + "\n");
console.log(JSON.stringify({ outputPath, outcomeRows: rows.length, players: new Set(rows.map((row) => row.player_id)).size, seasons: [...new Set(rows.map((row) => row.nfl_season))] }, null, 2));
