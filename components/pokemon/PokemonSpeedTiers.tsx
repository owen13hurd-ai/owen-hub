"use client";

import { useMemo, useState } from "react";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import type {
  PokemonBaseStats,
  PokemonBuilderData,
  PokemonSpeedTier,
} from "@/lib/pokemon/team-builder";

type StatKey = "HP" | "Atk" | "Def" | "SpA" | "SpD" | "Spe";

const natureModifiers: Record<string, { down?: StatKey; up?: StatKey }> = {
  Adamant: { down: "SpA", up: "Atk" },
  Bashful: {},
  Bold: { down: "Atk", up: "Def" },
  Brave: { down: "Spe", up: "Atk" },
  Calm: { down: "Atk", up: "SpD" },
  Careful: { down: "SpA", up: "SpD" },
  Docile: {},
  Gentle: { down: "Def", up: "SpD" },
  Hardy: {},
  Hasty: { down: "Def", up: "Spe" },
  Impish: { down: "SpA", up: "Def" },
  Jolly: { down: "SpA", up: "Spe" },
  Lax: { down: "SpD", up: "Def" },
  Lonely: { down: "Def", up: "Atk" },
  Mild: { down: "Def", up: "SpA" },
  Modest: { down: "Atk", up: "SpA" },
  Naive: { down: "SpD", up: "Spe" },
  Naughty: { down: "SpD", up: "Atk" },
  Quiet: { down: "Spe", up: "SpA" },
  Quirky: {},
  Rash: { down: "SpD", up: "SpA" },
  Relaxed: { down: "Spe", up: "Def" },
  Sassy: { down: "Spe", up: "SpD" },
  Serious: {},
  Timid: { down: "Atk", up: "Spe" },
};

const itemOptions = [
  { label: "No speed item", multiplier: 1, value: "none" },
  { label: "Choice Scarf", multiplier: 1.5, value: "choice-scarf" },
  { label: "Mega Stone", multiplier: 1, value: "mega-stone" },
];
const maxChampionsInvestment = 32;
const maxComparableEv = 252;

function getNatureMultiplier(nature: string, stat: StatKey) {
  const modifier = natureModifiers[nature];

  if (modifier?.up === stat) {
    return 1.1;
  }

  if (modifier?.down === stat) {
    return 0.9;
  }

  return 1;
}

function clampChampionsInvestment(investment: number) {
  return Math.min(Math.max(investment, 0), maxChampionsInvestment);
}

function toComparableEv(investment: number) {
  const boundedInvestment = clampChampionsInvestment(investment);

  return Math.round((boundedInvestment / maxChampionsInvestment) * maxComparableEv);
}

function calculateLevel50Speed({
  baseStats,
  ev,
  itemMultiplier,
  nature,
}: {
  baseStats: PokemonBaseStats | null;
  ev: number;
  itemMultiplier: number;
  nature: string;
}) {
  const base = baseStats?.Spe;

  if (typeof base !== "number") {
    return null;
  }

  const comparableEv = toComparableEv(ev);
  const rawSpeed =
    Math.floor(((2 * base + 31 + Math.floor(comparableEv / 4)) * 50) / 100) + 5;
  const natureSpeed = Math.floor(rawSpeed * getNatureMultiplier(nature, "Spe"));

  return Math.floor(natureSpeed * itemMultiplier);
}

export function PokemonSpeedTiers({ data }: { data: PokemonBuilderData }) {
  const [selectedItem, setSelectedItem] = useState("none");
  const [selectedNature, setSelectedNature] = useState("Jolly");
  const [selectedPokemon, setSelectedPokemon] = useState(
    data.pokemon.find((pokemon) => pokemon.name.includes("Pyroar"))?.name ??
      data.pokemon[0]?.name ??
      "",
  );
  const [speedEvs, setSpeedEvs] = useState(maxChampionsInvestment);
  const selectedOption = data.pokemon.find(
    (pokemon) => pokemon.name === selectedPokemon,
  );
  const item = itemOptions.find((option) => option.value === selectedItem) ?? itemOptions[0];
  const selectedSpeed = calculateLevel50Speed({
    baseStats: selectedOption?.baseStats ?? null,
    ev: speedEvs,
    itemMultiplier: item.multiplier,
    nature: selectedNature,
  });
  const chartRows = useMemo(() => {
    const rows: (PokemonSpeedTier & { isSelected?: boolean })[] = [
      ...data.speedTiers,
    ];

    if (selectedOption && selectedSpeed !== null) {
      rows.push({
        baseSpeed: selectedOption.baseStats?.Spe ?? null,
        count: selectedOption.count,
        evs: speedEvs,
        isSelected: true,
        name: selectedOption.name,
        nature: `${selectedNature}${item.value === "choice-scarf" ? " Scarf" : ""}`,
        speed: selectedSpeed,
      });
    }

    return rows.sort((a, b) => (b.speed ?? 0) - (a.speed ?? 0));
  }, [data.speedTiers, item.value, selectedNature, selectedOption, selectedSpeed, speedEvs]);
  const maxSpeed = Math.max(...chartRows.map((row) => row.speed ?? 0), 1);
  const similarRows =
    selectedSpeed === null
      ? []
      : chartRows.filter((row) => {
          return !row.isSelected && row.speed !== null && Math.abs(row.speed - selectedSpeed) <= 15;
        });

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-3 rounded-lg bg-mist p-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Speed tiers
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Check your benchmark
            </h2>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
              Pokémon
            </span>
            <select
              value={selectedPokemon}
              onChange={(event) => setSelectedPokemon(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-ink/10 bg-white px-2 text-sm text-ink"
            >
              {data.pokemon.map((pokemon) => (
                <option key={pokemon.name} value={pokemon.name}>
                  {pokemon.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
                Nature
              </span>
              <select
                value={selectedNature}
                onChange={(event) => setSelectedNature(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-ink/10 bg-white px-2 text-sm text-ink"
              >
                {Object.keys(natureModifiers).map((nature) => (
                  <option key={nature} value={nature}>
                    {nature}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
                Item
              </span>
              <select
                value={selectedItem}
                onChange={(event) => setSelectedItem(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-ink/10 bg-white px-2 text-sm text-ink"
              >
                {itemOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
              <span>Speed investment</span>
              <span className="text-ink">{speedEvs}</span>
            </span>
            <input
              type="range"
              min={0}
              max={maxChampionsInvestment}
              step={1}
              value={speedEvs}
              onChange={(event) => setSpeedEvs(clampChampionsInvestment(Number(event.target.value)))}
              className="mt-2 w-full accent-ink"
            />
          </label>

          <div className="rounded-md bg-white p-3">
            <div className="flex items-center gap-3">
              {selectedOption ? (
                <PokemonSprite name={selectedOption.name} className="h-14 w-14" />
              ) : null}
              <div>
                <p className="text-sm font-bold text-ink">
                  {selectedOption?.name ?? "Select a Pokémon"}
                </p>
                <p className="text-3xl font-bold text-moss">
                  {selectedSpeed ?? "-"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-ink/45">
              Base {selectedOption?.baseStats?.Spe ?? "-"} · {selectedNature} ·{" "}
              {speedEvs} Spe investment · {item.label}
            </p>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-ink/10 bg-mist p-3">
            <p className="text-sm font-bold text-ink">Visual chart</p>
            <div className="mt-3 space-y-2">
              {chartRows.map((row) => {
                const width = `${Math.max(((row.speed ?? 0) / maxSpeed) * 100, 4)}%`;

                return (
                  <div
                    key={`${row.name}-${row.nature}-${row.evs}-${row.isSelected ? "selected" : "tier"}`}
                    className={`rounded-md p-2 ${row.isSelected ? "bg-emerald-50" : "bg-white"}`}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-ink">{row.name}</span>
                      <span className={row.isSelected ? "font-bold text-moss" : "font-bold text-ink"}>
                        {row.speed ?? "-"}
                      </span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className={row.isSelected ? "h-full rounded-full bg-moss" : "h-full rounded-full bg-ink/50"}
                        style={{ width }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink/45">
                      {row.nature} · {row.evs} Spe investment
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-mist p-3">
            <p className="text-sm font-bold text-ink">Similar speed range</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {similarRows.map((row) => (
                <div
                  key={`${row.name}-${row.speed}`}
                  className="rounded-md bg-white px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-ink">{row.name}</span>
                    <span className="text-sm font-bold text-moss">{row.speed}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/45">
                    {row.nature} · {row.evs} Spe investment · {row.count} teams
                  </p>
                </div>
              ))}
              {similarRows.length === 0 ? (
                <p className="rounded-md bg-white px-3 py-2 text-sm text-ink/55">
                  No popular M-B Pokémon are within 15 Speed.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
