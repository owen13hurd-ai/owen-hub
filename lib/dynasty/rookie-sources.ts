import type { RookiePosition, RookieProspect } from "@/types/rookies";

const rankingSheets = [
  {
    classYear: "2025",
    id: "1f5u4SGrlrop1H0hrFZMYoIoxAfP4zVeFDI9ZmYKs5IM",
    label: "2025 rookie rankings sheet",
  },
  {
    classYear: "2026",
    id: "1ZnhkpoJspVQ8RDowAiXnWKL4_bBpcyki-JHkZhe5xVQ",
    label: "2026 rookie rankings sheet",
  },
] as const;
const statsSheetId = "167k1l6dMPJOw1V0eQh-R1WHqtmEhqoeyS4DmePmhiYY";

const statsSheetUrl = `https://docs.google.com/spreadsheets/d/${statsSheetId}/gviz/tq?tqx=out:csv`;

type RankingSheetResult = {
  detail: string;
  label: string;
  prospects: RookieProspect[];
  status: "live" | "fallback" | "error";
};

export type RookieSourceSummary = {
  detail: string;
  label: string;
  status: "live" | "fallback" | "error";
};

const positionColumns: { columnIndex: number; position: RookiePosition }[] = [
  { columnIndex: 2, position: "QB" },
  { columnIndex: 3, position: "RB" },
  { columnIndex: 4, position: "WR" },
  { columnIndex: 5, position: "TE" },
];

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === "\"" && nextCharacter === "\"") {
      current += "\"";
      index += 1;
    } else if (character === "\"") {
      isInsideQuotes = !isInsideQuotes;
    } else if (character === "," && !isInsideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(csv: string) {
  return csv.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
}

function getTierScore(tier: string) {
  if (tier.includes("90")) {
    return 9.2;
  }

  if (tier.includes("80")) {
    return 8.4;
  }

  if (tier.includes("70")) {
    return 7.4;
  }

  if (tier.includes("60")) {
    return 6.4;
  }

  if (tier.includes("50")) {
    return 5.4;
  }

  return 4.5;
}

function getTierLabel(tier: string) {
  const match = tier.match(/Tier\s+\d+/i);

  return match?.[0] ?? "Tier 6";
}

function toProspectId(name: string, position: RookiePosition, classYear: string) {
  return `${classYear}-${position}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getProjectedPick(rank: number) {
  return `${Math.ceil(rank / 12)}.${String(((rank - 1) % 12) + 1).padStart(
    2,
    "0",
  )}`;
}

async function fetchCsv(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    throw new Error(`Google Sheet returned ${response.status}`);
  }

  return response.text();
}

function parseProspectName(value: string) {
  const match = value.match(/^(.*?)\s*\((\d+(?:\.\d+)?)\)\s*$/);

  if (!match) {
    return {
      name: value.trim(),
      score: null,
    };
  }

  return {
    name: match[1].trim(),
    score: Number(match[2]) / 10,
  };
}

function parseRankingProspects(csv: string, classYear: string): RookieProspect[] {
  const rows = parseCsv(csv);
  const prospects: RookieProspect[] = [];
  let currentTier = "Tier 6 (<50)";

  rows.slice(1).forEach((row) => {
    if (row[1]) {
      currentTier = row[1];
    }

    positionColumns.forEach(({ columnIndex, position }) => {
      const rawName = row[columnIndex]?.trim();

      if (!rawName) {
        return;
      }

      const { name, score: sheetScore } = parseProspectName(rawName);
      const score = sheetScore ?? getTierScore(currentTier);
      const rank = prospects.length + 1;

      prospects.push({
        ageScore: score,
        athleticScore: score,
        classYear,
        draftCapitalScore: score,
        id: toProspectId(name, position, classYear),
        landingSpotScore: 5,
        name,
        notes: sheetScore
          ? `Imported from ${currentTier} with sheet score ${Math.round(sheetScore * 10)}`
          : `Imported from ${currentTier}`,
        position,
        productionScore: score,
        projectedPick: getProjectedPick(rank),
        riskScore: Number((10 - score).toFixed(1)),
        school: "",
        tier: getTierLabel(currentTier),
      });
    });
  });

  return prospects;
}

async function getStatsSourceSummary(): Promise<RookieSourceSummary> {
  try {
    const csv = await fetchCsv(statsSheetUrl);
    const rows = parseCsv(csv);
    const playerCount = Math.max(rows.length - 1, 0);

    return {
      detail: `${playerCount} stat rows available for future model inputs`,
      label: "CFB stats sheet",
      status: "live",
    };
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message : "Could not load stats sheet",
      label: "CFB stats sheet",
      status: "error",
    };
  }
}

async function getRankingSheetResult(
  sheet: (typeof rankingSheets)[number],
): Promise<RankingSheetResult> {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}/gviz/tq?tqx=out:csv`;

  try {
    const csv = await fetchCsv(sheetUrl);
    const prospects = parseRankingProspects(csv, sheet.classYear);

    if (prospects.length === 0) {
      return {
        detail: "No rookies found",
        label: sheet.label,
        prospects: [],
        status: "fallback",
      };
    }

    return {
      detail: `${prospects.length} rookies imported`,
      label: sheet.label,
      prospects,
      status: "live",
    };
  } catch (error) {
    return {
      detail:
        error instanceof Error
          ? error.message
          : "Could not load rookie ranking sheet",
      label: sheet.label,
      prospects: [],
      status: "error",
    };
  }
}

export async function getImportedRookieProspects(
  fallbackProspects: RookieProspect[],
): Promise<{
  prospects: RookieProspect[];
  sources: RookieSourceSummary[];
}> {
  const rankingResults = await Promise.all(
    rankingSheets.map((sheet) => getRankingSheetResult(sheet)),
  );
  const importedProspects = rankingResults.flatMap((result) => result.prospects);
  const statsSummary = await getStatsSourceSummary();

  return {
    prospects: importedProspects.length > 0 ? importedProspects : fallbackProspects,
    sources: [
      ...rankingResults.map((result) => ({
        detail: result.detail,
        label: result.label,
        status: result.status,
      })),
      statsSummary,
    ],
  };
}
