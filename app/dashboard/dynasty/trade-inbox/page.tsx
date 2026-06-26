import Link from "next/link";
import { ArrowLeft, Bell, ExternalLink, RefreshCcw } from "lucide-react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { getSleeperTradeInbox } from "@/lib/dynasty/sleeper";
import { personalSettings } from "@/lib/personal-settings";
import type {
  SleeperPendingTrade,
  SleeperTradeInboxAsset,
} from "@/lib/dynasty/sleeper";

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
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold uppercase text-ink/50">
            {asset.kind}
          </span>
        </div>
      ))}
    </div>
  );
}

function TradeCard({ trade }: { trade: SleeperPendingTrade }) {
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
          </div>
          <h2 className="mt-2 text-lg font-bold text-ink">{trade.leagueName}</h2>
          <p className="mt-1 text-sm text-ink/55">
            With {trade.tradeWith.join(", ") || "multiple rosters"} ·{" "}
            {formatDate(trade.createdAt)}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={trade.tradeUrl} target="_blank">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open Sleeper
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-bold text-emerald-800">You receive</p>
          <AssetList assets={trade.receives} fallback="No matched incoming assets." />
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-rose-800">You send</p>
          <AssetList assets={trade.sends} fallback="No matched outgoing assets." />
        </div>
      </div>
    </article>
  );
}

export default async function DynastyTradeInboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = params?.season?.trim() || personalSettings.dynastySeason;
  const data = await getSleeperTradeInbox({
    season,
    username: personalSettings.sleeperUsername,
  }).catch((error) => {
    return error instanceof Error ? error : new Error("Trade inbox failed.");
  });
  const hasError = data instanceof Error;
  const inbox = hasError ? null : data;
  const pendingCount = inbox?.pendingTrades.length ?? 0;

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
        <h1 className="mt-2 text-3xl font-bold text-ink">Trade Inbox</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Pending Sleeper trade offers across your leagues. This checks the
          authenticated trade endpoint and sends you back to Sleeper to act.
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">Inbox status</p>
            <p className="mt-1 text-sm text-ink/60">
              Checking trades for{" "}
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
                Refresh
              </Button>
            </div>
          </form>
        </div>

        {hasError ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {data.message}
          </p>
        ) : null}

        {inbox?.missingToken ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-bold text-amber-950">
              Sleeper token is needed for pending offers.
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Add your private Sleeper token to{" "}
              <span className="font-mono font-bold">.env.local</span> as{" "}
              <span className="font-mono font-bold">SLEEPER_AUTH_TOKEN</span>,
              then restart the local server. Do not commit that token to GitHub.
            </p>
          </div>
        ) : null}
      </section>

      {inbox ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <p className="text-sm text-ink/55">Pending offers</p>
            <p className="mt-1 text-2xl font-bold text-ink">{pendingCount}</p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <p className="text-sm text-ink/55">Leagues checked</p>
            <p className="mt-1 text-2xl font-bold text-ink">
              {inbox.checkedLeagueCount}
            </p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <p className="text-sm text-ink/55">Notification source</p>
            <p className="mt-1 text-sm font-bold text-ink">
              Sleeper pending/proposed trades
            </p>
          </div>
        </section>
      ) : null}

      {inbox && !inbox.missingToken ? (
        <section className="space-y-4">
          {inbox.pendingTrades.map((trade) => (
            <TradeCard key={trade.tradeId} trade={trade} />
          ))}

          {inbox.pendingTrades.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink/20 bg-white p-8 text-center shadow-soft">
              <Bell className="mx-auto h-8 w-8 text-moss" aria-hidden="true" />
              <p className="mt-3 text-lg font-bold text-ink">
                No pending trade offers
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                When Sleeper shows an active incoming or outgoing offer, it will
                appear here after refresh.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
