import type { DynastyRanking, MarketSourceSummary } from "@/types/dynasty";
import { normalizePlayerName } from "@/lib/dynasty/sources/nameMatch";
import { getFantasyCalcValues } from "@/lib/dynasty/sources/fantasyCalc";
import { getKtcGoogleSheetValues } from "@/lib/dynasty/sources/googleSheet";
import { getSleeperRookies } from "@/lib/dynasty/sources/sleeperRookies";

export async function enrichRankingsWithMarketSources(
  rankings: DynastyRanking[],
) {
  const [fantasyCalc, ktc, sleeperRookies] = await Promise.all([
    getFantasyCalcValues(),
    getKtcGoogleSheetValues(),
    getSleeperRookies(),
  ]);

  const importedByName = new Map(
    rankings.map((ranking) => [normalizePlayerName(ranking.player), ranking]),
  );
  const tierTemplates = [...rankings].sort(
    (first, second) => first.overallRank - second.overallRank,
  );
  const validPositions = new Set(["QB", "RB", "WR", "TE"]);
  const fantasyCalcPlayers = Array.from(fantasyCalc.values.values())
    .filter(
      (player) =>
        validPositions.has(player.position) && player.rank !== null,
    )
    .sort((first, second) => (first.rank ?? Infinity) - (second.rank ?? Infinity));

  const marketRankings = fantasyCalcPlayers.map((fantasyCalcValue, index) => {
    const normalizedName = normalizePlayerName(fantasyCalcValue.name);
    const imported = importedByName.get(normalizedName);
    const tierTemplate = tierTemplates[Math.min(index, tierTemplates.length - 1)];
    const ktcValue = ktc.values.get(normalizedName);
    const position = fantasyCalcValue.position as DynastyRanking["position"];
    const overallRank = index + 1;

    return {
      id: imported?.id ?? `market-${normalizedName.replace(/\s+/g, "-")}`,
      rookiePick: imported?.rookiePick ?? "",
      importedTier:
        tierTemplate?.importedTier ?? imported?.importedTier ?? "Unpriced",
      position,
      positionRank: `${position}${fantasyCalcValue.positionRank ?? "-"}`,
      player: fantasyCalcValue.name,
      age: fantasyCalcValue.age ?? ktcValue?.age ?? imported?.age ?? null,
      team: fantasyCalcValue.team || ktcValue?.team || imported?.team || "",
      overallRank,
      ktcRank: ktcValue?.rank ?? null,
      ktcDelta: ktcValue ? ktcValue.rank - overallRank : null,
      marketPosition: ktcValue?.position ?? position,
      marketPositionRank: ktcValue
        ? Number(ktcValue.positionRank.replace(/[^0-9]/g, "")) || null
        : null,
      buySellHold: "Hold",
      relativeBaseValue:
        tierTemplate?.relativeBaseValue ?? imported?.relativeBaseValue ?? null,
      fantasyCalcRank: overallRank,
      fantasyCalcValue: fantasyCalcValue.value,
      fantasyCalcTrend30Day: fantasyCalcValue.trend30Day,
      isRookie: fantasyCalcValue.yearsExperience === 0,
      yearsExperience: fantasyCalcValue.yearsExperience,
    } satisfies DynastyRanking;
  });

  const marketNames = new Set(marketRankings.map((ranking) => normalizePlayerName(ranking.player)));
  const missingRookies = Array.from(sleeperRookies.values.values())
    .filter((rookie) => !marketNames.has(normalizePlayerName(rookie.name)))
    .sort((first, second) => {
      const firstKtcRank = ktc.values.get(normalizePlayerName(first.name))?.rank ?? Infinity;
      const secondKtcRank = ktc.values.get(normalizePlayerName(second.name))?.rank ?? Infinity;
      return firstKtcRank - secondKtcRank || (first.searchRank ?? Infinity) - (second.searchRank ?? Infinity) || first.name.localeCompare(second.name);
    })
    .map((rookie, index) => {
      const normalizedName = normalizePlayerName(rookie.name);
      const ktcValue = ktc.values.get(normalizedName);
      const imported = importedByName.get(normalizedName);
      const overallRank = marketRankings.length + index + 1;

      return {
        age: rookie.age ?? ktcValue?.age ?? imported?.age ?? null,
        buySellHold: imported?.buySellHold ?? "Hold",
        fantasyCalcRank: null,
        fantasyCalcTrend30Day: null,
        fantasyCalcValue: null,
        id: imported?.id ?? `sleeper-${rookie.id}`,
        importedTier: imported?.importedTier || "Unranked rookies",
        isRookie: true,
        ktcDelta: ktcValue ? ktcValue.rank - overallRank : null,
        ktcRank: ktcValue?.rank ?? null,
        marketPosition: ktcValue?.position ?? rookie.position,
        marketPositionRank: ktcValue ? Number(ktcValue.positionRank.replace(/[^0-9]/g, "")) || null : null,
        overallRank,
        player: rookie.name,
        position: rookie.position,
        positionRank: ktcValue?.positionRank || `${rookie.position}-`,
        relativeBaseValue: imported?.relativeBaseValue ?? null,
        rookiePick: imported?.rookiePick ?? "",
        team: rookie.team,
        yearsExperience: 0,
      } satisfies DynastyRanking;
    });

  const fallbackRankings = rankings.map((ranking) => {
    const normalizedName = normalizePlayerName(ranking.player);
    const fantasyCalcValue = fantasyCalc.values.get(normalizedName);
    const ktcValue = ktc.values.get(normalizedName);
    const ktcRank = ktcValue?.rank ?? ranking.ktcRank;

    return {
      ...ranking,
      age: ktcValue?.age ?? ranking.age,
      team: ktcValue?.team ?? ranking.team,
      ktcRank,
      ktcDelta:
        ktcRank === null || ktcRank === undefined
          ? ranking.ktcDelta
          : ktcRank - ranking.overallRank,
      fantasyCalcRank: fantasyCalcValue?.rank ?? null,
      fantasyCalcValue: fantasyCalcValue?.value ?? null,
      fantasyCalcTrend30Day: fantasyCalcValue?.trend30Day ?? null,
    };
  });

  const enrichedRankings = marketRankings.length > 0
    ? [...marketRankings, ...missingRookies]
    : fallbackRankings;
  const rookieCount = enrichedRankings.filter((ranking) => ranking.isRookie).length;

  const sources: MarketSourceSummary = {
    ktc: {
      label: ktc.label,
      status: ktc.status,
      detail: ktc.detail,
    },
    fantasyCalc:
      marketRankings.length > 0
        ? {
            ...fantasyCalc.status,
            detail: `${marketRankings.length} current players loaded in market order · ${rookieCount} rookies`,
          }
        : fantasyCalc.status,
    rookiePool: {
      ...sleeperRookies.status,
      detail: sleeperRookies.status.status === "live"
        ? `${rookieCount} rookies on the board · ${missingRookies.length} added beyond FantasyCalc`
        : sleeperRookies.status.detail,
    },
  };

  return {
    rankings: enrichedRankings,
    sources,
  };
}
