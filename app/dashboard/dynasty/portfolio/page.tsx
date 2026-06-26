import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";

import { SleeperPortfolioClient } from "@/components/dynasty/SleeperPortfolioClient";
import { Button } from "@/components/ui/Button";
import { getSleeperPortfolio } from "@/lib/dynasty/sleeper";
import { personalSettings } from "@/lib/personal-settings";

export default async function DynastyPortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const username = personalSettings.sleeperUsername;
  const season = params?.season?.trim() || personalSettings.dynastySeason;
  const sleeperPortfolio = await getSleeperPortfolio({ season, username }).catch(
    (error) => {
      return error instanceof Error ? error : new Error("Sleeper failed.");
    },
  );
  const hasError = sleeperPortfolio instanceof Error;
  const data = hasError ? null : sleeperPortfolio;
  const selectedLeagueCount = data?.leagues.length ?? 0;
  const uniquePlayerCount = data
    ? new Set(data.rosterAssets.map((asset) => asset.playerId)).size
    : 0;
  const maxValueExposure = data
    ? Math.max(
        0,
        ...Array.from(
          data.rosterAssets.reduce((values, asset) => {
            values.set(
              asset.playerId,
              (values.get(asset.playerId) ?? 0) + (asset.value ?? 0),
            );
            return values;
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
          most exposed by total personal ranking value. Use the league dropdown
          to include or remove leagues from the exposure view.
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">Sleeper account</p>
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
                Load
              </Button>
            </div>
          </form>
        </div>

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
              <p className="text-sm text-ink/55">Top value held</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">
                {maxValueExposure.toFixed(2)}
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
            Sleeper portfolio could not load.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            The app is set to use your hardcoded Sleeper username, then
            calculate player exposure across your leagues.
          </p>
        </section>
      )}
    </div>
  );
}
