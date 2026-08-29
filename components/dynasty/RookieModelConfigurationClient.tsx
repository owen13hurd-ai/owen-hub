"use client";

import { CheckCircle2, Save, ShieldAlert } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { publishRookieModelDraft, saveRookieModelDraft } from "@/app/dashboard/dynasty/rookies/actions";
import { Button } from "@/components/ui/button";
import type { RookieModelVersionSummary } from "@/lib/dynasty/rookie-model/repository";
import type { RookieModelConfiguration } from "@/types/rookie-engine";
import { rookieEnginePositions, type RookieEnginePosition } from "@/types/rookie-engine";

export function RookieModelConfigurationClient({ defaults, versions }: { defaults: RookieModelConfiguration[]; versions: RookieModelVersionSummary[] }) {
  const router = useRouter();
  const [position, setPosition] = useState<RookieEnginePosition>("WR");
  const newest = useMemo(() => versions.find((version) => version.position === position), [position, versions]);
  const base = useMemo(() => newest?.configuration ?? defaults.find((configuration) => configuration.position === position)!, [defaults, newest, position]);
  const [drafts, setDrafts] = useState<Record<string, RookieModelConfiguration>>({});
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();
  const [savedDraftIds, setSavedDraftIds] = useState<Partial<Record<RookieEnginePosition, string>>>({});
  const configuration = useMemo(() => drafts[position] ?? { ...base, version: newest?.status === "draft" ? base.version : `${base.version}-next` }, [base, drafts, newest?.status, position]);
  const familyTotal = configuration.prospectFamilies.reduce((total, family) => total + family.weight, 0);
  const overallTotal = Object.values(configuration.overallWeights).reduce((total, weight) => total + weight, 0);
  const valid = Math.abs(familyTotal - 1) < 0.0001 && Math.abs(overallTotal - 1) < 0.0001 && configuration.version.trim().length > 0;

  function update(next: RookieModelConfiguration) { setDrafts((current) => ({ ...current, [position]: next })); }
  function save() { startSaving(async () => { const result = await saveRookieModelDraft(configuration); if (result.ok) { toast.success(result.message); setSavedDraftIds((current) => ({ ...current, [position]: result.id })); router.refresh(); } else toast.error(result.message); }); }
  function publish() {
    const model = versions.find((version) => version.position === position && version.status === "draft" && version.semanticVersion === configuration.version);
    const modelId = savedDraftIds[position] ?? model?.id;
    if (!modelId) { toast.error("Save this version as a draft before publishing it."); return; }
    startPublishing(async () => { const result = await publishRookieModelDraft(modelId); if (result.ok) { toast.success(result.message); setSavedDraftIds((current) => ({ ...current, [position]: undefined })); router.refresh(); } else toast.error(result.message); });
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap gap-2">{rookieEnginePositions.map((candidate) => <Button key={candidate} type="button" variant={position === candidate ? "default" : "outline"} onClick={() => setPosition(candidate)}>{candidate}</Button>)}</div>
    <section className="rounded-lg border border-ink/10 bg-white shadow-soft">
      <div className="grid gap-4 border-b border-ink/10 p-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-ink">Model label<input value={configuration.label} onChange={(event) => update({ ...configuration, label: event.target.value })} className="h-10 rounded-md border border-ink/15 px-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold text-ink">Version<input value={configuration.version} onChange={(event) => update({ ...configuration, version: event.target.value })} className="h-10 rounded-md border border-ink/15 px-3 font-normal" /><span className="text-xs font-normal text-ink/50">Published names cannot be reused.</span></label></div>
      <div className="p-5"><h2 className="font-bold text-ink">Prospect families</h2><p className="mt-1 text-sm text-ink/55">Family weights must total 100%. Metric weights remain visible and versioned inside each family.</p><div className="mt-4 grid gap-3 lg:grid-cols-2">{configuration.prospectFamilies.map((family, index) => <article key={family.key} className="rounded-md border border-ink/10 bg-mist/35 p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-bold text-ink">{family.label}</h3><p className="mt-1 text-xs text-ink/50">Minimum coverage {(family.minimumCoverage * 100).toFixed(0)}%</p></div><label className="text-xs font-semibold text-ink/55">Weight %<input type="number" min="0" max="100" step="1" value={Math.round(family.weight * 100)} onChange={(event) => { const families = [...configuration.prospectFamilies]; families[index] = { ...family, weight: Number(event.target.value) / 100 }; update({ ...configuration, prospectFamilies: families }); }} className="ml-2 h-8 w-20 rounded border border-ink/15 bg-white px-2 text-sm text-ink" /></label></div><ul className="mt-3 space-y-1 text-xs text-ink/60">{family.metrics.map((metric) => <li key={metric.key} className="flex justify-between gap-3"><span>{metric.label}</span><span>{(metric.weight * 100).toFixed(0)}%</span></li>)}</ul></article>)}</div></div>
      <div className="border-t border-ink/10 p-5"><h2 className="font-bold text-ink">Overall rookie score</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(configuration.overallWeights).map(([key, weight]) => <label key={key} className="grid gap-2 text-sm font-semibold capitalize text-ink">{key}<input type="number" min="0" max="100" value={Math.round(weight * 100)} onChange={(event) => update({ ...configuration, overallWeights: { ...configuration.overallWeights, [key]: Number(event.target.value) / 100 } })} className="h-9 rounded border border-ink/15 px-3 font-normal" /></label>)}</div></div>
      <div className={`flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between ${valid ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-center gap-2 text-sm font-semibold text-ink">{valid ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <ShieldAlert className="h-4 w-4 text-amber-700" />}Families {(familyTotal * 100).toFixed(0)}% · Overall {(overallTotal * 100).toFixed(0)}%</div><div className="flex gap-2"><Button type="button" variant="outline" disabled={!valid || isSaving} onClick={save}><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save draft"}</Button><Button type="button" disabled={!valid || isPublishing} onClick={publish}>{isPublishing ? "Publishing..." : "Publish saved draft"}</Button></div></div>
    </section>
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft"><h2 className="font-bold text-ink">Version history</h2><div className="mt-3 space-y-2">{versions.filter((version) => version.position === position).map((version) => <div key={version.id} className="flex items-center justify-between rounded-md border border-ink/10 p-3 text-sm"><div><p className="font-semibold text-ink">{version.semanticVersion} · {version.label}</p><p className="text-xs text-ink/50">Created {new Date(version.createdAt).toLocaleDateString()}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${version.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{version.status}</span></div>)}{versions.every((version) => version.position !== position) ? <p className="text-sm text-ink/55">No saved versions yet. The built-in MVP configuration will be created on the first score run.</p> : null}</div></section>
  </div>;
}
