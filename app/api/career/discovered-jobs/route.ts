import { NextRequest, NextResponse } from "next/server";

import { defaultJobPreferences } from "@/lib/career/preferences";
import { scoreJob } from "@/lib/career/scoring";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { JobPreferences, ScoutJob } from "@/lib/career/types";

const profileKey = "owen-main";
type IncomingJob = Partial<ScoutJob>;
type FeedbackStatus = "blocked_company" | "hidden" | "not_interested";
type StoredPayload = ScoutJob & {
  feedback?: { status: FeedbackStatus; updatedAt: string };
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isGeorgiaLocation(location: string) {
  const value = normalize(location);
  return value.includes("atlanta") || value.includes("georgia") || /(^| )ga($| )/.test(value);
}

function normalizeJob(value: IncomingJob, preferences: JobPreferences): ScoutJob | null {
  const company = value.company?.trim();
  const title = value.title?.trim();
  const location = value.location?.trim();
  const url = value.url?.trim();
  const source = value.source?.trim();
  if (!company || !title || !location || !url || !source || !isGeorgiaLocation(location)) return null;
  if (preferences.blockedCompanies.some((blocked) => normalize(blocked) === normalize(company))) return null;

  const baseJob = {
    company,
    description: value.description?.trim() ?? "",
    location,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string") : [],
    title,
  };
  const match = scoreJob(baseJob, preferences);

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

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: profile } = await supabase.from("career_profiles").select("preferences").eq("profile_key", profileKey).maybeSingle();
  const preferences = { ...defaultJobPreferences, ...((profile?.preferences ?? {}) as Partial<JobPreferences>) };
  const jobs = (body.jobs ?? []).map((job) => normalizeJob(job, preferences)).filter((job): job is ScoutJob => Boolean(job));
  if (!jobs.length) return NextResponse.json({ accepted: 0, rejected: body.jobs?.length ?? 0 });

  await supabase.from("career_profiles").upsert({ profile_key: profileKey, preferences, updated_at: now });
  const jobKeys = jobs.map((job) => normalize(`${job.company}-${job.title}`));
  const { data: existingRows } = await supabase
    .from("career_seen_jobs")
    .select("job_key,payload")
    .eq("profile_key", profileKey)
    .in("job_key", jobKeys);
  const feedbackByKey = new Map(
    (existingRows ?? []).map((row) => [row.job_key, (row.payload as StoredPayload).feedback]),
  );
  const { error } = await supabase.from("career_seen_jobs").upsert(
    jobs.map((job) => {
      const jobKey = normalize(`${job.company}-${job.title}`);
      const feedback = feedbackByKey.get(jobKey);
      return {
        closed_at: null,
        job_key: jobKey,
        last_seen_at: now,
        payload: feedback ? { ...job, feedback } : job,
        profile_key: profileKey,
      };
    }),
    { onConflict: "profile_key,job_key", ignoreDuplicates: false },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accepted: jobs.length, rejected: (body.jobs?.length ?? 0) - jobs.length });
}

export async function PATCH(request: NextRequest) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  let body: { action?: "block_company" | "hide" | "not_interested" | "restore" | "unblock_company"; jobKey?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.jobKey || !body.action) return NextResponse.json({ error: "Missing action or job key." }, { status: 400 });

  const supabase = await createClient();
  const { data: row, error: rowError } = await supabase
    .from("career_seen_jobs")
    .select("payload")
    .eq("profile_key", profileKey)
    .eq("job_key", body.jobKey)
    .maybeSingle();
  if (rowError || !row) return NextResponse.json({ error: rowError?.message ?? "Job not found." }, { status: 404 });

  const payload = row.payload as StoredPayload;
  const now = new Date().toISOString();
  if (body.action === "block_company") {
    const { data: profile } = await supabase.from("career_profiles").select("preferences").eq("profile_key", profileKey).maybeSingle();
    const preferences = { ...defaultJobPreferences, ...((profile?.preferences ?? {}) as Partial<JobPreferences>) };
    preferences.blockedCompanies = Array.from(new Set([...(preferences.blockedCompanies ?? []), payload.company]));
    await supabase.from("career_profiles").upsert({ profile_key: profileKey, preferences, updated_at: now });

    const { data: companyRows } = await supabase.from("career_seen_jobs").select("job_key,payload").eq("profile_key", profileKey);
    const matchingRows = (companyRows ?? []).filter((candidate) =>
      normalize((candidate.payload as StoredPayload).company) === normalize(payload.company),
    );
    await Promise.all(matchingRows.map((candidate) =>
      supabase.from("career_seen_jobs").update({
        payload: { ...(candidate.payload as StoredPayload), feedback: { status: "blocked_company", updatedAt: now } },
      }).eq("profile_key", profileKey).eq("job_key", candidate.job_key),
    ));
    return NextResponse.json({ ok: true, affected: matchingRows.length });
  }

  if (body.action === "unblock_company") {
    const { data: profile } = await supabase.from("career_profiles").select("preferences").eq("profile_key", profileKey).maybeSingle();
    const preferences = { ...defaultJobPreferences, ...((profile?.preferences ?? {}) as Partial<JobPreferences>) };
    preferences.blockedCompanies = (preferences.blockedCompanies ?? []).filter((company) => normalize(company) !== normalize(payload.company));
    await supabase.from("career_profiles").upsert({ profile_key: profileKey, preferences, updated_at: now });
    const { data: companyRows } = await supabase.from("career_seen_jobs").select("job_key,payload").eq("profile_key", profileKey);
    const matchingRows = (companyRows ?? []).filter((candidate) =>
      normalize((candidate.payload as StoredPayload).company) === normalize(payload.company),
    );
    await Promise.all(matchingRows.map((candidate) => {
      const { feedback: previousFeedback, ...restoredPayload } = candidate.payload as StoredPayload;
      void previousFeedback;
      return supabase.from("career_seen_jobs").update({ payload: restoredPayload })
        .eq("profile_key", profileKey).eq("job_key", candidate.job_key);
    }));
    return NextResponse.json({ ok: true, affected: matchingRows.length });
  }

  const feedback = body.action === "restore"
    ? undefined
    : { status: body.action === "hide" ? "hidden" as const : "not_interested" as const, updatedAt: now };
  const { feedback: previousFeedback, ...jobWithoutFeedback } = payload;
  void previousFeedback;
  const { error } = await supabase.from("career_seen_jobs").update({
    payload: feedback ? { ...jobWithoutFeedback, feedback } : jobWithoutFeedback,
  }).eq("profile_key", profileKey).eq("job_key", body.jobKey);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, affected: 1 });
}
