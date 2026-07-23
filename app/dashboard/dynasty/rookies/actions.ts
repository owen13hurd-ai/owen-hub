"use server";

import { revalidatePath } from "next/cache";

import { previewRookieCsv } from "@/lib/dynasty/rookie-model/import";
import { findRookieDuplicateCandidates } from "@/lib/dynasty/rookie-model/matching";
import { validateRookieModelConfiguration } from "@/lib/dynasty/rookie-model/config";
import { rbModelConfiguration, wrModelConfiguration } from "@/lib/dynasty/rookie-model/config";
import { scoreAndPersistRookieClass } from "@/lib/dynasty/rookie-model/repository";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type RookieImportActionState = {
  batchId?: string;
  message: string;
  ok: boolean;
  pendingDuplicates?: number;
  preview?: ReturnType<typeof previewRookieCsv>;
};

async function getAuthenticatedClient() {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in before saving rookie data.");
  return { supabase, userId: data.user.id };
}

export async function previewRookieImport(
  _state: RookieImportActionState,
  formData: FormData,
): Promise<RookieImportActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a CSV file first.", ok: false };
  }
  if (file.size > 2_000_000) {
    return { message: "CSV files must be smaller than 2 MB.", ok: false };
  }

  try {
    const preview = previewRookieCsv(await file.text());
    const { supabase, userId } = await getAuthenticatedClient();
    const sourceIdInput = String(formData.get("source_id") ?? "").trim();
    const sourceId = sourceIdInput || null;
    if (!sourceId) throw new Error("Choose an approved source before previewing the import.");
    if (sourceId) {
      const { data: source } = await supabase.from("rookie_sources").select("id").eq("id", sourceId).eq("user_id", userId).maybeSingle();
      if (!source) throw new Error("The selected source was not found.");
    }
    const { data: existingPlayers, error: playersError } = await supabase
      .from("rookie_players")
      .select("id,name,position,class_year,school")
      .eq("user_id", userId)
      .in("class_year", [2025, 2026])
      .in("position", ["RB", "WR"]);
    if (playersError) throw playersError;
    const matchCandidates = (existingPlayers ?? []).map((player) => ({ classYear: player.class_year, id: player.id, name: player.name, position: player.position, school: player.school }));
    const duplicateCandidates = new Map(preview.rows.map((row) => [row.sourceRow, findRookieDuplicateCandidates(row.name, row.classYear, row.position, matchCandidates)]));
    const pendingDuplicates = [...duplicateCandidates.values()].filter((candidates) => candidates.length > 0).length;
    const { data, error } = await supabase
      .from("rookie_import_batches")
      .insert({
        filename: file.name,
        invalid_row_count: preview.invalidRows,
        mapping: { strategy: "normalized-header-v1" },
        row_count: preview.rows.length,
        status: "previewed",
        source_id: sourceId,
        user_id: userId,
        valid_row_count: preview.validRows,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: rowError } = await supabase.from("rookie_import_rows").insert(
      preview.rows.map((row) => ({
        batch_id: data.id,
        duplicate_candidates: duplicateCandidates.get(row.sourceRow) ?? [],
        normalized_data: row,
        raw_data: row.rawData,
        resolution_status: (duplicateCandidates.get(row.sourceRow)?.length ?? 0) > 0 ? "pending" : "create",
        source_row: row.sourceRow,
        user_id: userId,
        validation_errors: row.errors,
      })),
    );
    if (rowError) throw rowError;

    return {
      batchId: data.id,
      message: pendingDuplicates > 0 ? `${pendingDuplicates} possible duplicate${pendingDuplicates === 1 ? "" : "s"} must be resolved.` : `${preview.validRows} valid rows ready to commit.`,
      ok: preview.validRows > 0 && pendingDuplicates === 0,
      pendingDuplicates,
      preview,
    };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The CSV could not be previewed.", ok: false };
  }
}

export async function commitRookieImport(batchId: string): Promise<RookieImportActionState> {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const { data: batch, error: batchError } = await supabase
      .from("rookie_import_batches")
      .select("id,status,source_id")
      .eq("id", batchId)
      .eq("user_id", userId)
      .single();
    if (batchError || !batch) throw batchError ?? new Error("Import batch was not found.");
    if (batch.status !== "previewed") throw new Error("Only previewed imports can be committed.");

    const { data: importRows, error: rowsError } = await supabase
      .from("rookie_import_rows")
      .select("id,normalized_data,validation_errors,resolution_status,matched_player_id")
      .eq("batch_id", batchId)
      .eq("user_id", userId);
    if (rowsError) throw rowsError;

    const validRows = (importRows ?? []).filter(
      (row) => Array.isArray(row.validation_errors) && row.validation_errors.length === 0 && row.resolution_status !== "pending",
    );
    const unresolvedCount = (importRows ?? []).filter((row) => row.resolution_status === "pending").length;
    if (unresolvedCount > 0) throw new Error(`Resolve ${unresolvedCount} possible duplicate${unresolvedCount === 1 ? "" : "s"} before committing.`);

    for (const importRow of validRows) {
      const row = importRow.normalized_data as ReturnType<typeof previewRookieCsv>["rows"][number];
      let matchedPlayerId: string | null = importRow.resolution_status === "matched" ? importRow.matched_player_id : null;
      if (row.externalId) {
        const { data: externalMatch, error } = await supabase.from("rookie_players").select("id").eq("user_id", userId).eq("external_id", row.externalId).maybeSingle();
        if (error) throw error;
        matchedPlayerId = externalMatch?.id ?? null;
      }
      if (!matchedPlayerId) {
        const { data: aliasMatch, error } = await supabase.from("rookie_player_aliases").select("player_id").eq("user_id", userId).ilike("alias", row.name).maybeSingle();
        if (error) throw error;
        matchedPlayerId = aliasMatch?.player_id ?? null;
      }
      if (!matchedPlayerId) {
        const { data: nameMatch, error } = await supabase.from("rookie_players").select("id").eq("user_id", userId).eq("class_year", row.classYear).eq("position", row.position).ilike("name", row.name).maybeSingle();
        if (error) throw error;
        matchedPlayerId = nameMatch?.id ?? null;
      }
      const playerPayload = {
        age_at_draft: row.ageAtDraft,
        class_year: row.classYear,
        early_declare: row.earlyDeclare,
        external_id: row.externalId,
        import_batch_id: batchId,
        school: row.school,
        source_id: batch.source_id,
        updated_at: new Date().toISOString(),
      };
      const playerQuery = matchedPlayerId
        ? supabase.from("rookie_players").update(playerPayload).eq("id", matchedPlayerId).eq("user_id", userId)
        : supabase.from("rookie_players").insert({ ...playerPayload, name: row.name, position: row.position, user_id: userId });
      const { data: player, error: playerError } = await playerQuery.select("id").single();
      if (playerError) throw playerError;

      const metrics = row.metrics.filter((metric) => metric.value !== null);
      for (const metric of metrics) {
        const asOfDate = `${row.classYear}-04-30`;
        let existingMetricQuery = supabase
          .from("rookie_player_metrics")
          .select("id")
          .eq("player_id", player.id)
          .eq("metric_key", metric.key)
          .eq("as_of_date", asOfDate);
        existingMetricQuery = batch.source_id ? existingMetricQuery.eq("source_id", batch.source_id) : existingMetricQuery.is("source_id", null);
        const { data: existingMetric, error: lookupError } = await existingMetricQuery.maybeSingle();
        if (lookupError) throw lookupError;
        const metricPayload = { import_batch_id: batchId, source_id: batch.source_id, value: metric.value };
        const metricQuery = existingMetric
          ? supabase.from("rookie_player_metrics").update(metricPayload).eq("id", existingMetric.id)
          : supabase.from("rookie_player_metrics").insert({
              ...metricPayload,
              as_of_date: asOfDate,
              metric_key: metric.key,
              player_id: player.id,
              user_id: userId,
            });
        const { error: metricError } = await metricQuery;
        if (metricError) throw metricError;
      }

      await supabase
        .from("rookie_import_rows")
        .update({ matched_player_id: player.id })
        .eq("id", importRow.id);
    }

    const { error: updateError } = await supabase
      .from("rookie_import_batches")
      .update({ committed_at: new Date().toISOString(), status: "committed" })
      .eq("id", batchId)
      .eq("user_id", userId);
    if (updateError) throw updateError;

    revalidatePath("/dashboard/dynasty/rookies");
    return { message: `${validRows.length} prospects committed with provenance.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The import could not be committed.", ok: false };
  }
}

export async function runRookieModel() {
  try {
    const { userId } = await getAuthenticatedClient();
    const count = await scoreAndPersistRookieClass(userId);
    revalidatePath("/dashboard/dynasty/rookies");
    return { message: `${count} prospects scored in a new immutable run.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The model could not run.", ok: false };
  }
}

export async function saveManualRookieRankings(
  rankings: Array<{ manualRank: number | null; manualTier: string | null; playerId: string }>,
) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    if (rankings.length === 0) return { message: "No manual rankings changed.", ok: true };
    if (rankings.length > 250) throw new Error("Save no more than 250 rankings at once.");

    const normalized = rankings.map((ranking) => ({
      format: "12-team-superflex",
      manual_rank: ranking.manualRank,
      manual_tier: ranking.manualTier?.trim() || null,
      player_id: ranking.playerId,
      updated_at: new Date().toISOString(),
      user_id: userId,
    }));
    if (normalized.some((ranking) => ranking.manual_rank !== null && ranking.manual_rank < 1)) {
      throw new Error("Manual ranks must be positive whole numbers.");
    }

    const { error } = await supabase
      .from("rookie_manual_rankings")
      .upsert(normalized, { onConflict: "user_id,player_id,format" });
    if (error) throw error;
    revalidatePath("/dashboard/dynasty/rookies");
    return { message: `${rankings.length} manual ranking${rankings.length === 1 ? "" : "s"} saved.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Manual rankings could not be saved.", ok: false };
  }
}

export async function saveRookieModelDraft(configurationInput: unknown) {
  try {
    const configuration = validateRookieModelConfiguration(configurationInput as never);
    const { supabase, userId } = await getAuthenticatedClient();
    const { data: existing } = await supabase
      .from("rookie_model_versions")
      .select("id,status")
      .eq("user_id", userId)
      .eq("position", configuration.position)
      .eq("semantic_version", configuration.version)
      .maybeSingle();
    if (existing?.status === "published") {
      throw new Error("Published versions are immutable. Choose a new version name.");
    }

    const payload = {
      configuration,
      label: configuration.label,
      position: configuration.position,
      reference_cohort: { classes: [2025, 2026], label: "MVP class-relative" },
      semantic_version: configuration.version,
      status: "draft" as const,
      updated_at: new Date().toISOString(),
      user_id: userId,
    };
    const query = existing
      ? supabase.from("rookie_model_versions").update(payload).eq("id", existing.id).eq("user_id", userId)
      : supabase.from("rookie_model_versions").insert(payload);
    const { data, error } = await query.select("id").single();
    if (error) throw error;
    revalidatePath("/dashboard/dynasty/rookies/configuration");
    return { id: data.id, message: `${configuration.position} draft ${configuration.version} saved.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The model draft could not be saved.", ok: false };
  }
}

export async function publishRookieModelDraft(modelId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const { data: model, error: readError } = await supabase
      .from("rookie_model_versions")
      .select("id,status,configuration,position,semantic_version")
      .eq("id", modelId)
      .eq("user_id", userId)
      .single();
    if (readError || !model) throw readError ?? new Error("Model draft not found.");
    if (model.status !== "draft") throw new Error("Only draft models can be published.");
    validateRookieModelConfiguration(model.configuration as never);
    const { error } = await supabase
      .from("rookie_model_versions")
      .update({ published_at: new Date().toISOString(), status: "published" })
      .eq("id", modelId)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/dashboard/dynasty/rookies");
    revalidatePath("/dashboard/dynasty/rookies/configuration");
    return { message: `${model.position} ${model.semantic_version} published. Future score runs will use it.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The model could not be published.", ok: false };
  }
}

export type RookiePlayerUpdate = {
  ageAtDraft: number | null;
  birthdate: string | null;
  classYear: number;
  confidence: "high" | "medium" | "low";
  conference: string | null;
  draftRound: number | null;
  earlyDeclare: boolean | null;
  heightInches: number | null;
  name: string;
  nflTeam: string | null;
  overallPick: number | null;
  playerId: string;
  position: "RB" | "WR";
  school: string | null;
  weightPounds: number | null;
};

export async function updateRookiePlayer(input: RookiePlayerUpdate) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const name = input.name.trim();
    if (!name) throw new Error("Player name is required.");
    if (![2025, 2026].includes(input.classYear)) throw new Error("MVP class must be 2025 or 2026.");
    if (input.overallPick !== null && (input.overallPick < 1 || input.overallPick > 257)) throw new Error("Overall pick must be between 1 and 257.");
    const { error } = await supabase.from("rookie_players").update({
      age_at_draft: input.ageAtDraft,
      birthdate: input.birthdate || null,
      class_year: input.classYear,
      confidence: input.confidence,
      conference: input.conference?.trim() || null,
      draft_round: input.draftRound,
      early_declare: input.earlyDeclare,
      height_inches: input.heightInches,
      name,
      nfl_team: input.nflTeam?.trim().toUpperCase() || null,
      overall_pick: input.overallPick,
      position: input.position,
      school: input.school?.trim() || null,
      updated_at: new Date().toISOString(),
      weight_pounds: input.weightPounds,
    }).eq("id", input.playerId).eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/dashboard/dynasty/rookies");
    revalidatePath(`/dashboard/dynasty/rookies/${input.playerId}`);
    return { message: `${name} updated. Run the model to create a new score snapshot.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The player could not be updated.", ok: false };
  }
}

export async function addRookieNote(playerId: string, bodyInput: string) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const body = bodyInput.trim();
    if (!body) throw new Error("Write a note before saving.");
    if (body.length > 5_000) throw new Error("Notes must be 5,000 characters or fewer.");
    const { error } = await supabase.from("rookie_notes").insert({ body, player_id: playerId, user_id: userId });
    if (error) throw error;
    revalidatePath(`/dashboard/dynasty/rookies/${playerId}`);
    return { message: "Note saved separately from the model score.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The note could not be saved.", ok: false };
  }
}

export async function deleteRookieNote(playerId: string, noteId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const { error } = await supabase.from("rookie_notes").delete().eq("id", noteId).eq("player_id", playerId).eq("user_id", userId);
    if (error) throw error;
    revalidatePath(`/dashboard/dynasty/rookies/${playerId}`);
    return { message: "Note deleted.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The note could not be deleted.", ok: false };
  }
}

const editableMetricKeys = new Set(
  [rbModelConfiguration, wrModelConfiguration].flatMap((configuration) =>
    configuration.prospectFamilies.flatMap((family) => family.metrics.map((metric) => metric.key)),
  ),
);

export async function saveRookieMetric(input: {
  asOfDate: string;
  confidence: "high" | "medium" | "low";
  metricKey: string;
  playerId: string;
  value: number;
}) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    if (!editableMetricKeys.has(input.metricKey)) throw new Error("That metric is not part of the RB/WR MVP configuration.");
    if (!Number.isFinite(input.value)) throw new Error("Enter a valid numerical value.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.asOfDate)) throw new Error("Choose a valid as-of date.");
    const { data: player } = await supabase.from("rookie_players").select("id").eq("id", input.playerId).eq("user_id", userId).maybeSingle();
    if (!player) throw new Error("Player not found.");

    const sourceLookup = await supabase
      .from("rookie_sources")
      .select("id")
      .eq("user_id", userId)
      .eq("label", "Manual entry by Owen")
      .maybeSingle();
    let source = sourceLookup.data;
    const sourceError = sourceLookup.error;
    if (sourceError) throw sourceError;
    if (!source) {
      const { data: createdSource, error } = await supabase.from("rookie_sources").insert({
        label: "Manual entry by Owen",
        methodology_class: "opinion",
        reliability: "medium",
        summary: "Structured value entered manually in Owen's Hub; verify against a cited primary source when available.",
        user_id: userId,
      }).select("id").single();
      if (error) throw error;
      source = createdSource;
    }
    const { error } = await supabase.from("rookie_player_metrics").upsert({
      as_of_date: input.asOfDate,
      confidence: input.confidence,
      metric_key: input.metricKey,
      player_id: input.playerId,
      source_id: source.id,
      user_id: userId,
      value: input.value,
    }, { onConflict: "player_id,metric_key,as_of_date,source_id" });
    if (error) throw error;
    revalidatePath(`/dashboard/dynasty/rookies/${input.playerId}`);
    return { message: "Metric saved with manual-entry provenance. Run the model to score it.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The metric could not be saved.", ok: false };
  }
}

export async function addRookieAlias(playerId: string, aliasInput: string) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const alias = aliasInput.trim();
    if (alias.length < 2) throw new Error("Alias must contain at least two characters.");
    const { error } = await supabase.from("rookie_player_aliases").insert({ alias, player_id: playerId, user_id: userId });
    if (error?.code === "23505") throw new Error("That alias is already assigned to a player.");
    if (error) throw error;
    revalidatePath(`/dashboard/dynasty/rookies/${playerId}`);
    return { message: `${alias} added as a matching alias.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The alias could not be saved.", ok: false };
  }
}

export async function deleteRookieAlias(playerId: string, aliasId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const { error } = await supabase.from("rookie_player_aliases").delete().eq("id", aliasId).eq("player_id", playerId).eq("user_id", userId);
    if (error) throw error;
    revalidatePath(`/dashboard/dynasty/rookies/${playerId}`);
    return { message: "Alias removed.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The alias could not be removed.", ok: false };
  }
}

export type RookieSourceInput = {
  accessedAt: string;
  author: string | null;
  label: string;
  license: string | null;
  methodologyClass: "documented" | "partial" | "inference" | "opinion";
  publication: string | null;
  publishedOn: string | null;
  reliability: "high" | "medium" | "low";
  summary: string | null;
  url: string | null;
};

export async function createRookieSource(input: RookieSourceInput) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const label = input.label.trim();
    if (!label) throw new Error("Source label is required.");
    if (input.url) {
      try { new URL(input.url); } catch { throw new Error("Enter a valid source URL."); }
    }
    const { error } = await supabase.from("rookie_sources").insert({
      accessed_at: input.accessedAt ? new Date(input.accessedAt).toISOString() : new Date().toISOString(),
      author: input.author?.trim() || null,
      label,
      license: input.license?.trim() || null,
      methodology_class: input.methodologyClass,
      publication: input.publication?.trim() || null,
      published_on: input.publishedOn || null,
      reliability: input.reliability,
      summary: input.summary?.trim() || null,
      url: input.url?.trim() || null,
      user_id: userId,
    });
    if (error) throw error;
    revalidatePath("/dashboard/dynasty/rookies/sources");
    return { message: `${label} added to the source library.`, ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The source could not be created.", ok: false };
  }
}

export async function resolveRookieDuplicate(importRowId: string, playerId: string | null) {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    const { data: row, error: rowError } = await supabase
      .from("rookie_import_rows")
      .select("id,batch_id,resolution_status,duplicate_candidates")
      .eq("id", importRowId)
      .eq("user_id", userId)
      .single();
    if (rowError || !row) throw rowError ?? new Error("Import row not found.");
    if (row.resolution_status !== "pending") throw new Error("This row has already been resolved.");
    if (playerId) {
      const candidates = row.duplicate_candidates as Array<{ id: string }>;
      if (!candidates.some((candidate) => candidate.id === playerId)) throw new Error("Choose one of the reviewed candidates.");
      const { data: player } = await supabase.from("rookie_players").select("id").eq("id", playerId).eq("user_id", userId).maybeSingle();
      if (!player) throw new Error("Candidate player not found.");
    }
    const { error } = await supabase.from("rookie_import_rows").update({
      matched_player_id: playerId,
      resolution_status: playerId ? "matched" : "create",
    }).eq("id", importRowId).eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/dashboard/dynasty/rookies/imports");
    revalidatePath("/dashboard/dynasty/rookies");
    return { batchId: row.batch_id, message: playerId ? "Import row matched to the existing player." : "Import row approved as a new player.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The duplicate could not be resolved.", ok: false };
  }
}
