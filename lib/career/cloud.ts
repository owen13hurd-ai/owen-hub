import type { JobApplication } from "@/lib/career/applications";
import type { JobPreferences } from "@/lib/career/types";
import { createClient } from "@/lib/supabase/client";

const profileKey = "owen-main";

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function loadCareerApplicationsFromCloud(): Promise<JobApplication[] | null> {
  if (!configured()) return null;
  const { data, error } = await createClient().from("career_applications").select("*").eq("profile_key", profileKey).order("updated_at", { ascending: false });
  if (error) return null;
  return data.map((row) => ({
    appliedDate: row.applied_date ?? "", company: row.company, followUpDate: row.follow_up_date ?? "",
    id: row.id, interviewNotes: row.interview_notes ?? "", jobUrl: row.job_url ?? "",
    notes: row.notes ?? "", priority: row.priority, rating: row.rating ?? 0,
    recruiterContact: row.recruiter_contact ?? "", resumeVersion: row.resume_version ?? "",
    role: row.role, salary: row.salary ?? "", source: row.source ?? "", status: row.status,
  })) as JobApplication[];
}

export async function saveCareerApplicationsToCloud(applications: JobApplication[]) {
  if (!configured()) return;
  const supabase = createClient();
  await supabase.from("career_profiles").upsert({ profile_key: profileKey, updated_at: new Date().toISOString() });
  const ids = applications.map((application) => application.id);
  const deleteQuery = supabase.from("career_applications").delete().eq("profile_key", profileKey);
  if (ids.length) await deleteQuery.not("id", "in", `(${ids.map((id) => `"${id.replaceAll('"', '')}"`).join(",")})`);
  else await deleteQuery;
  if (!applications.length) return;
  await supabase.from("career_applications").upsert(applications.map((application) => ({
    applied_date: application.appliedDate || null, company: application.company,
    follow_up_date: application.followUpDate || null, id: application.id,
    interview_notes: application.interviewNotes, job_url: application.jobUrl,
    notes: application.notes, priority: application.priority, profile_key: profileKey,
    rating: application.rating, recruiter_contact: application.recruiterContact,
    resume_version: application.resumeVersion, role: application.role, salary: application.salary,
    source: application.source, status: application.status, updated_at: new Date().toISOString(),
  })), { onConflict: "id" });
}

export async function loadCareerPreferencesFromCloud(): Promise<JobPreferences | null> {
  if (!configured()) return null;
  const { data, error } = await createClient().from("career_profiles").select("preferences").eq("profile_key", profileKey).maybeSingle();
  if (error || !data?.preferences) return null;
  return data.preferences as JobPreferences;
}

export async function saveCareerPreferencesToCloud(preferences: JobPreferences) {
  if (!configured()) return;
  await createClient().from("career_profiles").upsert({
    preferences, profile_key: profileKey, updated_at: new Date().toISOString(),
  }, { onConflict: "profile_key" });
}

