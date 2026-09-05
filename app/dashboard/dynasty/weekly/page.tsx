import { AlertTriangle, BellOff, RefreshCcw, ShieldAlert } from "lucide-react";

import { getSavedDynastyBoard } from "@/app/dashboard/dynasty/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDynastyRankings } from "@/lib/dynasty/rankings";
import { getSleeperWeeklyBoard } from "@/lib/dynasty/sleeper";
import { enrichRankingsWithMarketSources } from "@/lib/dynasty/sources/marketSources";
import { personalSettings } from "@/lib/personal-settings";
import type { DynastyRanking } from "@/types/dynasty";

export const dynamic = "force-dynamic";

function applySavedOrder(rankings: DynastyRanking[], savedIds: string[]) {
  if (savedIds.length === 0) return rankings;

  const byId = new Map(rankings.map((ranking) => [ranking.id, ranking]));
  const ordered = savedIds
    .map((id) => byId.get(id))
    .filter((ranking): ranking is DynastyRanking => Boolean(ranking));
  const savedSet = new Set(savedIds);
  ordered.push(...rankings.filter((ranking) => !savedSet.has(ranking.id)));

  return ordered.map((ranking, index) => ({ ...ranking, overallRank: index + 1 }));
}

function playerMeta(player: { injuryStatus: string | null; personalRank: number | null; position: string; team: string | null }) {
  return [
    player.position,
    player.team,
    player.personalRank ? `#${player.personalRank}` : null,
    player.injuryStatus,
  ].filter(Boolean).join(" · ");
}

export default async function DynastyWeeklyPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string; week?: string }>;
}) {
  const params = await searchParams;
  const season = params?.season?.trim() || personalSettings.dynastySeason;
  const requestedWeek = Number(params?.week);
  const week = Number.isInteger(requestedWeek) && requestedWeek >= 1 && requestedWeek <= 18
    ? requestedWeek
    : 1;
  const [{ rankings }, savedBoard] = await Promise.all([
    enrichRankingsWithMarketSources(getDynastyRankings()),
    getSavedDynastyBoard(),
  ]);
  const savedIds = (savedBoard?.ALL ?? [])
    .filter((row) => row.type === "player")
    .map((row) => row.playerId);
  const personalRankings = applySavedOrder(rankings, savedIds);
  const result = await getSleeperWeeklyBoard({
    rankings: personalRankings,
    season,
    username: personalSettings.sleeperUsername,
    week,
  }).catch((error) => error instanceof Error ? error : new Error("Sleeper failed."));
  const hasError = result instanceof Error;
  const data = hasError ? null : result;
  const reviewCount = data?.leagues.reduce((total, league) => total + league.lineupReviews.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dynasty Hub"
        title="Weekly Decisions"
        description="Review submitted Sleeper lineups and surface only unusually valuable waiver availability."
      />

      <section className="rounded-md border border-ink/10 bg-white p-4">
        <form className="grid gap-3 sm:grid-cols-[140px_120px_auto] sm:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Season</span>
            <input name="season" defaultValue={season} className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm outline-none focus:border-moss focus:bg-white" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Week</span>
            <input name="week" type="number" min={1} max={18} defaultValue={week} className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm outline-none focus:border-moss focus:bg-white" />
          </label>
          <Button type="submit"><RefreshCcw className="h-4 w-4" aria-hidden="true" />Refresh week</Button>
        </form>
        {hasError ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{result.message}</p> : null}
      </section>

      {data ? (
        <>
          {data.hugeWaivers.length > 0 ? (
            <Alert className="border-ember/35 bg-ember/5">
              <ShieldAlert className="h-4 w-4 text-ember" />
              <AlertTitle>Huge waiver value found</AlertTitle>
              <AlertDescription>
                {data.hugeWaivers.length} player{data.hugeWaivers.length === 1 ? "" : "s"} inside your personal top {data.threshold} {data.hugeWaivers.length === 1 ? "is" : "are"} available.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center gap-2 text-sm text-ink/55">
              <BellOff className="h-4 w-4" aria-hidden="true" />
              No top-{data.threshold} waiver values. No alert needed.
            </div>
          )}

          {data.hugeWaivers.length > 0 ? (
            <section className="rounded-md border border-ember/25 bg-white">
              <div className="border-b border-ink/10 px-4 py-3">
                <h2 className="font-bold text-ink">Priority waivers</h2>
                <p className="mt-1 text-sm text-ink/55">Only players inside your saved top {data.threshold} appear here.</p>
              </div>
              <div className="divide-y divide-ink/10">
                {data.hugeWaivers.map((player) => (
                  <div key={player.playerId} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_2fr] md:items-center">
                    <div><p className="font-semibold text-ink">{player.name}</p><p className="text-sm text-ink/50">{playerMeta(player)}</p></div>
                    <div className="flex flex-wrap gap-1.5">{player.availableIn.map((league) => <Badge key={league.id} variant="secondary">{league.name}</Badge>)}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div><h2 className="text-lg font-bold text-ink">Start / sit review</h2><p className="mt-1 text-sm text-ink/55">{reviewCount} lineup check{reviewCount === 1 ? "" : "s"} across {data.leagues.length} leagues.</p></div>
              <p className="text-xs text-ink/45">Baseline uses your dynasty board, not weekly projections.</p>
            </div>
            <div className="space-y-3">
              {data.leagues.map((league) => (
                <article key={league.league.id} className="rounded-md border border-ink/10 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-ink">{league.league.name}</h3><Badge variant={league.lineupReviews.length ? "destructive" : "outline"}>{league.lineupReviews.length ? `${league.lineupReviews.length} review` : "Lineup clear"}</Badge></div>
                  {league.lineupReviews.length > 0 ? (
                    <div className="mt-3 space-y-2">{league.lineupReviews.map((review) => (
                      <div key={`${review.starter.playerId}-${review.benchPlayer.playerId}`} className="grid gap-2 rounded-md bg-amber-50 px-3 py-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <div><p className="text-xs font-semibold text-ink/45">CURRENT {review.starter.slot}</p><p className="font-semibold text-ink">{review.starter.name}</p><p className="text-xs text-ink/50">{playerMeta(review.starter)}</p></div>
                        <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
                        <div><p className="text-xs font-semibold text-ink/45">CHECK {review.benchPlayer.name}</p><p className="text-sm text-ink/65">{review.reason}</p></div>
                      </div>
                    ))}</div>
                  ) : <p className="mt-3 text-sm text-ink/55">No injury or major personal-rank conflicts in the submitted lineup.</p>}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
