import Link from "next/link";
import { ArrowLeft, CalendarDays, RefreshCcw, Star } from "lucide-react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { getSleeperMyTeamsBoard } from "@/lib/dynasty/sleeper";
import { personalSettings } from "@/lib/personal-settings";
import type {
  SleeperLeagueRosterPlayer,
  SleeperMyTeam,
  SleeperMyTeamStatus,
} from "@/lib/dynasty/sleeper";

const positionColumns = ["QB", "RB", "WR", "TE"];

function formatValue(value: number | null) {
  if (value === null) {
    return "-";
  }

  return Math.round(value).toLocaleString();
}

function formatSlot(slot: string) {
  return slot
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status: SleeperMyTeamStatus) {
  if (status === "Contender") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }

  if (status === "Playoff Mix") {
    return "bg-sky-50 text-sky-800 border-sky-200";
  }

  if (status === "Fragile Contender") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  if (status === "Rebuild") {
    return "bg-violet-50 text-violet-800 border-violet-200";
  }

  return "bg-rose-50 text-rose-800 border-rose-200";
}

function getPlayerValueClass(value: number | null) {
  if (value === null) {
    return "bg-white text-ink/55 border-ink/10";
  }

  if (value >= 8) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }

  if (value >= 4) {
    return "bg-sky-50 text-sky-800 border-sky-200";
  }

  if (value >= 1) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  return "bg-rose-50 text-rose-800 border-rose-200";
}

function getStarterPlayers(team: SleeperMyTeam) {
  const players = Object.values(team.playersByPosition).flat();

  return team.starterSlots
    .map((slot) => {
      return players.find((player) => {
        return player.rosterRole === "starter" && player.starterSlot === slot;
      });
    })
    .filter((player): player is SleeperLeagueRosterPlayer => Boolean(player));
}

function PlayerRow({ player }: { player: SleeperLeagueRosterPlayer }) {
  const isStarter = player.rosterRole === "starter";

  return (
    <div
      className={clsx(
        "grid min-h-10 grid-cols-[1fr_auto] items-center gap-2 rounded-md border px-2 py-1.5",
        getPlayerValueClass(player.value),
        !isStarter && "opacity-80",
      )}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          {isStarter ? (
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-emerald-600 text-emerald-600"
              aria-hidden="true"
            />
          ) : null}
          <span className="truncate text-sm font-semibold text-ink">
            {player.name}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-ink/50">
          {player.positionRank ? <span>{player.positionRank}</span> : null}
          {player.personalRank ? <span>#{player.personalRank}</span> : null}
          {player.team ? <span>{player.team}</span> : null}
          {isStarter && player.starterSlot ? (
            <span>{formatSlot(player.starterSlot)}</span>
          ) : null}
        </div>
      </div>
      <span className="text-sm font-bold">{formatValue(player.value)}</span>
    </div>
  );
}

export default async function DynastyMyTeamsPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = params?.season?.trim() || personalSettings.dynastySeason;
  const myTeamsBoard = await getSleeperMyTeamsBoard({
    season,
    username: personalSettings.sleeperUsername,
  }).catch((error) => {
    return error instanceof Error ? error : new Error("Sleeper failed.");
  });
  const hasError = myTeamsBoard instanceof Error;
  const data = hasError ? null : myTeamsBoard;

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
        <h1 className="mt-2 text-3xl font-bold text-ink">My Teams</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Review only your Sleeper rosters, labeled by team direction and
          organized around the starters your personal rankings prefer.
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">My roster view</p>
            <p className="mt-1 text-sm text-ink/60">
              Loading teams for{" "}
              <span className="font-semibold text-ink">
                {personalSettings.sleeperUsername}
              </span>
              .
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
            {myTeamsBoard.message}
          </p>
        ) : null}
      </section>

      {data ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Sleeper user</p>
              <p className="mt-1 text-xl font-bold text-ink">{data.username}</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Leagues found</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {data.leagues.length}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">My rosters</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {data.teams.length}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            {data.teams.map((team) => {
              const starterPlayers = getStarterPlayers(team);
              const benchValue = team.totalValue - team.starterValue;

              return (
                <article
                  key={team.league.id}
                  className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"
                >
                  <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
                          #{team.leagueRank}
                        </span>
                        <span
                          className={clsx(
                            "rounded-full border px-2.5 py-1 text-xs font-bold",
                            getStatusClass(team.statusLabel),
                          )}
                        >
                          {team.statusLabel}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-ink">
                        {team.teamName ?? team.ownerName}
                      </h2>
                      <p className="mt-1 text-sm text-ink/55">
                        {team.league.name}
                      </p>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
                        {team.statusReason}
                      </p>
                    </div>

                    <aside className="rounded-lg bg-mist p-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink">
                        <CalendarDays
                          className="h-4 w-4 text-moss"
                          aria-hidden="true"
                        />
                        Weekly lineup preview
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {starterPlayers.map((player) => (
                          <div
                            key={`${team.league.id}-${player.starterSlot}-${player.playerId}`}
                            className="grid grid-cols-[70px_1fr_auto] items-center gap-2 rounded-md bg-white px-2 py-1.5 text-sm"
                          >
                            <span className="text-xs font-bold text-ink/45">
                              {player.starterSlot
                                ? formatSlot(player.starterSlot)
                                : "Start"}
                            </span>
                            <span className="truncate font-semibold text-ink">
                              {player.name}
                            </span>
                            <span className="text-xs font-bold text-moss">
                              {formatValue(player.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </aside>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Starter value</p>
                      <p className="text-sm font-bold text-ink">
                        {formatValue(team.starterValue)}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Bench value</p>
                      <p className="text-sm font-bold text-ink">
                        {formatValue(benchValue)}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Total value</p>
                      <p className="text-sm font-bold text-ink">
                        {formatValue(team.totalValue)}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Avg age</p>
                      <p className="text-sm font-bold text-ink">
                        {team.averageAge ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Format</p>
                      <p className="text-sm font-bold text-ink">
                        Start {team.starterSlots.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-4">
                    {positionColumns.map((position) => {
                      const players = team.playersByPosition[position] ?? [];

                      return (
                        <div key={`${team.league.id}-${position}`}>
                          <div className="mb-2 flex items-center justify-between border-b border-ink/10 pb-2">
                            <p className="text-sm font-bold text-ink">{position}</p>
                            <span className="text-xs font-bold text-ink/45">
                              {players.length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {players.map((player) => (
                              <PlayerRow
                                key={`${team.league.id}-${player.playerId}`}
                                player={player}
                              />
                            ))}
                            {players.length === 0 ? (
                              <div className="rounded-md border border-dashed border-ink/15 bg-mist px-3 py-4 text-center text-sm text-ink/45">
                                Empty
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}

            {data.teams.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink/20 bg-white p-6 text-sm text-ink/60">
                No rosters were found for your Sleeper account in this season.
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
