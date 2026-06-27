import { NextRequest, NextResponse } from "next/server";

import { defaultJobPreferences } from "@/lib/career/preferences";
import { scoreJob } from "@/lib/career/scoring";
import type { JobPreferences, ScoutJob } from "@/lib/career/types";

type SourceResult = { count: number; label: string; ok: boolean };
type RawJob = Omit<ScoutJob, "matchBreakdown" | "reasons" | "score">;
type MuseJob = {
  categories?: { name?: string }[];
  company?: { name?: string };
  contents?: string;
  id?: number;
  levels?: { name?: string }[];
  locations?: { name?: string }[];
  name?: string;
  publication_date?: string;
  refs?: { landing_page?: string };
  tags?: string[];
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

function isInAtlantaOrGeorgia(job: RawJob) {
  const location = normalize(job.location);
  return location.includes("atlanta") || location.includes("georgia") || /(^| )ga($| )/.test(location);
}

async function fetchMuseJobs(): Promise<RawJob[]> {
  const response = await fetch(
    "https://www.themuse.com/api/public/jobs?location=Atlanta%2C%20GA&page=1",
    { next: { revalidate: 60 * 30 } },
  );
  if (!response.ok) throw new Error(`The Muse returned ${response.status}`);
  const payload = (await response.json()) as { results?: MuseJob[] };
  return (payload.results ?? []).map((job) => ({
    company: job.company?.name ?? "Unknown company",
    description: plainText(job.contents),
    id: `muse-${job.id ?? job.refs?.landing_page ?? job.name}`,
    location: job.locations?.map((location) => location.name).filter(Boolean).join(" / ") || "Atlanta, GA",
    postedAt: job.publication_date ?? null,
    salaryMaximum: null,
    salaryMinimum: null,
    source: "The Muse",
    tags: [
      ...(job.categories ?? []).map((category) => category.name),
      ...(job.levels ?? []).map((level) => level.name),
      ...(job.tags ?? []),
    ].filter((tag): tag is string => Boolean(tag)),
    title: job.name ?? "Untitled role",
    url: job.refs?.landing_page ?? "https://www.themuse.com/search/location/atlanta-ga/",
  }));
}

async function runScout(preferences: JobPreferences) {
  const sources: SourceResult[] = [];
  const jobs: RawJob[] = [];
  for (const source of [
    { label: "The Muse", load: fetchMuseJobs },
  ]) {
    try {
      const sourceJobs = await source.load();
      jobs.push(...sourceJobs);
      sources.push({ count: sourceJobs.length, label: source.label, ok: true });
    } catch {
      sources.push({ count: 0, label: source.label, ok: false });
    }
  }

  const scoredJobs: ScoutJob[] = dedupeJobs(jobs).filter(isInAtlantaOrGeorgia).map((job) => {
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
