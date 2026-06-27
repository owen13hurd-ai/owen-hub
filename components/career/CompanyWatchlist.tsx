"use client";

import { ExternalLink, RadioTower, Search } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { careerTracks, watchedCompanies, type CareerTrack } from "@/lib/career/company-watchlist";

export function CompanyWatchlist() {
  const [track, setTrack] = useState<"All" | CareerTrack>("All");
  const [query, setQuery] = useState("");
  const companies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return watchedCompanies.filter((company) =>
      (track === "All" || company.tracks.includes(track)) &&
      (!normalized || `${company.company} ${company.locationNote} ${company.tracks.join(" ")}`.toLowerCase().includes(normalized)),
    );
  }, [query, track]);

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Company Watchlist</p>
          <h2 className="mt-1 text-lg font-bold text-ink">Atlanta career targets</h2>
          <p className="mt-2 text-sm text-ink/55">{watchedCompanies.length} companies across logistics, tech sales, and development programs.</p>
        </div>
        <label className="relative block lg:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-ink/35" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies"
            className="h-10 w-full rounded-md border border-ink/10 bg-mist pl-9 pr-3 text-sm text-ink outline-none focus:border-moss" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["All", ...careerTracks] as const).map((option) => (
          <button key={option} type="button" onClick={() => setTrack(option)}
            className={clsx("h-9 rounded-md px-3 text-sm font-bold transition",
              track === option ? "bg-ink text-white" : "bg-mist text-ink/60 hover:text-ink")}>{option}</button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <article key={company.company} className="rounded-lg border border-ink/10 bg-mist p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-ink">{company.company}</h3>
                <p className="mt-1 text-xs leading-5 text-ink/50">{company.locationNote}</p>
              </div>
              <a href={company.careersUrl} target="_blank" rel="noreferrer" aria-label={`Open ${company.company} careers`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-moss hover:text-ink">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {company.tracks.map((item) => <span key={item} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink/55">{item}</span>)}
              {company.automated ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800"><RadioTower className="h-3 w-3" aria-hidden="true" />Live feed</span> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

