"use client";

import { useState } from "react";

type PokemonHubTabsProps = {
  battleJournal: React.ReactNode;
  bringFour: React.ReactNode;
  builder: React.ReactNode;
  damageCalc: React.ReactNode;
  matchupPrep: React.ReactNode;
  speedTiers: React.ReactNode;
  teams: React.ReactNode;
};

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
      <div className="flex flex-wrap gap-2 rounded-lg border border-ink/10 bg-white p-2 shadow-soft">
        <button
          type="button"
          onClick={() => openTab("bring")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "bring"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          Bring 4
        </button>
        <button
          type="button"
          onClick={() => openTab("damage")}
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
          onClick={() => openTab("battles")}
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
          onClick={() => openTab("builder")}
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
          onClick={() => openTab("speed")}
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
          onClick={() => openTab("matchups")}
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
          onClick={() => openTab("teams")}
          className={`h-10 rounded-md px-4 text-sm font-bold transition ${
            activeTab === "teams"
              ? "bg-ink text-white"
              : "bg-mist text-ink hover:bg-skyglass"
          }`}
        >
          M-B Teams
        </button>
      </div>

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
