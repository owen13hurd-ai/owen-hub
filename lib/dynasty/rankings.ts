import fs from "node:fs";
import path from "node:path";

import type { DynastyRanking, DynastyTier } from "@/types/dynasty";

const rankingsPath = path.join(process.cwd(), "data", "dynasty-rankings.csv");

function parseNumber(value: string): number | null {
  const cleaned = value.replace("+", "").trim();
  if (!cleaned) {
    return null;
  }

  const number = Number(cleaned);
  return Number.isNaN(number) ? null : number;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
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

export function getDynastyRankings(): DynastyRanking[] {
  const csv = fs.readFileSync(rankingsPath, "utf8");
  const lines = csv.split(/\r?\n/).filter(Boolean);

  return lines.slice(1).map((line, index) => {
    const columns = parseCsvLine(line);
    const player = columns[5] ?? "";
    const overallRank = parseNumber(columns[8] ?? "") ?? index + 1;

    return {
      id: `${overallRank}-${player.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      rookiePick: columns[0] ?? "",
      importedTier: columns[2] ?? "",
      position: (columns[3] || "QB") as DynastyRanking["position"],
      positionRank: columns[4] ?? "",
      player,
      age: parseNumber(columns[6] ?? ""),
      team: columns[7] ?? "",
      overallRank,
      ktcRank: parseNumber(columns[10] ?? ""),
      ktcDelta: parseNumber(columns[11] ?? ""),
      marketPosition: columns[12] ?? "",
      marketPositionRank: parseNumber(columns[13] ?? ""),
      buySellHold: columns[14] || "Hold",
      relativeBaseValue: parseNumber(columns[16] ?? ""),
      fantasyCalcRank: null,
      fantasyCalcValue: null,
      fantasyCalcTrend30Day: null,
    };
  });
}

export function getDynastyTiers(rankings: DynastyRanking[]): DynastyTier[] {
  const tiers = new Map<string, DynastyTier>();

  function addTier(scope: DynastyTier["scope"], ranking: DynastyRanking) {
    const key = `${scope}-${ranking.importedTier}`;
    const existingTier = tiers.get(key);

    if (existingTier) {
      existingTier.playerCount += 1;
      return;
    }

    tiers.set(key, {
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      scope,
      label: `Tier ${tiers.size + 1}`,
      pickValueLabel: ranking.importedTier,
      playerCount: 1,
      pickValue: ranking.relativeBaseValue,
    });
  }

  rankings.forEach((ranking) => {
    addTier("ALL", ranking);
    addTier(ranking.position, ranking);
  });

  const scopeCounts = new Map<DynastyTier["scope"], number>();

  return Array.from(tiers.values()).map((tier) => {
    const nextCount = (scopeCounts.get(tier.scope) ?? 0) + 1;
    scopeCounts.set(tier.scope, nextCount);

    return {
      ...tier,
      id: `${tier.scope.toLowerCase()}-tier-${nextCount}`,
      label: `Tier ${nextCount}`,
    };
  });
}
