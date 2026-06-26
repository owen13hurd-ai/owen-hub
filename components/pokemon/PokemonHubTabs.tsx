"use client";

import { useState } from "react";

type PokemonHubTabsProps = {
  builder: React.ReactNode;
  matchupPrep: React.ReactNode;
  speedTiers: React.ReactNode;
  teams: React.ReactNode;
};

export function PokemonHubTabs({
  builder,
  matchupPrep,
  speedTiers,
  teams,
}: PokemonHubTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "builder" | "matchups" | "speed" | "teams"
  >("builder");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-lg border border-ink/10 bg-white p-2 shadow-soft">
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

      <div hidden={activeTab !== "builder"}>{builder}</div>
      <div hidden={activeTab !== "speed"}>{speedTiers}</div>
      <div hidden={activeTab !== "matchups"}>{matchupPrep}</div>
      <div hidden={activeTab !== "teams"}>{teams}</div>
    </div>
  );
}
