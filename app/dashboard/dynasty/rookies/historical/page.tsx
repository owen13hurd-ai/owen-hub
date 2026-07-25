import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RookieHistoricalImportClient } from "@/components/dynasty/RookieHistoricalImportClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { getRookieSources } from "@/lib/dynasty/rookie-model/repository";

export const dynamic = "force-dynamic";

export default async function HistoricalRookieImportPage() {
  const sources = await getRookieSources();
  return <div className="space-y-6"><Link href="/dashboard/dynasty/rookies" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-moss"><ArrowLeft className="h-4 w-4" />Rookie rankings</Link><PageHeader eyebrow="Historical validation" title="Load a historical cohort" description="Preview sourced raw RB/WR inputs, resolve identities, and create explainable pre-draft score runs." /><RookieHistoricalImportClient sources={sources} /></div>;
}
