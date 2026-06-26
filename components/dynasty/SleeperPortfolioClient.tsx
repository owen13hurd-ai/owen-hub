"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import clsx from "clsx";

import type {
  SleeperLeagueSummary,
  SleeperRosterAsset,
} from "@/lib/dynasty/sleeper";

type ExposureRow = {
  id: string;
  leagues: string[];
  name: string;
  personalRank: number | null;
  playerId: string;
  playerValue: number;
  position: string;
  positionRank: string | null;
  shareCount: number;
  team: string | null;
  valueExposure: number;
};

type PortfolioFilter = "All" | "QB" | "RB" | "WR" | "TE" | "High Exposure";

const filters: PortfolioFilter[] = ["All", "QB", "RB", "WR", "TE", "High Exposure"];

function buildExposureRows(assets: SleeperRosterAsset[]) {
  const rowsByPlayerId = new Map<string, ExposureRow>();

  assets.forEach((asset) => {
    const existingRow = rowsByPlayerId.get(asset.playerId);

    if (existingRow) {
      existingRow.leagues.push(asset.leagueName);
      existingRow.shareCount += 1;
      existingRow.valueExposure = Number(
        (existingRow.shareCount * existingRow.playerValue).toFixed(2),
      );
      return;
    }

    const playerValue = asset.value ?? 0;

    rowsByPlayerId.set(asset.playerId, {
      id: asset.playerId,
      leagues: [asset.leagueName],
      name: asset.name,
      personalRank: asset.personalRank,
      playerId: asset.playerId,
      playerValue,
      position: asset.position,
      positionRank: asset.positionRank,
      shareCount: 1,
      team: asset.team,
      valueExposure: playerValue,
    });
  });

  return Array.from(rowsByPlayerId.values()).sort((a, b) => {
    return (
      b.valueExposure - a.valueExposure ||
      b.shareCount - a.shareCount ||
      a.name.localeCompare(b.name)
    );
  });
}

function formatValue(value: number) {
  return value.toFixed(2);
}

export function SleeperPortfolioClient({
  leagues,
  rosterAssets,
}: {
  leagues: SleeperLeagueSummary[];
  rosterAssets: SleeperRosterAsset[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PortfolioFilter>("All");
  const [selectedLeagueIds, setSelectedLeagueIds] = useState(
    () => new Set(leagues.map((league) => league.id)),
  );

  const selectedAssets = useMemo(() => {
    return rosterAssets.filter((asset) => selectedLeagueIds.has(asset.leagueId));
  }, [rosterAssets, selectedLeagueIds]);

  const exposureRows = useMemo(() => {
    return buildExposureRows(selectedAssets);
  }, [selectedAssets]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exposureRows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.leagues.some((league) => league.toLowerCase().includes(normalizedQuery));

      if (!matchesQuery) {
        return false;
      }

      if (filter === "High Exposure") {
        return row.valueExposure >= 10 || (row.shareCount >= 3 && row.playerValue >= 2);
      }

      if (filter !== "All") {
        return row.position === filter;
      }

      return true;
    });
  }, [exposureRows, filter, query]);

  function toggleLeague(leagueId: string) {
    setSelectedLeagueIds((currentLeagueIds) => {
      const nextLeagueIds = new Set(currentLeagueIds);

      if (nextLeagueIds.has(leagueId)) {
        nextLeagueIds.delete(leagueId);
      } else {
        nextLeagueIds.add(leagueId);
      }

      return nextLeagueIds;
    });
  }

  function selectAllLeagues() {
    setSelectedLeagueIds(new Set(leagues.map((league) => league.id)));
  }

  function clearLeagues() {
    setSelectedLeagueIds(new Set());
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search player or league"
            className="h-10 w-full rounded-md border border-ink/10 bg-mist pl-9 pr-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <details className="relative">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-ink/10 bg-white px-3 text-sm font-semibold text-ink transition hover:bg-skyglass">
              Leagues
              <span className="text-xs text-ink/45">
                {selectedLeagueIds.size}/{leagues.length}
              </span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-ink/10 bg-white p-3 shadow-soft">
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={selectAllLeagues}
                  className="h-8 rounded-md bg-ink px-3 text-xs font-bold text-white"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={clearLeagues}
                  className="h-8 rounded-md border border-ink/10 px-3 text-xs font-bold text-ink"
                >
                  None
                </button>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {leagues.map((league) => (
                  <label
                    key={league.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-mist"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeagueIds.has(league.id)}
                      onChange={() => toggleLeague(league.id)}
                      className="mt-1 h-4 w-4 rounded border-ink/20"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        {league.name}
                      </span>
                      {league.totalRosters ? (
                        <span className="text-xs text-ink/45">
                          {league.totalRosters} teams
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </details>

          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={clsx(
                "h-9 rounded-md px-3 text-sm font-semibold transition",
                filter === item
                  ? "bg-ink text-white"
                  : "bg-mist text-ink/70 hover:bg-skyglass hover:text-ink",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-ink/10">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-[0.08em] text-ink/55">
              <tr>
                <th className="px-3 py-3">Player</th>
                <th className="px-3 py-3">Pos</th>
                <th className="px-3 py-3">Team</th>
                <th className="px-3 py-3">Value Held</th>
                <th className="px-3 py-3">Shares</th>
                <th className="px-3 py-3">Value/Share</th>
                <th className="px-3 py-3">Leagues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredRows.map((row) => (
                <tr key={row.id} className="bg-white transition hover:bg-mist/70">
                  <td className="px-3 py-3 font-semibold text-ink">{row.name}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-skyglass px-2 py-1 text-xs font-bold text-ink">
                      {row.positionRank ?? row.position}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-ink/70">{row.team ?? "-"}</td>
                  <td className="px-3 py-3 font-semibold text-ink">
                    {formatValue(row.valueExposure)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-ink">
                    {row.shareCount}
                  </td>
                  <td className="px-3 py-3 text-ink/70">
                    {row.playerValue > 0 ? formatValue(row.playerValue) : "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-xl flex-wrap gap-1.5">
                      {row.leagues.slice(0, 6).map((league, index) => (
                        <span
                          key={`${row.id}-${league}-${index}`}
                          className="rounded-md bg-mist px-2 py-1 text-xs font-medium text-ink/70"
                        >
                          {league}
                        </span>
                      ))}
                      {row.leagues.length > 6 ? (
                        <span className="rounded-md bg-ink/5 px-2 py-1 text-xs font-bold text-ink/55">
                          +{row.leagues.length - 6}
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-ink/55">
        This view pulls your Sleeper rosters live and recalculates exposure based
        on the leagues selected above. Players are sorted by total personal value
        held first, then by share count.
      </p>
    </section>
  );
}
