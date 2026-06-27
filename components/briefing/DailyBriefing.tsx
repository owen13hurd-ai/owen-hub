"use client";

import { Bookmark, BookmarkCheck, ExternalLink, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { briefingCategories, type BriefingCategory } from "@/lib/briefing/sources";

type BriefingItem = { category: BriefingCategory; id: string; link: string; publishedAt: string | null; source: string; summary: string; title: string; whyItMatters: string };
type BriefingResponse = { generatedAt: string; sections: { category: BriefingCategory; items: BriefingItem[] }[]; sources: { count: number; label: string; ok: boolean }[] };
const savedKey = "owen-hub-saved-briefing-items";

function formatDate(value: string | null) {
  if (!value) return "Recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function DailyBriefing() {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [category, setCategory] = useState<"All" | BriefingCategory>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem(savedKey) ?? "[]") as string[]; } catch { return []; }
  });

  async function load() {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/briefing", { cache: "no-store" });
      if (!response.ok) throw new Error("The briefing could not refresh.");
      setData(await response.json() as BriefingResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The briefing could not refresh.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/briefing", { cache: "no-store" }).then((response) => response.json() as Promise<BriefingResponse>)
      .then((payload) => { if (!cancelled) setData(payload); })
      .catch(() => { if (!cancelled) setError("The briefing could not load."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function toggleSaved(item: BriefingItem) {
    const next = saved.includes(item.link) ? saved.filter((link) => link !== item.link) : [...saved, item.link];
    setSaved(next); window.localStorage.setItem(savedKey, JSON.stringify(next));
  }

  const sections = data?.sections.filter((section) => category === "All" || section.category === category) ?? [];
  const itemCount = data?.sections.reduce((count, section) => count + section.items.length, 0) ?? 0;

  return <div className="space-y-5">
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Today</p><h2 className="mt-1 text-xl font-bold text-ink">Your interest briefing</h2><p className="mt-2 text-sm text-ink/55">{itemCount} focused updates · {data ? formatDate(data.generatedAt) : "Loading"}</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white disabled:bg-ink/35"><RefreshCcw className={clsx("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />Refresh</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{(["All", ...briefingCategories] as const).map((option) => <button key={option} type="button" onClick={() => setCategory(option)} className={clsx("h-9 rounded-md px-3 text-xs font-bold", category === option ? "bg-moss text-white" : "bg-mist text-ink/60")}>{option}</button>)}</div>
      {data ? <div className="mt-4 flex flex-wrap gap-1.5">{data.sources.map((source) => <span key={source.label} className={clsx("rounded-md px-2 py-1 text-xs font-semibold", source.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>{source.label}: {source.ok ? source.count : "offline"}</span>)}</div> : null}
      {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
    </section>

    {sections.map((section) => <section key={section.category}>
      <div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-bold text-ink">{section.category}</h2><span className="text-xs font-bold text-ink/40">{section.items.length} updates</span></div>
      <div className="grid gap-3 xl:grid-cols-2">{section.items.map((item) => {
        const isSaved = saved.includes(item.link);
        return <article key={item.id} className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className="text-moss">{item.source}</span><span className="text-ink/35">{formatDate(item.publishedAt)}</span></div><h3 className="mt-2 text-base font-bold leading-6 text-ink">{item.title}</h3></div><button type="button" onClick={() => toggleSaved(item)} title={isSaved ? "Remove bookmark" : "Save for later"} aria-label={isSaved ? `Remove ${item.title} bookmark` : `Save ${item.title}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-mist text-ink/55">{isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}</button></div>
          {item.summary ? <p className="mt-3 text-sm leading-6 text-ink/60">{item.summary}</p> : null}
          <div className="mt-3 border-l-2 border-ember pl-3"><p className="text-xs font-bold uppercase text-ink/40">Why it matters</p><p className="mt-1 text-sm text-ink/60">{item.whyItMatters}</p></div>
          <a href={item.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 items-center gap-2 text-xs font-bold text-moss hover:text-ink"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Open source</a>
        </article>;
      })}</div>
    </section>)}
  </div>;
}

