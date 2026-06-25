import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { DynastyRankingsClient } from "@/components/dynasty/DynastyRankingsClient";
import { getSavedDynastyBoard } from "@/app/dashboard/dynasty/actions";
import { Button } from "@/components/ui/Button";
import { getDynastyRankings, getDynastyTiers } from "@/lib/dynasty/rankings";
import { enrichRankingsWithMarketSources } from "@/lib/dynasty/sources/marketSources";

export default async function DynastyHubPage() {
  const importedRankings = getDynastyRankings();
  const { rankings, sources } =
    await enrichRankingsWithMarketSources(importedRankings);
  const tiers = getDynastyTiers(rankings);
  const savedRowsByScope = await getSavedDynastyBoard();

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
        <div className="mt-5">
          <Button asChild variant="secondary">
            <Link href="/dashboard/dynasty/portfolio">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Portfolio exposure
            </Link>
          </Button>
        </div>
      </section>

      <DynastyRankingsClient
        initialRankings={rankings}
        initialTiers={tiers}
        initialRowsByScope={savedRowsByScope}
        sources={sources}
      />
    </div>
  );
}
