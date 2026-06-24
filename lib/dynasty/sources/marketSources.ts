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

  const enrichedRankings = rankings.map((ranking) => {
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

  const sources: MarketSourceSummary = {
    ktc: {
      label: ktc.label,
      status: ktc.status,
      detail: ktc.detail,
    },
    fantasyCalc: fantasyCalc.status,
  };

  return {
    rankings: enrichedRankings,
    sources,
  };
}
