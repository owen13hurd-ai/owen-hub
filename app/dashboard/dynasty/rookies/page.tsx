import { RookieEngineClient } from "@/components/dynasty/RookieEngineClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { getRookieEngineRankings, getRookieImportBatches, getRookieSources } from "@/lib/dynasty/rookie-model/repository";

export default async function DynastyRookieDraftPage() {
  const [rankings, importBatches, sources] = await Promise.all([getRookieEngineRankings(), getRookieImportBatches(), getRookieSources()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dynasty Hub"
        title="Rookie Prospect Engine"
        description="Transparent RB and WR scoring with source-level explanations and immutable model history."
      />
      <RookieEngineClient importBatches={importBatches} rankings={rankings} sources={sources} />
    </div>
  );
}
