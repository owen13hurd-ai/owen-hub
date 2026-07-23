import type { JobPreferences } from "@/lib/career/types";

export const jobPreferencesStorageKey = "owen-hub-job-preferences-v2";
export const jobPreferencesChangedEvent = "owen-hub-job-preferences-changed";

const requiredTargetRoles = [
  "Transportation Coordinator",
  "Logistics Coordinator",
  "Freight Coordinator",
  "Dispatch Coordinator",
  "Supply Chain Coordinator",
  "Supply Chain Analyst",
  "Logistics Analyst",
  "Transportation Analyst",
  "Procurement Analyst",
  "Inventory Coordinator",
  "Operations Coordinator",
  "Manager Trainee",
  "Management Trainee",
  "Development Program",
  "Rotational Program",
  "Sales Development Representative",
  "Business Development Representative",
  "Inside Sales Representative",
];

const requiredPositiveKeywords = [
  "Transportation Coordinator",
  "Logistics Coordinator",
  "Supply Chain",
  "Freight",
  "Dispatch",
  "SDR",
  "BDR",
  "SaaS",
  "Development Program",
  "Trainee",
];

export const defaultJobPreferences: JobPreferences = {
  blockedCompanies: [],
  targetRoles: [
    "Transportation Coordinator",
    "Logistics Coordinator",
    "Freight Coordinator",
    "Dispatch Coordinator",
    "Supply Chain Coordinator",
    "Supply Chain Analyst",
    "Transportation Analyst",
    "Logistics Analyst",
    "Procurement Analyst",
    "Inventory Coordinator",
    "Operations Coordinator",
    "Manager Trainee",
    "Management Trainee",
    "Operations Management Development Program",
    "Supply Chain Development Program",
    "Corporate Rotational Program",
    "Manufacturing Leadership Program",
    "Sales Development Representative",
    "Business Development Representative",
    "Inside Sales Representative",
  ],
  seniority: ["Entry Level", "Associate", "Early Career"],
  industries: [
    "Manufacturing",
    "Consumer Goods",
    "Logistics",
    "Transportation",
    "Retail",
    "Technology",
    "Healthcare",
    "Food & Beverage",
  ],
  workModes: ["Hybrid", "On-site"],
  preferredCities: ["Atlanta"],
  preferredStates: ["Georgia", "GA"],
  maximumCommuteMiles: null,
  willingToRelocate: false,
  minimumSalary: null,
  maximumSalary: null,
  companySizes: ["Large enterprise", "Fortune 500"],
  positiveKeywords: [
    "Supply Chain",
    "Distribution",
    "SAP",
    "Logistics",
    "Transportation",
    "Planning",
    "Transportation Coordinator",
    "Freight",
    "SDR",
    "BDR",
    "SaaS",
  ],
  negativeKeywords: [
    "Insurance",
    "Door-to-door",
    "MLM",
    "Commission-only",
    "Senior",
    "Director",
    "Principal",
    "Vice President",
    "Finance",
    "Financial",
    "Investment",
    "Wealth",
    "Banking",
    "Capital Management",
    "Revenue Analyst",
    "Deal Desk",
    "Commercial Banking",
    "Accounting",
    "Audit",
    "Tax",
  ],
};

export function enforceGeorgiaPreferences(preferences: JobPreferences): JobPreferences {
  return {
    ...preferences,
    blockedCompanies: preferences.blockedCompanies ?? [],
    targetRoles: Array.from(new Set([...requiredTargetRoles, ...(preferences.targetRoles ?? [])])),
    positiveKeywords: Array.from(new Set([...requiredPositiveKeywords, ...(preferences.positiveKeywords ?? [])])),
    preferredCities: ["Atlanta"],
    preferredStates: ["Georgia", "GA"],
    willingToRelocate: false,
    workModes: (preferences.workModes ?? []).filter((mode) => mode !== "Remote"),
  };
}

export function getJobPreferencesFromStorage(): JobPreferences {
  if (typeof window === "undefined") return defaultJobPreferences;

  try {
    const saved = window.localStorage.getItem(jobPreferencesStorageKey);
    if (!saved) return defaultJobPreferences;
    const parsed = JSON.parse(saved) as JobPreferences;
    return enforceGeorgiaPreferences({
      ...defaultJobPreferences,
      ...parsed,
    });
  } catch {
    return defaultJobPreferences;
  }
}

export function saveJobPreferences(preferences: JobPreferences) {
  window.localStorage.setItem(jobPreferencesStorageKey, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(jobPreferencesChangedEvent));
}
