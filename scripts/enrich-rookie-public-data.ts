import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

import { rbModelConfiguration, wrModelConfiguration } from "@/lib/dynasty/rookie-model/config";
import { calculateRookieScore } from "@/lib/dynasty/rookie-model/scoring";
import type { RookieMetricReference, RookieModelConfiguration } from "@/types/rookie-engine";

async function main() {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cfbdKey = process.env.CFBD_API_KEY;
if (!url || !key || !cfbdKey) throw new Error("Supabase and CFBD credentials are required.");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const users = (await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })).data.users;
const user = [...users].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
if (!user) throw new Error("No Supabase user found.");
const norm = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
const now = new Date().toISOString();

async function source(label: string, values: Record<string, unknown>) {
  const found = await supabase.from("rookie_sources").select("id").eq("user_id", user.id).eq("label", label).maybeSingle();
  if (found.error) throw found.error;
  if (found.data) return found.data.id;
  const made = await supabase.from("rookie_sources").insert({ ...values, accessed_at: now, label, user_id: user.id }).select("id").single();
  if (made.error) throw made.error;
  return made.data.id;
}

const playersResult = await supabase.from("rookie_players").select("id,name,class_year,position,overall_pick").eq("user_id", user.id).in("class_year", [2025, 2026]).in("position", ["RB", "WR"]);
if (playersResult.error) throw playersResult.error;
const players = playersResult.data;
const byClassName = new Map(players.map((player) => [`${player.class_year}:${norm(player.name)}`, player]));

const nflverseSource = await source("nflverse draft picks", {
  author: "nflverse", license: "CC-BY-4.0", methodology_class: "documented", publication: "nflverse-data",
  reliability: "high", summary: "Open NFL draft round, overall pick, team, college, and draft age.",
  url: "https://github.com/nflverse/nflverse-data/releases/tag/draft_picks",
});
const draftResponse = await fetch("https://github.com/nflverse/nflverse-data/releases/download/draft_picks/draft_picks.csv");
if (!draftResponse.ok) throw new Error(`nflverse returned ${draftResponse.status}.`);
const drafts = parse(await draftResponse.text(), { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;
const draftMatches = drafts.flatMap((row) => {
  const classYear = Number(row.season);
  const player = byClassName.get(`${classYear}:${norm(row.pfr_player_name ?? "")}`);
  return player ? [{ player, row }] : [];
});
for (const { player, row } of draftMatches) {
  const pick = Number(row.pick) || null;
  const round = Number(row.round) || null;
  const age = Number(row.age) || null;
  player.overall_pick = pick;
  const updated = await supabase.from("rookie_players").update({ age_at_draft: age, draft_round: round, nfl_team: row.team || null, overall_pick: pick, school: row.college || null, source_id: nflverseSource, updated_at: now }).eq("id", player.id);
  if (updated.error) throw updated.error;
  const context = await supabase.from("rookie_context_snapshots").upsert({ observed_at: `${player.class_year}-04-30T12:00:00Z`, overall_pick: pick, nfl_team: row.team || null, player_id: player.id, source_id: nflverseSource, user_id: user.id }, { onConflict: "player_id,observed_at" });
  if (context.error) throw context.error;
  if (age !== null) {
    const metric = await supabase.from("rookie_player_metrics").upsert({ as_of_date: `${player.class_year}-04-30`, confidence: "high", metric_key: "age_at_draft", player_id: player.id, source_id: nflverseSource, user_id: user.id, value: age }, { onConflict: "player_id,metric_key,as_of_date,source_id" });
    if (metric.error) throw metric.error;
  }
}

const combineSource = await source("nflverse combine", { author: "nflverse", license: "CC-BY-4.0", methodology_class: "documented", publication: "nflverse-data", reliability: "high", summary: "Open NFL combine measurements and testing results.", url: "https://github.com/nflverse/nflverse-data/releases/tag/combine" });
const combineResponse = await fetch("https://github.com/nflverse/nflverse-data/releases/download/combine/combine.csv");
if (!combineResponse.ok) throw new Error(`nflverse combine returned ${combineResponse.status}.`);
const combineRows = parse(await combineResponse.text(), { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;
const combineMatches = combineRows.flatMap((row) => {
  const player = byClassName.get(`${Number(row.season)}:${norm(row.player_name ?? "")}`);
  return player ? [{ player, row }] : [];
});
for (const { player, row } of combineMatches) {
  const heightParts = row.ht?.split("-").map(Number) ?? [];
  const height = heightParts.length === 2 && heightParts.every(Number.isFinite) ? heightParts[0] * 12 + heightParts[1] : null;
  const weight = Number(row.wt) || null;
  const forty = Number(row.forty) || null;
  const bmi = height && weight ? weight * 703 / (height * height) : null;
  const speedScore = weight && forty ? weight * 200 / Math.pow(forty, 4) : null;
  const updated = await supabase.from("rookie_players").update({ bmi, height_inches: height, weight_pounds: weight, updated_at: now }).eq("id", player.id);
  if (updated.error) throw updated.error;
  const existing = await supabase.from("rookie_athletic_tests").select("id").eq("player_id", player.id).eq("source_id", combineSource).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  const test = { bench_reps: Number(row.bench) || null, broad_inches: Number(row.broad_jump) || null, event_type: "combine" as const, forty_seconds: forty, player_id: player.id, source_id: combineSource, speed_score: speedScore, shuttle_seconds: Number(row.shuttle) || null, three_cone_seconds: Number(row.cone) || null, user_id: user.id, vertical_inches: Number(row.vertical) || null };
  const savedTest = existing.data ? await supabase.from("rookie_athletic_tests").update(test).eq("id", existing.data.id) : await supabase.from("rookie_athletic_tests").insert(test);
  if (savedTest.error) throw savedTest.error;
  const values = [{ key: "bmi", value: bmi }, { key: "speed_score", value: speedScore }].filter((entry): entry is { key: string; value: number } => entry.value !== null);
  if (values.length) {
    const saved = await supabase.from("rookie_player_metrics").upsert(values.map((entry) => ({ as_of_date: `${player.class_year}-04-30`, confidence: "high", metric_key: entry.key, player_id: player.id, source_id: combineSource, user_id: user.id, value: entry.value })), { onConflict: "player_id,metric_key,as_of_date,source_id" });
    if (saved.error) throw saved.error;
  }
}

const recruitingSource = await source("CollegeFootballData recruiting", { author: "CollegeFootballData", license: "Provider terms apply", methodology_class: "documented", publication: "CollegeFootballData", reliability: "high", summary: "Documented high-school recruiting ratings and star classifications.", url: "https://collegefootballdata.com/" });
const recruitingByName = new Map<string, { rating: number; stars: number; year: number }>();
for (const recruitingYear of [2019, 2020, 2021, 2022, 2023, 2024]) {
  const response = await fetch(`https://api.collegefootballdata.com/recruiting/players?year=${recruitingYear}`, { headers: { Authorization: `Bearer ${cfbdKey}` } });
  if (!response.ok) throw new Error(`CFBD recruiting ${recruitingYear} returned ${response.status}.`);
  const recruits = await response.json() as Array<{ name: string; rating?: number; stars?: number; year: number }>;
  for (const recruit of recruits) {
    if (recruit.rating == null) continue;
    const key = norm(recruit.name);
    const current = recruitingByName.get(key);
    if (!current || recruit.rating > current.rating) recruitingByName.set(key, { rating: recruit.rating, stars: recruit.stars ?? 0, year: recruit.year });
  }
}
const recruitingMatches = players.flatMap((player) => {
  const recruit = recruitingByName.get(norm(player.name));
  return recruit ? [{ player, recruit }] : [];
});
if (recruitingMatches.length) {
  const saved = await supabase.from("rookie_player_metrics").upsert(recruitingMatches.map(({ player, recruit }) => ({ as_of_date: `${player.class_year}-04-30`, confidence: "high", metric_key: "recruiting_rating", player_id: player.id, source_id: recruitingSource, user_id: user.id, value: recruit.rating })), { onConflict: "player_id,metric_key,as_of_date,source_id" });
  if (saved.error) throw saved.error;
  for (const { player, recruit } of recruitingMatches) {
    const updated = await supabase.from("rookie_players").update({ recruiting_rating: recruit.rating, updated_at: now }).eq("id", player.id);
    if (updated.error) throw updated.error;
  }
}

const cfbdSource = await source("CollegeFootballData API", { author: "CollegeFootballData", license: "Provider terms apply", methodology_class: "documented", publication: "CollegeFootballData", reliability: "high", summary: "Documented college production and usage API.", url: "https://collegefootballdata.com/" });
let usageMatches = 0;
for (const { classYear, season } of [{ classYear: 2025, season: 2024 }, { classYear: 2026, season: 2025 }]) {
  const response = await fetch(`https://api.collegefootballdata.com/player/usage?year=${season}`, { headers: { Authorization: `Bearer ${cfbdKey}` } });
  if (!response.ok) throw new Error(`CFBD usage returned ${response.status}.`);
  const rows = await response.json() as Array<{ name: string; position: string; usage?: { pass?: number } }>;
  const metrics = rows.flatMap((row) => {
    const player = byClassName.get(`${classYear}:${norm(row.name)}`);
    const value = row.usage?.pass;
    if (!player || player.position !== "WR" || value === null || value === undefined) return [];
    usageMatches += 1;
    return [{ as_of_date: `${classYear}-04-30`, confidence: "high", metric_key: "pass_play_usage", player_id: player.id, source_id: cfbdSource, user_id: user.id, value }];
  });
  if (metrics.length) {
    const saved = await supabase.from("rookie_player_metrics").upsert(metrics, { onConflict: "player_id,metric_key,as_of_date,source_id" });
    if (saved.error) throw saved.error;
  }
}

const fantasyCalcSource = await source("FantasyCalc 12-team Superflex", { author: "FantasyCalc", license: "Public API; provider terms apply", methodology_class: "documented", publication: "FantasyCalc", reliability: "medium", summary: "Current 12-team Superflex half-PPR dynasty market values.", url: "https://fantasycalc.com/" });
const marketResponse = await fetch("https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=0.5");
if (!marketResponse.ok) throw new Error(`FantasyCalc returned ${marketResponse.status}.`);
const marketRows = await marketResponse.json() as Array<{ overallRank?: number; value?: number; player?: { name?: string; position?: string } }>;
const marketMatches = marketRows.flatMap((row) => {
  const candidates = players.filter((player) => norm(player.name) === norm(row.player?.name ?? "") && player.position === row.player?.position);
  return candidates.length === 1 && row.value != null ? [{ player: candidates[0], row }] : [];
});
const sortedValues = marketMatches.map(({ row }) => row.value!).sort((a, b) => a - b);
const percentile = (value: number) => sortedValues.length < 2 ? 50 : Number((sortedValues.indexOf(value) / (sortedValues.length - 1) * 100).toFixed(2));
const observedAt = now;
const marketPayload = marketMatches.map(({ player, row }) => ({ dynasty_adp: row.overallRank ?? null, format: "12-team-superflex", market_value: percentile(row.value!), observed_at: observedAt, player_id: player.id, provider: "FantasyCalc class-relative percentile", source_id: fantasyCalcSource, user_id: user.id }));
if (marketPayload.length) {
  const saved = await supabase.from("rookie_market_snapshots").upsert(marketPayload, { onConflict: "player_id,provider,format,observed_at" });
  if (saved.error) throw saved.error;
}

const configurations = [rbModelConfiguration, wrModelConfiguration];
const modelIds = new Map<string, string>();
for (const configuration of configurations) {
  const existing = await supabase.from("rookie_model_versions").select("id").eq("user_id", user.id).eq("position", configuration.position).eq("semantic_version", configuration.version).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) modelIds.set(configuration.position, existing.data.id);
  else {
    const made = await supabase.from("rookie_model_versions").insert({ configuration, label: configuration.label, position: configuration.position, published_at: now, reference_cohort: { classes: [2025, 2026], label: "MVP class-relative" }, semantic_version: configuration.version, status: "published", user_id: user.id }).select("id").single();
    if (made.error) throw made.error;
    modelIds.set(configuration.position, made.data.id);
  }
}

const metricResult = await supabase.from("rookie_player_metrics").select("player_id,metric_key,value,source_id,as_of_date,created_at").in("player_id", players.map((p) => p.id)).order("as_of_date", { ascending: false }).order("created_at", { ascending: false });
if (metricResult.error) throw metricResult.error;
const inputs = new Map<string, Array<{ key: string; sourceId: string | null; value: number | null }>>();
for (const metric of metricResult.data) {
  const values = inputs.get(metric.player_id) ?? [];
  if (!values.some((entry) => entry.key === metric.metric_key)) values.push({ key: metric.metric_key, sourceId: metric.source_id, value: metric.value });
  inputs.set(metric.player_id, values);
}
const marketByPlayer = new Map(marketPayload.map((row) => [row.player_id, row.market_value]));
let scoredCount = 0;
for (const configuration of configurations) {
  const positionPlayers = players.filter((player) => player.position === configuration.position);
  const keys = configuration.prospectFamilies.flatMap((family) => family.metrics.map((metric) => metric.key));
  const references: RookieMetricReference[] = keys.map((metricKey) => ({ key: metricKey, values: positionPlayers.flatMap((player) => { const value = inputs.get(player.id)?.find((metric) => metric.key === metricKey)?.value; return value == null ? [] : [value]; }) }));
  const scored = positionPlayers.map((player) => ({ player, result: calculateRookieScore(configuration as RookieModelConfiguration, inputs.get(player.id) ?? [], references, { draftCapital: player.overall_pick ? Math.max(0, Math.min(100, 101 - ((player.overall_pick - 1) / 256) * 100)) : null, market: marketByPlayer.get(player.id) ?? null, situation: null }) }));
  const ranked = [...scored].sort((a, b) => (b.result.overallScore ?? -1) - (a.result.overallScore ?? -1));
  const runs = await supabase.from("rookie_score_runs").insert(scored.map(({ player, result }) => ({ as_of_date: now.slice(0, 10), data_coverage: result.coverage, draft_capital_score: result.draftCapitalScore, market_score: result.marketScore, model_version_id: modelIds.get(configuration.position)!, normalization: result.normalization, overall_score: result.overallScore, player_id: player.id, position_rank: ranked.findIndex((entry) => entry.player.id === player.id) + 1, prospect_score: result.prospectScore, situation_score: null, tier: result.tier, user_id: user.id }))).select("id,player_id");
  if (runs.error) throw runs.error;
  const runIds = new Map(runs.data.map((run) => [run.player_id, run.id]));
  const components = scored.flatMap(({ player, result }) => result.components.map((component) => ({ contribution: component.contribution, effective_weight: component.weight, explanation: component.explanation, family_key: component.familyKey, metric_key: component.key, metric_label: component.label, missing: component.missing, normalized_value: component.normalizedValue, raw_value: component.rawValue, score_run_id: runIds.get(player.id)!, source_id: component.sourceId, user_id: user.id })));
  if (components.length) { const saved = await supabase.from("rookie_score_components").insert(components); if (saved.error) throw saved.error; }
  scoredCount += scored.length;
}

const byYear = (matches: Array<{ player: { class_year: number } }>, year: number) => matches.filter(({ player }) => player.class_year === year).length;
console.log(JSON.stringify({ byDraftYear: Object.fromEntries([2025, 2026].map((year) => [year, { combine: byYear(combineMatches, year), draft: byYear(draftMatches, year), market: byYear(marketMatches, year), players: players.filter((player) => player.class_year === year).length, recruiting: byYear(recruitingMatches, year) }])), scored: scoredCount, usageMatches }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
