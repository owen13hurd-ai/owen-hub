import type { DynastyRanking, MarketSourceSummary } from "@/types/dynasty";
import { normalizePlayerName } from "@/lib/dynasty/sources/nameMatch";
import { getFantasyCalcValues } from "@/lib/dynasty/sources/fantasyCalc";
import { getKtcGoogleSheetValues } from "@/lib/dynasty/sources/googleSheet";

export async function enrichRankingsWithMarketSources(
  rankings: DynastyRanking[],
) {
  const [fantasyCalc, ktc] = await Promise.all([
    getFantasyCalcValues(),
    getKtcGoogleSheetValues(),
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

  const enrichedRankings =
    marketRankings.length > 0 ? marketRankings : fallbackRankings;
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
  };

  return {
    rankings: enrichedRankings,
    sources,
  };
}
