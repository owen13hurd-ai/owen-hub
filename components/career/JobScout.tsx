"use client";

import { Bot, ExternalLink, Plus, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

import {
  defaultResumeName,
  getApplicationsFromStorage,
  saveApplications,
  type JobApplication,
} from "@/lib/career/applications";

type ScoutJob = {
  company: string;
  id: string;
  location: string;
  postedAt: string | null;
  reason: string;
  score: number;
  source: string;
  tags: string[];
  title: string;
  url: string;
};

type ScoutSource = {
  count: number;
  label: string;
  ok: boolean;
};

type ScoutResponse = {
  jobs: ScoutJob[];
  ranAt: string;
  sources: ScoutSource[];
};

function getSavedJobKeys() {
  return new Set(
    getApplicationsFromStorage().map((application) =>
      `${application.company.toLowerCase()}-${application.role.toLowerCase()}`,
    ),
  );
}

function getScoreClass(score: number) {
  if (score >= 75) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (score >= 60) {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }

  return "bg-mist text-ink/60 ring-ink/10";
}

function formatRunTime(value: string | null) {
  if (!value) {
    return "Not run yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildApplicationFromJob(job: ScoutJob): JobApplication {
  return {
    appliedDate: "",
    company: job.company,
    followUpDate: "",
    id: `job-scout-${Date.now()}-${job.id}`,
    jobUrl: job.url,
    notes: `${job.reason}. Location: ${job.location}. Tags: ${
      job.tags.join(", ") || "none listed"
    }.`,
    priority: job.score >= 75 ? "High" : job.score >= 60 ? "Medium" : "Low",
    resumeVersion: defaultResumeName,
    role: job.title,
    source: job.source,
    status: "Interested",
  };
}

export function JobScout() {
  const [data, setData] = useState<ScoutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJobKeys, setSavedJobKeys] = useState(getSavedJobKeys);

  const savedCount = useMemo(() => {
    return data?.jobs.filter((job) =>
      savedJobKeys.has(`${job.company.toLowerCase()}-${job.title.toLowerCase()}`),
    ).length;
  }, [data, savedJobKeys]);

  async function runScout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/career/job-scout", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("The job scout could not load right now.");
      }

      setData((await response.json()) as ScoutResponse);
      setSavedJobKeys(getSavedJobKeys());
    } catch (scoutError) {
      setError(
        scoutError instanceof Error
          ? scoutError.message
          : "The job scout could not load right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function saveJob(job: ScoutJob) {
    const currentApplications = getApplicationsFromStorage();
    const key = `${job.company.toLowerCase()}-${job.title.toLowerCase()}`;

    if (
      currentApplications.some(
        (application) =>
          application.company.toLowerCase() === job.company.toLowerCase() &&
          application.role.toLowerCase() === job.title.toLowerCase(),
      )
    ) {
      setSavedJobKeys(getSavedJobKeys());
      return;
    }

    saveApplications([buildApplicationFromJob(job), ...currentApplications]);
    setSavedJobKeys(new Set([...Array.from(savedJobKeys), key]));
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-skyglass text-ink">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
                Job Scout
              </p>
              <h2 className="text-lg font-bold text-ink">
                Morning search base
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">
            This first version checks public job feeds, dedupes roles, gives each
            lead a rough fit score, and lets you save strong matches into the
            tracker below.
          </p>
        </div>

        <button
          type="button"
          onClick={runScout}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/35"
        >
          <RefreshCcw
            className={clsx("h-4 w-4", isLoading && "animate-spin")}
            aria-hidden="true"
          />
          {isLoading ? "Searching" : "Run scout"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-mist p-3">
          <p className="text-sm text-ink/55">Matches found</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {data?.jobs.length ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-mist p-3">
          <p className="text-sm text-ink/55">Saved from run</p>
          <p className="mt-1 text-2xl font-bold text-moss">{savedCount ?? 0}</p>
        </div>
        <div className="rounded-lg bg-mist p-3">
          <p className="text-sm text-ink/55">Last run</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {formatRunTime(data?.ranAt ?? null)}
          </p>
        </div>
      </div>

      {data ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.sources.map((source) => (
            <span
              key={source.label}
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                source.ok
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-rose-50 text-rose-800 ring-rose-200",
              )}
            >
              {source.label}: {source.ok ? `${source.count} found` : "offline"}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {data?.jobs.map((job) => {
          const jobKey = `${job.company.toLowerCase()}-${job.title.toLowerCase()}`;
          const isSaved = savedJobKeys.has(jobKey);

          return (
            <article key={job.id} className="rounded-lg border border-ink/10 bg-mist p-3">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                        getScoreClass(job.score),
                      )}
                    >
                      Fit {job.score}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink/55">
                      {job.source}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink/55">
                      {job.location}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-ink">{job.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-ink/60">
                    {job.company}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/55">
                    {job.reason}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-xs font-bold text-moss transition hover:text-ink"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => saveJob(job)}
                    disabled={isSaved}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-xs font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </div>
              </div>

              {job.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.tags.slice(0, 6).map((tag) => (
                    <span
                      key={`${job.id}-${tag}`}
                      className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {!data && !error ? (
        <div className="mt-4 rounded-lg border border-dashed border-ink/20 bg-mist p-6 text-sm text-ink/55">
          Run the scout to pull a first batch of leads. Next pass can add your
          exact title, salary, location, and target-company filters.
        </div>
      ) : null}
    </section>
  );
}
