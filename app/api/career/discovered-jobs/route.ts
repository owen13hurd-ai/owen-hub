import { NextRequest, NextResponse } from "next/server";

import { defaultJobPreferences } from "@/lib/career/preferences";
import { scoreJob } from "@/lib/career/scoring";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ScoutJob } from "@/lib/career/types";

const profileKey = "owen-main";
type IncomingJob = Partial<ScoutJob>;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isGeorgiaLocation(location: string) {
  const value = normalize(location);
  return value.includes("atlanta") || value.includes("georgia") || /(^| )ga($| )/.test(value);
}

function normalizeJob(value: IncomingJob): ScoutJob | null {
  const company = value.company?.trim();
  const title = value.title?.trim();
  const location = value.location?.trim();
  const url = value.url?.trim();
  const source = value.source?.trim();
  if (!company || !title || !location || !url || !source || !isGeorgiaLocation(location)) return null;

  const baseJob = {
    company,
    description: value.description?.trim() ?? "",
    location,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string") : [],
    title,
  };
  const match = scoreJob(baseJob, defaultJobPreferences);

  return {
    ...baseJob,
    id: value.id?.trim() || `${normalize(source)}-${normalize(company)}-${normalize(title)}`,
    matchBreakdown: match.breakdown,
    postedAt: value.postedAt ?? null,
    reasons: match.reasons,
    salaryMaximum: typeof value.salaryMaximum === "number" ? value.salaryMaximum : null,
    salaryMinimum: typeof value.salaryMinimum === "number" ? value.salaryMinimum : null,
    score: match.score,
    source,
    url,
  };
}

export async function GET() {
  if (!hasSupabaseConfig()) return NextResponse.json({ jobs: [] });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_seen_jobs")
    .select("job_key,payload,first_seen_at,last_seen_at,closed_at")
    .eq("profile_key", profileKey)
    .order("first_seen_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    jobs: data.map((row) => ({
      ...(row.payload as ScoutJob),
      closedAt: row.closed_at,
      firstSeenAt: row.first_seen_at,
      jobKey: row.job_key,
      lastSeenAt: row.last_seen_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.CAREER_INGEST_SECRET;
  if (configuredSecret && request.headers.get("x-career-ingest-key") !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  let body: { jobs?: IncomingJob[] };
  try {
    body = (await request.json()) as { jobs?: IncomingJob[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const jobs = (body.jobs ?? []).map(normalizeJob).filter((job): job is ScoutJob => Boolean(job));
  if (!jobs.length) return NextResponse.json({ accepted: 0, rejected: body.jobs?.length ?? 0 });

  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase.from("career_profiles").upsert({ profile_key: profileKey, updated_at: now });
  const { error } = await supabase.from("career_seen_jobs").upsert(
    jobs.map((job) => ({
      closed_at: null,
      job_key: normalize(`${job.company}-${job.title}`),
      last_seen_at: now,
      payload: job,
      profile_key: profileKey,
    })),
    { onConflict: "profile_key,job_key", ignoreDuplicates: false },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accepted: jobs.length, rejected: (body.jobs?.length ?? 0) - jobs.length });
}
