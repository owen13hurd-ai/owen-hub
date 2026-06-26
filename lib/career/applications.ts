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
  jobUrl: string;
  notes: string;
  priority: "High" | "Medium" | "Low";
  resumeVersion: string;
  role: string;
  source: string;
  status: ApplicationStatus;
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
  jobUrl: "",
  notes: "",
  priority: "Medium",
  resumeVersion: defaultResumeName,
  role: "",
  source: "",
  status: "Interested",
};

export function getApplicationsFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(jobApplicationsStorageKey);
    const parsedApplications = savedValue
      ? (JSON.parse(savedValue) as JobApplication[])
      : [];

    return Array.isArray(parsedApplications) ? parsedApplications : [];
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
}
