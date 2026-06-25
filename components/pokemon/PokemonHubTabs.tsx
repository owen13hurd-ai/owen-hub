"use client";

import { useState } from "react";

type PokemonHubTabsProps = {
  builder: React.ReactNode;
  teams: React.ReactNode;
};

export function PokemonHubTabs({ builder, teams }: PokemonHubTabsProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "teams">("builder");

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
      <div hidden={activeTab !== "teams"}>{teams}</div>
    </div>
  );
}
