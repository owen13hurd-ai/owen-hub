"use client";

import { BarChart3, BookOpen, FileSearch, FileUp, FlaskConical, GitCompareArrows, Save, Search, Settings2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  commitRookieImport,
  previewRookieImport,
  runRookieModel,
  saveManualRookieRankings,
  type RookieImportActionState,
} from "@/app/dashboard/dynasty/rookies/actions";
import { Button } from "@/components/ui/button";
import type { RookieEngineRanking, RookieImportBatchSummary, RookieSourceSummary } from "@/lib/dynasty/rookie-model/repository";

const initialImportState: RookieImportActionState = { message: "", ok: false };

function score(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

export function RookieEngineClient({ importBatches, rankings, sources }: { importBatches: RookieImportBatchSummary[]; rankings: RookieEngineRanking[]; sources: RookieSourceSummary[] }) {
  const router = useRouter();
  const [classYear, setClassYear] = useState<"ALL" | "2025" | "2026">("ALL");
  const [position, setPosition] = useState<"ALL" | "RB" | "WR">("ALL");
  const [query, setQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importState, importAction, importPending] = useActionState(previewRookieImport, initialImportState);
  const [isRunning, startRun] = useTransition();
  const [isCommitting, startCommit] = useTransition();
  const [isSavingRanks, startSaveRanks] = useTransition();
  const [manualEdits, setManualEdits] = useState<Record<string, { rank: string; tier: string }>>({});

  const visibleRankings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rankings.filter((ranking) => {
      return (
        (classYear === "ALL" || String(ranking.classYear) === classYear) &&
        (position === "ALL" || ranking.position === position) &&
        (!normalizedQuery ||
          ranking.name.toLowerCase().includes(normalizedQuery) ||
          ranking.school?.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [classYear, position, query, rankings]);

  const classComparison = useMemo(() => {
    return [2025, 2026].map((year) => {
      const cohort = rankings.filter((ranking) => ranking.classYear === year);
      const scored = cohort.filter((ranking) => ranking.prospectScore !== null);
      const average = scored.length
        ? scored.reduce((total, ranking) => total + (ranking.prospectScore ?? 0), 0) / scored.length
        : null;
      const coverage = scored.length
        ? scored.reduce((total, ranking) => total + (ranking.coverage ?? 0), 0) / scored.length
        : null;
      return { average, coverage, count: cohort.length, scored: scored.length, year };
    });
  }, [rankings]);

  function handleRun() {
    startRun(async () => {
      const result = await runRookieModel();
      if (result.ok) { toast.success(result.message); router.refresh(); }
      else toast.error(result.message);
    });
  }

  function handleCommit() {
    if (!importState.batchId) return;
    startCommit(async () => {
      const result = await commitRookieImport(importState.batchId!);
      if (result.ok) { toast.success(result.message); router.refresh(); }
      else toast.error(result.message);
    });
  }

  function handleSaveManualRanks() {
    const changed = Object.entries(manualEdits).map(([playerId, edit]) => ({
      manualRank: edit.rank.trim() ? Number.parseInt(edit.rank, 10) : null,
      manualTier: edit.tier.trim() || null,
      playerId,
    }));
    if (changed.some((ranking) => ranking.manualRank !== null && (!Number.isInteger(ranking.manualRank) || ranking.manualRank < 1))) {
      toast.error("Manual ranks must be positive whole numbers.");
      return;
    }
    startSaveRanks(async () => {
      const result = await saveManualRookieRankings(changed);
      if (result.ok) {
        toast.success(result.message);
        setManualEdits({});
        router.refresh();
      } else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-ink/55">Modeled prospects</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{rankings.length}</p>
          <p className="mt-1 text-sm text-ink/55">2025-2026 RB and WR</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Scored</p>
          <p className="mt-2 text-2xl font-bold text-moss">{rankings.filter((ranking) => ranking.overallScore !== null).length}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Reference</p>
          <p className="mt-2 text-sm font-bold text-ink">Class-relative</p>
          <p className="mt-1 text-xs text-ink/50">Not a hit probability</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Format</p>
          <p className="mt-2 text-sm font-bold text-ink">12-team Superflex</p>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white shadow-soft">
        <div className="flex flex-col gap-4 border-b border-ink/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/dashboard/dynasty/rookies/configuration"><Settings2 className="h-4 w-4" aria-hidden="true" />Configure</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/dynasty/rookies/compare"><GitCompareArrows className="h-4 w-4" aria-hidden="true" />Compare</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/dynasty/rookies/sources"><BookOpen className="h-4 w-4" aria-hidden="true" />Sources</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/dynasty/rookies/imports"><FileSearch className="h-4 w-4" aria-hidden="true" />Resolve duplicates</Link></Button>
            <Button type="button" onClick={() => setShowImport((current) => !current)} variant="outline">
              <FileUp className="h-4 w-4" aria-hidden="true" /> Import CSV
            </Button>
            <Button type="button" onClick={handleRun} disabled={isRunning || rankings.length === 0}>
              <FlaskConical className="h-4 w-4" aria-hidden="true" /> {isRunning ? "Scoring..." : "Run model"}
            </Button>
            {Object.keys(manualEdits).length > 0 ? (
              <Button type="button" variant="outline" onClick={handleSaveManualRanks} disabled={isSavingRanks}>
                <Save className="h-4 w-4" aria-hidden="true" /> {isSavingRanks ? "Saving..." : `Save ${Object.keys(manualEdits).length} edits`}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search prospects</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink/40" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prospects" className="h-9 rounded-md border border-ink/15 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/15" />
            </label>
            <select value={classYear} onChange={(event) => setClassYear(event.target.value as typeof classYear)} className="h-9 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink">
              <option value="ALL">All classes</option><option value="2025">2025</option><option value="2026">2026</option>
            </select>
            <select value={position} onChange={(event) => setPosition(event.target.value as typeof position)} className="h-9 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink">
              <option value="ALL">All positions</option><option value="RB">RB</option><option value="WR">WR</option>
            </select>
          </div>
        </div>

        {showImport ? (
          <div className="border-b border-ink/10 bg-skyglass/45 p-4">
            <form action={importAction} className="grid gap-3 lg:grid-cols-[1fr_18rem_auto] lg:items-end">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Prospect CSV
                <input name="file" type="file" accept=".csv,text/csv" required className="block w-full rounded-md border border-ink/15 bg-white p-2 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
                <span className="text-xs font-normal text-ink/55">Required: name, position, class_year. Headers are normalized automatically.</span>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">Approved source<select name="source_id" required className="h-10 rounded-md border border-ink/15 bg-white px-3 font-normal"><option value="">Choose approved source</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}</select><span className="text-xs font-normal text-ink/55">Required for field-level provenance. Add sources in the Source Library.</span></label>
              <Button type="submit" variant="outline" disabled={importPending}>{importPending ? "Checking..." : "Preview"}</Button>
            </form>
            {importState.message ? (
              <div className="mt-4 rounded-md border border-ink/10 bg-white p-3 text-sm text-ink">
                <p className="font-semibold">{importState.message}</p>
                {importState.preview ? <p className="mt-1 text-ink/55">{importState.preview.invalidRows} rows need attention. Nothing has been committed yet.</p> : null}
                {importState.pendingDuplicates ? <Button asChild type="button" variant="outline" className="mt-3"><Link href="/dashboard/dynasty/rookies/imports"><FileSearch className="h-4 w-4" />Resolve {importState.pendingDuplicates} possible duplicate{importState.pendingDuplicates === 1 ? "" : "s"}</Link></Button> : null}
                {importState.preview?.rows.length ? (
                  <div className="mt-3 max-h-64 overflow-auto rounded-md border border-ink/10">
                    <table className="min-w-full bg-white text-left text-xs">
                      <thead className="sticky top-0 bg-mist text-ink/60"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Player</th><th className="px-3 py-2">Class / Pos</th><th className="px-3 py-2">Validation</th></tr></thead>
                      <tbody>{importState.preview.rows.slice(0, 50).map((row) => <tr key={row.sourceRow} className="border-t border-ink/8"><td className="px-3 py-2">{row.sourceRow}</td><td className="px-3 py-2 font-semibold">{row.name || "Missing name"}</td><td className="px-3 py-2">{row.classYear || "-"} {row.position || ""}</td><td className={`px-3 py-2 ${row.errors.length ? "text-red-700" : "text-emerald-700"}`}>{row.errors.length ? row.errors.join(" ") : "Ready"}</td></tr>)}</tbody>
                    </table>
                  </div>
                ) : null}
                {importState.batchId && importState.preview?.validRows && !importState.pendingDuplicates ? (
                  <Button type="button" className="mt-3" onClick={handleCommit} disabled={isCommitting}>{isCommitting ? "Committing..." : "Commit valid rows"}</Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {visibleRankings.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-moss" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-ink">No engine prospects yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/60">Import a 2025 or 2026 RB/WR CSV. Legacy Google Sheet tiers are no longer converted into fake metric scores.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-mist/70 text-xs font-bold uppercase tracking-wide text-ink/55">
                <tr><th className="px-4 py-3">Model rank</th><th className="px-4 py-3">Player</th><th className="px-4 py-3">Manual rank</th><th className="px-4 py-3">Prospect</th><th className="px-4 py-3">Draft</th><th className="px-4 py-3">Market</th><th className="px-4 py-3">Situation</th><th className="px-4 py-3">Overall</th><th className="px-4 py-3">Coverage</th><th className="px-4 py-3">Manual tier</th></tr>
              </thead>
              <tbody>
                {visibleRankings.map((ranking) => (
                  <tr key={ranking.id} className="border-t border-ink/8 hover:bg-skyglass/35">
                    <td className="px-4 py-3 font-bold text-ink">{ranking.overallRank ?? ranking.positionRank ?? "-"}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/dynasty/rookies/${ranking.id}`} className="font-bold text-ink hover:text-moss hover:underline">{ranking.name}</Link><p className="mt-0.5 text-xs text-ink/50">{ranking.classYear} {ranking.position}{ranking.school ? `, ${ranking.school}` : ""}</p></td>
                    <td className="px-4 py-3"><input aria-label={`Manual rank for ${ranking.name}`} inputMode="numeric" value={manualEdits[ranking.id]?.rank ?? String(ranking.manualRank ?? "")} onChange={(event) => setManualEdits((current) => ({ ...current, [ranking.id]: { rank: event.target.value, tier: current[ranking.id]?.tier ?? ranking.manualTier ?? "" } }))} className="h-8 w-16 rounded border border-ink/15 px-2 text-sm" placeholder="-" /></td>
                    <td className="px-4 py-3 font-semibold text-ink">{score(ranking.prospectScore)}</td><td className="px-4 py-3 text-ink/65">{score(ranking.draftCapitalScore)}</td><td className="px-4 py-3 text-ink/65">{score(ranking.marketScore)}</td><td className="px-4 py-3 text-ink/65">{score(ranking.situationScore)}</td><td className="px-4 py-3 font-bold text-moss">{score(ranking.overallScore)}</td><td className="px-4 py-3 text-ink/65">{ranking.coverage === null ? "-" : `${ranking.coverage.toFixed(0)}%`}</td><td className="px-4 py-3"><input aria-label={`Manual tier for ${ranking.name}`} value={manualEdits[ranking.id]?.tier ?? ranking.manualTier ?? ""} onChange={(event) => setManualEdits((current) => ({ ...current, [ranking.id]: { rank: current[ranking.id]?.rank ?? String(ranking.manualRank ?? ""), tier: event.target.value } }))} className="h-8 w-24 rounded border border-ink/15 px-2 text-sm" placeholder={ranking.tier ?? "Tier"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-moss" aria-hidden="true" /><h2 className="font-bold text-ink">Class comparison</h2></div>
        <p className="mt-1 text-sm text-ink/55">Class-relative distributions are directional and are not historical hit probabilities.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{classComparison.map((cohort) => <article key={cohort.year} className="rounded-md border border-ink/10 bg-mist/35 p-4"><div className="flex items-center justify-between"><h3 className="text-lg font-bold text-ink">{cohort.year}</h3><span className="text-xs font-semibold text-ink/50">{cohort.scored}/{cohort.count} scored</span></div><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-ink/50">Average prospect</dt><dd className="mt-1 text-xl font-bold text-moss">{score(cohort.average)}</dd></div><div><dt className="text-ink/50">Average coverage</dt><dd className="mt-1 text-xl font-bold text-ink">{cohort.coverage === null ? "-" : `${cohort.coverage.toFixed(0)}%`}</dd></div></dl></article>)}</div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white shadow-soft">
        <div className="border-b border-ink/10 p-4"><h2 className="font-bold text-ink">Import history</h2><p className="mt-1 text-sm text-ink/55">Previewed and committed batches remain available as an audit trail.</p></div>
        {importBatches.length === 0 ? <p className="p-5 text-sm text-ink/55">No CSV batches recorded.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-mist/70 text-xs font-bold uppercase tracking-wide text-ink/55"><tr><th className="px-4 py-3">File</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Rows</th><th className="px-4 py-3">Valid</th><th className="px-4 py-3">Errors</th><th className="px-4 py-3">Created</th></tr></thead><tbody>{importBatches.map((batch) => <tr key={batch.id} className="border-t border-ink/8"><td className="px-4 py-3 font-semibold text-ink">{batch.filename}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${batch.status === "committed" ? "bg-emerald-100 text-emerald-800" : batch.status === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{batch.status}</span></td><td className="px-4 py-3">{batch.rowCount}</td><td className="px-4 py-3 text-emerald-700">{batch.validRows}</td><td className="px-4 py-3 text-red-700">{batch.invalidRows}</td><td className="px-4 py-3 text-ink/55">{new Date(batch.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
