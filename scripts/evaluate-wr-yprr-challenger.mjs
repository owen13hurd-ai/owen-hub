import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { aggregateThreeYearOutcomes, buildRookieBacktestReport } from "../lib/dynasty/rookie-model/backtest.ts";

const players = parse(await readFile("data/rookies-2020-2026.csv", "utf8"), { columns: true, skip_empty_lines: true }).filter((row) => row.position === "WR");
const yprr = JSON.parse(await readFile("data/pahowdy-yprr-2020-2025.json", "utf8"));
const outcomes = JSON.parse(await readFile("data/rookie-outcomes-2020-2025.json", "utf8"));
const audit = JSON.parse(await readFile("data/rookie-outcomes-2020-2025-audit.json", "utf8"));
const sourceById = new Map(yprr.map((row) => [row.externalId, row]));
const playerById = new Map(players.map((row) => [row.external_id, row]));
const targets = aggregateThreeYearOutcomes(outcomes.map((row) => ({ player_id: row.playerId, nfl_season: row.nflSeason, fantasy_ppg: row.fantasyPpg, fantasy_points: row.fantasyPoints, games: row.games, position_finish: row.positionFinish, peak_dynasty_value: null })), new Map(players.map((row) => [row.external_id, Number(row.class_year)])), audit.seasons.filter((row) => row.complete).map((row) => row.season));
const observations = targets.map((target) => {
  const player = playerById.get(target.player_id);
  const source = sourceById.get(target.player_id);
  if (source && source.classYear !== Number(player.class_year)) throw new Error(`YPRR class mismatch: ${player.name}`);
  const pick = player.overall_pick.trim() === "" ? null : Number(player.overall_pick);
  return {
    classYear: Number(player.class_year), playerId: target.player_id, playerName: player.name,
    scoringDate: player.scoring_date, outcomeAvailableDate: target.outcome_available_date,
    draftCapitalScore: pick !== null && Number.isFinite(pick) && pick > 0 ? Math.max(0, Math.min(100, 101 - ((pick - 1) / 256) * 100)) : null,
    prospectScore: source?.careerYprr ?? null, fantasyPpg: target.fantasy_ppg,
    fantasyPoints: target.fantasy_points, games: target.games, positionFinish: target.position_finish,
    consensusRank: null, marketScore: null, peakDynastyValue: null,
  };
});
console.log(JSON.stringify({
  protocol: "One player; first-three-season peak statistical-appearance PPR PPG and best finish; incomplete/missing outcomes unknown; training labels available before test September 1; train-only standardization; fixed L2 penalty=1; no tuning on test class.",
  sourceSeasons: audit.seasons,
  audit: { maturedPlayers: targets.length, missingEntireWindow: targets.filter((row) => row.missing_seasons === 3).length, missingSomeSeasons: targets.filter((row) => row.missing_seasons > 0 && row.missing_seasons < 3).length, completeTargets: targets.filter((row) => row.missing_seasons === 0).length, missingYprr: observations.filter((row) => row.prospectScore === null).length },
  rollingOrigin: buildRookieBacktestReport(observations).rollingOrigin,
}, null, 2));
