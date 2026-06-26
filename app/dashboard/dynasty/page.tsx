import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  RefreshCcw,
  ShieldCheck,
  TableProperties,
  Users,
} from "lucide-react";

import { DynastyRankingsClient } from "@/components/dynasty/DynastyRankingsClient";
import { TradeIdeaNotebook } from "@/components/dynasty/TradeIdeaNotebook";
import { getSavedDynastyBoard } from "@/app/dashboard/dynasty/actions";
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
  const portfolioHref =
    season === personalSettings.dynastySeason
      ? "/dashboard/dynasty/portfolio"
      : `/dashboard/dynasty/portfolio?season=${encodeURIComponent(season)}`;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Dynasty Hub
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Dynasty Rankings
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          This is the first web version of your Dynasty Hub rankings. It starts
          with your spreadsheet data, adds position filters and search, and
          creates the foundation for saved custom rankings, market comparisons,
          and trade tools.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={portfolioHref}>
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Portfolio exposure
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/dynasty/leaguemates">
              <Users className="h-4 w-4" aria-hidden="true" />
              Leaguemate insights
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/dynasty/leagues">
              <TableProperties className="h-4 w-4" aria-hidden="true" />
              Power rankings
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/dynasty/my-teams">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              My teams
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/dynasty/rookies">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Rookie draft
            </Link>
          </Button>
        </div>
      </section>

      <TradeIdeaNotebook rankings={rankings} />

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
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
