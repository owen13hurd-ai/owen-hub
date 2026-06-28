import { RefreshCcw } from "lucide-react";

import { TradeInboxClient } from "@/components/dynasty/TradeInboxClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getSleeperTradeInbox } from "@/lib/dynasty/sleeper";
import { personalSettings } from "@/lib/personal-settings";

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

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dynasty Hub" title="Trade Inbox" description="Review and value pending Sleeper offers across your leagues." />

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

      {inbox && !inbox.missingToken ? (
        <TradeInboxClient
          checkedLeagueCount={inbox.checkedLeagueCount}
          pendingTrades={inbox.pendingTrades}
        />
      ) : null}
    </div>
  );
}
