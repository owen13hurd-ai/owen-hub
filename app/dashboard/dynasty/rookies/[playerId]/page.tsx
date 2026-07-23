import { ArrowLeft, AlertTriangle, CheckCircle2, Link2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { RookiePlayerEditorClient } from "@/components/dynasty/RookiePlayerEditorClient";
import { getRookiePlayerDetail } from "@/lib/dynasty/rookie-model/repository";

function score(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

export default async function RookiePlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const player = await getRookiePlayerDetail(playerId);
  if (!player) notFound();

  const available = player.components.filter((component) => !component.missing);
  const missing = player.components.filter((component) => component.missing);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/dynasty/rookies" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-moss">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Rookie rankings
      </Link>
      <PageHeader eyebrow={`${player.classYear} ${player.position}`} title={player.name} description={`${player.school ?? "School not recorded"}. ${player.modelLabel ?? "Awaiting a model run"}.`} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Prospect", player.prospectScore], ["Draft capital", player.draftCapitalScore], ["Situation", player.situationScore], ["Market", player.marketScore], ["Overall", player.overallScore],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><p className="text-sm text-ink/55">{label}</p><p className="mt-2 text-2xl font-bold text-ink">{score(value as number | null)}</p></div>
        ))}
      </section>

      <RookiePlayerEditorClient player={player} />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-ink/10 bg-white shadow-soft">
          <div className="border-b border-ink/10 p-4"><h2 className="font-bold text-ink">Score explanation</h2><p className="mt-1 text-sm text-ink/55">Every contribution is tied to a raw input and model version.</p></div>
          {available.length === 0 ? <p className="p-6 text-sm text-ink/60">Run the model after importing metrics to create an explanation.</p> : (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {available.map((component) => (
                <article key={component.key} className="rounded-md border border-ink/10 bg-mist/35 p-4">
                  <div className="flex items-start justify-between gap-4"><div><p className="font-bold text-ink">{component.label}</p><p className="mt-1 text-xs text-ink/50">{component.familyKey.replaceAll("_", " ")}</p></div><p className="text-lg font-bold text-moss">{score(component.normalizedValue)}</p></div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-ink/45">Raw</dt><dd className="mt-1 font-semibold text-ink">{component.rawValue ?? "-"}</dd></div><div><dt className="text-ink/45">Weight</dt><dd className="mt-1 font-semibold text-ink">{(component.weight * 100).toFixed(0)}%</dd></div><div><dt className="text-ink/45">Points</dt><dd className="mt-1 font-semibold text-ink">{score(component.contribution)}</dd></div></dl>
                  <p className="mt-3 text-sm leading-6 text-ink/60">{component.explanation}</p>
                  {component.sourceUrl ? <a href={component.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-moss hover:underline"><Link2 className="h-3.5 w-3.5" aria-hidden="true" />{component.sourceLabel ?? "View source"}</a> : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><h2 className="font-bold text-ink">Model record</h2><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-ink/50">Version</dt><dd className="font-semibold text-ink">{player.modelVersion ?? "Not scored"}</dd></div><div><dt className="text-ink/50">Normalization</dt><dd className="font-semibold text-ink">{player.normalization ?? "Class-relative"}</dd></div><div><dt className="text-ink/50">Coverage</dt><dd className="font-semibold text-ink">{player.coverage === null ? "-" : `${player.coverage.toFixed(1)}%`}</dd></div><div><dt className="text-ink/50">Tier</dt><dd className="font-semibold text-ink">{player.manualTier ?? player.tier ?? "-"}</dd></div></dl></div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-bold text-amber-900"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Missing data</div>{missing.length ? <ul className="mt-3 space-y-2 text-sm text-amber-900/80">{missing.map((component) => <li key={component.key}>{component.label}</li>)}</ul> : <p className="mt-3 flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />No configured metric is missing.</p>}</div>
        </aside>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white shadow-soft">
        <div className="border-b border-ink/10 p-4"><h2 className="font-bold text-ink">Ranking history</h2><p className="mt-1 text-sm text-ink/55">Append-only score runs preserve how this prospect changed across model versions and dates.</p></div>
        {player.scoreHistory.length === 0 ? <p className="p-6 text-sm text-ink/60">No score runs recorded.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-mist/70 text-xs font-bold uppercase tracking-wide text-ink/55"><tr><th className="px-4 py-3">Run</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Prospect</th><th className="px-4 py-3">Overall</th><th className="px-4 py-3">Coverage</th><th className="px-4 py-3">Tier</th></tr></thead><tbody>{player.scoreHistory.map((entry) => <tr key={entry.createdAt} className="border-t border-ink/8"><td className="px-4 py-3"><span className="font-semibold text-ink">{entry.asOfDate}</span><p className="text-xs text-ink/45">{new Date(entry.createdAt).toLocaleString()}</p></td><td className="px-4 py-3">{entry.modelVersion}</td><td className="px-4 py-3 font-semibold">{score(entry.prospectScore)}</td><td className="px-4 py-3 font-bold text-moss">{score(entry.overallScore)}</td><td className="px-4 py-3">{entry.coverage.toFixed(0)}%</td><td className="px-4 py-3">{entry.tier ?? "-"}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
