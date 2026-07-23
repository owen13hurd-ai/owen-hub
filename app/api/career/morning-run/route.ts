import { NextRequest, NextResponse } from "next/server";

import { fetchCloudGmailJobEmails } from "@/lib/career/gmail-cloud";

type ImportResult = {
  accepted?: number;
  error?: string;
  rejected?: number;
};

type ScoutResult = {
  error?: string;
  jobs?: unknown[];
  sources?: Array<{ count: number; label: string; ok: boolean }>;
};

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.CAREER_INGEST_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}` ||
    request.headers.get("x-career-ingest-key") === secret;
}

async function postJson<T extends { error?: unknown }>(url: string, body: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.CAREER_INGEST_SECRET) headers["x-career-ingest-key"] = process.env.CAREER_INGEST_SECRET;

  const response = await fetch(url, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers,
    method: "POST",
  });
  const payload = await response.json() as T;
  if (!response.ok) throw new Error("error" in payload && typeof payload.error === "string" ? payload.error : `Request failed with ${response.status}.`);
  return payload;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = request.nextUrl.origin;
  const startedAt = new Date().toISOString();
  const result = {
    gmail: { accepted: 0, emails: 0, error: null as string | null, rejected: 0 },
    scout: { accepted: 0, error: null as string | null, found: 0, rejected: 0 },
    startedAt,
  };

  try {
    const emails = await fetchCloudGmailJobEmails();
    const importResult = await postJson<ImportResult>(`${baseUrl}/api/career/discovered-jobs`, { emails });
    result.gmail = {
      accepted: importResult.accepted ?? 0,
      emails: emails.length,
      error: null,
      rejected: importResult.rejected ?? 0,
    };
  } catch (error) {
    result.gmail.error = error instanceof Error ? error.message : "Gmail import failed.";
  }

  try {
    const scoutResult = await postJson<ScoutResult>(`${baseUrl}/api/career/job-scout`, {});
    const importResult = await postJson<ImportResult>(`${baseUrl}/api/career/discovered-jobs`, {
      jobs: scoutResult.jobs ?? [],
    });
    result.scout = {
      accepted: importResult.accepted ?? 0,
      error: null,
      found: scoutResult.jobs?.length ?? 0,
      rejected: importResult.rejected ?? 0,
    };
  } catch (error) {
    result.scout.error = error instanceof Error ? error.message : "Job scout import failed.";
  }

  return NextResponse.json({ ...result, finishedAt: new Date().toISOString() });
}
