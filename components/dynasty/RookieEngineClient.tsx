"use client";

import { BarChart3, Save, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveManualRookieRankings } from "@/app/dashboard/dynasty/rookies/actions";
import { Button } from "@/components/ui/button";
import type { RookieEngineRanking } from "@/lib/dynasty/rookie-model/repository";
import type { RookieEnginePosition } from "@/types/rookie-engine";

function score(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

export function RookieEngineClient({ rankings }: { rankings: RookieEngineRanking[] }) {
  const router = useRouter();
  const [classYear, setClassYear] = useState<"ALL" | "2025" | "2026">("ALL");
  const [position, setPosition] = useState<"ALL" | RookieEnginePosition>("ALL");
  const [query, setQuery] = useState("");
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
      const overall = cohort.filter((ranking) => ranking.overallScore !== null);
      const averageOverall = overall.length ? overall.reduce((total, ranking) => total + (ranking.overallScore ?? 0), 0) / overall.length : null;
      return {
        average,
        averageOverall,
        coverage,
        count: cohort.length,
        draft: cohort.filter((ranking) => ranking.draftCapitalScore !== null).length,
        market: cohort.filter((ranking) => ranking.marketScore !== null).length,
        overall: overall.length,
        scored: scored.length,
        year,
      };
    });
  }, [rankings]);

  const coverageGaps = useMemo(() => {
    const gaps = new Map<string, { families: Set<string>; players: number }>();

    for (const ranking of visibleRankings) {
      for (const family of ranking.familyScores) {
        for (const metric of family.optionalEvidence && family.score === null ? [] : family.missingMetrics) {
          const gap = gaps.get(metric) ?? { families: new Set<string>(), players: 0 };
          gap.families.add(family.label);
          gap.players += 1;
          gaps.set(metric, gap);
        }
      }
    }

    return [...gaps.entries()]
      .map(([metric, gap]) => ({
        families: [...gap.families].join(", "),
        metric,
        players: gap.players,
        share: visibleRankings.length ? (gap.players / visibleRankings.length) * 100 : 0,
      }))
      .sort((a, b) => b.players - a.players || a.metric.localeCompare(b.metric))
      .slice(0, 6);
  }, [visibleRankings]);

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
          <p className="mt-1 text-sm text-ink/55">2025-2026 QB, RB, WR, and TE</p>
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

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-bold text-ink">Coverage gaps</h2>
            <p className="mt-1 text-sm text-ink/55">Most commonly missing inputs for the prospects currently shown.</p>
          </div>
          <p className="text-xs font-semibold text-ink/45">{visibleRankings.length} prospects analyzed</p>
        </div>
        {coverageGaps.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coverageGaps.map((gap) => (
              <article key={gap.metric} className="rounded-md border border-ink/10 bg-mist/35 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-ink">{gap.metric}</h3>
                  <span className="text-sm font-bold text-amber-700">{gap.players}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8" aria-label={`${gap.metric} missing for ${gap.share.toFixed(0)}% of visible prospects`}>
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${gap.share}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-ink/50">Missing for {gap.share.toFixed(0)}% · {gap.families}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-emerald-800">Every configured input is present for the current view.</p>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-ink/10 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-bold text-ink">Rookie board</h2>
            <p className="mt-1 text-sm text-ink/55">Section scores show what is driving each prospect grade. Missing sections display an em dash.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative">
              <span className="sr-only">Search prospects</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink/40" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prospects" className="h-9 rounded-md border border-ink/15 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/15" />
            </label>
            <select value={classYear} onChange={(event) => setClassYear(event.target.value as typeof classYear)} className="h-9 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink">
              <option value="ALL">All classes</option><option value="2025">2025</option><option value="2026">2026</option>
            </select>
            <select value={position} onChange={(event) => setPosition(event.target.value as typeof position)} className="h-9 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink">
              <option value="ALL">All positions</option><option value="QB">QB</option><option value="RB">RB</option><option value="WR">WR</option><option value="TE">TE</option>
            </select>
            {Object.keys(manualEdits).length > 0 ? (
              <Button type="button" variant="outline" onClick={handleSaveManualRanks} disabled={isSavingRanks}>
                <Save className="h-4 w-4" aria-hidden="true" /> {isSavingRanks ? "Saving..." : `Save ${Object.keys(manualEdits).length} edits`}
              </Button>
            ) : null}
          </div>
        </div>

        {visibleRankings.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-moss" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-ink">No engine prospects yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/60">Import a 2025 or 2026 QB/RB/WR/TE CSV. Legacy Google Sheet tiers are no longer converted into fake metric scores.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-mist/70 text-xs font-bold uppercase tracking-wide text-ink/55">
                <tr><th className="px-4 py-3">Model rank</th><th className="px-4 py-3">Player</th><th className="px-4 py-3">Manual rank</th><th className="min-w-64 px-4 py-3">Section scores</th><th className="px-4 py-3">Prospect</th><th className="px-4 py-3">Draft</th><th className="px-4 py-3">Market</th><th className="px-4 py-3">Situation</th><th className="px-4 py-3">Overall</th><th className="px-4 py-3">Manual tier</th></tr>
              </thead>
              <tbody>
                {visibleRankings.map((ranking) => (
                  <tr key={ranking.id} className="border-t border-ink/8 hover:bg-skyglass/35">
                    <td className="px-4 py-3 font-bold text-ink">{ranking.overallScore === null ? "-" : (ranking.overallRank ?? ranking.positionRank ?? "-")}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/dynasty/rookies/${ranking.id}`} className="font-bold text-ink hover:text-moss hover:underline">{ranking.name}</Link><p className="mt-0.5 text-xs text-ink/50">{ranking.classYear} {ranking.position}{ranking.school ? `, ${ranking.school}` : ""}</p></td>
                    <td className="px-4 py-3"><input aria-label={`Manual rank for ${ranking.name}`} inputMode="numeric" value={manualEdits[ranking.id]?.rank ?? String(ranking.manualRank ?? "")} onChange={(event) => setManualEdits((current) => ({ ...current, [ranking.id]: { rank: event.target.value, tier: current[ranking.id]?.tier ?? ranking.manualTier ?? "" } }))} className="h-8 w-16 rounded border border-ink/15 px-2 text-sm" placeholder="-" /></td>
                    <td className="px-4 py-3">
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {ranking.familyScores.map((family) => (
                          <div key={family.key} title={family.optionalEvidence && family.score === null ? "No verified test; neutral" : family.missingMetrics.length ? `Missing: ${family.missingMetrics.join(", ")}` : "All configured inputs available"}>
                            <div className="flex items-baseline justify-between gap-2">
                              <dt className="truncate text-[11px] text-ink/50">{family.label}</dt>
                              <dd className={`text-xs font-bold ${family.score === null ? "text-ink/40" : "text-ink"}`}>{score(family.score)}</dd>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/8" aria-label={`${family.label} input coverage ${family.coverage}%`}>
                              <div className={`h-full rounded-full ${family.coverage === 100 ? "bg-moss" : "bg-amber-500"}`} style={{ width: `${family.coverage}%` }} />
                            </div>
                            <p className="mt-0.5 text-[9px] font-medium text-ink/40">{family.optionalEvidence && family.score === null ? "No test · neutral" : `${family.coverage}% coverage`}</p>
                          </div>
                        ))}
                      </dl>
                      {ranking.evidenceFlags.length ? <div className="mt-2 flex max-w-80 flex-wrap gap-1" aria-label={`Evidence flags for ${ranking.name}`}>{ranking.evidenceFlags.map((flag) => <span key={flag.key} title={flag.detail} className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${flag.tone === "green" ? "border-moss/25 bg-moss/8 text-moss" : "border-ember/25 bg-ember/8 text-ember"}`}>{flag.label}</span>)}</div> : null}
                      {ranking.coverage !== null && ranking.coverage < 100 ? <p className="mt-2 text-[10px] text-amber-700">{ranking.coverage.toFixed(0)}% weighted coverage overall</p> : null}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">{score(ranking.prospectScore)}</td><td className="px-4 py-3 text-ink/65">{score(ranking.draftCapitalScore)}</td><td className="px-4 py-3 text-ink/65">{score(ranking.marketScore)}</td><td className="px-4 py-3 text-ink/65">{score(ranking.situationScore)}</td><td className="px-4 py-3 font-bold text-moss">{score(ranking.overallScore)}</td><td className="px-4 py-3"><input aria-label={`Manual tier for ${ranking.name}`} value={manualEdits[ranking.id]?.tier ?? ranking.manualTier ?? ""} onChange={(event) => setManualEdits((current) => ({ ...current, [ranking.id]: { rank: current[ranking.id]?.rank ?? String(ranking.manualRank ?? ""), tier: event.target.value } }))} className="h-8 w-24 rounded border border-ink/15 px-2 text-sm" placeholder={ranking.tier ?? "Tier"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-moss" aria-hidden="true" /><h2 className="font-bold text-ink">Central dataset by draft year</h2></div>
        <p className="mt-1 text-sm text-ink/55">One joined view of prospect, draft, market, and overall coverage. Scores remain class-relative—not hit probabilities.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{classComparison.map((cohort) => <article key={cohort.year} className="rounded-md border border-ink/10 bg-mist/35 p-4"><div className="flex items-center justify-between"><h3 className="text-lg font-bold text-ink">{cohort.year} draft class</h3><span className="text-xs font-semibold text-ink/50">{cohort.count} prospects</span></div><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-ink/50">Average prospect</dt><dd className="mt-1 text-xl font-bold text-moss">{score(cohort.average)}</dd></div><div><dt className="text-ink/50">Average overall</dt><dd className="mt-1 text-xl font-bold text-ink">{score(cohort.averageOverall)}</dd></div><div><dt className="text-ink/50">Input coverage</dt><dd className="mt-1 text-xl font-bold text-ink">{cohort.coverage === null ? "-" : `${cohort.coverage.toFixed(0)}%`}</dd></div><div><dt className="text-ink/50">Complete overall</dt><dd className="mt-1 text-xl font-bold text-ink">{cohort.overall}/{cohort.count}</dd></div></dl><div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink/10 pt-3 text-center text-xs"><div><p className="font-bold text-ink">{cohort.scored}</p><p className="text-ink/50">Prospect</p></div><div><p className="font-bold text-ink">{cohort.draft}</p><p className="text-ink/50">Draft</p></div><div><p className="font-bold text-ink">{cohort.market}</p><p className="text-ink/50">Market</p></div></div></article>)}</div>
      </section>

    </div>
  );
}
