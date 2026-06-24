"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Database,
  GripVertical,
  Search,
} from "lucide-react";
import clsx from "clsx";

import type {
  DynastyRanking,
  DynastyTier,
  MarketSourceSummary,
  Position,
  SourceStatus,
} from "@/types/dynasty";

const positions: Position[] = ["ALL", "QB", "RB", "WR", "TE"];

type RankingRow = {
  id: string;
  playerId: string;
  type: "player";
};

type TierRow = {
  id: string;
  tierId: string;
  type: "tier";
};

type TableRow = RankingRow | TierRow;

type AssignedTier = {
  label: string;
  pickValue: number | null;
  pickValueLabel: string;
};

type DragState = {
  rowId: string;
  scope: Position;
} | null;

const tierColors = [
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-skyglass text-ink border-skyglass",
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-rose-100 text-rose-900 border-rose-200",
  "bg-violet-100 text-violet-900 border-violet-200",
  "bg-slate-100 text-slate-900 border-slate-200",
];

function formatDelta(delta: number | null) {
  if (delta === null) {
    return "-";
  }

  return delta > 0 ? `+${delta}` : `${delta}`;
}

function getSignalClass(signal: string) {
  if (signal.toLowerCase().includes("buy")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (signal.toLowerCase().includes("sell")) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-skyglass text-ink ring-ink/10";
}

function getDeltaIcon(delta: number | null) {
  if (delta === null || delta === 0) {
    return null;
  }

  return delta > 0 ? (
    <ArrowUp className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
  );
}

function getSourceClass(status: SourceStatus["status"]) {
  if (status === "live") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (status === "error") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  if (status === "fallback") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-dashed border-ink/20 bg-white text-ink";
}

function SourceCard({ source }: { source: SourceStatus }) {
  return (
    <div className={clsx("rounded-md border p-3", getSourceClass(source.status))}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.1em]">
          {source.label}
        </p>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold uppercase">
          {source.status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 opacity-75">{source.detail}</p>
    </div>
  );
}

function buildRowsForScope({
  rankings,
  scope,
  tiers,
}: {
  rankings: DynastyRanking[];
  scope: Position;
  tiers: DynastyTier[];
}) {
  const rows: TableRow[] = [];
  const scopedRankings =
    scope === "ALL"
      ? rankings
      : rankings.filter((ranking) => ranking.position === scope);
  const scopedTiers = tiers.filter((tier) => tier.scope === scope);
  const tierByPickValueLabel = new Map(
    scopedTiers.map((tier) => [tier.pickValueLabel, tier]),
  );
  const placedTierIds = new Set<string>();

  scopedRankings.forEach((ranking) => {
    const tier = tierByPickValueLabel.get(ranking.importedTier);

    if (tier && !placedTierIds.has(tier.id)) {
      rows.push({
        id: `tier-row-${tier.id}`,
        tierId: tier.id,
        type: "tier",
      });
      placedTierIds.add(tier.id);
    }

    rows.push({
      id: `player-row-${scope}-${ranking.id}`,
      playerId: ranking.id,
      type: "player",
    });
  });

  return rows;
}

function reorderRows(rows: TableRow[], draggedId: string, targetId: string) {
  const draggedIndex = rows.findIndex((row) => row.id === draggedId);
  const targetIndex = rows.findIndex((row) => row.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return rows;
  }

  const nextRows = [...rows];
  const [draggedRow] = nextRows.splice(draggedIndex, 1);
  nextRows.splice(targetIndex, 0, draggedRow);

  return nextRows;
}

export function DynastyRankingsClient({
  initialRankings,
  initialTiers,
  sources,
}: {
  initialRankings: DynastyRanking[];
  initialTiers: DynastyTier[];
  sources: MarketSourceSummary;
}) {
  const rankingsById = useMemo(() => {
    return new Map(initialRankings.map((ranking) => [ranking.id, ranking]));
  }, [initialRankings]);

  const tiersById = useMemo(() => {
    return new Map(initialTiers.map((tier) => [tier.id, tier]));
  }, [initialTiers]);

  const [rowsByScope, setRowsByScope] = useState<Record<Position, TableRow[]>>(
    () => ({
      ALL: buildRowsForScope({
        rankings: initialRankings,
        scope: "ALL",
        tiers: initialTiers,
      }),
      QB: buildRowsForScope({
        rankings: initialRankings,
        scope: "QB",
        tiers: initialTiers,
      }),
      RB: buildRowsForScope({
        rankings: initialRankings,
        scope: "RB",
        tiers: initialTiers,
      }),
      WR: buildRowsForScope({
        rankings: initialRankings,
        scope: "WR",
        tiers: initialTiers,
      }),
      TE: buildRowsForScope({
        rankings: initialRankings,
        scope: "TE",
        tiers: initialTiers,
      }),
    }),
  );
  const [position, setPosition] = useState<Position>("ALL");
  const [query, setQuery] = useState("");
  const [dragState, setDragState] = useState<DragState>(null);

  const overallPlayerRows = useMemo(() => {
    return rowsByScope.ALL.filter(
      (row): row is RankingRow => row.type === "player",
    );
  }, [rowsByScope.ALL]);

  const overallRankByPlayerId = useMemo(() => {
    return new Map(
      overallPlayerRows.map((row, index) => [row.playerId, index + 1]),
    );
  }, [overallPlayerRows]);

  const assignedTierByPlayerId = useMemo(() => {
    const assignments = new Map<string, AssignedTier>();
    let activeTier: AssignedTier | null = null;

    rowsByScope.ALL.forEach((row) => {
      if (row.type === "tier") {
        const tier = tiersById.get(row.tierId);
        activeTier = tier
          ? {
              label: tier.label,
              pickValue: tier.pickValue,
              pickValueLabel: tier.pickValueLabel,
            }
          : null;
        return;
      }

      if (activeTier) {
        assignments.set(row.playerId, activeTier);
      }
    });

    return assignments;
  }, [rowsByScope.ALL, tiersById]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = rowsByScope[position];

    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) => {
      if (row.type === "tier") {
        return false;
      }

      const ranking = rankingsById.get(row.playerId);

      return (
        ranking?.player.toLowerCase().includes(normalizedQuery) ||
        ranking?.team.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [position, query, rankingsById, rowsByScope]);

  function moveRow(targetId: string) {
    if (!dragState || dragState.scope !== position || dragState.rowId === targetId) {
      return;
    }

    setRowsByScope((currentRowsByScope) => ({
      ...currentRowsByScope,
      [position]: reorderRows(
        currentRowsByScope[position],
        dragState.rowId,
        targetId,
      ),
    }));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Players</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {initialRankings.length}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Hard buys</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {
              initialRankings.filter((ranking) =>
                ranking.buySellHold.toLowerCase().includes("hard buy"),
              ).length
            }
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Hard sells</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">
            {
              initialRankings.filter((ranking) =>
                ranking.buySellHold.toLowerCase().includes("hard sell"),
              ).length
            }
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Market sources</p>
          <p className="mt-1 text-2xl font-bold text-ink">3</p>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Market comparison
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              KTC and FantasyCalc
            </h2>
          </div>
          <Database className="h-5 w-5 text-ink/45" aria-hidden="true" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <SourceCard source={sources.ktc} />
          <SourceCard source={sources.fantasyCalc} />
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search player or team"
              className="h-10 w-full rounded-md border border-ink/10 bg-mist pl-9 pr-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {positions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPosition(item)}
                className={clsx(
                  "h-9 rounded-md px-3 text-sm font-semibold transition",
                  position === item
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
            <table className="min-w-[960px] w-full border-collapse text-left text-sm">
              <thead className="bg-mist text-xs uppercase tracking-[0.08em] text-ink/55">
                <tr>
                  <th className="w-10 px-3 py-3" aria-label="Drag handle" />
                  <th className="px-3 py-3">Rank</th>
                  <th className="px-3 py-3">Player</th>
                  <th className="px-3 py-3">Pos</th>
                  <th className="px-3 py-3">Age</th>
                  <th className="px-3 py-3">Team</th>
                  <th className="px-3 py-3">KTC</th>
                  <th className="px-3 py-3">FantasyCalc</th>
                  <th className="px-3 py-3">Delta</th>
                  <th className="px-3 py-3">Signal</th>
                  <th className="px-3 py-3">Pick value</th>
                  <th className="px-3 py-3">RBV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {visibleRows.map((row) => {
                  if (row.type === "tier") {
                    const tier = tiersById.get(row.tierId);
                    const tierIndex = rowsByScope[position]
                      .filter((scopeRow) => scopeRow.type === "tier")
                      .findIndex((tierRow) => tierRow.id === row.id);
                    const colorClass =
                      tierColors[Math.max(tierIndex, 0) % tierColors.length];

                    return (
                      <tr
                        key={row.id}
                        draggable
                        onDragStart={() =>
                          setDragState({ rowId: row.id, scope: position })
                        }
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => moveRow(row.id)}
                        onDragEnd={() => setDragState(null)}
                        className={clsx(
                          "bg-white",
                          dragState?.rowId === row.id && "opacity-40",
                        )}
                      >
                        <td colSpan={12} className="px-3 py-2">
                          <div
                            className={clsx(
                              "flex items-center gap-3 rounded-md border px-3 py-2",
                              colorClass,
                            )}
                          >
                            <GripVertical
                              className="h-4 w-4 shrink-0 opacity-60"
                              aria-hidden="true"
                            />
                            <span className="text-xs font-bold uppercase tracking-[0.12em]">
                              {tier?.label ?? "Tier"}
                            </span>
                            {position === "ALL" ? (
                              <span className="text-xs font-semibold opacity-75">
                                {`${tier?.pickValueLabel ?? "Pick value"} · RBV ${
                                  tier?.pickValue ?? "placeholder"
                                }`}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const ranking = rankingsById.get(row.playerId);

                  if (!ranking) {
                    return null;
                  }

                  const assignedTier = assignedTierByPlayerId.get(ranking.id);

                  return (
                    <tr
                      key={row.id}
                      draggable
                      onDragStart={() =>
                        setDragState({ rowId: row.id, scope: position })
                      }
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => moveRow(row.id)}
                      onDragEnd={() => setDragState(null)}
                      className={clsx(
                        "bg-white transition hover:bg-mist/70",
                        dragState?.rowId === row.id && "opacity-40",
                      )}
                    >
                      <td className="px-3 py-3 text-ink/35">
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      </td>
                      <td className="px-3 py-3 font-semibold text-ink">
                        {overallRankByPlayerId.get(ranking.id) ?? "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-semibold text-ink">
                            {ranking.player}
                          </p>
                          <p className="text-xs text-ink/45">
                            {ranking.rookiePick}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-skyglass px-2 py-1 text-xs font-bold text-ink">
                          {ranking.positionRank}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-ink/70">
                        {ranking.age ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-ink/70">{ranking.team}</td>
                      <td className="px-3 py-3 text-ink/70">
                        {ranking.ktcRank ?? "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-semibold text-ink">
                            {ranking.fantasyCalcRank ?? "-"}
                          </p>
                          {ranking.fantasyCalcValue ? (
                            <p className="text-xs text-ink/45">
                              {ranking.fantasyCalcValue}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink">
                          {getDeltaIcon(ranking.ktcDelta)}
                          {formatDelta(ranking.ktcDelta)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={clsx(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                            getSignalClass(ranking.buySellHold),
                          )}
                        >
                          {ranking.buySellHold}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-ink">
                        {assignedTier?.pickValueLabel ?? ranking.importedTier}
                      </td>
                      <td className="px-3 py-3 text-ink/70">
                        {assignedTier?.pickValue ??
                          ranking.relativeBaseValue ??
                          "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-ink/55">
          On ALL, tier bars control the pick value assigned to every player
          between that tier and the next tier. On position pages, tier bars are
          separate visual separators and do not change pick value.
        </p>
      </section>
    </div>
  );
}
