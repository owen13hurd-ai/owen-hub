import { createClient } from "@supabase/supabase-js";

import { parseGoogleSheetRookieIdentities } from "../lib/dynasty/rookie-model/google-sheet-adapter.ts";
import { fetchCfbdPlayerSeasons } from "../lib/dynasty/sources/cfbd.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cfbdKey = process.env.CFBD_API_KEY;
if (!supabaseUrl || !serviceKey || !cfbdKey) throw new Error("Supabase URL, service role key, and CFBD key are required.");

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
if (usersError) throw usersError;
const users = [...usersData.users].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
const user = process.env.ROOKIE_USER_EMAIL
  ? users.find((candidate) => candidate.email?.toLowerCase() === process.env.ROOKIE_USER_EMAIL.toLowerCase())
  : users[0];
if (!user) throw new Error("No matching Supabase auth user was found.");

const sheets = [
  { classYear: 2025, id: "1f5u4SGrlrop1H0hrFZMYoIoxAfP4zVeFDI9ZmYKs5IM", label: "Owen 2025 rookie rankings sheet" },
  { classYear: 2026, id: "1ZnhkpoJspVQ8RDowAiXnWKL4_bBpcyki-JHkZhe5xVQ", label: "Owen 2026 rookie rankings sheet" },
];

async function sourceId(label, values) {
  const existing = await supabase.from("rookie_sources").select("id").eq("user_id", user.id).eq("label", label).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;
  const created = await supabase.from("rookie_sources").insert({ ...values, label, user_id: user.id }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id;
}

let identityCount = 0;
for (const sheet of sheets) {
  console.log(`Repairing ${sheet.classYear} identities...`);
  const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/gviz/tq?tqx=out:csv`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${sheet.classYear} sheet returned ${response.status}.`);
  const identities = parseGoogleSheetRookieIdentities(await response.text(), sheet.classYear);
  const source = await sourceId(sheet.label, { accessed_at: new Date().toISOString(), license: "Personal Google Sheet; manual rankings", methodology_class: "opinion", reliability: "medium", summary: "Player identity and Owen's manual tier only; never used as a numerical model input.", url });
  const batch = await supabase.from("rookie_import_batches").insert({ filename: `repair-google-sheet-${sheet.classYear}.csv`, invalid_row_count: 0, mapping: { strategy: "admin-repair-identity-v1" }, row_count: identities.length, source_id: source, status: "committed", committed_at: new Date().toISOString(), user_id: user.id, valid_row_count: identities.length }).select("id").single();
  if (batch.error) throw batch.error;
  const players = await supabase.from("rookie_players").upsert(identities.map((identity) => ({ class_year: identity.classYear, external_id: `owen-sheet-${identity.classYear}-${identity.position.toLowerCase()}-${identity.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, import_batch_id: batch.data.id, name: identity.name, position: identity.position, source_id: source, updated_at: new Date().toISOString(), user_id: user.id })), { onConflict: "user_id,class_year,position,name" }).select("id,name,class_year,position");
  if (players.error) throw players.error;
  const ids = new Map(players.data.map((player) => [`${player.class_year}:${player.position}:${player.name}`, player.id]));
  const rankings = identities.map((identity) => ({ format: "12-team-superflex", manual_rank: null, manual_tier: identity.tier, player_id: ids.get(`${identity.classYear}:${identity.position}:${identity.name}`), updated_at: new Date().toISOString(), user_id: user.id }));
  if (rankings.some((ranking) => !ranking.player_id)) throw new Error(`Player ID mapping failed for ${sheet.classYear}.`);
  console.log(`Saving ${rankings.length} ${sheet.classYear} manual tiers...`);
  const rankingResult = await supabase.from("rookie_manual_rankings").upsert(rankings, { onConflict: "user_id,player_id,format" });
  if (rankingResult.error) throw rankingResult.error;
  identityCount += identities.length;
}

const playersResult = await supabase.from("rookie_players").select("id,name,class_year,position").eq("user_id", user.id).in("class_year", [2025, 2026]).in("position", ["RB", "WR"]);
if (playersResult.error) throw playersResult.error;
const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
const playersByClassName = new Map(playersResult.data.map((player) => [`${player.class_year}:${normalize(player.name)}`, player]));
const cfbdSource = await sourceId("CollegeFootballData API", { accessed_at: new Date().toISOString(), author: "CollegeFootballData", license: "Provider terms apply; raw source attribution retained", methodology_class: "documented", publication: "CollegeFootballData", reliability: "high", summary: "Public API college player season totals and season overview usage.", url: "https://collegefootballdata.com/" });

let seasonCount = 0;
let metricCount = 0;
const requestedClassYear = process.env.REPAIR_CLASS_YEAR ? Number(process.env.REPAIR_CLASS_YEAR) : null;
for (const mapping of [{ classYear: 2025, season: 2024 }, { classYear: 2026, season: 2025 }].filter((entry) => !requestedClassYear || entry.classYear === requestedClassYear)) {
  console.log(`Repairing ${mapping.season} CFBD seasons...`);
  const allSeasons = await fetchCfbdPlayerSeasons(cfbdKey, mapping.season);
  const teamReceiving = new Map();
  const teamRushing = new Map();
  for (const row of allSeasons) {
    const team = normalize(row.team);
    teamReceiving.set(team, (teamReceiving.get(team) ?? 0) + (row.receivingYards ?? 0));
    teamRushing.set(team, (teamRushing.get(team) ?? 0) + (row.rushingYards ?? 0));
  }
  const relevantCandidates = allSeasons.flatMap((row) => {
    const player = playersByClassName.get(`${mapping.classYear}:${normalize(row.player)}`);
    return player ? [{ player, row }] : [];
  });
  const relevantByPlayer = new Map();
  for (const candidate of relevantCandidates) {
    const current = relevantByPlayer.get(candidate.player.id);
    const volume = (candidate.row.rushingYards ?? 0) + (candidate.row.receivingYards ?? 0);
    const currentVolume = current ? (current.row.rushingYards ?? 0) + (current.row.receivingYards ?? 0) : -1;
    if (!current || volume > currentVolume) relevantByPlayer.set(candidate.player.id, candidate);
  }
  const relevant = [...relevantByPlayer.values()];
  const overviewById = new Map();
  for (let start = 0; start < relevant.length; start += 8) {
    const chunk = relevant.slice(start, start + 8);
    const overviews = await Promise.all(chunk.map(async ({ row }) => {
      if (!row.playerId) return null;
      const response = await fetch(`https://api.collegefootballdata.com/player/season/overview?year=${mapping.season}&playerId=${row.playerId}`, { headers: { Authorization: `Bearer ${cfbdKey}` } });
      return response.ok ? response.json() : null;
    }));
    overviews.forEach((overview) => { if (overview?.id) overviewById.set(String(overview.id), overview); });
  }
  const seasonRows = relevant.map(({ player, row }) => {
    const overview = row.playerId ? overviewById.get(row.playerId) : null;
    const teamKey = normalize(row.team);
    return { attempts: row.attempts, carries: row.carries, games: overview?.games ?? null, player_id: player.id, receiving_yard_share: row.receivingYards === null || !teamReceiving.get(teamKey) ? null : row.receivingYards / teamReceiving.get(teamKey), receiving_yards: row.receivingYards, receptions: row.receptions, rushing_yard_share: row.rushingYards === null || !teamRushing.get(teamKey) ? null : row.rushingYards / teamRushing.get(teamKey), rushing_yards: row.rushingYards, season: row.season, source_id: cfbdSource, touchdowns: row.touchdowns, user_id: user.id };
  });
  if (seasonRows.length) {
    console.log(`Saving ${seasonRows.length} season rows...`);
    const saved = await supabase.from("rookie_seasons").upsert(seasonRows, { onConflict: "player_id,season" });
    if (saved.error) throw saved.error;
  }
  const asOfDate = `${mapping.classYear}-04-30`;
  const metrics = seasonRows.flatMap((row) => {
    const player = playersResult.data.find((candidate) => candidate.id === row.player_id);
    if (!player) return [];
    const values = [];
    if (player.position === "RB" && row.games) {
      values.push({ key: "scrimmage_yards_per_game", value: ((row.rushing_yards ?? 0) + (row.receiving_yards ?? 0)) / row.games });
      if (row.receptions !== null) values.push({ key: "receptions_per_game", value: row.receptions / row.games });
      if (row.rushing_yard_share !== null) values.push({ key: "rushing_yard_share", value: row.rushing_yard_share });
    }
    if (player.position === "WR" && row.receiving_yard_share !== null) values.push({ key: "receiving_yard_share", value: row.receiving_yard_share });
    return values.map((metric) => ({ as_of_date: asOfDate, confidence: "high", metric_key: metric.key, player_id: row.player_id, source_id: cfbdSource, user_id: user.id, value: metric.value }));
  });
  if (metrics.length) {
    console.log(`Saving ${metrics.length} metric rows...`);
    const saved = await supabase.from("rookie_player_metrics").upsert(metrics, { onConflict: "player_id,metric_key,as_of_date,source_id" });
    if (saved.error) throw saved.error;
  }
  seasonCount += seasonRows.length;
  metricCount += metrics.length;
}

console.log(JSON.stringify({ authUsers: users.length, identities: identityCount, metrics: metricCount, seasons: seasonCount, userId: user.id }));
