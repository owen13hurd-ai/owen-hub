"use client";

import { BookOpen, Calculator, Gauge, Search, ShieldCheck, Swords, Users } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

type PokemonHubTabsProps = {
  battleJournal: React.ReactNode;
  bringFour: React.ReactNode;
  builder: React.ReactNode;
  damageCalc: React.ReactNode;
  matchupPrep: React.ReactNode;
  speedTiers: React.ReactNode;
  teams: React.ReactNode;
};

const tabs = [
  { icon: ShieldCheck, id: "builder", label: "Teambuilder" },
  { icon: Swords, id: "bring", label: "Bring 4" },
  { icon: Calculator, id: "damage", label: "Damage Calc" },
  { icon: Gauge, id: "speed", label: "Speed Tiers" },
  { icon: Search, id: "matchups", label: "Matchups" },
  { icon: BookOpen, id: "battles", label: "Battle Journal" },
  { icon: Users, id: "teams", label: "M-B Teams" },
] as const;

export function PokemonHubTabs({
  battleJournal,
  bringFour,
  builder,
  damageCalc,
  matchupPrep,
  speedTiers,
  teams,
}: PokemonHubTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "battles" | "bring" | "builder" | "damage" | "matchups" | "speed" | "teams"
  >("builder");
  const [mountedTabs, setMountedTabs] = useState(() => new Set(["builder"]));

  function openTab(tab: "battles" | "bring" | "builder" | "damage" | "matchups" | "speed" | "teams") {
    setActiveTab(tab);
    setMountedTabs((current) => new Set(current).add(tab));
  }

  return (
    <div className="space-y-4">
      <nav aria-label="Pokémon Hub sections" className="flex gap-1 overflow-x-auto border-b border-ink/10">
        {tabs.map(({ icon: Icon, id, label }) => (
          <button key={id} type="button" onClick={() => openTab(id)}
            className={clsx("inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition",
              activeTab === id ? "border-ember text-ink" : "border-transparent text-ink/45 hover:border-ink/20 hover:text-ink")}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        ))}
      </nav>

      {mountedTabs.has("battles") && <div hidden={activeTab !== "battles"}>{battleJournal}</div>}
      {mountedTabs.has("bring") && <div hidden={activeTab !== "bring"}>{bringFour}</div>}
      {mountedTabs.has("builder") && <div hidden={activeTab !== "builder"}>{builder}</div>}
      {mountedTabs.has("damage") && <div hidden={activeTab !== "damage"}>{damageCalc}</div>}
      {mountedTabs.has("speed") && <div hidden={activeTab !== "speed"}>{speedTiers}</div>}
      {mountedTabs.has("matchups") && <div hidden={activeTab !== "matchups"}>{matchupPrep}</div>}
      {mountedTabs.has("teams") && <div hidden={activeTab !== "teams"}>{teams}</div>}
    </div>
  );
}
