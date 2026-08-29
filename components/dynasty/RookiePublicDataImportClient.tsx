"use client";

import { DatabaseZap, Download, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { importCfbdRookieSeasons, runRookieModel } from "@/app/dashboard/dynasty/rookies/actions";
import { importAuditedRookieOutcomes, importBundledRookieEnrichments } from "@/app/dashboard/dynasty/rookies/enrichment-actions";
import { Button } from "@/components/ui/button";

export function RookiePublicDataImportClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enrichmentPending, startEnrichmentTransition] = useTransition();
  const [outcomePending, startOutcomeTransition] = useTransition();
  const [modelPending, startModelTransition] = useTransition();
  const [outcomeMessage, setOutcomeMessage] = useState("");
  return <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
    <div className="mb-5 border-b border-ink/10 pb-5"><h2 className="font-bold text-ink">Audited NFL outcomes</h2><p className="my-2 text-sm text-ink/55">Refresh the verified 2020–2025 regular-season data without changing prospect inputs or scoring weights.</p><Button variant="outline" disabled={outcomePending} onClick={() => startOutcomeTransition(async () => { const result = await importAuditedRookieOutcomes(); setOutcomeMessage(result.message); if (result.ok) router.refresh(); })}>{outcomePending ? "Verifying outcomes…" : "Refresh audited outcomes"}</Button><p role="status" className="mt-2 text-sm">{outcomeMessage}</p></div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h2 className="font-bold text-ink">CollegeFootballData</h2><p className="mt-1 max-w-2xl text-sm text-ink/55">Import official 2024 and 2025 college passing, rushing, and receiving totals for the existing 2025–2026 QB/RB/WR/TE classes. This never invents routes, YPRR, shares, or scores.</p></div>
      <Button type="button" disabled={pending} onClick={() => startTransition(async () => {
        const result = await importCfbdRookieSeasons();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        if (result.ok) router.refresh();
      })}><DatabaseZap className="h-4 w-4" />{pending ? "Importing..." : "Import public data"}</Button>
    </div>
    <p className="mt-3 text-xs text-ink/45">Requires a private CFBD_API_KEY in the app environment. Unmatched names are recorded for review instead of being merged automatically.</p>
    <div className="mt-5 flex flex-col justify-between gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center"><div><h3 className="font-bold text-ink">Open-data enrichments</h3><p className="mt-1 max-w-2xl text-sm text-ink/55">Import audited target share, eligibility, Pahowdy data, and reproducible CollegeFootballData usage and PPA metrics.</p></div><Button type="button" variant="outline" disabled={enrichmentPending} onClick={() => startEnrichmentTransition(async () => { const result = await importBundledRookieEnrichments(); if (result.ok) toast.success(result.message); else toast.error(result.message); if (result.ok) router.refresh(); })}><DatabaseZap className="h-4 w-4" />{enrichmentPending ? "Importing..." : "Import enrichments"}</Button></div>
    <div className="mt-5 flex flex-col justify-between gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center"><div><h3 className="font-bold text-ink">Recalculate rankings</h3><p className="mt-1 max-w-2xl text-sm text-ink/55">Create a new immutable score run after imports. Existing score history is preserved.</p></div><Button type="button" disabled={modelPending || enrichmentPending} onClick={() => startModelTransition(async () => { const result = await runRookieModel(); if (result.ok) toast.success(result.message); else toast.error(result.message); if (result.ok) router.refresh(); })}><FlaskConical className="h-4 w-4" />{modelPending ? "Scoring..." : "Run model"}</Button></div>
    <div className="mt-5 flex flex-col justify-between gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center"><div><h3 className="font-bold text-ink">Licensed charting and RAS</h3><p className="mt-1 max-w-2xl text-sm text-ink/55">Download a pre-matched 2020–2026 template for provider exports. Routes, contact charting, and official RAS stay blank until their source permits use.</p><p className="mt-2 text-xs text-ink/45">Fields: career and best YPRR, final-season receiving YPRR, yards after contact per attempt, missed tackles per attempt, and official RAS.</p></div><Button asChild type="button" variant="outline"><a href="/data/rookie-provider-enrichment-template-2020-2026.csv" download><Download className="h-4 w-4" />Download template</a></Button></div>
  </section>;
}
