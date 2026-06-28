import { TradeIdeaNotebook } from "@/components/dynasty/TradeIdeaNotebook";
import { PageHeader } from "@/components/layout/PageHeader";
import { getDynastyRankings } from "@/lib/dynasty/rankings";
import { enrichRankingsWithMarketSources } from "@/lib/dynasty/sources/marketSources";

export default async function TradeLabPage() {
  const { rankings } = await enrichRankingsWithMarketSources(getDynastyRankings());

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dynasty Hub"
        title="Trade Notebook"
        description="Keep trade targets, offers, and negotiation angles in one focused workspace."
      />
      <TradeIdeaNotebook rankings={rankings} />
    </div>
  );
}

