import { parse } from "csv-parse/sync";

import type { RookieEnginePosition, RookieImportPreview, RookieMetricInput } from "@/types/rookie-engine";

const importPositions: RookieEnginePosition[] = ["QB", "RB", "WR", "TE"];

const metricColumns = [
  "pass_play_usage",
  "best_pass_play_usage",
  "passing_ppa",
  "career_passing_ppa",
  "best_passing_ppa",
  "receiving_ppa",
  "career_receiving_ppa",
  "best_receiving_ppa",
  "rushing_ppa",
  "career_rushing_ppa",
  "best_rushing_ppa",
  "career_yprr",
  "best_yprr",
  "target_share",
  "receiving_yard_share",
  "age_at_draft",
  "early_declare",
  "ras",
  "bmi",
  "speed_score",
  "recruiting_rating",
  "conference_strength",
  "scrimmage_yards_per_game",
  "rushing_yard_share",
  "yards_after_contact_per_attempt",
  "missed_tackles_per_attempt",
  "receptions_per_game",
  "receiving_yprr",
] as const;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function numberOrNull(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanOrNull(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return null;
}

function previewCsv(csv: string, mode: "mvp" | "historical"): RookieImportPreview {
  const records = parse(csv, {
    bom: true,
    columns: (headers: string[]) => headers.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const rows = records.map((record, index) => {
    const errors: string[] = [];
    const name = record.name?.trim() ?? "";
    const rawPosition = record.position?.trim().toUpperCase();
    const position: RookieEnginePosition | null = importPositions.includes(rawPosition as RookieEnginePosition) ? rawPosition as RookieEnginePosition : null;
    const classYear = numberOrNull(record.class_year ?? record.draft_year);
    const ageAtDraft = numberOrNull(record.age_at_draft);
    const earlyDeclare = booleanOrNull(record.early_declare);
    const draftRound = numberOrNull(record.draft_round);
    const overallPick = numberOrNull(record.overall_pick);
    const scoringDate = record.scoring_date?.trim() || null;

    if (!name) errors.push("Name is required.");
    if (!position) errors.push("Position must be QB, RB, WR, or TE.");
    if (overallPick !== null && (overallPick < 1 || overallPick > 300)) errors.push("Overall pick must be between 1 and 300.");
    if (draftRound !== null && (draftRound < 1 || draftRound > 7)) errors.push("Draft round must be between 1 and 7.");
    if (mode === "mvp" && classYear !== 2025 && classYear !== 2026) errors.push("Class year must be 2025 or 2026 for the MVP.");
    if (mode === "historical" && (!classYear || classYear < 2010 || classYear > 2024)) errors.push("Historical class year must be between 2010 and 2024.");
    if (mode === "historical") {
      if (!scoringDate || !/^\d{4}-\d{2}-\d{2}$/.test(scoringDate)) errors.push("A YYYY-MM-DD scoring_date is required.");
      else if (classYear && scoringDate > `${classYear}-09-01`) errors.push("Scoring date must be on or before September 1 of the draft year.");
    }

    const metrics: RookieMetricInput[] = metricColumns.map((key) => ({
      key,
      value:
        key === "early_declare"
          ? earlyDeclare === null
            ? null
            : earlyDeclare
              ? 1
              : 0
          : numberOrNull(record[key]),
    }));

    return {
      ageAtDraft,
      asOfDate: scoringDate ?? (classYear ? `${classYear}-04-30` : null),
      classYear: classYear ?? 0,
      draftRound,
      earlyDeclare,
      errors,
      externalId: record.external_id?.trim() || null,
      metrics,
      name,
      nflTeam: record.nfl_team?.trim().toUpperCase() || null,
      overallPick,
      position,
      rawData: record,
      school: record.school?.trim() || null,
      sourceRow: index + 2,
    };
  });

  return {
    invalidRows: rows.filter((row) => row.errors.length > 0).length,
    rows,
    validRows: rows.filter((row) => row.errors.length === 0).length,
  };
}

export function previewRookieCsv(csv: string) {
  return previewCsv(csv, "mvp");
}

export function previewHistoricalRookieCsv(csv: string) {
  return previewCsv(csv, "historical");
}

export const rookieCsvTemplateHeaders = [
  "name",
  "position",
  "class_year",
  "school",
  "external_id",
  "scoring_date",
  "draft_round",
  "overall_pick",
  "nfl_team",
  ...metricColumns,
];
