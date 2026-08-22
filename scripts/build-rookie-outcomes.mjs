import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parse } from "csv-parse/sync";

const PLAYER_STATS_URL = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.csv";
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

const response = await fetch(PLAYER_STATS_URL);
if (!response.ok) throw new Error(`nflverse player stats returned ${response.status}.`);
const [prospectsCsv, statsCsv] = await Promise.all([readFile(inputPath, "utf8"), response.text()]);
const prospects = parse(prospectsCsv, { columns: true, skip_empty_lines: true });
const prospectById = new Map(prospects.filter((player) => String(player.external_id).startsWith("00-")).map((player) => [player.external_id, player]));
const weekly = parse(statsCsv, { columns: true, skip_empty_lines: true }).filter((row) => row.season_type === "REG" && ["RB", "WR"].includes(row.position));
const grouped = new Map();
for (const row of weekly) {
  const season = number(row.season);
  const prospect = prospectById.get(row.player_id);
  if (!season || season > 2025) continue;
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
  for (const position of ["RB", "WR"]) {
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
console.log(JSON.stringify({ outputPath, outcomeRows: rows.length, players: new Set(rows.map((row) => row.player_id)).size, seasons: [...new Set(rows.map((row) => row.nfl_season))] }, null, 2));
