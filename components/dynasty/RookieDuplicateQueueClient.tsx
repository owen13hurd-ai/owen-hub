"use client";

import { Check, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { resolveRookieDuplicate } from "@/app/dashboard/dynasty/rookies/actions";
import { commitAndScoreHistoricalRookieImport, commitRookieImport } from "@/app/dashboard/dynasty/rookies/actions";
import { Button } from "@/components/ui/button";
import type { RookieImportBatchSummary, RookiePendingDuplicate } from "@/lib/dynasty/rookie-model/repository";

export function RookieDuplicateQueueClient({ duplicates, readyBatches }: { duplicates: RookiePendingDuplicate[]; readyBatches: RookieImportBatchSummary[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function resolve(rowId: string, playerId: string | null) { startTransition(async () => { const result = await resolveRookieDuplicate(rowId, playerId); if (result.ok) { toast.success(result.message); router.refresh(); } else toast.error(result.message); }); }
  function commit(batchId: string) { const batch = readyBatches.find((candidate) => candidate.id === batchId); startTransition(async () => { const result = batch?.isHistorical ? await commitAndScoreHistoricalRookieImport(batchId) : await commitRookieImport(batchId); if (result.ok) { toast.success(result.message); router.push(batch?.isHistorical ? "/dashboard/dynasty/rookies/validation" : "/dashboard/dynasty/rookies"); router.refresh(); } else toast.error(result.message); }); }
  return <div className="space-y-4">{duplicates.length === 0 ? <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft"><Check className="mx-auto h-8 w-8 text-emerald-700" /><h2 className="mt-3 font-bold text-ink">Duplicate queue is clear</h2><p className="mt-1 text-sm text-ink/55">No import rows need a matching decision.</p></section> : duplicates.map((duplicate) => <section key={duplicate.id} className="rounded-lg border border-amber-200 bg-white shadow-soft"><div className="border-b border-amber-100 bg-amber-50 p-4"><h2 className="font-bold text-ink">Imported: {duplicate.importedName}</h2><p className="mt-1 text-xs text-ink/50">{duplicate.filename} · row {duplicate.sourceRow} · {duplicate.position}</p></div><div className="grid gap-3 p-4 md:grid-cols-2">{duplicate.candidates.map((candidate) => <article key={candidate.id} className="flex items-center justify-between gap-3 rounded-md border border-ink/10 p-3"><div><p className="font-semibold text-ink">{candidate.name}</p><p className="text-xs text-ink/50">{candidate.school ?? "School unknown"} · {(candidate.similarity * 100).toFixed(0)}% name similarity</p></div><Button type="button" variant="outline" onClick={() => resolve(duplicate.id, candidate.id)} disabled={pending}><Check className="h-4 w-4" />Match</Button></article>)}</div><div className="border-t border-ink/10 p-4"><Button type="button" variant="outline" onClick={() => resolve(duplicate.id, null)} disabled={pending}><UserPlus className="h-4 w-4" />This is a new player</Button></div></section>)}{readyBatches.length > 0 ? <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><h2 className="font-bold text-emerald-950">Ready to commit</h2><div className="mt-3 space-y-2">{readyBatches.map((batch) => <div key={batch.id} className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-white p-3"><div><p className="font-semibold text-ink">{batch.filename}</p><p className="text-xs text-ink/50">{batch.validRows} valid rows</p></div><Button type="button" onClick={() => commit(batch.id)} disabled={pending}>{pending ? "Working..." : "Commit batch"}</Button></div>)}</div></section> : null}</div>;
}
