import Link from "next/link";
import { ArrowLeft, RefreshCcw, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  getSleeperLeaguemateInsights,
  getSleeperLeaguemateSearchOptions,
} from "@/lib/dynasty/sleeper";
import { personalSettings } from "@/lib/personal-settings";

function formatPercent(count: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((count / total) * 100)}%`;
}

function LeagueMatchCard({
  match,
}: {
  match: {
    displayName: string;
    isSharedLeague: boolean;
    leagueId: string;
    leagueName: string;
    rosterId: number;
    teamName: string | null;
  };
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-mist p-3">
      <p className="font-semibold text-ink">{match.displayName}</p>
      <p className="mt-1 text-sm text-ink/60">{match.leagueName}</p>
      <p className="mt-1 text-xs font-semibold text-ink/45">
        {match.isSharedLeague ? "Shared league" : "Other league"}
      </p>
      {match.teamName ? (
        <p className="mt-1 text-xs text-ink/45">Team: {match.teamName}</p>
      ) : null}
    </div>
  );
}

export default async function LeaguemateInsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ manager?: string; managerId?: string; season?: string }>;
}) {
  const params = await searchParams;
  const managerName = params?.manager?.trim() ?? "";
  const managerUserId = params?.managerId?.trim();
  const season = params?.season?.trim() || personalSettings.dynastySeason;
  const searchOptions = await getSleeperLeaguemateSearchOptions({
    season,
    username: personalSettings.sleeperUsername,
  }).catch(() => []);
  const insights = managerName
    ? await getSleeperLeaguemateInsights({
        managerName,
        managerUserId,
        season,
        username: personalSettings.sleeperUsername,
      }).catch((error) => {
        return error instanceof Error ? error : new Error("Sleeper failed.");
      })
    : null;
  const hasError = insights instanceof Error;
  const data = hasError ? null : insights;
  const topPlayers = data?.players.slice(0, 12) ?? [];
  const positions = ["QB", "RB", "WR", "TE"];
  const suggestedManagers = searchOptions
    .filter((option) => option.displayName !== personalSettings.sleeperUsername)
    .slice(0, 18);
  const visibleMatches = data?.matches.slice(0, 10) ?? [];
  const hiddenMatches = data?.matches.slice(10) ?? [];

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
          Leaguemate Insights
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Search a manager from your Sleeper leagues to see their repeated
          players, roster profile, and trade tendencies. This is built for
          finding negotiation angles before you send an offer.
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">Manager search</p>
            <p className="mt-1 text-sm text-ink/60">
              Searching across leagues for{" "}
              <span className="font-semibold text-ink">
                {personalSettings.sleeperUsername}
              </span>
              .
            </p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[260px_140px_auto]">
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Leaguemate
              </span>
              <div className="relative mt-2">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                  aria-hidden="true"
                />
                <input
                  list="leaguemate-options"
                  name="manager"
                  defaultValue={managerName}
                  placeholder="Name, username, or team"
                  className="h-10 w-full rounded-md border border-ink/10 bg-mist pl-9 pr-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
                />
                <datalist id="leaguemate-options">
                  {searchOptions.map((option) => (
                    <option key={option.userId} value={option.displayName}>
                      {option.searchLabel}
                    </option>
                  ))}
                </datalist>
              </div>
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
                Analyze
              </Button>
            </div>
          </form>
        </div>

        {suggestedManagers.length > 0 ? (
          <div className="mt-4 border-t border-ink/10 pt-4">
            <p className="text-sm font-semibold text-ink">
              Known leaguemates
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedManagers.map((option) => (
                <Link
                  key={option.userId}
                  href={`/dashboard/dynasty/leaguemates?managerId=${encodeURIComponent(
                    option.userId,
                  )}&manager=${encodeURIComponent(
                    option.displayName,
                  )}&season=${encodeURIComponent(season)}`}
                  className="rounded-full border border-ink/10 bg-mist px-3 py-1.5 text-xs font-bold text-ink transition hover:border-moss hover:bg-skyglass"
                >
                  {option.displayName}
                  <span className="ml-1 text-ink/45">
                    {option.leagueCount}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {hasError ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {insights.message}
          </p>
        ) : null}
      </section>

      {!managerName ? (
        <section className="rounded-lg border border-dashed border-ink/20 bg-white p-6">
          <Users className="h-6 w-6 text-ink/45" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-ink">
            Enter a leaguemate to begin.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Try a Sleeper display name, username, or team name. The app will
            match that manager across your leagues and summarize their roster
            tendencies.
          </p>
        </section>
      ) : null}

      {managerName && data?.totalLeagueCount === 0 ? (
        <section className="rounded-lg border border-dashed border-ink/20 bg-white p-6">
          <Users className="h-6 w-6 text-ink/45" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-ink">
            No matching Sleeper manager found.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Sleeper usually exposes manager handles, not real names. Try one of
            the known leaguemates above, or search by team name.
          </p>
        </section>
      ) : null}

      {data && data.totalLeagueCount > 0 ? (
        <>
          <section className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Leagues found</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {data.totalLeagueCount}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Shared with you</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {data.sharedLeagueCount}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Unique players</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {data.playerCount}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Average age</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {data.averageAge ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Completed trades found</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {data.tradeCount}
              </p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
                Manager profile
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.profileLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-skyglass px-3 py-1 text-xs font-bold text-ink"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {positions.map((position) => {
                  const count = data.positionCounts[position] ?? 0;

                  return (
                    <div key={position}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink">
                          {position}
                        </span>
                        <span className="text-ink/55">
                          {count} · {formatPercent(count, data.playerCount)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                        <div
                          className="h-full rounded-full bg-moss"
                          style={{
                            width: formatPercent(count, data.playerCount),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
                  League matches
                </p>
                <span className="text-xs font-semibold text-ink/45">
                  {data.matches.length}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {visibleMatches.map((match) => (
                  <LeagueMatchCard
                    key={`${match.leagueId}-${match.rosterId}`}
                    match={match}
                  />
                ))}
              </div>
              {hiddenMatches.length > 0 ? (
                <details className="mt-3">
                  <summary className="cursor-pointer rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-skyglass">
                    Show {hiddenMatches.length} more leagues
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {hiddenMatches.map((match) => (
                      <LeagueMatchCard
                        key={`${match.leagueId}-${match.rosterId}`}
                        match={match}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Favorite players
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-ink/10">
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                  <thead className="bg-mist text-xs uppercase tracking-[0.08em] text-ink/55">
                    <tr>
                      <th className="px-3 py-3">Player</th>
                      <th className="px-3 py-3">Pos</th>
                      <th className="px-3 py-3">Team</th>
                      <th className="px-3 py-3">Exposure</th>
                      <th className="px-3 py-3">Leagues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {topPlayers.map((player) => (
                      <tr key={player.playerId} className="bg-white">
                        <td className="px-3 py-3 font-semibold text-ink">
                          {player.name}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-md bg-skyglass px-2 py-1 text-xs font-bold text-ink">
                            {player.position}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-ink/70">
                          {player.team ?? "-"}
                        </td>
                        <td className="px-3 py-3 font-semibold text-ink">
                          {player.exposure}/{data.totalLeagueCount}
                        </td>
                        <td className="px-3 py-3 text-ink/60">
                          {player.leagueNames.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
                Most traded for
              </p>
              <div className="mt-4 space-y-2">
                {data.topAcquiredPlayers.length > 0 ? (
                  data.topAcquiredPlayers.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between rounded-md bg-mist px-3 py-2"
                    >
                      <span className="font-semibold text-ink">
                        {player.name}
                      </span>
                      <span className="text-sm text-ink/55">
                        {player.count}x
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink/55">
                    No player acquisition detail found in Sleeper trades yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
                Most traded away
              </p>
              <div className="mt-4 space-y-2">
                {data.topTradedAwayPlayers.length > 0 ? (
                  data.topTradedAwayPlayers.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between rounded-md bg-mist px-3 py-2"
                    >
                      <span className="font-semibold text-ink">
                        {player.name}
                      </span>
                      <span className="text-sm text-ink/55">
                        {player.count}x
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink/55">
                    No player sell-away detail found in Sleeper trades yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
