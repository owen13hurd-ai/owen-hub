import { RefreshCcw } from "lucide-react";

import { DynastyRankingsClient } from "@/components/dynasty/DynastyRankingsClient";
import { getSavedDynastyBoard } from "@/app/dashboard/dynasty/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getDynastyRankings, getDynastyTiers } from "@/lib/dynasty/rankings";
import { getSleeperPortfolio } from "@/lib/dynasty/sleeper";
import { enrichRankingsWithMarketSources } from "@/lib/dynasty/sources/marketSources";
import { personalSettings } from "@/lib/personal-settings";
import type { DynastyOwnershipSummary } from "@/types/dynasty";

function normalizePlayerName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export default async function DynastyHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const username = personalSettings.sleeperUsername;
  const season = params?.season?.trim() || personalSettings.dynastySeason;
  const importedRankings = getDynastyRankings();
  const { rankings, sources } =
    await enrichRankingsWithMarketSources(importedRankings);
  const tiers = getDynastyTiers(rankings);
  const savedRowsByScope = await getSavedDynastyBoard();
  const sleeperPortfolio = await getSleeperPortfolio({ season, username }).catch(
    (error) => {
      return error instanceof Error ? error : new Error("Sleeper failed.");
    },
  );
  const hasSleeperError = sleeperPortfolio instanceof Error;
  const sleeperData = hasSleeperError ? null : sleeperPortfolio;
  const leagueCount = sleeperData?.leagues.length ?? 0;
  const rosteredLeagueNamesByPlayer = new Map<string, Set<string>>();
  const ownershipByPlayerId: Record<string, DynastyOwnershipSummary> = {};

  sleeperData?.rosterAssets.forEach((asset) => {
    const key = normalizePlayerName(asset.name);
    const existingLeagues =
      rosteredLeagueNamesByPlayer.get(key) ?? new Set<string>();

    existingLeagues.add(asset.leagueName);
    rosteredLeagueNamesByPlayer.set(key, existingLeagues);
  });

  rankings.forEach((ranking) => {
    const rosteredLeagues = rosteredLeagueNamesByPlayer.get(
      normalizePlayerName(ranking.player),
    );
    const exposure = rosteredLeagues?.size ?? 0;

    ownershipByPlayerId[ranking.id] = {
      exposure,
      leagueCount,
      percent: leagueCount > 0 ? Math.round((exposure / leagueCount) * 100) : 0,
    };
  });
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dynasty Hub"
        title="Player Rankings"
        description="Your personal dynasty board, market comparison, tiers, and roster exposure."
      />

      <section className="rounded-md border border-ink/10 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">
              Sleeper ownership
            </p>
            <p className="mt-1 text-sm text-ink/60">
              Automatically loading teams for{" "}
              <span className="font-semibold text-ink">{username}</span>.
            </p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[140px_auto]">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Season</span>
              <input
                name="season"
                defaultValue={season}
                className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
              />
            </label>
            <div className="flex items-end">
              <Button type="submit">
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Load ownership
              </Button>
            </div>
          </form>
        </div>

        {sleeperData ? (
          <p className="mt-3 text-sm text-ink/60">
            Showing ownership across {leagueCount} Sleeper leagues for{" "}
            <span className="font-semibold text-ink">
              {sleeperData.displayName}
            </span>
            .
          </p>
        ) : null}

        {hasSleeperError ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {sleeperPortfolio.message}
          </p>
        ) : null}
      </section>

      <DynastyRankingsClient
        initialRankings={rankings}
        initialTiers={tiers}
        initialRowsByScope={savedRowsByScope}
        ownershipByPlayerId={ownershipByPlayerId}
        sources={sources}
      />
    </div>
  );
}
