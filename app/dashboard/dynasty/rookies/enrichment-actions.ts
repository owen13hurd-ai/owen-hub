"use server";

import { revalidatePath } from "next/cache";

import enrichments from "@/data/rookie-enrichments-2020-2026.json";
import pahowdyYprr from "@/data/pahowdy-yprr-2020-2025.json";
import outcomes from "@/data/rookie-outcomes-2020-2025.json";
import outcomeAudit from "@/data/rookie-outcomes-2020-2025-audit.json";
import officialRas from "@/data/official-ras-2025-te.json";
import pahowdyQbTe from "@/data/pahowdy-qb-te-2025-2026.json";
import steinQbTe from "@/data/stein-2025-qb-te.json";
import steinYprr from "@/data/stein-2025-receiving-yprr.json";
import { createRookieClient } from "@/lib/supabase/rookie";

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(jr|sr|ii|iii|iv)\b/g, "").replace(/[^a-z0-9]/g, "");
}

// Targeted outcome refresh: never rewrites prospect inputs or published scores.
export async function importAuditedRookieOutcomes() {
  try {
    const supabase = await createRookieClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in before importing outcomes.");
    const userId = auth.user.id;
    if (!outcomeAudit.seasons.some((row) => row.season === 2025 && row.complete)) throw new Error("2025 coverage has not passed the source audit.");
    const source = await supabase.from("rookie_sources").select("id").eq("user_id", userId).eq("label", "nflverse player outcomes").single();
    if (source.error) throw source.error;
    const metadata = await supabase.from("rookie_sources").update({ accessed_at: outcomeAudit.generatedAt, url: "https://github.com/nflverse/nflverse-data/releases/tag/stats_player", summary: "2020–2025 regular-season PPR outcomes from stats_player_week season-specific files. Complete game coverage checked against nflverse schedules. Missing players remain unknown; PPG denominator is statistical appearances." }).eq("id", source.data.id).eq("user_id", userId);
    if (metadata.error) throw metadata.error;
    const result = await supabase.from("rookie_players").select("id,external_id").eq("user_id", userId).gte("class_year", 2020).lte("class_year", 2025);
    if (result.error) throw result.error;
    const byExternal = new Map((result.data ?? []).filter((row) => row.external_id).map((row) => [row.external_id, row.id]));
    const rows = outcomes.flatMap((row) => {
      const playerId = byExternal.get(row.playerId);
      return playerId ? [{ user_id: userId, player_id: playerId, nfl_season: row.nflSeason, fantasy_points: row.fantasyPoints, fantasy_ppg: row.fantasyPpg, games: row.games, position_finish: row.positionFinish, source_id: source.data.id }] : [];
    });
    for (let start = 0; start < rows.length; start += 100) {
      const batch = rows.slice(start, start + 100);
      const saved = await supabase.from("rookie_outcomes").upsert(batch, { onConflict: "player_id,nfl_season" }).select("player_id,nfl_season,fantasy_ppg,position_finish");
      if (saved.error) throw saved.error;
      if (saved.data.length !== batch.length || batch.some((row) => !saved.data.some((stored) => stored.player_id === row.player_id && stored.nfl_season === row.nfl_season && Math.abs((stored.fantasy_ppg ?? -1) - (row.fantasy_ppg ?? -1)) < 1e-6 && stored.position_finish === row.position_finish))) throw new Error("Outcome write verification failed.");
    }
    revalidatePath("/dashboard/dynasty/rookies/validation");
    return { ok: true, message: `${rows.length} outcome records verified, including ${rows.filter((row) => row.nfl_season === 2025).length} for 2025. ${outcomes.length - rows.length} source records have no matching Hub identity. Scoring weights unchanged.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : error && typeof error === "object" && "message" in error ? String(error.message) : "Outcome import failed." };
  }
}

export async function importBundledRookieEnrichments() {
  try {
    const supabase = await createRookieClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in before importing rookie enrichments.");
    const userId = auth.user.id;
    const { data: sources, error: sourceError } = await supabase.from("rookie_sources").select("id,label").eq("user_id", userId).in("label", ["cfbfastR ESPN receiving targets", "NFL underclassmen eligibility lists", "nflverse player outcomes", "Official Relative Athletic Score", "Pahowdy public prospect database — career YPRR", "Pahowdy public prospect database — QB/TE", "Stein 2025 CFB stats — receiving YPRR", "Stein 2025 CFB stats — QB/TE"]);
    if (sourceError) throw sourceError;
    const sourceIds = new Map((sources ?? []).map((source) => [source.label, source.id]));
    let outcomeSourceId = sourceIds.get("nflverse player outcomes");
    if (!outcomeSourceId) {
      const created = await supabase.from("rookie_sources").insert({ accessed_at: "2026-08-22", author: "nflverse", label: "nflverse player outcomes", license: "CC-BY-4.0", methodology_class: "documented", publication: "nflverse-data", reliability: "high", summary: "Regular-season PPR production and league-wide position finishes for validation only.", url: "https://github.com/nflverse/nflverse-data/releases/tag/player_stats", user_id: userId }).select("id").single();
      if (created.error) throw created.error;
      outcomeSourceId = created.data.id;
    }
    const targetSourceId = sourceIds.get("cfbfastR ESPN receiving targets");
    const earlySourceId = sourceIds.get("NFL underclassmen eligibility lists");
    if (!targetSourceId || !earlySourceId) throw new Error("The approved cfbfastR and NFL sources are missing.");
    let yprrSourceId = sourceIds.get("Pahowdy public prospect database — career YPRR");
    if (!yprrSourceId) {
      const created = await supabase.from("rookie_sources").insert({ accessed_at: "2026-08-22", author: "Peter Howard (@pahowdy) and credited contributors", label: "Pahowdy public prospect database — career YPRR", license: "Public compiler permits sharing with attribution; upstream sources are disclosed in the workbook", methodology_class: "partial", publication: "Pahowdy's College Database", reliability: "medium", summary: "Career college receiving yards per route run from the public WR prospect workbook. The compiler credits PFF, Sports Reference, and community contributors; values are treated as secondary-source data.", url: "https://www.patreon.com/posts/pahowdy-prospect-63253587", user_id: userId }).select("id").single();
      if (created.error) throw created.error;
      yprrSourceId = created.data.id;
    }
    let currentYprrSourceId = sourceIds.get("Stein 2025 CFB stats — receiving YPRR");
    if (!currentYprrSourceId) {
      const created = await supabase.from("rookie_sources").insert({ accessed_at: "2026-08-22", author: "Stein (shared workbook compiler); PFF receiving data", label: "Stein 2025 CFB stats — receiving YPRR", license: "Public view-only workbook shared by user; downstream PFF attribution retained", methodology_class: "partial", publication: "Stein - 2025 cfb stats", reliability: "medium", summary: "Final 2025 college-season yards per route run from the workbook's pff_rec tab. Stored as season receiving YPRR, not career YPRR.", url: "https://docs.google.com/spreadsheets/d/167k1l6dMPJOw1V0eQh-R1WHqtmEhqoeyS4DmePmhiYY/edit?usp=sharing", user_id: userId }).select("id").single();
      if (created.error) throw created.error;
      currentYprrSourceId = created.data.id;
    }
    let steinQbTeSourceId = sourceIds.get("Stein 2025 CFB stats — QB/TE");
    if (!steinQbTeSourceId) {
      const created = await supabase.from("rookie_sources").insert({ accessed_at: "2026-08-23", author: "Stein (shared workbook compiler); ESPN, CFBD, PFF and cfbstats attribution retained", label: "Stein 2025 CFB stats — QB/TE", license: "Public view-only workbook shared by user; upstream attribution retained", methodology_class: "partial", publication: "Stein - 2025 cfb stats", reliability: "medium", summary: "Final 2025 QB and TE efficiency and usage statistics for the 2026 class. Workbook definitions are preserved and EPA fields are not relabeled as CFBD PPA.", url: "https://docs.google.com/spreadsheets/d/167k1l6dMPJOw1V0eQh-R1WHqtmEhqoeyS4DmePmhiYY/edit?usp=sharing", user_id: userId }).select("id").single();
      if (created.error) throw created.error;
      steinQbTeSourceId = created.data.id;
    }
    let qbTeSourceId = sourceIds.get("Pahowdy public prospect database — QB/TE");
    if (!qbTeSourceId) {
      const created = await supabase.from("rookie_sources").insert({ accessed_at: "2026-08-23", author: "Peter Howard (@pahowdy) and credited contributors", label: "Pahowdy public prospect database — QB/TE", license: "Public database explicitly shared free with attribution; upstream sources retained", methodology_class: "partial", publication: "Pahowdy's College Database", reliability: "medium", summary: "Attributed biographical, draft, combine, and TE receiving fields from the official public QB and TE tabs.", url: "https://docs.google.com/spreadsheets/d/19suThny5WpYuBpv7tKrLe6_qtj_j9DQxHA8vftjkRd0/edit?usp=sharing", user_id: userId }).select("id").single();
      if (created.error) throw created.error;
      qbTeSourceId = created.data.id;
    }
    let rasSourceId = sourceIds.get("Official Relative Athletic Score");
    if (!rasSourceId) {
      const created = await supabase.from("rookie_sources").insert({ accessed_at: "2026-08-23", author: "Kent Lee Platte (@MathBomb)", label: "Official Relative Athletic Score", license: "Public player table; attribution retained", methodology_class: "documented", publication: "Relative Athletic Score", reliability: "high", summary: "Official position-relative 0–10 RAS. A score requires any six of ten measurables; no specific drill, including the forty, is mandatory.", url: "https://www.ras.football/", user_id: userId }).select("id").single();
      if (created.error) throw created.error;
      rasSourceId = created.data.id;
    }

    const { data: players, error: playerError } = await supabase.from("rookie_players").select("id,external_id,name,class_year,position").eq("user_id", userId).gte("class_year", 2020).lte("class_year", 2026);
    if (playerError) throw playerError;
    const byExternal = new Map((players ?? []).filter((player) => player.external_id).map((player) => [player.external_id, player]));
    const byIdentity = new Map((players ?? []).map((player) => [`${player.class_year}:${player.position}:${normalize(player.name)}`, player]));
    for (const row of pahowdyQbTe) {
      const player = byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      if (!player) continue;
      const updated = await supabase.from("rookie_players").update({ age_at_draft: row.ageAtDraft, birthdate: row.birthdate, bmi: row.bmi, conference: row.conference, draft_round: row.draftRound, height_inches: row.heightInches, nfl_team: row.nflTeam, overall_pick: row.overallPick, school: row.school, updated_at: new Date().toISOString(), weight_pounds: row.weightPounds }).eq("id", player.id).eq("user_id", userId);
      if (updated.error) throw updated.error;
    }
    for (const row of steinQbTe) {
      const player = byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      if (!player) continue;
      const updated = await supabase.from("rookie_players").update({ school: row.school, updated_at: new Date().toISOString() }).eq("id", player.id).eq("user_id", userId);
      if (updated.error) throw updated.error;
    }
    const rawMetricRows = enrichments.flatMap((row) => {
      const player = byExternal.get(row.externalId) ?? byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      if (!player) return [];
      return [
        row.targetShare === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "high", metric_key: "target_share", player_id: player.id, source_id: targetSourceId, user_id: userId, value: row.targetShare },
        row.earlyDeclare === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "high", metric_key: "early_declare", player_id: player.id, source_id: earlySourceId, user_id: userId, value: row.earlyDeclare ? 1 : 0 },
      ].filter((value): value is NonNullable<typeof value> => value !== null);
    }).concat(officialRas.flatMap((row) => {
      const player = byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      if (!player) return [];
      const eligibility = { as_of_date: `${row.classYear}-04-30`, confidence: "high" as const, metric_key: "ras_eligible", player_id: player.id, source_id: rasSourceId, user_id: userId, value: row.ras === null ? 0 : 1 };
      return row.ras === null ? [eligibility] : [eligibility, { ...eligibility, metric_key: "ras", value: row.ras }];
    })).concat(pahowdyQbTe.flatMap((row) => {
      const player = byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      if (!player) return [];
      return [
        row.ageAtDraft === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "medium", metric_key: "age_at_draft", player_id: player.id, source_id: qbTeSourceId, user_id: userId, value: row.ageAtDraft },
        row.earlyDeclare === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "high", metric_key: "early_declare", player_id: player.id, source_id: earlySourceId, user_id: userId, value: row.earlyDeclare ? 1 : 0 },
        row.bmi === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "medium", metric_key: "bmi", player_id: player.id, source_id: qbTeSourceId, user_id: userId, value: row.bmi },
        row.speedScore === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "medium", metric_key: "speed_score", player_id: player.id, source_id: qbTeSourceId, user_id: userId, value: row.speedScore },
        row.careerYprr === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "medium", metric_key: "career_yprr", player_id: player.id, source_id: qbTeSourceId, user_id: userId, value: row.careerYprr },
        row.bestYprr === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "medium", metric_key: "best_yprr", player_id: player.id, source_id: qbTeSourceId, user_id: userId, value: row.bestYprr },
        row.targetShare === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "medium", metric_key: "target_share", player_id: player.id, source_id: qbTeSourceId, user_id: userId, value: row.targetShare },
      ].filter((value): value is NonNullable<typeof value> => value !== null);
    })).concat(steinQbTe.flatMap((row) => {
      const player = byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      if (!player) return [];
      const base = { as_of_date: "2026-04-30", confidence: "medium" as const, player_id: player.id, source_id: steinQbTeSourceId, user_id: userId };
      const metric = (metric_key: string, value: number | null | undefined) => typeof value === "number" ? [{ ...base, metric_key, value }] : [];
      if (row.position === "QB") {
        return [
          ...metric("adjusted_completion_percentage", row.adjustedCompletionPercentage),
          ...metric("adjusted_yards_per_attempt", row.adjustedYardsPerAttempt),
          ...metric("pff_passing_grade", row.pffPassingGrade),
          ...metric("qbr", row.qbr),
          ...metric("epa_per_dropback", row.epaPerDropback),
          ...metric("quarterback_epa_per_play", row.epaPerPlay),
        ];
      }
      return [
        ...metric("pass_play_usage", row.passPlayUsage),
        ...metric("receiving_yprr", row.receivingYprr),
        ...metric("target_share", row.targetShare),
        ...metric("receiving_yard_share", row.receivingYardShare),
        ...metric("pff_receiving_grade", row.pffReceivingGrade),
        ...metric("weighted_dominator", row.weightedDominator),
        ...metric("receiving_yards_per_team_pass_attempt", row.receivingYardsPerTeamPassAttempt),
        ...metric("receiving_epa_per_play", row.epaPerPlay),
      ];
    })).concat(pahowdyYprr.flatMap((row) => {
      const player = byExternal.get(row.externalId) ?? byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      return player ? [{ as_of_date: `${row.classYear}-04-30`, confidence: "medium", metric_key: "career_yprr", player_id: player.id, source_id: yprrSourceId, user_id: userId, value: row.careerYprr }] : [];
    })).concat(steinYprr.flatMap((row) => {
      const player = byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      return player ? [{ as_of_date: "2026-04-30", confidence: "medium", metric_key: "receiving_yprr", player_id: player.id, source_id: currentYprrSourceId, user_id: userId, value: row.receivingYprr }] : [];
    }));
    const metricRows = [...new Map(rawMetricRows.map((row) => [`${row.player_id}:${row.metric_key}:${row.as_of_date}:${row.source_id}`, row])).values()];
    for (let start = 0; start < metricRows.length; start += 200) {
      const result = await supabase.from("rookie_player_metrics").upsert(metricRows.slice(start, start + 200), { onConflict: "player_id,metric_key,as_of_date,source_id" });
      if (result.error) throw result.error;
    }
    const rawOutcomeRows = outcomes.flatMap((row) => {
      const player = byExternal.get(row.playerId);
      return player ? [{ fantasy_points: row.fantasyPoints, fantasy_ppg: row.fantasyPpg, games: row.games, nfl_season: row.nflSeason, player_id: player.id, position_finish: row.positionFinish, source_id: outcomeSourceId, user_id: userId }] : [];
    });
    const outcomeRows = [...new Map(rawOutcomeRows.map((row) => [`${row.player_id}:${row.nfl_season}`, row])).values()];
    for (let start = 0; start < outcomeRows.length; start += 200) {
      const result = await supabase.from("rookie_outcomes").upsert(outcomeRows.slice(start, start + 200), { onConflict: "player_id,nfl_season" });
      if (result.error) throw result.error;
    }
    revalidatePath("/dashboard/dynasty/rookies");
    return { message: `${metricRows.length} prospect metrics and ${outcomeRows.length} outcomes imported.`, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : error && typeof error === "object" && "message" in error ? String(error.message) : "The enrichments could not be imported.";
    return { message, ok: false };
  }
}
