import { parse } from "csv-parse/sync";

import type { RookieEnginePosition, RookieImportPreview, RookieMetricInput } from "@/types/rookie-engine";

const metricColumns = [
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

export function previewRookieCsv(csv: string): RookieImportPreview {
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
    const position: RookieEnginePosition | null = rawPosition === "RB" || rawPosition === "WR" ? rawPosition : null;
    const classYear = numberOrNull(record.class_year ?? record.draft_year);
    const ageAtDraft = numberOrNull(record.age_at_draft);
    const earlyDeclare = booleanOrNull(record.early_declare);

    if (!name) errors.push("Name is required.");
    if (!position) errors.push("Position must be RB or WR.");
    if (classYear !== 2025 && classYear !== 2026) errors.push("Class year must be 2025 or 2026 for the MVP.");

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
      classYear: classYear ?? 0,
      earlyDeclare,
      errors,
      externalId: record.external_id?.trim() || null,
      metrics,
      name,
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

export const rookieCsvTemplateHeaders = [
  "name",
  "position",
  "class_year",
  "school",
  "external_id",
  ...metricColumns,
];
