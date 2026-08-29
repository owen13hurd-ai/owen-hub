import { parse } from "csv-parse/sync";

import type { RookieEnginePosition } from "@/types/rookie-engine";

export type GoogleSheetRookieIdentity = {
  classYear: number;
  name: string;
  position: RookieEnginePosition;
  sheetScore: number | null;
  sourceRow: number;
  tier: string;
};

function tierLabel(value: string) {
  return value.match(/Tier\s+\d+/i)?.[0] ?? "Uncategorized";
}

function playerValue(value: string) {
  const match = value.trim().match(/^(.*?)\s*\((\d+(?:\.\d+)?)\)\s*$/);
  return { name: (match?.[1] ?? value).trim(), sheetScore: match ? Number(match[2]) : null };
}

export function parseGoogleSheetRookieIdentities(csv: string, classYear: number) {
  const rows = parse(csv, { relax_column_count: true, skip_empty_lines: true }) as string[][];
  const identities: GoogleSheetRookieIdentity[] = [];
  let currentTier = "Uncategorized";
  rows.slice(1).forEach((row, index) => {
    if (row[1]?.trim()) currentTier = tierLabel(row[1]);
    ([{ column: 2, position: "QB" }, { column: 3, position: "RB" }, { column: 4, position: "WR" }, { column: 5, position: "TE" }] as const).forEach(({ column, position }) => {
      const raw = row[column]?.trim();
      if (!raw) return;
      const parsed = playerValue(raw);
      if (!parsed.name) return;
      identities.push({ classYear, name: parsed.name, position, sheetScore: parsed.sheetScore, sourceRow: index + 2, tier: currentTier });
    });
  });
  return identities;
}
