"use client";

import {
  type DragEvent as ReactDragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Search,
  X,
} from "lucide-react";
import clsx from "clsx";

import { saveDynastyBoard } from "@/app/dashboard/dynasty/actions";
import type {
  DynastyBoardRow,
  DynastyOwnershipSummary,
  DynastyRanking,
  DynastyRowsByScope,
  DynastyTier,
  MarketSourceSummary,
  Position,
} from "@/types/dynasty";

const positions: Position[] = ["ALL", "QB", "RB", "WR", "TE"];

type AssignedTier = {
  label: string;
  pickValue: number | null;
  pickValueLabel: string;
};

type MarketSignal = {
  detail: string;
  edge: number | null;
  label: "Hard Buy" | "Soft Buy" | "Hold" | "Soft Sell" | "Hard Sell";
  sourceCount: number;
};

type HeatMapSignal = {
  detail: string;
  label:
    | "Priority Buy"
    | "Target"
    | "Risk Watch"
    | "Trim"
    | "Overexposed"
    | "Balanced"
    | "Light"
    | "No Shares"
    | "No Data";
};

type SaveState = "saved" | "pending" | "saving" | "error";

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
const dragScrollEdgeSize = 120;
const dragScrollMaxSpeed = 24;

function formatDelta(delta: number | null) {
  if (delta === null) {
    return "-";
  }

  return delta > 0 ? `+${delta}` : `${delta}`;
}

function formatRankAsRookiePick(rank: number) {
  const round = Math.floor((rank - 1) / 12) + 1;
  const pick = ((rank - 1) % 12) + 1;
  return `${round}.${String(pick).padStart(2, "0")}`;
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

function getHeatMapClass(signal: HeatMapSignal["label"]) {
  if (signal === "Priority Buy" || signal === "Target") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (signal === "Risk Watch" || signal === "Trim") {
    return "bg-rose-50 text-rose-800 ring-rose-200";
  }

  if (signal === "Overexposed") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }

  if (signal === "No Shares" || signal === "Light") {
    return "bg-skyglass text-ink ring-ink/10";
  }

  if (signal === "No Data") {
    return "bg-mist text-ink/55 ring-ink/10";
  }

  return "bg-white text-ink ring-ink/10";
}

function getMarketSignal({
  currentRank,
  ranking,
}: {
  currentRank: number;
  ranking: DynastyRanking;
}): MarketSignal {
  const marketRanks = [ranking.ktcRank, ranking.fantasyCalcRank].filter(
    (rank): rank is number => typeof rank === "number",
  );

  if (marketRanks.length === 0) {
    return {
      detail: "No live market rank yet",
      edge: null,
      label: "Hold",
      sourceCount: 0,
    };
  }

  const marketAverage =
    marketRanks.reduce((total, rank) => total + rank, 0) / marketRanks.length;
  const edge = Math.round(marketAverage - currentRank);
  const sourceText = `${marketRanks.length} source${
    marketRanks.length === 1 ? "" : "s"
  }`;

  if (edge >= 24) {
    return {
      detail: `You are ${edge} spots higher than market across ${sourceText}`,
      edge,
      label: "Hard Buy",
      sourceCount: marketRanks.length,
    };
  }

  if (edge >= 12) {
    return {
      detail: `You are ${edge} spots higher than market across ${sourceText}`,
      edge,
      label: "Soft Buy",
      sourceCount: marketRanks.length,
    };
  }

  if (edge <= -24) {
    return {
      detail: `Market is ${Math.abs(edge)} spots higher than you across ${sourceText}`,
      edge,
      label: "Hard Sell",
      sourceCount: marketRanks.length,
    };
  }

  if (edge <= -12) {
    return {
      detail: `Market is ${Math.abs(edge)} spots higher than you across ${sourceText}`,
      edge,
      label: "Soft Sell",
      sourceCount: marketRanks.length,
    };
  }

  return {
    detail: `Close to market across ${sourceText}`,
    edge,
    label: "Hold",
    sourceCount: marketRanks.length,
  };
}

function getHeatMapSignal({
  marketSignal,
  ownership,
}: {
  marketSignal: MarketSignal;
  ownership: DynastyOwnershipSummary | undefined;
}): HeatMapSignal {
  if (!ownership || ownership.leagueCount === 0) {
    return {
      detail: "No Sleeper league data loaded",
      label: "No Data",
    };
  }

  const isBuy =
    marketSignal.label === "Hard Buy" || marketSignal.label === "Soft Buy";
  const isSell =
    marketSignal.label === "Hard Sell" || marketSignal.label === "Soft Sell";

  if (isBuy && ownership.exposure === 0) {
    return {
      detail: "Buy signal and no current shares",
      label: "Priority Buy",
    };
  }

  if (isBuy && ownership.percent <= 25) {
    return {
      detail: "Buy signal with light exposure",
      label: "Target",
    };
  }

  if (isSell && ownership.percent >= 50) {
    return {
      detail: "Sell signal with heavy exposure",
      label: "Risk Watch",
    };
  }

  if (isSell && ownership.percent >= 25) {
    return {
      detail: "Sell signal with meaningful exposure",
      label: "Trim",
    };
  }

  if (ownership.percent >= 75) {
    return {
      detail: "Very high portfolio exposure",
      label: "Overexposed",
    };
  }

  if (ownership.exposure === 0) {
    return {
      detail: "No current roster shares",
      label: "No Shares",
    };
  }

  if (ownership.percent <= 20) {
    return {
      detail: "Small portfolio position",
      label: "Light",
    };
  }

  return {
    detail: "Exposure fits current signal",
    label: "Balanced",
  };
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

function PlayerDetailDrawer({
  assignedTier,
  heatMapSignal,
  marketSignal,
  onClose,
  ownership,
  ranking,
  rank,
  rookiePick,
}: {
  assignedTier: AssignedTier | undefined;
  heatMapSignal: HeatMapSignal | undefined;
  marketSignal: MarketSignal | undefined;
  onClose: () => void;
  ownership: DynastyOwnershipSummary | undefined;
  ranking: DynastyRanking;
  rank: number | undefined;
  rookiePick: string;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-ink/30 p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="ml-auto flex h-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">
              Player detail
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ink">{ranking.player}</h2>
            <p className="mt-1 text-sm text-ink/55">
              {ranking.team || "FA"} · {ranking.positionRank} · Overall #
              {rank ?? ranking.overallRank}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-mist text-ink/55 hover:bg-skyglass hover:text-ink"
            aria-label="Close player detail"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-mist p-3">
              <p className="text-xs text-ink/50">Your rank · {rookiePick}</p>
              <p className="mt-1 text-xl font-bold text-ink">
                #{rank ?? ranking.overallRank}
              </p>
            </div>
            <div className="rounded-md bg-mist p-3">
              <p className="text-xs text-ink/50">Market rank</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {ranking.ktcRank ?? ranking.fantasyCalcRank ?? "-"}
              </p>
            </div>
            <div className="rounded-md bg-mist p-3">
              <p className="text-xs text-ink/50">Own</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {ownership ? `${ownership.percent}%` : "-"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink/10 p-3">
              <p className="text-sm font-bold text-ink">Market read</p>
              <span
                className={clsx(
                  "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                  getSignalClass(marketSignal?.label ?? "Hold"),
                )}
              >
                {marketSignal?.label ?? "Hold"}
              </span>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                {marketSignal?.detail ?? "No market signal yet."}
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 p-3">
              <p className="text-sm font-bold text-ink">Portfolio read</p>
              <span
                className={clsx(
                  "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                  getHeatMapClass(heatMapSignal?.label ?? "No Data"),
                )}
              >
                {heatMapSignal?.label ?? "No Data"}
              </span>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                {heatMapSignal?.detail ?? "No portfolio signal yet."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 p-3">
            <p className="text-sm font-bold text-ink">Value snapshot</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p className="rounded-md bg-mist px-3 py-2 text-sm text-ink/70">
                KTC: <span className="font-bold text-ink">{ranking.ktcRank ?? "-"}</span>
              </p>
              <p className="rounded-md bg-mist px-3 py-2 text-sm text-ink/70">
                FantasyCalc:{" "}
                <span className="font-bold text-ink">
                  {ranking.fantasyCalcRank ?? "-"}
                </span>
              </p>
              <p className="rounded-md bg-mist px-3 py-2 text-sm text-ink/70">
                Value tier:{" "}
                <span className="font-bold text-ink">
                  {assignedTier?.pickValueLabel ?? ranking.importedTier}
                </span>
              </p>
              <p className="rounded-md bg-mist px-3 py-2 text-sm text-ink/70">
                RBV:{" "}
                <span className="font-bold text-ink">
                  {assignedTier?.pickValue ?? ranking.relativeBaseValue ?? "-"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-ink/20 bg-mist p-3">
            <p className="text-sm font-bold text-ink">Next layer</p>
            <p className="mt-1 text-sm leading-6 text-ink/55">
              This drawer is ready for player notes, news blurbs, and trade
              history once we add those feeds.
            </p>
          </div>
        </div>
      </div>
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
  const rows: DynastyBoardRow[] = [];
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

function buildDefaultRowsByScope({
  rankings,
  tiers,
}: {
  rankings: DynastyRanking[];
  tiers: DynastyTier[];
}): DynastyRowsByScope {
  return {
    ALL: buildRowsForScope({
      rankings,
      scope: "ALL",
      tiers,
    }),
    QB: buildRowsForScope({
      rankings,
      scope: "QB",
      tiers,
    }),
    RB: buildRowsForScope({
      rankings,
      scope: "RB",
      tiers,
    }),
    WR: buildRowsForScope({
      rankings,
      scope: "WR",
      tiers,
    }),
    TE: buildRowsForScope({
      rankings,
      scope: "TE",
      tiers,
    }),
  };
}

function getInitialRowsByScope({
  defaultRowsByScope,
  savedRowsByScope,
}: {
  defaultRowsByScope: DynastyRowsByScope;
  savedRowsByScope: DynastyRowsByScope | null;
}) {
  if (!savedRowsByScope) {
    return defaultRowsByScope;
  }

  const nextRowsByScope = { ...defaultRowsByScope };

  positions.forEach((scope) => {
    const defaultRows = defaultRowsByScope[scope];
    const savedRows = savedRowsByScope[scope];
    const defaultRowIds = new Set(defaultRows.map((row) => row.id));
    const savedRowIds = new Set(savedRows.map((row) => row.id));

    nextRowsByScope[scope] = [
      ...savedRows.filter((row) => defaultRowIds.has(row.id)),
      // New market players should join an established personal board, but
      // omitted tier markers are intentional—the saved board owns its breaks.
      ...defaultRows.filter(
        (row) => row.type === "player" && !savedRowIds.has(row.id),
      ),
    ];
  });

  return nextRowsByScope;
}

function reorderRows(
  rows: DynastyBoardRow[],
  draggedId: string,
  targetId: string,
) {
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
  initialRowsByScope,
  ownershipByPlayerId,
  sources,
}: {
  initialRankings: DynastyRanking[];
  initialTiers: DynastyTier[];
  initialRowsByScope: DynastyRowsByScope | null;
  ownershipByPlayerId: Record<string, DynastyOwnershipSummary> | null;
  sources: MarketSourceSummary;
}) {
  const defaultRowsByScope = useMemo(() => {
    return buildDefaultRowsByScope({
      rankings: initialRankings,
      tiers: initialTiers,
    });
  }, [initialRankings, initialTiers]);

  const rankingsById = useMemo(() => {
    return new Map(initialRankings.map((ranking) => [ranking.id, ranking]));
  }, [initialRankings]);

  const tiersById = useMemo(() => {
    return new Map(initialTiers.map((tier) => [tier.id, tier]));
  }, [initialTiers]);

  const [rowsByScope, setRowsByScope] = useState<DynastyRowsByScope>(
    () =>
      getInitialRowsByScope({
        defaultRowsByScope,
        savedRowsByScope: initialRowsByScope,
      }),
  );
  const [position, setPosition] = useState<Position>("ALL");
  const [rookiesOnly, setRookiesOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [saveState, setSaveState] = useState<SaveState>(
    initialRowsByScope ? "saved" : "pending",
  );
  const [saveMessage, setSaveMessage] = useState(
    initialRowsByScope
      ? "Loaded saved board"
      : "Starter board has not been saved yet",
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const rowsByScopeRef = useRef(rowsByScope);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragScrollFrameRef = useRef<number | null>(null);
  const dragScrollSpeedRef = useRef(0);
  const tickDragAutoScrollRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    rowsByScopeRef.current = rowsByScope;
  }, [rowsByScope]);

  const saveRowsNow = useCallback(async (rowsToSave = rowsByScopeRef.current) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setSaveState("saving");
    setSaveMessage("Saving changes...");

    const result = await saveDynastyBoard(rowsToSave);

    if (result.ok) {
      setSaveState("saved");
      setSaveMessage("Saved");
      setLastSavedAt(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
      return;
    }

    setSaveState("error");
    setSaveMessage(result.message);
  }, []);

  const queueAutosave = useCallback(
    (nextRowsByScope: DynastyRowsByScope) => {
      rowsByScopeRef.current = nextRowsByScope;
      setSaveState("pending");
      setSaveMessage("Unsaved changes");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        void saveRowsNow(nextRowsByScope);
      }, 1000);
    },
    [saveRowsNow],
  );

  const syncToMarketOrder = useCallback(() => {
    if (!window.confirm("Replace your saved player order with the current FantasyCalc market order?")) return;
    setRowsByScope(defaultRowsByScope);
    rowsByScopeRef.current = defaultRowsByScope;
    void saveRowsNow(defaultRowsByScope);
  }, [defaultRowsByScope, saveRowsNow]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const stopDragAutoScroll = useCallback(() => {
    dragScrollSpeedRef.current = 0;

    if (dragScrollFrameRef.current) {
      window.cancelAnimationFrame(dragScrollFrameRef.current);
      dragScrollFrameRef.current = null;
    }
  }, []);

  const tickDragAutoScroll = useCallback(() => {
    const speed = dragScrollSpeedRef.current;

    if (speed === 0) {
      dragScrollFrameRef.current = null;
      return;
    }

    window.scrollBy({ top: speed });
    dragScrollFrameRef.current = window.requestAnimationFrame(() =>
      tickDragAutoScrollRef.current(),
    );
  }, []);

  useEffect(() => {
    tickDragAutoScrollRef.current = tickDragAutoScroll;
  }, [tickDragAutoScroll]);

  const updateDragAutoScroll = useCallback(
    (clientY: number) => {
      const viewportHeight = window.innerHeight;
      const distanceFromTop = clientY;
      const distanceFromBottom = viewportHeight - clientY;
      let nextSpeed = 0;

      if (distanceFromTop < dragScrollEdgeSize) {
        const intensity = (dragScrollEdgeSize - distanceFromTop) / dragScrollEdgeSize;
        nextSpeed = -Math.ceil(intensity * dragScrollMaxSpeed);
      } else if (distanceFromBottom < dragScrollEdgeSize) {
        const intensity =
          (dragScrollEdgeSize - distanceFromBottom) / dragScrollEdgeSize;
        nextSpeed = Math.ceil(intensity * dragScrollMaxSpeed);
      }

      dragScrollSpeedRef.current = nextSpeed;

      if (nextSpeed !== 0 && !dragScrollFrameRef.current) {
        dragScrollFrameRef.current =
          window.requestAnimationFrame(tickDragAutoScroll);
      }
    },
    [tickDragAutoScroll],
  );

  useEffect(() => {
    if (!dragState) {
      stopDragAutoScroll();
      return;
    }

    function handleWindowDragOver(event: DragEvent) {
      updateDragAutoScroll(event.clientY);
    }

    window.addEventListener("dragover", handleWindowDragOver);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      stopDragAutoScroll();
    };
  }, [dragState, stopDragAutoScroll, updateDragAutoScroll]);

  const overallPlayerRows = useMemo(() => {
    return rowsByScope.ALL.filter(
      (row) => row.type === "player",
    );
  }, [rowsByScope.ALL]);

  const overallRankByPlayerId = useMemo(() => {
    return new Map(
      overallPlayerRows.map((row, index) => [row.playerId, index + 1]),
    );
  }, [overallPlayerRows]);

  const positionRankByPlayerId = useMemo(() => {
    const ranks = new Map<string, number>();

    (["QB", "RB", "WR", "TE"] as const).forEach((scope) => {
      rowsByScope[scope]
        .filter((row) => row.type === "player")
        .forEach((row, index) => ranks.set(row.playerId, index + 1));
    });

    return ranks;
  }, [rowsByScope]);

  const rookiePickByPlayerId = useMemo(() => {
    return new Map(
      Array.from(overallRankByPlayerId, ([playerId, rank]) => [
        playerId,
        formatRankAsRookiePick(rank),
      ]),
    );
  }, [overallRankByPlayerId]);

  const ktcDeltaByPlayerId = useMemo(() => {
    return new Map(
      initialRankings.map((ranking) => {
        const currentRank =
          overallRankByPlayerId.get(ranking.id) ?? ranking.overallRank;
        return [
          ranking.id,
          ranking.ktcRank === null ? null : ranking.ktcRank - currentRank,
        ];
      }),
    );
  }, [initialRankings, overallRankByPlayerId]);

  const marketSignalByPlayerId = useMemo(() => {
    const signals = new Map<string, MarketSignal>();

    initialRankings.forEach((ranking) => {
      signals.set(
        ranking.id,
        getMarketSignal({
          currentRank: overallRankByPlayerId.get(ranking.id) ?? ranking.overallRank,
          ranking,
        }),
      );
    });

    return signals;
  }, [initialRankings, overallRankByPlayerId]);

  const signalCounts = useMemo(() => {
    const counts = {
      hardBuys: 0,
      hardSells: 0,
    };

    marketSignalByPlayerId.forEach((signal) => {
      if (signal.label === "Hard Buy") {
        counts.hardBuys += 1;
      }

      if (signal.label === "Hard Sell") {
        counts.hardSells += 1;
      }
    });

    return counts;
  }, [marketSignalByPlayerId]);

  const heatMapByPlayerId = useMemo(() => {
    const signals = new Map<string, HeatMapSignal>();

    initialRankings.forEach((ranking) => {
      const marketSignal = marketSignalByPlayerId.get(ranking.id);

      signals.set(
        ranking.id,
        getHeatMapSignal({
          marketSignal:
            marketSignal ??
            getMarketSignal({
              currentRank: ranking.overallRank,
              ranking,
            }),
          ownership: ownershipByPlayerId?.[ranking.id],
        }),
      );
    });

    return signals;
  }, [initialRankings, marketSignalByPlayerId, ownershipByPlayerId]);

  const heatMapCounts = useMemo(() => {
    const counts = {
      overexposed: 0,
      priorityBuys: 0,
      riskWatches: 0,
      targets: 0,
    };

    heatMapByPlayerId.forEach((signal) => {
      if (signal.label === "Priority Buy") {
        counts.priorityBuys += 1;
      }

      if (signal.label === "Target") {
        counts.targets += 1;
      }

      if (signal.label === "Risk Watch") {
        counts.riskWatches += 1;
      }

      if (signal.label === "Overexposed") {
        counts.overexposed += 1;
      }
    });

    return counts;
  }, [heatMapByPlayerId]);

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

    if (!normalizedQuery && !rookiesOnly) {
      return rows;
    }

    return rows.filter((row) => {
      if (row.type === "tier") {
        return false;
      }

      const ranking = rankingsById.get(row.playerId);

      if (rookiesOnly && !ranking?.isRookie) return false;

      if (!normalizedQuery) return true;

      return (
        ranking?.player.toLowerCase().includes(normalizedQuery) ||
        ranking?.team.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [position, query, rankingsById, rookiesOnly, rowsByScope]);

  function moveRow(targetId: string) {
    if (!dragState || dragState.scope !== position || dragState.rowId === targetId) {
      return;
    }

    setRowsByScope((currentRowsByScope) => {
      const nextRowsByScope = {
        ...currentRowsByScope,
        [position]: reorderRows(
          currentRowsByScope[position],
          dragState.rowId,
          targetId,
        ),
      };

      queueAutosave(nextRowsByScope);
      return nextRowsByScope;
    });
  }

  function startRowDrag(rowId: string) {
    setDragState({ rowId, scope: position });
  }

  function handleRowDragOver(event: ReactDragEvent<HTMLTableRowElement>) {
    event.preventDefault();
    updateDragAutoScroll(event.clientY);
  }

  function finishRowDrag() {
    setDragState(null);
    stopDragAutoScroll();
  }

  function dropRow(targetId: string) {
    moveRow(targetId);
    finishRowDrag();
  }

  const selectedRanking = selectedPlayerId
    ? rankingsById.get(selectedPlayerId)
    : undefined;

  return (
    <div className="space-y-6">
      {selectedRanking ? (
        <PlayerDetailDrawer
          assignedTier={assignedTierByPlayerId.get(selectedRanking.id)}
          heatMapSignal={heatMapByPlayerId.get(selectedRanking.id)}
          marketSignal={marketSignalByPlayerId.get(selectedRanking.id)}
          onClose={() => setSelectedPlayerId(null)}
          ownership={ownershipByPlayerId?.[selectedRanking.id]}
          ranking={selectedRanking}
          rank={overallRankByPlayerId.get(selectedRanking.id)}
          rookiePick={
            rookiePickByPlayerId.get(selectedRanking.id) ??
            selectedRanking.rookiePick
          }
        />
      ) : null}

      <section className="rounded-md border border-ink/10 bg-white shadow-soft">
        <div className="grid gap-3 border-b border-ink/10 px-4 py-3 sm:grid-cols-4">
          <div><p className="text-xs font-semibold text-ink/45">Board</p><p className="mt-0.5 text-sm font-bold text-ink">{initialRankings.length} players · {initialRankings.filter((ranking) => ranking.isRookie).length} rookies</p></div>
          <div><p className="text-xs font-semibold text-ink/45">Market edges</p><p className="mt-0.5 text-sm font-bold text-ink"><span className="text-emerald-700">{signalCounts.hardBuys} buys</span> · <span className="text-rose-700">{signalCounts.hardSells} sells</span></p></div>
          <div><p className="text-xs font-semibold text-ink/45">Portfolio</p><p className="mt-0.5 text-sm font-bold text-ink">{heatMapCounts.priorityBuys + heatMapCounts.targets} targets · {heatMapCounts.riskWatches} risks</p></div>
          <div><p className="text-xs font-semibold text-ink/45">Sources</p><p className="mt-0.5 text-sm font-bold text-ink">KTC {sources.ktc.status} · FC {sources.fantasyCalc.status} · Rookies {sources.rookiePool.status}</p></div>
        </div>

        <div className="p-4">
        <div className="grid gap-3">
          <div className="relative w-full">
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

          <div className="flex flex-wrap items-center gap-2">
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
              <button
                type="button"
                aria-pressed={rookiesOnly}
                onClick={() => setRookiesOnly((current) => !current)}
                className={clsx(
                  "h-9 rounded-md px-3 text-sm font-semibold transition active:translate-y-px",
                  rookiesOnly
                    ? "bg-moss text-white"
                    : "bg-mist text-ink/70 hover:bg-skyglass hover:text-ink",
                )}
              >
                Rookies
              </button>
            </div>

            <button
              type="button"
              onClick={syncToMarketOrder}
              className="h-9 rounded-md border border-ink/10 bg-white px-3 text-sm font-semibold text-ink transition hover:bg-skyglass active:translate-y-px"
            >
              Sync to market
            </button>

            <button
              type="button"
              onClick={() => void saveRowsNow()}
              className="h-9 rounded-md border border-ink/10 bg-white px-3 text-sm font-semibold text-ink transition hover:bg-skyglass"
            >
              Save now
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={clsx(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] ring-1",
              saveState === "saved" &&
                "bg-emerald-50 text-emerald-700 ring-emerald-200",
              saveState === "pending" &&
                "bg-amber-50 text-amber-800 ring-amber-200",
              saveState === "saving" && "bg-skyglass text-ink ring-ink/10",
              saveState === "error" && "bg-rose-50 text-rose-700 ring-rose-200",
            )}
          >
            {saveState === "pending"
              ? "Auto-save queued"
              : saveState === "saving"
                ? "Saving"
                : saveState === "error"
                  ? "Save failed"
                  : "Saved"}
          </span>
          <span className="text-ink/55">
            {saveMessage}
            {lastSavedAt ? ` at ${lastSavedAt}` : ""}
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-ink/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-mist text-xs font-semibold text-ink/55">
                <tr>
                  <th className="w-9 px-2 py-2.5" aria-label="Drag handle" />
                  <th className="w-16 px-2 py-2.5">Rank</th>
                  <th className="px-2 py-2.5">Player</th>
                  <th className="px-2 py-2.5">Market</th>
                  <th className="px-2 py-2.5">Gap</th>
                  <th className="px-2 py-2.5">Your read</th>
                  <th className="px-2 py-2.5">Owned</th>
                  <th className="px-2 py-2.5">Tier</th>
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
                        onDragStart={() => startRowDrag(row.id)}
                        onDragOver={handleRowDragOver}
                        onDrop={() => dropRow(row.id)}
                        onDragEnd={finishRowDrag}
                        className={clsx(
                          "bg-white",
                          dragState?.rowId === row.id && "opacity-40",
                        )}
                      >
                        <td colSpan={8} className="px-2 py-1.5">
                          <div
                            className={clsx(
                              "flex items-center gap-3 rounded-md border px-3 py-1.5",
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
                  const marketSignal = marketSignalByPlayerId.get(ranking.id);
                  const heatMapSignal = heatMapByPlayerId.get(ranking.id);
                  const ownership = ownershipByPlayerId?.[ranking.id];

                  return (
                    <tr
                      key={row.id}
                      draggable
                      onDragStart={() => startRowDrag(row.id)}
                      onDragOver={handleRowDragOver}
                      onDrop={() => dropRow(row.id)}
                      onDragEnd={finishRowDrag}
                      className={clsx(
                        "bg-white transition hover:bg-mist/70",
                        dragState?.rowId === row.id && "opacity-40",
                      )}
                    >
                      <td className="px-2 py-2.5 text-ink/30">
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      </td>
                      <td className="px-2 py-2.5 text-base font-bold tabular-nums text-ink">
                        {overallRankByPlayerId.get(ranking.id) ?? "-"}
                      </td>
                      <td className="px-2 py-2.5">
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedPlayerId(ranking.id)}
                            className="text-left font-semibold text-ink underline-offset-4 hover:text-moss hover:underline"
                          >
                            {ranking.player}
                          </button>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/45">
                            <span className="font-bold text-ink/60">{ranking.position}{positionRankByPlayerId.get(ranking.id) ?? "-"}</span>
                            <span>{ranking.team || "FA"}</span>
                            <span>Age {ranking.age ?? "-"}</span>
                            {ranking.isRookie ? <span className="font-semibold text-moss">Rookie</span> : null}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink/35">
                            {rookiePickByPlayerId.get(ranking.id) ??
                              ranking.rookiePick}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 tabular-nums">
                        <p className="font-semibold text-ink">FC #{ranking.fantasyCalcRank ?? "-"}</p>
                        <p className="text-xs text-ink/45">KTC #{ranking.ktcRank ?? "-"}</p>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink">
                          {getDeltaIcon(
                            ktcDeltaByPlayerId.get(ranking.id) ?? null,
                          )}
                          {formatDelta(
                            ktcDeltaByPlayerId.get(ranking.id) ?? null,
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className={clsx("inline-flex rounded-md px-2 py-1 text-xs font-bold ring-1", getSignalClass(marketSignal?.label ?? "Hold"))}>
                          {marketSignal?.label ?? "Hold"}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        {ownership ? <><p className="font-semibold text-ink">{ownership.percent}%</p><p className="text-xs text-ink/45">{heatMapSignal?.label ?? `${ownership.exposure}/${ownership.leagueCount}`}</p></> : <span className="text-ink/35">Load</span>}
                      </td>
                      <td className="px-2 py-2.5">
                        <p className="font-semibold text-ink">{assignedTier?.pickValueLabel ?? ranking.importedTier}</p>
                        <p className="text-xs text-ink/45">RBV {assignedTier?.pickValue ?? ranking.relativeBaseValue ?? "-"}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-ink/45">
          On ALL, tier bars control the pick value assigned to every player
          between that tier and the next tier. On position pages, tier bars are
          separate visual separators and do not change pick value.
        </p>
        </div>
      </section>
    </div>
  );
}
