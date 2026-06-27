export type WorkMode = "Remote" | "Hybrid" | "On-site";

export type JobPreferences = {
  blockedCompanies: string[];
  targetRoles: string[];
  seniority: string[];
  industries: string[];
  workModes: WorkMode[];
  preferredCities: string[];
  preferredStates: string[];
  maximumCommuteMiles: number | null;
  willingToRelocate: boolean;
  minimumSalary: number | null;
  maximumSalary: number | null;
  companySizes: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
};

export type JobMatchBreakdown = {
  company: number;
  experience: number;
  industry: number;
  keywords: number;
  location: number;
  role: number;
};

export type ScoutJob = {
  company: string;
  description: string;
  id: string;
  location: string;
  matchBreakdown: JobMatchBreakdown;
  postedAt: string | null;
  reasons: string[];
  salaryMaximum: number | null;
  salaryMinimum: number | null;
  score: number;
  source: string;
  tags: string[];
  title: string;
  url: string;
};
