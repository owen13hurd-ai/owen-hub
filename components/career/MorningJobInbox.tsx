"use client";

import { ExternalLink, Inbox, Plus, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import {
  buildApplicationFromScoutJob,
  getApplicationsFromStorage,
  saveApplications,
} from "@/lib/career/applications";
import type { ScoutJob } from "@/lib/career/types";

type DiscoveredJob = ScoutJob & {
  closedAt: string | null;
  firstSeenAt: string;
  jobKey: string;
  lastSeenAt: string;
};

function isNewToday(value: string) {
  return Date.now() - new Date(value).getTime() < 24 * 60 * 60 * 1000;
}

export function MorningJobInbox() {
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("All");
  const [hideSeniorRoles, setHideSeniorRoles] = useState(true);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/career/discovered-jobs", { cache: "no-store" });
      if (!response.ok) throw new Error("The morning inbox could not load.");
      const payload = (await response.json()) as { jobs?: DiscoveredJob[] };
      setJobs(payload.jobs ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The morning inbox could not load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/career/discovered-jobs", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("The morning inbox could not load.");
        return response.json() as Promise<{ jobs?: DiscoveredJob[] }>;
      })
      .then((payload) => {
        if (!cancelled) setJobs(payload.jobs ?? []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "The morning inbox could not load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const sources = useMemo(() => ["All", ...Array.from(new Set(jobs.map((job) => job.source))).sort()], [jobs]);
  const seniorTitle = /(^|\s)(senior|sr\.?|director|principal|vice president|vp|manager|head of)(\s|$)/i;
  const visibleJobs = jobs.filter((job) =>
    !job.closedAt &&
    (source === "All" || job.source === source) &&
    (!hideSeniorRoles || !seniorTitle.test(job.title)),
  );
  const newCount = jobs.filter((job) => !job.closedAt && isNewToday(job.firstSeenAt)).length;

  function saveJob(job: DiscoveredJob) {
    const applications = getApplicationsFromStorage();
    const duplicate = applications.some((application) =>
      application.company.toLowerCase() === job.company.toLowerCase() &&
      application.role.toLowerCase() === job.title.toLowerCase());
    if (!duplicate) saveApplications([buildApplicationFromScoutJob(job), ...applications]);
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-skyglass text-ink">
            <Inbox className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Morning Inbox</p>
            <h2 className="mt-1 text-lg font-bold text-ink">Jobs collected automatically</h2>
            <p className="mt-1 text-sm text-ink/55">Company feeds plus LinkedIn and Indeed alert emails.</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadJobs()} disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-ink px-3 text-xs font-bold text-white disabled:bg-ink/35">
          <RefreshCcw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden="true" />Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-mist p-3"><p className="text-xs text-ink/50">Active discoveries</p><p className="mt-1 text-2xl font-bold text-ink">{jobs.filter((job) => !job.closedAt).length}</p></div>
        <div className="rounded-lg bg-mist p-3"><p className="text-xs text-ink/50">New today</p><p className="mt-1 text-2xl font-bold text-moss">{newCount}</p></div>
        <label className="rounded-lg bg-mist p-3 text-xs font-bold text-ink/50">Source
          <select value={source} onChange={(event) => setSource(event.target.value)} className="mt-1 h-8 w-full bg-transparent text-sm font-bold text-ink outline-none">
            {sources.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs font-bold text-ink/60">
        <input type="checkbox" checked={hideSeniorRoles} onChange={(event) => setHideSeniorRoles(event.target.checked)} className="h-4 w-4 accent-ink" />
        Hide senior and management roles · Showing {visibleJobs.length}
      </label>

      {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {visibleJobs.map((job) => (
          <article key={job.jobKey} className="rounded-lg border border-ink/10 bg-mist p-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-moss">{job.score}% match</span>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink/55">{job.source}</span>
                  {isNewToday(job.firstSeenAt) ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">New</span> : null}
                </div>
                <h3 className="mt-2 font-bold text-ink">{job.title}</h3>
                <p className="mt-1 text-sm font-semibold text-ink/55">{job.company} · {job.location}</p>
                <p className="mt-2 text-sm text-ink/50">{job.reasons.slice(0, 3).join(" · ")}</p>
              </div>
              <div className="flex gap-2">
                <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-xs font-bold text-moss">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Open
                </a>
                <button type="button" onClick={() => saveJob(job)} className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-xs font-bold text-white">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />Save
                </button>
              </div>
            </div>
          </article>
        ))}
        {!loading && visibleJobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink/20 bg-mist p-6 text-sm text-ink/55">No jobs have been imported yet. The next morning run will populate this inbox.</div>
        ) : null}
      </div>
    </section>
  );
}
