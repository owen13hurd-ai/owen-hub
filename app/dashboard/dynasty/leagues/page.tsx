import { RefreshCcw, Rows3, Star } from "lucide-react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSleeperLeagueRosterBoard } from "@/lib/dynasty/sleeper";
import { personalSettings } from "@/lib/personal-settings";
import type {
  SleeperLeagueDraftPick,
  SleeperLeagueRosterPlayer,
} from "@/lib/dynasty/sleeper";

const positionColumns = ["QB", "RB", "WR", "TE"];

type PositionRankings = Record<string, Record<string, number>>;

function formatValue(value: number | null) {
  if (value === null) {
    return "-";
  }

  return Math.round(value).toLocaleString();
}

function getValueColor(value: number | null) {
  if (value === null) {
    return {
      border: "border-ink/10",
      background: "bg-white",
      text: "text-ink/55",
    };
  }

  if (value >= 8) {
    return {
      border: "border-emerald-300",
      background: "bg-emerald-50",
      text: "text-emerald-800",
    };
  }

  if (value >= 4) {
    return {
      border: "border-sky-300",
      background: "bg-sky-50",
      text: "text-sky-800",
    };
  }

  if (value >= 1) {
    return {
      border: "border-amber-300",
      background: "bg-amber-50",
      text: "text-amber-800",
    };
  }

  return {
    border: "border-rose-200",
    background: "bg-rose-50",
    text: "text-rose-700",
  };
}

function getPositionValue(players: SleeperLeagueRosterPlayer[]) {
  return players.reduce((total, player) => total + (player.value ?? 0), 0);
}

function getPickBucketCounts(picks: SleeperLeagueDraftPick[]) {
  return picks.reduce<Record<string, number>>((counts, pick) => {
    const label = `R${pick.round}`;
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
}

function getTeamBuildLabel({
  draftPickValue,
  starterValue,
  totalValue,
}: {
  draftPickValue: number;
  starterValue: number;
  totalValue: number;
}) {
  if (starterValue >= totalValue * 0.68 && draftPickValue < totalValue * 0.12) {
    return "Win-now";
  }

  if (draftPickValue >= totalValue * 0.28) {
    return "Reloading";
  }

  if (starterValue >= totalValue * 0.58 && draftPickValue >= totalValue * 0.16) {
    return "Balanced contender";
  }

  if (starterValue < totalValue * 0.48) {
    return "Depth build";
  }

  return "Middle build";
}

function getTeamBuildClass(label: string) {
  if (label === "Win-now" || label === "Balanced contender") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (label === "Reloading") {
    return "bg-sky-50 text-sky-800 ring-sky-200";
  }

  if (label === "Depth build") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }

  return "bg-mist text-ink/70 ring-ink/10";
}

function getRosterStrengths(
  team: {
    rosterId: number;
    playersByPosition: Record<string, SleeperLeagueRosterPlayer[]>;
  },
  positionRankings: PositionRankings,
) {
  return positionColumns
    .map((position) => ({
      position,
      rank: positionRankings[position]?.[team.rosterId] ?? 99,
      value: getPositionValue(team.playersByPosition[position] ?? []),
    }))
    .sort((firstPosition, secondPosition) => {
      return firstPosition.rank - secondPosition.rank || secondPosition.value - firstPosition.value;
    });
}

function formatSlot(slot: string) {
  return slot
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPositionRankings(
  teams: {
    rosterId: number;
    playersByPosition: Record<string, SleeperLeagueRosterPlayer[]>;
  }[],
) {
  return positionColumns.reduce<PositionRankings>((rankings, position) => {
    const positionTotals = teams
      .map((team) => ({
        rosterId: team.rosterId,
        value: getPositionValue(team.playersByPosition[position] ?? []),
      }))
      .sort((firstTeam, secondTeam) => secondTeam.value - firstTeam.value);

    rankings[position] = {};
    positionTotals.forEach((team, index) => {
      rankings[position][team.rosterId] = index + 1;
    });

    return rankings;
  }, {});
}

function PlayerRow({ player }: { player: SleeperLeagueRosterPlayer }) {
  const isStarter = player.rosterRole === "starter";
  const valueColor = getValueColor(player.value);

  return (
    <div
      className={clsx(
        "grid min-h-10 grid-cols-[1fr_auto] items-center gap-2 rounded-md border px-2 py-1.5",
        valueColor.border,
        valueColor.background,
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
      <span className={clsx("text-sm font-bold", valueColor.text)}>
        {formatValue(player.value)}
      </span>
    </div>
  );
}

export default async function DynastyPowerRankingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ leagueId?: string; season?: string }>;
}) {
  const params = await searchParams;
  const season = params?.season?.trim() || personalSettings.dynastySeason;
  const rosterBoard = await getSleeperLeagueRosterBoard({
    leagueId: params?.leagueId,
    season,
    username: personalSettings.sleeperUsername,
  }).catch((error) => {
    return error instanceof Error ? error : new Error("Sleeper failed.");
  });
  const hasError = rosterBoard instanceof Error;
  const data = hasError ? null : rosterBoard;
  const positionRankings = data ? getPositionRankings(data.teams) : {};

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dynasty Hub" title="Power Rankings" description="Compare every roster through your personal values and each league's starting format." />

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">Power rankings view</p>
            <p className="mt-1 text-sm text-ink/60">
              Loading leagues for{" "}
              <span className="font-semibold text-ink">
                {personalSettings.sleeperUsername}
              </span>
              .
            </p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[minmax(220px,320px)_120px_auto]">
            <label className="block">
              <span className="text-sm font-semibold text-ink">League</span>
              <select
                name="leagueId"
                defaultValue={data?.selectedLeague.id}
                className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
              >
                {data?.leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
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
        </div>

        {hasError ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {rosterBoard.message}
          </p>
        ) : null}
      </section>

      {data ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">League</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {data.selectedLeague.name}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Starter format</p>
              <p className="mt-1 text-xl font-bold text-ink">
                Start {data.starterSlots.length}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Teams</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {data.teams.length}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <p className="text-sm text-ink/55">Pick value shown</p>
              <p className="mt-1 text-xl font-bold text-ink">
                Next 3 drafts
              </p>
            </div>
          </section>

          <section className="space-y-4">
            {data.teams.map((team, index) => {
              const buildLabel = getTeamBuildLabel({
                draftPickValue: team.draftPickValue,
                starterValue: team.starterValue,
                totalValue: team.totalValue,
              });
              const strengths = getRosterStrengths(team, positionRankings);
              const topStrength = strengths[0];
              const softSpot = strengths[strengths.length - 1];

              return (
              <article
                key={team.rosterId}
                className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"
              >
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
                        #{index + 1}
                      </span>
                      <h2 className="truncate text-lg font-bold text-ink">
                        {team.teamName ?? team.ownerName}
                      </h2>
                      {team.teamName ? (
                        <span className="text-sm text-ink/50">
                          {team.ownerName}
                        </span>
                      ) : null}
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                          getTeamBuildClass(buildLabel),
                        )}
                      >
                        {buildLabel}
                      </span>
                    </div>
                    {team.username ? (
                      <p className="mt-1 text-sm text-ink/50">
                        @{team.username}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-ink/60">
                      Best room:{" "}
                      <span className="font-semibold text-ink">
                        {topStrength?.position ?? "-"}
                      </span>
                      {topStrength ? ` #${topStrength.rank}` : ""} · Soft spot:{" "}
                      <span className="font-semibold text-ink">
                        {softSpot?.position ?? "-"}
                      </span>
                      {softSpot ? ` #${softSpot.rank}` : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Power score</p>
                      <p className="text-sm font-bold text-ink">
                        {formatValue(team.powerValue)}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Starter value</p>
                      <p className="text-sm font-bold text-ink">
                        {formatValue(team.starterValue)}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Total value</p>
                      <p className="text-sm font-bold text-ink">
                        {formatValue(team.totalValue)}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Pick value</p>
                      <p className="text-sm font-bold text-ink">
                        {formatValue(team.draftPickValue)}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Starters</p>
                      <p className="text-sm font-bold text-ink">
                        {team.starterCount}
                      </p>
                    </div>
                    <div className="rounded-md bg-mist px-3 py-2">
                      <p className="text-xs text-ink/50">Avg age</p>
                      <p className="text-sm font-bold text-ink">
                        {team.averageAge ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-ink/10 bg-mist p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink">Draft picks</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(getPickBucketCounts(team.draftPicks)).map(
                        ([round, count]) => (
                          <span
                            key={`${team.rosterId}-${round}`}
                            className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink/60"
                          >
                            {round}: {count}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[...team.draftPicks]
                      .sort((firstPick, secondPick) => {
                        return (
                          firstPick.season.localeCompare(secondPick.season) ||
                          firstPick.round - secondPick.round ||
                          firstPick.originalRosterId - secondPick.originalRosterId
                        );
                      })
                      .map((pick) => (
                        <span
                          key={`${team.rosterId}-${pick.season}-${pick.round}-${pick.originalRosterId}`}
                          className="rounded-md bg-white px-2 py-1 text-xs font-bold text-ink/65"
                        >
                          {pick.label}
                          {pick.originalRosterId !== team.rosterId
                            ? ` from R${pick.originalRosterId}`
                            : ""}
                        </span>
                      ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ink/50">
                    Pick value is included in the power score, but the team label
                    separates current starters from future capital.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-4">
                  {positionColumns.map((position) => {
                    const players = team.playersByPosition[position] ?? [];
                    const positionValue = getPositionValue(players);
                    const positionRank = positionRankings[position]?.[team.rosterId];

                    return (
                      <div key={position} className="min-w-0">
                        <div className="mb-2 flex items-center justify-between gap-2 border-b border-ink/10 pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-ink">
                                {position}
                              </p>
                              {positionRank ? (
                                <span className="rounded-full bg-skyglass px-2 py-0.5 text-xs font-bold text-ink">
                                  #{positionRank} {position}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs text-ink/45">
                              {players.length} players
                            </p>
                          </div>
                          <span className="text-sm font-bold text-ink">
                            {formatValue(positionValue)}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {players.map((player) => (
                            <PlayerRow key={player.playerId} player={player} />
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
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Rows3 className="h-4 w-4 text-moss" aria-hidden="true" />
              Roster slots
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.rosterPositions.map((slot, index) => (
                <span
                  key={`${slot}-${index}`}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    index < data.starterSlots.length
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-mist text-ink/55",
                  )}
                >
                  {formatSlot(slot)}
                </span>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
