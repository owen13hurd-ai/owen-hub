import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { RookieDraftClient } from "@/components/dynasty/RookieDraftClient";
import { Button } from "@/components/ui/Button";
import { getImportedRookieProspects } from "@/lib/dynasty/rookie-sources";
import { starterRookieProspects } from "@/lib/dynasty/rookies";

export default async function DynastyRookieDraftPage() {
  const { prospects, sources } = await getImportedRookieProspects(
    starterRookieProspects,
  );

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
        <h1 className="mt-2 text-3xl font-bold text-ink">Rookie Draft</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Build your rookie rankings, track tiers, and score prospect profiles
          before draft season.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-skyglass px-3 py-2 text-sm font-semibold text-ink/65">
          <ClipboardList className="h-4 w-4 text-moss" aria-hidden="true" />
          Starter rows are placeholders until you add real prospects.
        </div>
      </section>

      <RookieDraftClient initialProspects={prospects} sources={sources} />
    </div>
  );
}
