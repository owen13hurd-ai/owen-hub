"use client";

import { useState } from "react";

type PokemonHubTabsProps = {
  battleJournal: React.ReactNode;
  builder: React.ReactNode;
  damageCalc: React.ReactNode;
  matchupPrep: React.ReactNode;
  speedTiers: React.ReactNode;
  teams: React.ReactNode;
};

export function PokemonHubTabs({
  battleJournal,
  builder,
  damageCalc,
  matchupPrep,
  speedTiers,
  teams,
}: PokemonHubTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "battles" | "builder" | "damage" | "matchups" | "speed" | "teams"
  >("builder");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-lg border border-ink/10 bg-white p-2 shadow-soft">
        <button
          type="button"
          onClick={() => setActiveTab("damage")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "damage"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          Damage Calc
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("battles")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "battles"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          Battle Journal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("builder")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "builder"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          Teambuilder
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("speed")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "speed"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          Speed Tiers
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("matchups")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "matchups"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          Matchups
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("teams")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "teams"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          M-B Teams
        </button>
      </div>

      <div hidden={activeTab !== "battles"}>{battleJournal}</div>
      <div hidden={activeTab !== "builder"}>{builder}</div>
      <div hidden={activeTab !== "damage"}>{damageCalc}</div>
      <div hidden={activeTab !== "speed"}>{speedTiers}</div>
      <div hidden={activeTab !== "matchups"}>{matchupPrep}</div>
      <div hidden={activeTab !== "teams"}>{teams}</div>
    </div>
  );
}
