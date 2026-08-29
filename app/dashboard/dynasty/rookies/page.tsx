import { RookieEngineClient } from "@/components/dynasty/RookieEngineClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { getRookieEngineRankings } from "@/lib/dynasty/rookie-model/repository";

export default async function DynastyRookieDraftPage() {
  const rankings = await getRookieEngineRankings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dynasty Hub"
        title="Rookie Prospect Engine"
        description="Transparent QB, RB, WR, and TE scoring with source-level explanations and immutable model history."
      />
      <RookieEngineClient rankings={rankings} />
    </div>
  );
}
