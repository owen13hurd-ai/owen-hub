"use client";

import { BriefcaseBusiness, Building2, Inbox, ListChecks, Search, Settings2 } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

import { CompanyResearchBoard } from "@/components/career/CompanyResearchBoard";
import { CompanyWatchlist } from "@/components/career/CompanyWatchlist";
import { JobApplicationTracker } from "@/components/career/JobApplicationTracker";
import { JobPreferencesPanel } from "@/components/career/JobPreferences";
import { JobScout } from "@/components/career/JobScout";
import { MorningJobInbox } from "@/components/career/MorningJobInbox";

type CareerView = "Inbox" | "Scout" | "Watchlist" | "Applications" | "Preferences" | "Companies";

const views = [
  { icon: Inbox, label: "Inbox" as const },
  { icon: Search, label: "Scout" as const },
  { icon: ListChecks, label: "Watchlist" as const },
  { icon: BriefcaseBusiness, label: "Applications" as const },
  { icon: Settings2, label: "Preferences" as const },
  { icon: Building2, label: "Companies" as const },
];

export function CareerHubClient({ resumeModifiedAt, resumeName, resumePath }: {
  resumeModifiedAt: string;
  resumeName: string;
  resumePath: string;
}) {
  const [view, setView] = useState<CareerView>("Inbox");

  return (
    <div>
      <nav aria-label="Career Hub sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-ink/10">
        {views.map(({ icon: Icon, label }) => (
          <button key={label} type="button" onClick={() => setView(label)}
            className={clsx("inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-bold transition",
              view === label ? "border-moss text-ink" : "border-transparent text-ink/50 hover:text-ink")}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        ))}
      </nav>

      {view === "Scout" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <JobScout />
          <aside><JobPreferencesPanel /></aside>
        </div>
      ) : null}
      {view === "Inbox" ? <MorningJobInbox /> : null}
      {view === "Applications" ? (
        <JobApplicationTracker resumeModifiedAt={resumeModifiedAt} resumeName={resumeName} resumePath={resumePath} />
      ) : null}
      {view === "Watchlist" ? <CompanyWatchlist /> : null}
      {view === "Preferences" ? <div className="max-w-4xl"><JobPreferencesPanel /></div> : null}
      {view === "Companies" ? <CompanyResearchBoard /> : null}
    </div>
  );
}
