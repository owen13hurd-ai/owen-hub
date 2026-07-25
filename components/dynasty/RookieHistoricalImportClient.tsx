"use client";

import { FileSearch, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { toast } from "sonner";

import { commitAndScoreHistoricalRookieImport, previewHistoricalRookieImport, type RookieImportActionState } from "@/app/dashboard/dynasty/rookies/actions";
import { Button } from "@/components/ui/button";
import type { RookieSourceSummary } from "@/lib/dynasty/rookie-model/repository";

const initialState: RookieImportActionState = { message: "", ok: false };

export function RookieHistoricalImportClient({ sources }: { sources: RookieSourceSummary[] }) {
  const router = useRouter();
  const [state, action, previewing] = useActionState(previewHistoricalRookieImport, initialState);
  const [committing, startTransition] = useTransition();
  function commit() { if (!state.batchId) return; startTransition(async () => { const result = await commitAndScoreHistoricalRookieImport(state.batchId!); if (result.ok) { toast.success(result.message); router.push("/dashboard/dynasty/rookies/validation"); router.refresh(); } else toast.error(result.message); }); }
  return <div className="space-y-5"><section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft"><form action={action} className="grid gap-4 lg:grid-cols-[1fr_20rem_auto] lg:items-end"><label className="grid gap-2 text-sm font-semibold text-ink">Historical raw-metric CSV<input name="file" type="file" accept=".csv,text/csv" required className="block w-full rounded-md border border-ink/15 p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-white" /><span className="text-xs font-normal text-ink/50">Classes 2010–2024. Required: name, position, class_year, scoring_date, plus raw model metrics.</span></label><label className="grid gap-2 text-sm font-semibold text-ink">Approved source<select name="source_id" required className="h-10 rounded-md border border-ink/15 px-3 font-normal"><option value="">Choose source</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}</select></label><Button type="submit" variant="outline" disabled={previewing}><Upload className="h-4 w-4" />{previewing ? "Checking..." : "Preview"}</Button></form>{state.message ? <div className="mt-4 rounded-md border border-ink/10 bg-mist/40 p-4"><p className="font-semibold text-ink">{state.message}</p>{state.preview ? <p className="mt-1 text-sm text-ink/55">{state.preview.validRows} valid · {state.preview.invalidRows} invalid · nothing committed yet</p> : null}{state.pendingDuplicates ? <Button asChild variant="outline" className="mt-3"><Link href="/dashboard/dynasty/rookies/imports"><FileSearch className="h-4 w-4" />Resolve possible duplicates</Link></Button> : null}{state.batchId && state.ok ? <Button type="button" className="mt-3" disabled={committing} onClick={commit}>{committing ? "Committing and scoring..." : "Commit and score historical cohort"}</Button> : null}</div> : null}</section><section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><h2 className="font-bold">Leakage requirements</h2><p className="mt-1">Every class must use one genuine pre-draft scoring date no later than September 1 of its draft year. Opaque Prospect Scores are not accepted; the engine recalculates from sourced raw metrics and stores complete components.</p></section></div>;
}
