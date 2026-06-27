import { NextRequest, NextResponse } from "next/server";

import { defaultJobPreferences } from "@/lib/career/preferences";
import { scoreJob } from "@/lib/career/scoring";
import type { JobPreferences, ScoutJob } from "@/lib/career/types";

type SourceResult = { count: number; label: string; ok: boolean };
type RawJob = Omit<ScoutJob, "matchBreakdown" | "reasons" | "score">;
type RemotiveJob = {
  candidate_required_location?: string; category?: string; company_name?: string;
  description?: string; id?: number; job_type?: string; publication_date?: string;
  salary?: string; tags?: string[]; title?: string; url?: string;
};
type ArbeitnowJob = {
  company_name?: string; description?: string; location?: string; remote?: boolean;
  slug?: string; tags?: string[]; title?: string; url?: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function plainText(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);
}

function dedupeJobs(jobs: RawJob[]) {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = normalize(`${job.company} ${job.title} ${job.location}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchRemotiveJobs(): Promise<RawJob[]> {
  const response = await fetch("https://remotive.com/api/remote-jobs?search=analyst", {
    next: { revalidate: 60 * 30 },
  });
  if (!response.ok) throw new Error(`Remotive returned ${response.status}`);
  const payload = (await response.json()) as { jobs?: RemotiveJob[] };
  return (payload.jobs ?? []).slice(0, 35).map((job) => ({
    company: job.company_name ?? "Unknown company",
    description: plainText(job.description),
    id: `remotive-${job.id ?? job.url ?? job.title}`,
    location: job.candidate_required_location ?? "Remote",
    postedAt: job.publication_date ?? null,
    salaryMaximum: null,
    salaryMinimum: null,
    source: "Remotive",
    tags: [job.category, job.job_type, ...(job.tags ?? [])].filter((tag): tag is string => Boolean(tag)),
    title: job.title ?? "Untitled role",
    url: job.url ?? "https://remotive.com/remote-jobs",
  }));
}

async function fetchArbeitnowJobs(): Promise<RawJob[]> {
  const response = await fetch("https://www.arbeitnow.com/api/job-board-api", {
    next: { revalidate: 60 * 30 },
  });
  if (!response.ok) throw new Error(`Arbeitnow returned ${response.status}`);
  const payload = (await response.json()) as { data?: ArbeitnowJob[] };
  return (payload.data ?? []).slice(0, 60).map((job) => ({
    company: job.company_name ?? "Unknown company",
    description: plainText(job.description),
    id: `arbeitnow-${job.slug ?? job.url ?? job.title}`,
    location: job.location ?? (job.remote ? "Remote" : "Unknown"),
    postedAt: null,
    salaryMaximum: null,
    salaryMinimum: null,
    source: "Arbeitnow",
    tags: job.tags ?? [],
    title: job.title ?? "Untitled role",
    url: job.url ?? "https://www.arbeitnow.com/",
  }));
}

async function runScout(preferences: JobPreferences) {
  const sources: SourceResult[] = [];
  const jobs: RawJob[] = [];
  for (const source of [
    { label: "Remotive", load: fetchRemotiveJobs },
    { label: "Arbeitnow", load: fetchArbeitnowJobs },
  ]) {
    try {
      const sourceJobs = await source.load();
      jobs.push(...sourceJobs);
      sources.push({ count: sourceJobs.length, label: source.label, ok: true });
    } catch {
      sources.push({ count: 0, label: source.label, ok: false });
    }
  }

  const scoredJobs: ScoutJob[] = dedupeJobs(jobs).map((job) => {
    const match = scoreJob(job, preferences);
    return { ...job, matchBreakdown: match.breakdown, reasons: match.reasons, score: match.score };
  });

  return {
    jobs: scoredJobs.sort((first, second) => second.score - first.score).slice(0, 40),
    ranAt: new Date().toISOString(),
    sources,
  };
}

export async function GET() {
  return NextResponse.json(await runScout(defaultJobPreferences));
}

export async function POST(request: NextRequest) {
  let preferences = defaultJobPreferences;
  try {
    const body = (await request.json()) as { preferences?: JobPreferences };
    if (body.preferences) preferences = { ...defaultJobPreferences, ...body.preferences };
  } catch {
    // A malformed body safely falls back to Owen's defaults.
  }
  return NextResponse.json(await runScout(preferences));
}
