import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RookieSourceLibraryClient } from "@/components/dynasty/RookieSourceLibraryClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { getRookieSources } from "@/lib/dynasty/rookie-model/repository";

export const dynamic = "force-dynamic";

export default async function RookieSourcesPage() {
  const sources = await getRookieSources();
  return <div className="space-y-6"><Link href="/dashboard/dynasty/rookies" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-moss"><ArrowLeft className="h-4 w-4" />Rookie rankings</Link><PageHeader eyebrow="Explainable Rookie Engine" title="Source library" description="Record methodology, reliability, licensing, retrieval dates, and evidence summaries for every approved source." /><RookieSourceLibraryClient sources={sources} /></div>;
}
