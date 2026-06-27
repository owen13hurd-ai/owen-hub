export type ApplicationStatus =
  | "Interested"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Archived";

export type JobApplication = {
  appliedDate: string;
  company: string;
  followUpDate: string;
  id: string;
  interviewNotes: string;
  jobUrl: string;
  notes: string;
  priority: "High" | "Medium" | "Low";
  rating: number;
  recruiterContact: string;
  resumeVersion: string;
  role: string;
  source: string;
  status: ApplicationStatus;
  salary: string;
};

export const jobApplicationsStorageKey = "owen-hub-job-applications";
export const jobApplicationsChangedEvent = "owen-hub-job-applications-changed";
export const defaultResumeName = "Hurd, Owen Resume.pdf";

export const applicationStatuses: ("All" | ApplicationStatus)[] = [
  "All",
  "Interested",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Archived",
];

export const emptyApplication: Omit<JobApplication, "id"> = {
  appliedDate: "",
  company: "",
  followUpDate: "",
  interviewNotes: "",
  jobUrl: "",
  notes: "",
  priority: "Medium",
  rating: 0,
  recruiterContact: "",
  resumeVersion: defaultResumeName,
  role: "",
  source: "",
  status: "Interested",
  salary: "",
};

export function buildApplicationFromScoutJob(job: ScoutJob): JobApplication {
  return {
    ...emptyApplication,
    company: job.company,
    id: `career-${Date.now()}-${job.id}`,
    jobUrl: job.url,
    notes: `${job.reasons.join(". ")}. Location: ${job.location}. Tags: ${job.tags.join(", ") || "none listed"}.`,
    priority: job.score >= 75 ? "High" : job.score >= 60 ? "Medium" : "Low",
    role: job.title,
    source: job.source,
  };
}

export function getApplicationsFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(jobApplicationsStorageKey);
    const parsedApplications = savedValue
      ? (JSON.parse(savedValue) as JobApplication[])
      : [];

    return Array.isArray(parsedApplications)
      ? parsedApplications.map((application) => ({
          ...emptyApplication,
          ...application,
          id: application.id,
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveApplications(applications: JobApplication[]) {
  window.localStorage.setItem(
    jobApplicationsStorageKey,
    JSON.stringify(applications),
  );
  window.dispatchEvent(new CustomEvent(jobApplicationsChangedEvent));
  void saveCareerApplicationsToCloud(applications);
}
import { saveCareerApplicationsToCloud } from "@/lib/career/cloud";
import type { ScoutJob } from "@/lib/career/types";
