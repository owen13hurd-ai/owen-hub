import { NextResponse } from "next/server";

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

type SourceResult = {
  count: number;
  label: string;
  ok: boolean;
};

type RemotiveJob = {
  candidate_required_location?: string;
  category?: string;
  company_name?: string;
  id?: number;
  job_type?: string;
  publication_date?: string;
  tags?: string[];
  title?: string;
  url?: string;
};

type ArbeitnowJob = {
  company_name?: string;
  location?: string;
  remote?: boolean;
  slug?: string;
  tags?: string[];
  title?: string;
  url?: string;
};

const targetKeywords = [
  "analyst",
  "operations",
  "business",
  "product",
  "customer success",
  "strategy",
  "coordinator",
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getJobScore({
  location,
  tags,
  title,
}: {
  location: string;
  tags: string[];
  title: string;
}) {
  const haystack = normalizeText(`${title} ${tags.join(" ")} ${location}`);
  const keywordMatches = targetKeywords.filter((keyword) =>
    haystack.includes(keyword),
  );
  const remoteBoost = haystack.includes("remote") ? 12 : 0;
  const score = Math.min(98, 45 + keywordMatches.length * 9 + remoteBoost);

  return {
    reason:
      keywordMatches.length > 0
        ? `Matched ${keywordMatches.slice(0, 3).join(", ")}`
        : "Saved as a broad lead for later filtering",
    score,
  };
}

function dedupeJobs(jobs: ScoutJob[]) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = normalizeText(`${job.company} ${job.title} ${job.location}`);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function fetchRemotiveJobs(): Promise<ScoutJob[]> {
  const response = await fetch(
    "https://remotive.com/api/remote-jobs?search=analyst",
    {
      next: { revalidate: 60 * 30 },
    },
  );

  if (!response.ok) {
    throw new Error(`Remotive returned ${response.status}`);
  }

  const payload = (await response.json()) as { jobs?: RemotiveJob[] };

  return (payload.jobs ?? []).slice(0, 20).map((job) => {
    const title = job.title ?? "Untitled role";
    const location = job.candidate_required_location ?? "Remote";
    const tags = [job.category, job.job_type, ...(job.tags ?? [])].filter(
      (tag): tag is string => Boolean(tag),
    );
    const scoring = getJobScore({ location, tags, title });

    return {
      company: job.company_name ?? "Unknown company",
      id: `remotive-${job.id ?? job.url ?? title}`,
      location,
      postedAt: job.publication_date ?? null,
      reason: scoring.reason,
      score: scoring.score,
      source: "Remotive",
      tags,
      title,
      url: job.url ?? "https://remotive.com/remote-jobs",
    };
  });
}

async function fetchArbeitnowJobs(): Promise<ScoutJob[]> {
  const response = await fetch("https://www.arbeitnow.com/api/job-board-api", {
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    throw new Error(`Arbeitnow returned ${response.status}`);
  }

  const payload = (await response.json()) as { data?: ArbeitnowJob[] };

  return (payload.data ?? [])
    .filter((job) => {
      const text = normalizeText(`${job.title ?? ""} ${(job.tags ?? []).join(" ")}`);
      return targetKeywords.some((keyword) => text.includes(keyword));
    })
    .slice(0, 20)
    .map((job) => {
      const title = job.title ?? "Untitled role";
      const location = job.location ?? (job.remote ? "Remote" : "Unknown");
      const tags = job.tags ?? [];
      const scoring = getJobScore({ location, tags, title });

      return {
        company: job.company_name ?? "Unknown company",
        id: `arbeitnow-${job.slug ?? job.url ?? title}`,
        location,
        postedAt: null,
        reason: scoring.reason,
        score: scoring.score,
        source: "Arbeitnow",
        tags,
        title,
        url: job.url ?? "https://www.arbeitnow.com/",
      };
    });
}

export async function GET() {
  const sources: SourceResult[] = [];
  const jobs: ScoutJob[] = [];

  for (const source of [
    { label: "Remotive", load: fetchRemotiveJobs },
    { label: "Arbeitnow", load: fetchArbeitnowJobs },
  ]) {
    try {
      const sourceJobs = await source.load();
      jobs.push(...sourceJobs);
      sources.push({
        count: sourceJobs.length,
        label: source.label,
        ok: true,
      });
    } catch {
      sources.push({
        count: 0,
        label: source.label,
        ok: false,
      });
    }
  }

  const dedupedJobs = dedupeJobs(jobs)
    .sort((firstJob, secondJob) => secondJob.score - firstJob.score)
    .slice(0, 30);

  return NextResponse.json({
    jobs: dedupedJobs,
    ranAt: new Date().toISOString(),
    sources,
  });
}
