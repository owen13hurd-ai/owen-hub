import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RookieDuplicateQueueClient } from "@/components/dynasty/RookieDuplicateQueueClient";
import { RookieIdentityRepairClient } from "@/components/dynasty/RookieIdentityRepairClient";
import { RookiePublicDataImportClient } from "@/components/dynasty/RookiePublicDataImportClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { getRookieImportBatches, getRookiePendingDuplicates } from "@/lib/dynasty/rookie-model/repository";

export const dynamic = "force-dynamic";

export default async function RookieImportsPage() {
  const [duplicates, batches] = await Promise.all([getRookiePendingDuplicates(), getRookieImportBatches()]);
  const pendingBatchIds = new Set(duplicates.map((duplicate) => duplicate.batchId));
  const readyBatches = batches.filter((batch) => batch.status === "previewed" && !pendingBatchIds.has(batch.id));
  return <div className="space-y-6"><Link href="/dashboard/dynasty/rookies" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-moss"><ArrowLeft className="h-4 w-4" />Rookie rankings</Link><PageHeader eyebrow="Rookie imports" title="Data imports" description="Load approved public data and review possible name matches explicitly. The engine never performs a fuzzy merge automatically." /><RookiePublicDataImportClient /><RookieIdentityRepairClient /><RookieDuplicateQueueClient duplicates={duplicates} readyBatches={readyBatches} /></div>;
}
