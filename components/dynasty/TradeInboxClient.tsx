"use client";

import Link from "next/link";
import { Bell, ExternalLink, X } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import type {
  SleeperPendingTrade,
  SleeperTradeInboxAsset,
} from "@/lib/dynasty/sleeper";

const dismissedTradesStorageKey = "owen-hub-dismissed-sleeper-trades-v1";

function getDismissedTrades() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    return new Set<string>(
      JSON.parse(window.localStorage.getItem(dismissedTradesStorageKey) ?? "[]"),
    );
  } catch {
    return new Set<string>();
  }
}

function saveDismissedTrades(tradeIds: Set<string>) {
  window.localStorage.setItem(
    dismissedTradesStorageKey,
    JSON.stringify(Array.from(tradeIds)),
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDirectionClass(direction: SleeperPendingTrade["direction"]) {
  if (direction === "Incoming") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (direction === "Outgoing") {
    return "bg-sky-50 text-sky-800 ring-sky-200";
  }

  return "bg-amber-50 text-amber-900 ring-amber-200";
}

function formatValue(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toFixed(2);
}

function getValueLabelClass(label: SleeperPendingTrade["valueLabel"]) {
  if (label === "Winning") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (label === "Losing") {
    return "bg-rose-50 text-rose-800 ring-rose-200";
  }

  return "bg-amber-50 text-amber-900 ring-amber-200";
}

function AssetList({
  assets,
  fallback,
}: {
  assets: SleeperTradeInboxAsset[];
  fallback: string;
}) {
  if (assets.length === 0) {
    return <p className="text-sm text-ink/45">{fallback}</p>;
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="flex items-center justify-between gap-3 rounded-md bg-mist px-3 py-2"
        >
          <span className="min-w-0 truncate text-sm font-semibold text-ink">
            {asset.label}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold uppercase text-ink/50">
              {asset.kind}
            </span>
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
              {formatValue(asset.value)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function TradeCard({
  onClear,
  trade,
}: {
  onClear: () => void;
  trade: SleeperPendingTrade;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                getDirectionClass(trade.direction),
              )}
            >
              {trade.direction}
            </span>
            <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold uppercase text-ink/55">
              {trade.status}
            </span>
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                getValueLabelClass(trade.valueLabel),
              )}
            >
              {trade.valueLabel} {trade.valueGap > 0 ? "+" : ""}
              {formatValue(trade.valueGap)}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-bold text-ink">{trade.leagueName}</h2>
          <p className="mt-1 text-sm text-ink/55">
            With {trade.tradeWith.join(", ") || "multiple rosters"} ·{" "}
            {formatDate(trade.createdAt)}
          </p>
          {trade.expiresAt ? (
            <p className="mt-1 text-xs font-semibold text-amber-800">
              Expires {formatDate(trade.expiresAt)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={trade.tradeUrl} target="_blank">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open Sleeper
            </Link>
          </Button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-rose-50 hover:text-rose-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-emerald-800">
            <span>You receive</span>
            <span>{formatValue(trade.receivesValue)}</span>
          </p>
          <AssetList assets={trade.receives} fallback="No matched incoming assets." />
        </div>
        <div>
          <p className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-rose-800">
            <span>You send</span>
            <span>{formatValue(trade.sendsValue)}</span>
          </p>
          <AssetList assets={trade.sends} fallback="No matched outgoing assets." />
        </div>
      </div>
    </article>
  );
}

export function TradeInboxClient({
  checkedLeagueCount,
  pendingTrades,
}: {
  checkedLeagueCount: number;
  pendingTrades: SleeperPendingTrade[];
}) {
  const [dismissedTradeIds, setDismissedTradeIds] =
    useState<Set<string>>(getDismissedTrades);
  const visibleTrades = useMemo(() => {
    return pendingTrades.filter((trade) => !dismissedTradeIds.has(trade.tradeId));
  }, [dismissedTradeIds, pendingTrades]);
  const clearedCount = pendingTrades.length - visibleTrades.length;

  function clearTrade(tradeId: string) {
    setDismissedTradeIds((currentTradeIds) => {
      const nextTradeIds = new Set(currentTradeIds);
      nextTradeIds.add(tradeId);
      saveDismissedTrades(nextTradeIds);
      return nextTradeIds;
    });
  }

  if (pendingTrades.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/20 bg-white p-8 text-center shadow-soft">
        <Bell className="mx-auto h-8 w-8 text-moss" aria-hidden="true" />
        <p className="mt-3 text-lg font-bold text-ink">No pending trade offers</p>
        <p className="mt-2 text-sm leading-6 text-ink/55">
          Expired exploding offers are hidden automatically. New active offers
          will appear here after refresh.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Pending offers</p>
          <p className="mt-1 text-2xl font-bold text-ink">{visibleTrades.length}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Leagues checked</p>
          <p className="mt-1 text-2xl font-bold text-ink">{checkedLeagueCount}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Notification source</p>
          <p className="mt-1 text-sm font-bold text-ink">
            Sleeper pending/proposed trades
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/10 bg-white p-3 shadow-soft">
        <p className="text-sm text-ink/60">
          {clearedCount > 0
            ? `${clearedCount} offer${clearedCount === 1 ? "" : "s"} deleted from this inbox`
            : "Expired exploding offers are hidden automatically"}
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">
          Cleared offers stay hidden on this device
        </p>
      </div>

      {visibleTrades.map((trade) => (
        <TradeCard
          key={trade.tradeId}
          onClear={() => clearTrade(trade.tradeId)}
          trade={trade}
        />
      ))}

      {visibleTrades.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 bg-white p-8 text-center shadow-soft">
          <Bell className="mx-auto h-8 w-8 text-moss" aria-hidden="true" />
          <p className="mt-3 text-lg font-bold text-ink">Inbox cleared</p>
          <p className="mt-2 text-sm leading-6 text-ink/55">
            All current offers were deleted from this local inbox. New pending
            offers will appear after refresh.
          </p>
        </div>
      ) : null}
    </section>
  );
}
