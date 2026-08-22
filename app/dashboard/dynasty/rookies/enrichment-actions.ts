"use server";

import { revalidatePath } from "next/cache";

import enrichments from "@/data/rookie-enrichments-2020-2026.json";
import outcomes from "@/data/rookie-outcomes-2020-2025.json";
import { createRookieClient } from "@/lib/supabase/rookie";

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(jr|sr|ii|iii|iv)\b/g, "").replace(/[^a-z0-9]/g, "");
}

export async function importBundledRookieEnrichments() {
  try {
    const supabase = await createRookieClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in before importing rookie enrichments.");
    const userId = auth.user.id;
    const { data: sources, error: sourceError } = await supabase.from("rookie_sources").select("id,label").eq("user_id", userId).in("label", ["cfbfastR ESPN receiving targets", "NFL underclassmen eligibility lists", "nflverse player outcomes"]);
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

    const { data: players, error: playerError } = await supabase.from("rookie_players").select("id,external_id,name,class_year,position").eq("user_id", userId).gte("class_year", 2020).lte("class_year", 2026);
    if (playerError) throw playerError;
    const byExternal = new Map((players ?? []).filter((player) => player.external_id).map((player) => [player.external_id, player]));
    const byIdentity = new Map((players ?? []).map((player) => [`${player.class_year}:${player.position}:${normalize(player.name)}`, player]));
    const rawMetricRows = enrichments.flatMap((row) => {
      const player = byExternal.get(row.externalId) ?? byIdentity.get(`${row.classYear}:${row.position}:${normalize(row.name)}`);
      if (!player) return [];
      return [
        row.targetShare === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "high", metric_key: "target_share", player_id: player.id, source_id: targetSourceId, user_id: userId, value: row.targetShare },
        row.earlyDeclare === null ? null : { as_of_date: `${row.classYear}-04-30`, confidence: "high", metric_key: "early_declare", player_id: player.id, source_id: earlySourceId, user_id: userId, value: row.earlyDeclare ? 1 : 0 },
      ].filter((value): value is NonNullable<typeof value> => value !== null);
    });
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
