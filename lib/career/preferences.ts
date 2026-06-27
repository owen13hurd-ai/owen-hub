import type { JobPreferences } from "@/lib/career/types";

export const jobPreferencesStorageKey = "owen-hub-job-preferences-v2";
export const jobPreferencesChangedEvent = "owen-hub-job-preferences-changed";

const requiredTargetRoles = [
  "Transportation Coordinator",
  "Logistics Coordinator",
  "Freight Coordinator",
  "Dispatch Coordinator",
  "Sales Development Representative",
  "Business Development Representative",
  "Inside Sales Representative",
];

const requiredPositiveKeywords = ["Transportation Coordinator", "Freight", "SDR", "BDR", "SaaS"];

export const defaultJobPreferences: JobPreferences = {
  targetRoles: [
    "Transportation Coordinator",
    "Logistics Coordinator",
    "Freight Coordinator",
    "Dispatch Coordinator",
    "Supply Chain Analyst",
    "Transportation Analyst",
    "Logistics Analyst",
    "Procurement Analyst",
    "Operations Analyst",
    "Business Analyst",
    "Strategy Analyst",
    "Corporate Rotational Programs",
    "Manufacturing Leadership Programs",
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
    "Sales",
    "Insurance",
    "Door-to-door",
    "MLM",
    "Commission-only",
  ],
};

export function enforceGeorgiaPreferences(preferences: JobPreferences): JobPreferences {
  return {
    ...preferences,
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
