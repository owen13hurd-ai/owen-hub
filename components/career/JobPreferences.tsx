"use client";

import { Check, Plus, Settings2, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

import {
  defaultJobPreferences,
  enforceGeorgiaPreferences,
  getJobPreferencesFromStorage,
  saveJobPreferences,
} from "@/lib/career/preferences";
import type { JobPreferences, WorkMode } from "@/lib/career/types";
import { loadCareerPreferencesFromCloud, saveCareerPreferencesToCloud } from "@/lib/career/cloud";
import { useEffect } from "react";

const seniorityOptions = ["Internship", "Entry Level", "Associate", "Early Career"];
const industryOptions = [
  "Manufacturing", "Consumer Goods", "Logistics", "Transportation", "Retail",
  "Technology", "Healthcare", "Food & Beverage",
];
const companySizeOptions = ["Startup", "Mid-size", "Large enterprise", "Fortune 500"];
const workModeOptions: WorkMode[] = ["Remote", "Hybrid", "On-site"];

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function ChipGroup({ label, options, values, onChange }: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button key={option} type="button" onClick={() => onChange(toggle(values, option))}
              className={clsx("inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold ring-1 transition",
                selected ? "bg-ink text-white ring-ink" : "bg-white text-ink/60 ring-ink/10 hover:ring-moss")}
            >
              {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ListEditor({ label, values, placeholder, onChange }: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const value = draft.trim();
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div>
      <p className="text-sm font-bold text-ink">{label}</p>
      <div className="mt-2 flex gap-2">
        <input value={draft} onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-moss" />
        <button type="button" onClick={add} aria-label={`Add ${label}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-white">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 rounded-md bg-skyglass px-2 py-1 text-xs font-semibold text-ink">
            {value}
            <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Remove ${value}`}>
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function JobPreferencesPanel() {
  const [preferences, setPreferences] = useState<JobPreferences>(getJobPreferencesFromStorage);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    void loadCareerPreferencesFromCloud().then((cloudPreferences) => {
      if (cloudPreferences) {
        setPreferences(enforceGeorgiaPreferences({ ...defaultJobPreferences, ...cloudPreferences }));
      }
    });
  }, []);
  function update<K extends keyof JobPreferences>(key: K, value: JobPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }
  function save() {
    const enforcedPreferences = enforceGeorgiaPreferences(preferences);
    setPreferences(enforcedPreferences);
    saveJobPreferences(enforcedPreferences);
    void saveCareerPreferencesToCloud(enforcedPreferences);
    setSaved(true);
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-mist p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <Settings2 className="mt-0.5 h-5 w-5 text-moss" aria-hidden="true" />
        <div><h2 className="font-bold text-ink">Job preferences</h2><p className="mt-1 text-sm text-ink/55">Atlanta or Georgia is required. These choices refine the matches.</p></div>
        </div>
        <button type="button" onClick={save} className="h-9 rounded-md bg-moss px-3 text-xs font-bold text-white">
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <ListEditor label="Target roles" values={preferences.targetRoles} placeholder="Add a role"
          onChange={(value) => update("targetRoles", value)} />
        <ChipGroup label="Seniority" options={seniorityOptions} values={preferences.seniority}
          onChange={(value) => update("seniority", value)} />
        <ChipGroup label="Industries" options={industryOptions} values={preferences.industries}
          onChange={(value) => update("industries", value)} />
        <ListEditor label="Custom industries" values={preferences.industries.filter((value) => !industryOptions.includes(value))}
          placeholder="Add an industry"
          onChange={(custom) => update("industries", [...preferences.industries.filter((value) => industryOptions.includes(value)), ...custom])} />
        <ChipGroup label="Work style" options={workModeOptions.filter((mode) => mode !== "Remote")} values={preferences.workModes.filter((mode) => mode !== "Remote")}
          onChange={(value) => update("workModes", value as WorkMode[])} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ListEditor label="Preferred cities" values={preferences.preferredCities} placeholder="Add a city"
            onChange={(value) => update("preferredCities", value)} />
          <ListEditor label="Preferred states" values={preferences.preferredStates} placeholder="Add a state"
            onChange={(value) => update("preferredStates", value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-bold text-ink">Minimum salary
            <input type="number" value={preferences.minimumSalary ?? ""} placeholder="65000"
              onChange={(event) => update("minimumSalary", event.target.value ? Number(event.target.value) : null)}
              className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-white px-3 font-normal outline-none focus:border-moss" />
          </label>
          <label className="text-sm font-bold text-ink">Maximum salary
            <input type="number" value={preferences.maximumSalary ?? ""} placeholder="Optional"
              onChange={(event) => update("maximumSalary", event.target.value ? Number(event.target.value) : null)}
              className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-white px-3 font-normal outline-none focus:border-moss" />
          </label>
          <label className="text-sm font-bold text-ink">Maximum commute
            <input type="number" value={preferences.maximumCommuteMiles ?? ""} placeholder="Miles"
              onChange={(event) => update("maximumCommuteMiles", event.target.value ? Number(event.target.value) : null)}
              className="mt-2 h-10 w-full rounded-md border border-ink/10 bg-white px-3 font-normal outline-none focus:border-moss" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input type="checkbox" checked={preferences.willingToRelocate}
            onChange={(event) => update("willingToRelocate", event.target.checked)} className="h-4 w-4 accent-ink" />
          Willing to relocate
        </label>
        <ChipGroup label="Company size" options={companySizeOptions} values={preferences.companySizes}
          onChange={(value) => update("companySizes", value)} />
        <ListEditor label="Positive keywords" values={preferences.positiveKeywords} placeholder="Add a preferred keyword"
          onChange={(value) => update("positiveKeywords", value)} />
        <ListEditor label="Negative keywords" values={preferences.negativeKeywords} placeholder="Add an excluded keyword"
          onChange={(value) => update("negativeKeywords", value)} />
        <button type="button" onClick={() => { setPreferences(defaultJobPreferences); setSaved(false); }}
          className="text-xs font-bold text-ink/45 hover:text-ink">Reset defaults</button>
      </div>
    </section>
  );
}
