import { ClipboardList } from "lucide-react";

import { RookieDraftClient } from "@/components/dynasty/RookieDraftClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { getImportedRookieProspects } from "@/lib/dynasty/rookie-sources";
import { starterRookieProspects } from "@/lib/dynasty/rookies";

export default async function DynastyRookieDraftPage() {
  const { prospects, sources } = await getImportedRookieProspects(
    starterRookieProspects,
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dynasty Hub" title="Rookie Draft" description="Rank incoming prospects, track tiers, and compare model inputs." />
        <div className="inline-flex items-center gap-2 rounded-md bg-skyglass px-3 py-2 text-sm font-semibold text-ink/65">
          <ClipboardList className="h-4 w-4 text-moss" aria-hidden="true" />
          Starter rows are placeholders until you add real prospects.
        </div>

      <RookieDraftClient initialProspects={prospects} sources={sources} />
    </div>
  );
}
