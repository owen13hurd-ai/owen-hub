import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";

import { SleeperPortfolioClient } from "@/components/dynasty/SleeperPortfolioClient";
import { Button } from "@/components/ui/Button";
import { getSleeperPortfolio } from "@/lib/dynasty/sleeper";

const defaultSeason = "2026";

export default async function DynastyPortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string; username?: string }>;
}) {
  const params = await searchParams;
  const username = params?.username?.trim() ?? "";
  const season = params?.season?.trim() || defaultSeason;
  const sleeperPortfolio = username
    ? await getSleeperPortfolio({ season, username }).catch((error) => {
        return error instanceof Error ? error : new Error("Sleeper failed.");
      })
    : null;
  const hasError = sleeperPortfolio instanceof Error;
  const data = hasError ? null : sleeperPortfolio;
  const selectedLeagueCount = data?.leagues.length ?? 0;
  const uniquePlayerCount = data
    ? new Set(data.rosterAssets.map((asset) => asset.playerId)).size
    : 0;
  const maxExposure = data
    ? Math.max(
        0,
        ...Array.from(
          data.rosterAssets.reduce((counts, asset) => {
            counts.set(asset.playerId, (counts.get(asset.playerId) ?? 0) + 1);
            return counts;
          }, new Map<string, number>()).values(),
        ),
      )
    : 0;

  return (
    <div className="space-y-8">
      <section>
        <Button asChild variant="secondary">
          <Link href="/dashboard/dynasty">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Rankings
          </Link>
        </Button>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Dynasty Hub
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Sleeper Portfolio
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Pull your Sleeper teams, combine your rosters, and see where you are
          most exposed across leagues. Use the league dropdown to include or
          remove leagues from the exposure view.
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <form className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Sleeper username
            </span>
            <input
              name="username"
              defaultValue={username}
              placeholder="your Sleeper username"
              className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
            />
          </label>
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
              Load
            </Button>
          </div>
        </form>

        {hasError ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {sleeperPortfolio.message}
          </p>
        ) : null}
      </section>

      {data ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Sleeper user</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {data.displayName}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Leagues found</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {selectedLeagueCount}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Unique players</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {uniquePlayerCount}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Max exposure</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">
                {maxExposure}
              </p>
            </div>
          </section>

          <SleeperPortfolioClient
            leagues={data.leagues}
            rosterAssets={data.rosterAssets}
          />
        </>
      ) : (
        <section className="rounded-lg border border-dashed border-ink/20 bg-white p-6">
          <p className="text-lg font-bold text-ink">
            Enter your Sleeper username to build your portfolio.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Sleeper does not require an API key for this. The app reads your
            public league and roster data, then calculates player exposure
            across the leagues you choose.
          </p>
        </section>
      )}
    </div>
  );
}

