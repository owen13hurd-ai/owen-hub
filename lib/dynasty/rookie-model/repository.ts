import { rbModelConfiguration, wrModelConfiguration } from "@/lib/dynasty/rookie-model/config";
import { calculateRookieScore } from "@/lib/dynasty/rookie-model/scoring";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { RookieMetricReference, RookieModelConfiguration } from "@/types/rookie-engine";

export type RookieEngineRanking = {
  classYear: number;
  coverage: number | null;
  draftCapitalScore: number | null;
  id: string;
  manualRank: number | null;
  manualTier: string | null;
  marketScore: number | null;
  name: string;
  normalization: string | null;
  overallRank: number | null;
  overallScore: number | null;
  position: "RB" | "WR";
  positionRank: number | null;
  prospectScore: number | null;
  school: string | null;
  situationScore: number | null;
  tier: string | null;
};

export type RookieModelVersionSummary = {
  configuration: RookieModelConfiguration;
  createdAt: string;
  id: string;
  label: string;
  position: "RB" | "WR";
  publishedAt: string | null;
  semanticVersion: string;
  status: "draft" | "published" | "retired";
};

export type RookiePlayerDetail = RookieEngineRanking & {
  aliases: Array<{ alias: string; id: string }>;
  bio: {
    ageAtDraft: number | null;
    birthdate: string | null;
    confidence: "high" | "medium" | "low";
    conference: string | null;
    draftRound: number | null;
    earlyDeclare: boolean | null;
    heightInches: number | null;
    nflTeam: string | null;
    overallPick: number | null;
    weightPounds: number | null;
  };
  components: Array<{
    contribution: number | null;
    explanation: string;
    familyKey: string;
    key: string;
    label: string;
    missing: boolean;
    normalizedValue: number | null;
    rawValue: number | null;
    sourceLabel: string | null;
    sourceUrl: string | null;
    weight: number;
  }>;
  modelLabel: string | null;
  modelVersion: string | null;
  metricInputs: Array<{
    asOfDate: string;
    confidence: "high" | "medium" | "low";
    key: string;
    label: string;
    sourceLabel: string | null;
    value: number;
  }>;
  athleticTests: Array<{ eventDate: string | null; eventType: string; fortySeconds: number | null; ras: number | null; sourceLabel: string | null; speedScore: number | null }>;
  contextSnapshots: Array<{ nflTeam: string | null; observedAt: string; sourceLabel: string | null; situationScore: number | null }>;
  marketSnapshots: Array<{ dynastyAdp: number | null; marketValue: number | null; observedAt: string; provider: string; rookieAdp: number | null; sourceLabel: string | null }>;
  seasons: Array<{ games: number | null; playerSeason: number; receivingYards: number | null; receptions: number | null; rushingYards: number | null; sourceLabel: string | null; targetShare: number | null }>;
  notes: Array<{ body: string; createdAt: string; id: string }>;
  scoreHistory: Array<{
    asOfDate: string;
    coverage: number;
    createdAt: string;
    modelVersion: string;
    overallScore: number | null;
    prospectScore: number | null;
    tier: string | null;
  }>;
};

export type RookieSourceSummary = {
  accessedAt: string;
  author: string | null;
  id: string;
  label: string;
  license: string | null;
  methodologyClass: "documented" | "partial" | "inference" | "opinion";
  publication: string | null;
  publishedOn: string | null;
  reliability: "high" | "medium" | "low";
  summary: string | null;
  url: string | null;
};

export type RookiePendingDuplicate = {
  batchId: string;
  candidates: Array<{ id: string; name: string; school: string | null; similarity: number }>;
  filename: string;
  id: string;
  importedName: string;
  position: "RB" | "WR";
  sourceRow: number;
};

export type RookieImportBatchSummary = {
  committedAt: string | null;
  createdAt: string;
  filename: string;
  id: string;
  invalidRows: number;
  rowCount: number;
  status: "previewed" | "committed" | "failed";
  validRows: number;
};

type StoredRookieScore = {
  created_at: string;
  data_coverage: number;
  draft_capital_score: number | null;
  market_score: number | null;
  normalization: string;
  overall_rank: number | null;
  overall_score: number | null;
  player_id: string;
  position_rank: number | null;
  prospect_score: number | null;
  situation_score: number | null;
  tier: string | null;
};

async function getUserContext() {
  if (!hasSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { supabase, userId: data.user.id };
}

export async function getRookieEngineRankings(): Promise<RookieEngineRanking[]> {
  const context = await getUserContext();
  if (!context) return [];
  const { supabase, userId } = context;
  const { data: players } = await supabase
    .from("rookie_players")
    .select("id,name,position,class_year,school")
    .eq("user_id", userId)
    .in("class_year", [2025, 2026])
    .in("position", ["RB", "WR"]);
  if (!players?.length) return [];

  const playerIds = players.map((player) => player.id);
  const [{ data: scores }, { data: manualRankings }] = await Promise.all([
    supabase
      .from("rookie_score_runs")
      .select("player_id,prospect_score,draft_capital_score,situation_score,market_score,overall_score,data_coverage,position_rank,overall_rank,tier,normalization,created_at")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("rookie_manual_rankings")
      .select("player_id,manual_rank,manual_tier")
      .eq("user_id", userId)
      .eq("format", "12-team-superflex")
      .in("player_id", playerIds),
  ]);

  const latestScore = new Map<string, StoredRookieScore>();
  scores?.forEach((score) => {
    if (!latestScore.has(score.player_id)) latestScore.set(score.player_id, score as StoredRookieScore);
  });
  const manualByPlayer = new Map(manualRankings?.map((ranking) => [ranking.player_id, ranking]) ?? []);

  return players
    .map((player) => {
      const score = latestScore.get(player.id);
      const manual = manualByPlayer.get(player.id);
      return {
        classYear: player.class_year,
        coverage: score?.data_coverage ?? null,
        draftCapitalScore: score?.draft_capital_score ?? null,
        id: player.id,
        manualRank: manual?.manual_rank ?? null,
        manualTier: manual?.manual_tier ?? null,
        marketScore: score?.market_score ?? null,
        name: player.name,
        normalization: score?.normalization ?? null,
        overallRank: score?.overall_rank ?? null,
        overallScore: score?.overall_score ?? null,
        position: player.position,
        positionRank: score?.position_rank ?? null,
        prospectScore: score?.prospect_score ?? null,
        school: player.school,
        situationScore: score?.situation_score ?? null,
        tier: score?.tier ?? null,
      } satisfies RookieEngineRanking;
    })
    .sort((first, second) => (first.manualRank ?? first.overallRank ?? first.positionRank ?? 9999) - (second.manualRank ?? second.overallRank ?? second.positionRank ?? 9999));
}

export async function getRookieModelVersions(): Promise<RookieModelVersionSummary[]> {
  const context = await getUserContext();
  if (!context) return [];
  const { data, error } = await context.supabase
    .from("rookie_model_versions")
    .select("id,position,label,semantic_version,status,configuration,published_at,created_at")
    .eq("user_id", context.userId)
    .in("position", ["RB", "WR"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((version) => ({
    configuration: version.configuration as RookieModelConfiguration,
    createdAt: version.created_at,
    id: version.id,
    label: version.label,
    position: version.position,
    publishedAt: version.published_at,
    semanticVersion: version.semantic_version,
    status: version.status,
  }));
}

export async function getRookieImportBatches(): Promise<RookieImportBatchSummary[]> {
  const context = await getUserContext();
  if (!context) return [];
  const { data, error } = await context.supabase
    .from("rookie_import_batches")
    .select("id,filename,status,row_count,valid_row_count,invalid_row_count,committed_at,created_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((batch) => ({
    committedAt: batch.committed_at,
    createdAt: batch.created_at,
    filename: batch.filename,
    id: batch.id,
    invalidRows: batch.invalid_row_count,
    rowCount: batch.row_count,
    status: batch.status,
    validRows: batch.valid_row_count,
  }));
}

export async function getRookieSources(): Promise<RookieSourceSummary[]> {
  const context = await getUserContext();
  if (!context) return [];
  const { data, error } = await context.supabase
    .from("rookie_sources")
    .select("id,label,url,author,publication,published_on,accessed_at,license,reliability,methodology_class,summary")
    .eq("user_id", context.userId)
    .order("label");
  if (error) throw error;
  return (data ?? []).map((source) => ({
    accessedAt: source.accessed_at,
    author: source.author,
    id: source.id,
    label: source.label,
    license: source.license,
    methodologyClass: source.methodology_class,
    publication: source.publication,
    publishedOn: source.published_on,
    reliability: source.reliability,
    summary: source.summary,
    url: source.url,
  }));
}

export async function getRookiePendingDuplicates(): Promise<RookiePendingDuplicate[]> {
  const context = await getUserContext();
  if (!context) return [];
  const { data, error } = await context.supabase
    .from("rookie_import_rows")
    .select("id,batch_id,source_row,normalized_data,duplicate_candidates,rookie_import_batches(filename)")
    .eq("user_id", context.userId)
    .eq("resolution_status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const normalized = row.normalized_data as { name: string; position: "RB" | "WR" };
    const batch = Array.isArray(row.rookie_import_batches) ? row.rookie_import_batches[0] : row.rookie_import_batches;
    return {
      batchId: row.batch_id,
      candidates: row.duplicate_candidates as RookiePendingDuplicate["candidates"],
      filename: batch?.filename ?? "Unknown CSV",
      id: row.id,
      importedName: normalized.name,
      position: normalized.position,
      sourceRow: row.source_row,
    };
  });
}

export async function getRookiePlayerDetail(playerId: string): Promise<RookiePlayerDetail | null> {
  const rankings = await getRookieEngineRankings();
  const ranking = rankings.find((candidate) => candidate.id === playerId);
  const context = await getUserContext();
  if (!ranking || !context) return null;
  const { supabase, userId } = context;
  const { data: playerRecord } = await supabase
    .from("rookie_players")
    .select("birthdate,conference,age_at_draft,height_inches,weight_pounds,early_declare,nfl_team,draft_round,overall_pick,confidence")
    .eq("id", playerId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!playerRecord) return null;
  const { data: score } = await supabase
    .from("rookie_score_runs")
    .select("id,model_version_id,created_at")
    .eq("player_id", playerId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const [{ data: components }, { data: notes }, { data: model }, { data: history }, { data: metricInputs }, { data: aliases }, { data: seasons }, { data: athleticTests }, { data: contextSnapshots }, { data: marketSnapshots }] = await Promise.all([
    score
      ? supabase.from("rookie_score_components").select("metric_key,metric_label,family_key,raw_value,normalized_value,effective_weight,contribution,missing,explanation,rookie_sources(label,url)").eq("score_run_id", score.id)
      : Promise.resolve({ data: [] }),
    supabase.from("rookie_notes").select("id,body,created_at").eq("player_id", playerId).eq("user_id", userId).order("created_at", { ascending: false }),
    score
      ? supabase.from("rookie_model_versions").select("label,semantic_version").eq("id", score.model_version_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("rookie_score_runs")
      .select("as_of_date,created_at,prospect_score,overall_score,data_coverage,tier,rookie_model_versions(semantic_version)")
      .eq("player_id", playerId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("rookie_player_metrics")
      .select("metric_key,value,as_of_date,confidence,created_at,rookie_sources(label)")
      .eq("player_id", playerId)
      .eq("user_id", userId)
      .order("as_of_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("rookie_player_aliases")
      .select("id,alias")
      .eq("player_id", playerId)
      .eq("user_id", userId)
      .order("alias"),
    supabase.from("rookie_seasons").select("season,games,receptions,rushing_yards,receiving_yards,target_share,rookie_sources(label)").eq("player_id", playerId).eq("user_id", userId).order("season", { ascending: false }),
    supabase.from("rookie_athletic_tests").select("event_type,event_date,forty_seconds,speed_score,ras,rookie_sources(label)").eq("player_id", playerId).eq("user_id", userId).order("event_date", { ascending: false }),
    supabase.from("rookie_context_snapshots").select("observed_at,nfl_team,landing_spot_score,coaching_score,quarterback_score,offensive_line_score,depth_chart_score,rookie_sources(label)").eq("player_id", playerId).eq("user_id", userId).order("observed_at", { ascending: false }).limit(10),
    supabase.from("rookie_market_snapshots").select("observed_at,provider,rookie_adp,dynasty_adp,market_value,rookie_sources(label)").eq("player_id", playerId).eq("user_id", userId).order("observed_at", { ascending: false }).limit(10),
  ]);
  const metricLabels = new Map(
    [rbModelConfiguration, wrModelConfiguration].flatMap((configuration) =>
      configuration.prospectFamilies.flatMap((family) => family.metrics.map((metric) => [metric.key, metric.label] as const)),
    ),
  );
  const latestMetricInputs = new Map<string, RookiePlayerDetail["metricInputs"][number]>();
  metricInputs?.forEach((metric) => {
    if (latestMetricInputs.has(metric.metric_key) || metric.value === null) return;
    const source = Array.isArray(metric.rookie_sources) ? metric.rookie_sources[0] : metric.rookie_sources;
    latestMetricInputs.set(metric.metric_key, {
      asOfDate: metric.as_of_date,
      confidence: metric.confidence,
      key: metric.metric_key,
      label: metricLabels.get(metric.metric_key) ?? metric.metric_key.replaceAll("_", " "),
      sourceLabel: source?.label ?? null,
      value: metric.value,
    });
  });
  const sourceLabel = (relation: { label: string } | Array<{ label: string }> | null) =>
    (Array.isArray(relation) ? relation[0]?.label : relation?.label) ?? null;

  return {
    ...ranking,
    aliases: aliases ?? [],
    athleticTests: (athleticTests ?? []).map((test) => ({ eventDate: test.event_date, eventType: test.event_type, fortySeconds: test.forty_seconds, ras: test.ras, sourceLabel: sourceLabel(test.rookie_sources), speedScore: test.speed_score })),
    bio: {
      ageAtDraft: playerRecord.age_at_draft,
      birthdate: playerRecord.birthdate,
      confidence: playerRecord.confidence,
      conference: playerRecord.conference,
      draftRound: playerRecord.draft_round,
      earlyDeclare: playerRecord.early_declare,
      heightInches: playerRecord.height_inches,
      nflTeam: playerRecord.nfl_team,
      overallPick: playerRecord.overall_pick,
      weightPounds: playerRecord.weight_pounds,
    },
    components: (components ?? []).map((component) => {
      const source = Array.isArray(component.rookie_sources) ? component.rookie_sources[0] : component.rookie_sources;
      return {
        contribution: component.contribution,
        explanation: component.explanation,
        familyKey: component.family_key,
        key: component.metric_key,
        label: component.metric_label,
        missing: component.missing,
        normalizedValue: component.normalized_value,
        rawValue: component.raw_value,
        sourceLabel: source?.label ?? null,
        sourceUrl: source?.url ?? null,
        weight: component.effective_weight,
      };
    }),
    contextSnapshots: (contextSnapshots ?? []).map((snapshot) => {
      const values = [snapshot.landing_spot_score, snapshot.coaching_score, snapshot.quarterback_score, snapshot.offensive_line_score, snapshot.depth_chart_score].filter((value): value is number => value !== null);
      return { nflTeam: snapshot.nfl_team, observedAt: snapshot.observed_at, sourceLabel: sourceLabel(snapshot.rookie_sources), situationScore: values.length ? values.reduce((total, value) => total + value, 0) / values.length : null };
    }),
    modelLabel: model?.label ?? null,
    modelVersion: model?.semantic_version ?? null,
    metricInputs: [...latestMetricInputs.values()].sort((first, second) => first.label.localeCompare(second.label)),
    marketSnapshots: (marketSnapshots ?? []).map((snapshot) => ({ dynastyAdp: snapshot.dynasty_adp, marketValue: snapshot.market_value, observedAt: snapshot.observed_at, provider: snapshot.provider, rookieAdp: snapshot.rookie_adp, sourceLabel: sourceLabel(snapshot.rookie_sources) })),
    notes: (notes ?? []).map((note) => ({ body: note.body, createdAt: note.created_at, id: note.id })),
    scoreHistory: (history ?? []).map((entry) => {
      const historyModel = Array.isArray(entry.rookie_model_versions)
        ? entry.rookie_model_versions[0]
        : entry.rookie_model_versions;
      return {
        asOfDate: entry.as_of_date,
        coverage: entry.data_coverage,
        createdAt: entry.created_at,
        modelVersion: historyModel?.semantic_version ?? "Unknown",
        overallScore: entry.overall_score,
        prospectScore: entry.prospect_score,
        tier: entry.tier,
      };
    }),
    seasons: (seasons ?? []).map((season) => ({ games: season.games, playerSeason: season.season, receivingYards: season.receiving_yards, receptions: season.receptions, rushingYards: season.rushing_yards, sourceLabel: sourceLabel(season.rookie_sources), targetShare: season.target_share })),
  };
}

export async function scoreAndPersistRookieClass(userId: string) {
  const supabase = await createClient();
  const { data: players, error: playerError } = await supabase
    .from("rookie_players")
    .select("id,position,class_year,overall_pick")
    .eq("user_id", userId)
    .in("class_year", [2025, 2026])
    .in("position", ["RB", "WR"]);
  if (playerError) throw playerError;
  if (!players?.length) return 0;

  const playerIds = players.map((player) => player.id);
  const { data: metrics, error: metricError } = await supabase
    .from("rookie_player_metrics")
    .select("player_id,metric_key,value,source_id,as_of_date,created_at")
    .in("player_id", playerIds)
    .order("as_of_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (metricError) throw metricError;
  const [{ data: contexts, error: contextError }, { data: markets, error: marketError }] = await Promise.all([
    supabase.from("rookie_context_snapshots").select("player_id,observed_at,landing_spot_score,coaching_score,quarterback_score,offensive_line_score,depth_chart_score").in("player_id", playerIds).order("observed_at", { ascending: false }),
    supabase.from("rookie_market_snapshots").select("player_id,observed_at,market_value").in("player_id", playerIds).order("observed_at", { ascending: false }),
  ]);
  if (contextError) throw contextError;
  if (marketError) throw marketError;
  const latestSituation = new Map<string, number | null>();
  contexts?.forEach((context) => {
    if (latestSituation.has(context.player_id)) return;
    const values = [context.landing_spot_score, context.coaching_score, context.quarterback_score, context.offensive_line_score, context.depth_chart_score].filter((value): value is number => value !== null);
    latestSituation.set(context.player_id, values.length ? values.reduce((total, value) => total + value, 0) / values.length : null);
  });
  const latestMarket = new Map<string, number | null>();
  markets?.forEach((market) => {
    if (!latestMarket.has(market.player_id)) latestMarket.set(market.player_id, market.market_value);
  });

  const defaultConfigurations = [rbModelConfiguration, wrModelConfiguration];
  const configurations: RookieModelConfiguration[] = [];
  const modelIds = new Map<string, string>();
  for (const defaultConfiguration of defaultConfigurations) {
    const { data: latestPublished, error: publishedError } = await supabase
      .from("rookie_model_versions")
      .select("id,configuration")
      .eq("user_id", userId)
      .eq("position", defaultConfiguration.position)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (publishedError) throw publishedError;
    if (latestPublished) {
      const configuration = latestPublished.configuration as RookieModelConfiguration;
      configurations.push(configuration);
      modelIds.set(configuration.position, latestPublished.id);
      continue;
    }
    const configuration = defaultConfiguration;
    const { data: created, error } = await supabase
      .from("rookie_model_versions")
      .insert({
        configuration,
        label: configuration.label,
        position: configuration.position,
        published_at: new Date().toISOString(),
        reference_cohort: { classes: [2025, 2026], label: "MVP class-relative" },
        semantic_version: configuration.version,
        status: "published",
        user_id: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    configurations.push(configuration);
    modelIds.set(configuration.position, created.id);
  }

  const inputsByPlayer = new Map<string, Array<{ key: string; sourceId: string | null; value: number | null }>>();
  metrics?.forEach((metric) => {
    const current = inputsByPlayer.get(metric.player_id) ?? [];
    if (current.some((entry) => entry.key === metric.metric_key)) return;
    current.push({ key: metric.metric_key, sourceId: metric.source_id, value: metric.value });
    inputsByPlayer.set(metric.player_id, current);
  });

  for (const position of ["RB", "WR"] as const) {
    const configuration = configurations.find((candidate) => candidate.position === position);
    if (!configuration) throw new Error(`No published ${position} model is available.`);
    const positionPlayers = players.filter((player) => player.position === position);
    const metricKeys = configuration.prospectFamilies.flatMap((family) => family.metrics.map((metric) => metric.key));
    const references: RookieMetricReference[] = metricKeys.map((key) => ({
      key,
      values: positionPlayers.flatMap((player) => {
        const value = inputsByPlayer.get(player.id)?.find((metric) => metric.key === key)?.value;
        return value === null || value === undefined ? [] : [value];
      }),
    }));
    const scored = positionPlayers.map((player) => {
      const overallPick = player.overall_pick;
      const draftCapital = overallPick ? Math.max(0, Math.min(100, 101 - ((overallPick - 1) / 256) * 100)) : null;
      return {
        player,
        result: calculateRookieScore(configuration, inputsByPlayer.get(player.id) ?? [], references, {
          draftCapital,
          market: latestMarket.get(player.id) ?? null,
          situation: latestSituation.get(player.id) ?? null,
        }),
      };
    });
    const ranked = [...scored].sort((first, second) => (second.result.overallScore ?? -1) - (first.result.overallScore ?? -1));

    for (const entry of scored) {
      const positionRank = ranked.findIndex((candidate) => candidate.player.id === entry.player.id) + 1;
      const { data: run, error: runError } = await supabase
        .from("rookie_score_runs")
        .insert({
          as_of_date: new Date().toISOString().slice(0, 10),
          data_coverage: entry.result.coverage,
          draft_capital_score: entry.result.draftCapitalScore,
          market_score: entry.result.marketScore,
          model_version_id: modelIds.get(position),
          normalization: entry.result.normalization,
          overall_score: entry.result.overallScore,
          player_id: entry.player.id,
          position_rank: positionRank,
          prospect_score: entry.result.prospectScore,
          situation_score: entry.result.situationScore,
          tier: entry.result.tier,
          user_id: userId,
        })
        .select("id")
        .single();
      if (runError) throw runError;

      const { error: componentError } = await supabase.from("rookie_score_components").insert(
        entry.result.components.map((component) => ({
          contribution: component.contribution,
          effective_weight: component.weight,
          explanation: component.explanation,
          family_key: component.familyKey,
          metric_key: component.key,
          metric_label: component.label,
          missing: component.missing,
          normalized_value: component.normalizedValue,
          raw_value: component.rawValue,
          score_run_id: run.id,
          source_id: component.sourceId,
          user_id: userId,
        })),
      );
      if (componentError) throw componentError;
    }
  }
  return players.length;
}
