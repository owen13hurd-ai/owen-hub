"use client";

import { RotateCcw, ShieldCheck, Sparkles, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { PokemonMatchupMatrix } from "@/components/pokemon/PokemonMatchupMatrix";
import { Button } from "@/components/ui/button";
import { recommendBringFour } from "@/lib/pokemon/bring-four";
import type { PokemonBuilderData, PokemonBuilderOption } from "@/lib/pokemon/team-builder";

const teamSize = 6;
const savedBuildsStorageKey = "owen-hub-pokemon-builds";

type StoredBuild = {
  id: string;
  name: string;
  team: Array<{ pokemonName: string }>;
};

function getStoredBuilds() {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(savedBuildsStorageKey);
    const builds = saved ? (JSON.parse(saved) as StoredBuild[]) : [];
    return Array.isArray(builds) ? builds : [];
  } catch {
    return [];
  }
}

function selectedPokemon(names: string[], byName: Map<string, PokemonBuilderOption>) {
  const seen = new Set<string>();
  return names.flatMap((name) => {
    const pokemon = byName.get(name.trim().toLowerCase());
    if (!pokemon || seen.has(pokemon.name)) return [];
    seen.add(pokemon.name);
    return [pokemon];
  });
}

function TeamEntry({
  label,
  names,
  options,
  setNames,
}: {
  label: string;
  names: string[];
  options: PokemonBuilderOption[];
  setNames: (names: string[]) => void;
}) {
  const optionNames = new Set(options.map((pokemon) => pokemon.name.toLowerCase()));

  return (
    <section className="min-w-0">
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-ink/55">{label}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {names.map((name, index) => {
          const validName = optionNames.has(name.toLowerCase());
          return (
            <label
              className="flex min-w-0 items-center gap-2 rounded-md border border-ink/10 bg-white p-2 focus-within:border-moss"
              key={`${label}-${index}`}
            >
              {validName ? (
                <PokemonSprite className="h-11 w-11 shrink-0" name={name} />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-mist text-xs font-bold text-ink/35">
                  {index + 1}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="sr-only">{`${label} slot ${index + 1}`}</span>
                <input
                  aria-label={`${label} slot ${index + 1}`}
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink/35"
                  list="bring-four-pokemon"
                  onChange={(event) => {
                    const next = [...names];
                    next[index] = event.target.value;
                    setNames(next);
                  }}
                  placeholder="Choose Pokemon"
                  value={name}
                />
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export function PokemonBringFourAdvisor({ data }: { data: PokemonBuilderData }) {
  const [myNames, setMyNames] = useState(() => Array<string>(teamSize).fill(""));
  const [opponentNames, setOpponentNames] = useState(() => Array<string>(teamSize).fill(""));
  const [savedBuilds, setSavedBuilds] = useState<StoredBuild[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSavedBuilds(getStoredBuilds()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const pokemonByName = useMemo(
    () => new Map(data.pokemon.map((pokemon) => [pokemon.name.toLowerCase(), pokemon])),
    [data.pokemon],
  );
  const myTeam = useMemo(() => selectedPokemon(myNames, pokemonByName), [myNames, pokemonByName]);
  const opponentTeam = useMemo(
    () => selectedPokemon(opponentNames, pokemonByName),
    [opponentNames, pokemonByName],
  );
  const recommendation = useMemo(
    () => recommendBringFour(myTeam, opponentTeam),
    [myTeam, opponentTeam],
  );
  const leadNames = new Set(recommendation?.lead.map((pokemon) => pokemon.name) ?? []);

  return (
    <div className="space-y-5">
      <datalist id="bring-four-pokemon">
        {data.pokemon.map((pokemon) => <option key={pokemon.name} value={pokemon.name} />)}
      </datalist>

      <header className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">Match selection</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Bring-4 Advisor</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
            Enter both team previews to find the four Pokemon with the strongest type coverage and safest defensive matchups.
          </p>
        </div>
        <Button
          aria-label="Clear both team previews"
          onClick={() => {
            setMyNames(Array<string>(teamSize).fill(""));
            setOpponentNames(Array<string>(teamSize).fill(""));
          }}
          type="button"
          variant="outline"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Clear
        </Button>
      </header>

      {savedBuilds.length > 0 && (
        <label className="block max-w-sm text-sm font-semibold text-ink">
          Load one of my saved teams
          <select
            className="mt-2 h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm outline-none focus:border-moss"
            defaultValue=""
            onChange={(event) => {
              const build = savedBuilds.find((item) => item.id === event.target.value);
              if (!build) return;
              setMyNames(Array.from({ length: teamSize }, (_, index) => build.team[index]?.pokemonName ?? ""));
            }}
          >
            <option value="">Select a saved team</option>
            {savedBuilds.map((build) => <option key={build.id} value={build.id}>{build.name}</option>)}
          </select>
        </label>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <TeamEntry label="My team" names={myNames} options={data.pokemon} setNames={setMyNames} />
        <TeamEntry label="Opponent team" names={opponentNames} options={data.pokemon} setNames={setOpponentNames} />
      </div>

      {!recommendation ? (
        <div className="rounded-lg border border-dashed border-ink/20 bg-mist/60 px-5 py-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-moss" aria-hidden="true" />
          <p className="mt-3 font-bold text-ink">Add at least four of yours and one opponent</p>
          <p className="mt-1 text-sm text-ink/55">The recommendation updates automatically as the preview fills in.</p>
        </div>
      ) : (
        <section aria-live="polite" className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-5 py-4 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Recommended selection</p>
              <h3 className="mt-1 text-xl font-bold">Bring these four</h3>
            </div>
            <div className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold">
              Covers {recommendation.coverageCount} of {opponentTeam.length}
            </div>
          </div>

          <div className="grid divide-y divide-ink/10 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                {recommendation.picks.map((pick) => (
                  <article className="min-w-0 rounded-md border border-ink/10 bg-mist/45 p-3" key={pick.pokemon.name}>
                    <div className="flex items-center gap-2">
                      <PokemonSprite className="h-14 w-14 shrink-0" name={pick.pokemon.name} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{pick.pokemon.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-moss">
                          {leadNames.has(pick.pokemon.name) ? "Suggested lead" : "Bring"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pick.matchups.filter((matchup) => matchup.offense >= 2).slice(0, 3).map((matchup) => (
                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800" key={`hit-${matchup.opponent.name}`}>
                          {matchup.offense}x {matchup.opponent.name}
                        </span>
                      ))}
                      {pick.matchups.filter((matchup) => matchup.incoming >= 2).slice(0, 2).map((matchup) => (
                        <span className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800" key={`risk-${matchup.opponent.name}`}>
                          Risk: {matchup.opponent.name}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Swords className="h-4 w-4 text-ember" aria-hidden="true" />
                  Suggested opening pair
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recommendation.lead.map((pokemon) => (
                    <span className="rounded-md bg-ember/10 px-3 py-2 text-sm font-bold text-ink" key={pokemon.name}>{pokemon.name}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <ShieldCheck className="h-4 w-4 text-moss" aria-hidden="true" />
                  Leave behind
                </h4>
                <p className="mt-2 text-sm text-ink/65">
                  {recommendation.bench.length > 0 ? recommendation.bench.map((pokemon) => pokemon.name).join(", ") : "No bench choices yet."}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Uncovered threats</h4>
                <p className={`mt-2 text-sm ${recommendation.uncovered.length > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {recommendation.uncovered.length > 0
                    ? recommendation.uncovered.map((pokemon) => pokemon.name).join(", ")
                    : "Every shown opponent has a super-effective STAB answer."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <PokemonMatchupMatrix opponents={opponentTeam} team={myTeam} />

      <p className="text-xs leading-5 text-ink/45">
        The Bring-4 recommendation is a fast type and STAB safety model, adapted from the MIT-licensed PokeCounter project. The matrix adds common moves and damage rolls, but the recommendation itself does not yet account for items, speed, or battle strategy.
      </p>
    </div>
  );
}
