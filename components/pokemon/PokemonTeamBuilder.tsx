"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import type {
  PokemonBuilderData,
  PokemonBuilderOption,
  PokemonType,
} from "@/lib/pokemon/team-builder";

type TeamSlot = {
  ability: string;
  evs: Record<StatKey, number>;
  moves: string[];
  nature: string;
  pokemonName: string;
};

type StatKey = "HP" | "Atk" | "Def" | "SpA" | "SpD" | "Spe";

const stats: StatKey[] = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

const typeChart: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 2,
    Bug: 2,
    Rock: 0.5,
    Dragon: 0.5,
    Steel: 2,
  },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: {
    Water: 2,
    Electric: 0.5,
    Grass: 0.5,
    Ground: 0,
    Flying: 2,
    Dragon: 0.5,
  },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5,
  },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
    Fairy: 0.5,
  },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: {
    Fire: 2,
    Electric: 2,
    Grass: 0.5,
    Poison: 2,
    Flying: 0,
    Bug: 0.5,
    Rock: 2,
    Steel: 2,
  },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
    Fairy: 0.5,
  },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

const defaultEvs: Record<StatKey, number> = {
  HP: 0,
  Atk: 0,
  Def: 0,
  SpA: 0,
  SpD: 0,
  Spe: 0,
};

function getMultiplier(attackingType: PokemonType, defendingTypes: PokemonType[]) {
  return defendingTypes.reduce((multiplier, defendingType) => {
    return multiplier * (typeChart[attackingType][defendingType] ?? 1);
  }, 1);
}

function getTypeBadgeClass(type: PokemonType) {
  const classes: Record<PokemonType, string> = {
    Normal: "bg-stone-100 text-stone-800",
    Fire: "bg-red-100 text-red-800",
    Water: "bg-sky-100 text-sky-800",
    Electric: "bg-yellow-100 text-yellow-800",
    Grass: "bg-emerald-100 text-emerald-800",
    Ice: "bg-cyan-100 text-cyan-800",
    Fighting: "bg-orange-100 text-orange-800",
    Poison: "bg-fuchsia-100 text-fuchsia-800",
    Ground: "bg-amber-100 text-amber-900",
    Flying: "bg-indigo-100 text-indigo-800",
    Psychic: "bg-pink-100 text-pink-800",
    Bug: "bg-lime-100 text-lime-800",
    Rock: "bg-stone-200 text-stone-900",
    Ghost: "bg-violet-100 text-violet-800",
    Dragon: "bg-blue-100 text-blue-800",
    Dark: "bg-zinc-200 text-zinc-900",
    Steel: "bg-slate-100 text-slate-800",
    Fairy: "bg-rose-100 text-rose-800",
  };

  return classes[type];
}

function buildNewSlot(option: PokemonBuilderOption): TeamSlot {
  return {
    ability: option.abilities[0] ?? "",
    evs: { ...defaultEvs },
    moves: [
      option.moves[0] ?? "",
      option.moves[1] ?? "",
      option.moves[2] ?? "",
      option.moves[3] ?? "",
    ],
    nature: option.natures[0] ?? "",
    pokemonName: option.name,
  };
}

export function PokemonTeamBuilder({ data }: { data: PokemonBuilderData }) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState<TeamSlot[]>([]);
  const optionsByName = useMemo(() => {
    return new Map(data.pokemon.map((pokemon) => [pokemon.name, pokemon]));
  }, [data.pokemon]);
  const selectedOptions = team
    .map((slot) => optionsByName.get(slot.pokemonName))
    .filter((option): option is PokemonBuilderOption => Boolean(option));
  const filteredOptions = useMemo(() => {
    const selectedNames = new Set(team.map((slot) => slot.pokemonName));
    const normalizedQuery = query.trim().toLowerCase();

    return data.pokemon
      .filter((pokemon) => {
        return !selectedNames.has(pokemon.name);
      })
      .filter((pokemon) => {
        if (!normalizedQuery) {
          return true;
        }

        return pokemon.name.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, 12);
  }, [data.pokemon, query, team]);
  const weaknessSummary = data.types
    .map((type) => {
      const weakCount = selectedOptions.filter((pokemon) => {
        return getMultiplier(type, pokemon.types) > 1;
      }).length;
      const resistCount = selectedOptions.filter((pokemon) => {
        const multiplier = getMultiplier(type, pokemon.types);
        return multiplier > 0 && multiplier < 1;
      }).length;
      const immuneCount = selectedOptions.filter((pokemon) => {
        return getMultiplier(type, pokemon.types) === 0;
      }).length;

      return { immuneCount, resistCount, type, weakCount };
    })
    .sort((a, b) => b.weakCount - a.weakCount || a.type.localeCompare(b.type));
  const popularThreats = data.pokemon
    .filter((pokemon) => !team.some((slot) => slot.pokemonName === pokemon.name))
    .map((pokemon) => {
      const weakTargets = selectedOptions.filter((selectedPokemon) => {
        return pokemon.types.some((type) => {
          return getMultiplier(type, selectedPokemon.types) > 1;
        });
      }).length;

      return {
        ...pokemon,
        threatScore: weakTargets * pokemon.count,
        weakTargets,
      };
    })
    .filter((pokemon) => pokemon.weakTargets > 0)
    .sort((a, b) => b.threatScore - a.threatScore || b.count - a.count)
    .slice(0, 8);

  function addPokemon(option: PokemonBuilderOption) {
    if (team.length >= 6) {
      return;
    }

    setTeam((currentTeam) => [...currentTeam, buildNewSlot(option)]);
    setQuery("");
  }

  function updateSlot(index: number, nextSlot: TeamSlot) {
    setTeam((currentTeam) => {
      return currentTeam.map((slot, slotIndex) => {
        return slotIndex === index ? nextSlot : slot;
      });
    });
  }

  function removeSlot(index: number) {
    setTeam((currentTeam) => currentTeam.filter((_, slotIndex) => slotIndex !== index));
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
            Teambuilder Assist
          </p>
          <h2 className="mt-1 text-lg font-bold text-ink">
            Build around popular M-B data
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search eligible Pokémon"
              className="h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
            />
            <span className="rounded-md bg-mist px-3 py-2 text-sm font-semibold text-ink/60">
              {team.length}/6 selected
            </span>
          </div>

          {team.length < 6 ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredOptions.map((pokemon) => (
                <button
                  key={pokemon.name}
                  type="button"
                  onClick={() => addPokemon(pokemon)}
                  className="flex min-h-16 items-center gap-3 rounded-md border border-ink/10 bg-mist p-2 text-left transition hover:border-moss/40 hover:bg-skyglass"
                >
                  <PokemonSprite
                    name={pokemon.name}
                    className="h-12 w-12 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">
                      {pokemon.name}
                    </span>
                    <span className="text-xs text-ink/55">
                      {pokemon.count} teams
                    </span>
                  </span>
                  <Plus className="ml-auto h-4 w-4 text-moss" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3">
            {team.map((slot, index) => {
              const option = optionsByName.get(slot.pokemonName);

              if (!option) {
                return null;
              }

              return (
                <div
                  key={slot.pokemonName}
                  className="rounded-lg border border-ink/10 bg-mist p-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <PokemonSprite
                      name={slot.pokemonName}
                      className="h-16 w-16 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink">{slot.pokemonName}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {option.types.map((type) => (
                          <span
                            key={type}
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${getTypeBadgeClass(
                              type,
                            )}`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 bg-white text-ink transition hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`Remove ${slot.pokemonName}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
                        Ability
                      </span>
                      <select
                        value={slot.ability}
                        onChange={(event) =>
                          updateSlot(index, { ...slot, ability: event.target.value })
                        }
                        className="mt-1 h-9 w-full rounded-md border border-ink/10 bg-white px-2 text-sm text-ink"
                      >
                        <option value="">Choose ability</option>
                        {option.abilities.map((ability) => (
                          <option key={ability} value={ability}>
                            {ability}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
                        Nature
                      </span>
                      <select
                        value={slot.nature}
                        onChange={(event) =>
                          updateSlot(index, { ...slot, nature: event.target.value })
                        }
                        className="mt-1 h-9 w-full rounded-md border border-ink/10 bg-white px-2 text-sm text-ink"
                      >
                        <option value="">Choose nature</option>
                        {option.natures.map((nature) => (
                          <option key={nature} value={nature}>
                            {nature}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    {slot.moves.map((move, moveIndex) => (
                      <select
                        key={`${slot.pokemonName}-${moveIndex}`}
                        value={move}
                        onChange={(event) => {
                          const nextMoves = [...slot.moves];
                          nextMoves[moveIndex] = event.target.value;
                          updateSlot(index, { ...slot, moves: nextMoves });
                        }}
                        className="h-9 rounded-md border border-ink/10 bg-white px-2 text-sm text-ink"
                        aria-label={`${slot.pokemonName} move ${moveIndex + 1}`}
                      >
                        <option value="">Move {moveIndex + 1}</option>
                        {option.moves.map((moveOption) => (
                          <option key={moveOption} value={moveOption}>
                            {moveOption}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                    {stats.map((stat) => (
                      <label key={stat} className="block">
                        <span className="text-xs font-bold text-ink/45">
                          {stat}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={252}
                          step={4}
                          value={slot.evs[stat]}
                          onChange={(event) => {
                            updateSlot(index, {
                              ...slot,
                              evs: {
                                ...slot.evs,
                                [stat]: Number(event.target.value),
                              },
                            });
                          }}
                          className="mt-1 h-9 w-full rounded-md border border-ink/10 bg-white px-2 text-sm text-ink"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

            {team.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink/20 bg-mist p-6 text-sm text-ink/60">
                Add Pokémon to start seeing team weaknesses and threat notes.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-ink/10 bg-mist p-3">
            <p className="text-sm font-bold text-ink">Typing weaknesses</p>
            <div className="mt-3 space-y-2">
              {weaknessSummary.slice(0, 8).map((summary) => (
                <div
                  key={summary.type}
                  className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${getTypeBadgeClass(
                      summary.type,
                    )}`}
                  >
                    {summary.type}
                  </span>
                  <span className="font-semibold text-ink/65">
                    {summary.weakCount} weak · {summary.resistCount} resist ·{" "}
                    {summary.immuneCount} immune
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-mist p-3">
            <p className="text-sm font-bold text-ink">Popular threats</p>
            <div className="mt-3 space-y-2">
              {popularThreats.map((pokemon) => (
                <div
                  key={pokemon.name}
                  className="grid grid-cols-[48px_1fr] gap-2 rounded-md bg-white p-2"
                >
                  <PokemonSprite name={pokemon.name} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {pokemon.name}
                    </p>
                    <p className="text-xs text-ink/55">
                      Pressures {pokemon.weakTargets} selected mon
                      {pokemon.weakTargets === 1 ? "" : "s"} · {pokemon.count} teams
                    </p>
                  </div>
                </div>
              ))}
              {popularThreats.length === 0 ? (
                <p className="rounded-md bg-white px-3 py-2 text-sm text-ink/55">
                  Add Pokémon to reveal common threats.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
