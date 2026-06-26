"use client";

import Link from "next/link";
import { Bookmark, Search, Shuffle, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import type { VgcPasteTeam, VgcPastesData } from "@/lib/pokemon/vgc-pastes";

function includesQuery(values: string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function buildPokemonOptions(teams: VgcPastesData["teams"]) {
  const counts = new Map<string, number>();

  teams.forEach((team) => {
    team.pokemon.forEach((pokemon) => {
      counts.set(pokemon, (counts.get(pokemon) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ count, name }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function getRandomTeam(teams: VgcPasteTeam[], currentTeamId?: string) {
  if (teams.length === 0) {
    return null;
  }

  if (teams.length === 1) {
    return teams[0];
  }

  const nextTeams = currentTeamId
    ? teams.filter((team) => team.id !== currentTeamId)
    : teams;
  const randomIndex = Math.floor(Math.random() * nextTeams.length);

  return nextTeams[randomIndex] ?? null;
}

const wantToTryStorageKey = "owen-hub-want-to-try-teams";
const wantToTryNotesStorageKey = "owen-hub-want-to-try-team-notes";

function getWantToTryIdsFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(wantToTryStorageKey);
    const parsedIds = savedValue ? (JSON.parse(savedValue) as string[]) : [];

    return Array.isArray(parsedIds) ? parsedIds : [];
  } catch {
    return [];
  }
}

function getWantToTryNotesFromStorage() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const savedValue = window.localStorage.getItem(wantToTryNotesStorageKey);
    const parsedNotes = savedValue
      ? (JSON.parse(savedValue) as Record<string, string>)
      : {};

    return parsedNotes && typeof parsedNotes === "object" ? parsedNotes : {};
  } catch {
    return {};
  }
}

function TeamCard({
  isWantToTry,
  isSpotlight = false,
  selectedPokemon,
  team,
  togglePokemon,
  toggleWantToTry,
}: {
  isWantToTry: boolean;
  isSpotlight?: boolean;
  selectedPokemon: string[];
  team: VgcPasteTeam;
  togglePokemon: (pokemon: string) => void;
  toggleWantToTry: (teamId: string) => void;
}) {
  return (
    <article
      className={`rounded-lg border border-ink/10 bg-white p-4 shadow-soft ${
        isSpotlight ? "w-full max-w-5xl" : ""
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">
              {team.id}
            </span>
            <span className="rounded-md bg-mist px-2 py-1 text-xs font-bold text-ink/65">
              {team.rank}
            </span>
            {team.replicaCode !== "None" ? (
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                Code {team.replicaCode}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => toggleWantToTry(team.id)}
              className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-bold transition ${
                isWantToTry
                  ? "bg-amber-100 text-amber-900"
                  : "bg-mist text-ink/55 hover:bg-amber-50 hover:text-amber-900"
              }`}
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${isWantToTry ? "fill-amber-700" : ""}`}
                aria-hidden="true"
              />
              Want to try
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.pokemon.map((pokemon) => {
              const isSelected = selectedPokemon.includes(pokemon);

              return (
                <button
                  key={`${team.id}-${pokemon}`}
                  type="button"
                  onClick={() => togglePokemon(pokemon)}
                  className={`flex min-h-24 items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-moss bg-emerald-50"
                      : "border-ink/10 bg-skyglass hover:border-moss/40"
                  }`}
                >
                  <PokemonSprite
                    name={pokemon}
                    className="h-16 w-16 shrink-0"
                  />
                  <span className="text-sm font-bold leading-5 text-ink">
                    {pokemon}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-lg bg-mist p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">
            Team info
          </p>
          <h2 className="mt-2 text-base font-bold leading-6 text-ink">
            {team.description}
          </h2>

          <div className="mt-3 space-y-3 text-sm text-ink/65">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink/40">
                Creator / Event
              </p>
              <p className="mt-1 font-semibold text-ink">
                {team.fullName || team.creator || "-"}
              </p>
              <p className="mt-1 break-words">
                {team.creator ? `@${team.creator}` : ""}
                {team.creator && team.event !== "-" ? " · " : ""}
                {team.event !== "-" ? team.event : ""}
              </p>
              <p className="mt-1 text-xs text-ink/45">{team.dateShared}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink/40">
                Replica
              </p>
              <p className="mt-1 font-semibold text-ink">{team.replicaCode}</p>
              <p className="mt-1 text-xs text-ink/45">{team.replicaStatus}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {team.pokepasteUrl ? (
                <Link
                  href={team.pokepasteUrl}
                  target="_blank"
                  className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss transition hover:text-ink"
                >
                  Pokepaste
                </Link>
              ) : null}
              {team.sourceUrl && team.sourceUrl !== "-" ? (
                <Link
                  href={team.sourceUrl}
                  target="_blank"
                  className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss transition hover:text-ink"
                >
                  Source
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

export function PokemonTeamsClient({ data }: { data: VgcPastesData }) {
  const [query, setQuery] = useState("");
  const [pokemonQuery, setPokemonQuery] = useState("");
  const [randomTeam, setRandomTeam] = useState<VgcPasteTeam | null>(null);
  const [isRandomTeamOpen, setIsRandomTeamOpen] = useState(false);
  const [isThrowingTeam, setIsThrowingTeam] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>([]);
  const [wantToTryIds, setWantToTryIds] = useState<string[]>(
    getWantToTryIdsFromStorage,
  );
  const [wantToTryNotes, setWantToTryNotes] = useState<Record<string, string>>(
    getWantToTryNotesFromStorage,
  );

  const pokemonOptions = useMemo(() => {
    return buildPokemonOptions(data.teams);
  }, [data.teams]);

  const filteredPokemonOptions = useMemo(() => {
    const normalizedQuery = pokemonQuery.trim().toLowerCase();

    return pokemonOptions
      .filter((pokemon) => {
        if (selectedPokemon.includes(pokemon.name)) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return pokemon.name.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, 18);
  }, [pokemonOptions, pokemonQuery, selectedPokemon]);

  const visibleTeams = useMemo(() => {
    return data.teams.filter((team) => {
      const matchesText = includesQuery(
        [
          team.id,
          team.description,
          team.fullName,
          team.creator,
          team.event,
          team.rank,
          ...team.pokemon,
        ],
        query,
      );
      const hasSelectedPokemon = selectedPokemon.every((pokemon) => {
        return team.pokemon.includes(pokemon);
      });

      return matchesText && hasSelectedPokemon;
    });
  }, [data.teams, query, selectedPokemon]);
  const wantToTryTeams = useMemo(() => {
    const wantedIds = new Set(wantToTryIds);

    return data.teams.filter((team) => wantedIds.has(team.id));
  }, [data.teams, wantToTryIds]);

  function togglePokemon(pokemon: string) {
    setSelectedPokemon((currentPokemon) => {
      if (currentPokemon.includes(pokemon)) {
        return currentPokemon.filter((item) => item !== pokemon);
      }

      return [...currentPokemon, pokemon];
    });
  }

  function clearFilters() {
    setQuery("");
    setPokemonQuery("");
    setSelectedPokemon([]);
  }

  function toggleWantToTry(teamId: string) {
    setWantToTryIds((currentIds) => {
      const nextIds = currentIds.includes(teamId)
        ? currentIds.filter((id) => id !== teamId)
        : [...currentIds, teamId];

      window.localStorage.setItem(wantToTryStorageKey, JSON.stringify(nextIds));

      return nextIds;
    });
  }

  function updateWantToTryNote(teamId: string, note: string) {
    setWantToTryNotes((currentNotes) => {
      const nextNotes = { ...currentNotes, [teamId]: note };

      if (!note.trim()) {
        delete nextNotes[teamId];
      }

      window.localStorage.setItem(
        wantToTryNotesStorageKey,
        JSON.stringify(nextNotes),
      );

      return nextNotes;
    });
  }

  function showRandomTeam() {
    setRandomTeam((currentTeam) => getRandomTeam(visibleTeams, currentTeam?.id));
    setIsRandomTeamOpen(true);
    setIsThrowingTeam(false);
  }

  const showNextRandomTeam = useCallback(() => {
    if (visibleTeams.length === 0) {
      return;
    }

    setIsThrowingTeam(true);
    window.setTimeout(() => {
      setRandomTeam((currentTeam) => getRandomTeam(visibleTeams, currentTeam?.id));
      setIsThrowingTeam(false);
    }, 180);
  }, [visibleTeams]);

  const closeRandomTeam = useCallback(() => {
    setIsRandomTeamOpen(false);
    setIsThrowingTeam(false);
  }, []);

  useEffect(() => {
    if (!isRandomTeamOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === "Space") {
        event.preventDefault();
        showNextRandomTeam();
      }

      if (event.key === "Escape") {
        closeRandomTeam();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeRandomTeam, isRandomTeamOpen, showNextRandomTeam]);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Sheet</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data.sheetName}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Teams loaded</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {data.teams.length}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Visible teams</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {visibleTeams.length}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Last checked</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {data.lastCheckedAt}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Want to try
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Flagged M-B teams
            </h2>
          </div>
          <span className="rounded-md bg-mist px-3 py-2 text-sm font-bold text-ink/60">
            {wantToTryTeams.length}
          </span>
        </div>
        {wantToTryTeams.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {wantToTryTeams.map((team) => (
              <article
                key={`want-${team.id}`}
                className="rounded-lg border border-ink/10 bg-mist p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">
                        {team.id}
                      </span>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-ink/60">
                        {team.rank}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-ink">
                      {team.description}
                    </h3>
                    <p className="mt-1 text-xs text-ink/45">
                      {team.fullName || team.creator || "-"} · {team.dateShared}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleWantToTry(team.id)}
                    className="h-8 rounded-md bg-white px-3 text-xs font-bold text-ink transition hover:bg-rose-50 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {team.pokemon.map((pokemon) => (
                    <button
                      key={`want-${team.id}-${pokemon}`}
                      type="button"
                      onClick={() => togglePokemon(pokemon)}
                      className="rounded-md bg-white p-2 text-center transition hover:bg-skyglass"
                    >
                      <PokemonSprite
                        name={pokemon}
                        className="mx-auto h-12 w-12"
                      />
                      <span className="mt-1 block truncate text-[11px] font-bold text-ink">
                        {pokemon}
                      </span>
                    </button>
                  ))}
                </div>

                <input
                  value={wantToTryNotes[team.id] ?? ""}
                  onChange={(event) =>
                    updateWantToTryNote(team.id, event.target.value)
                  }
                  placeholder="Why I saved this team"
                  className="mt-3 h-9 w-full rounded-md border border-ink/10 bg-white px-3 text-xs text-ink outline-none transition focus:border-moss"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {team.pokepasteUrl ? (
                    <Link
                      href={team.pokepasteUrl}
                      target="_blank"
                      className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss transition hover:text-ink"
                    >
                      Pokepaste
                    </Link>
                  ) : null}
                  {team.sourceUrl && team.sourceUrl !== "-" ? (
                    <Link
                      href={team.sourceUrl}
                      target="_blank"
                      className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss transition hover:text-ink"
                    >
                      Source
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-dashed border-ink/20 bg-mist px-3 py-4 text-sm text-ink/55">
            Flag teams below to save them here.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Team filters
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Find teams by Pokémon
            </h2>
          </div>

          <div className="grid w-full gap-3 xl:max-w-2xl">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search player, team, event"
                  className="h-10 w-full rounded-md border border-ink/10 bg-mist pl-9 pr-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
                />
              </label>
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                  aria-hidden="true"
                />
                <input
                  value={pokemonQuery}
                  onChange={(event) => setPokemonQuery(event.target.value)}
                  placeholder="Search Pokémon to add"
                  className="h-10 w-full rounded-md border border-ink/10 bg-mist pl-9 pr-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
                />
              </label>
            </div>

            {selectedPokemon.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedPokemon.map((pokemon) => (
                  <button
                    key={pokemon}
                    type="button"
                    onClick={() => togglePokemon(pokemon)}
                    className="inline-flex h-8 items-center gap-2 rounded-md bg-ink px-2 text-xs font-bold text-white"
                  >
                    {pokemon}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-8 rounded-md border border-ink/10 bg-white px-3 text-xs font-bold text-ink"
                >
                  Clear
                </button>
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={showRandomTeam}
                disabled={visibleTeams.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                Find a team
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredPokemonOptions.map((pokemon) => (
            <button
              key={pokemon.name}
              data-pokemon-filter={pokemon.name}
              type="button"
              onClick={() => togglePokemon(pokemon.name)}
              className="flex min-h-16 items-center gap-3 rounded-md border border-ink/10 bg-mist p-2 text-left transition hover:border-moss/40 hover:bg-skyglass"
            >
              <PokemonSprite
                name={pokemon.name}
                className="h-12 w-12 shrink-0"
              />
              <span>
                <span className="block font-semibold text-ink">
                  {pokemon.name}
                </span>
                <span className="text-sm text-ink/55">
                  {pokemon.count} team{pokemon.count === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Usage snapshot
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Most common Pokémon
            </h2>
          </div>
          <p className="text-sm text-ink/55">
            Click a Pokémon below to add it to the filter.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.topPokemon.map((pokemon) => (
            <button
              key={pokemon.name}
              data-pokemon-filter={pokemon.name}
              type="button"
              onClick={() => togglePokemon(pokemon.name)}
              className="flex items-center gap-3 rounded-md border border-ink/10 bg-mist p-3 text-left transition hover:border-moss/40 hover:bg-skyglass"
            >
              <PokemonSprite
                name={pokemon.name}
                className="h-14 w-14 shrink-0"
              />
              <span>
                <span className="block font-semibold text-ink">
                  {pokemon.name}
                </span>
                <span className="mt-1 block text-sm text-ink/55">
                  {pokemon.count} team{pokemon.count === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {visibleTeams.map((team) => (
          <TeamCard
            key={team.id}
            isWantToTry={wantToTryIds.includes(team.id)}
            selectedPokemon={selectedPokemon}
            team={team}
            togglePokemon={togglePokemon}
            toggleWantToTry={toggleWantToTry}
          />
        ))}

        {visibleTeams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink/20 bg-white p-6 text-sm text-ink/60">
            No teams match that filter.
          </div>
        ) : null}
      </section>

      {isRandomTeamOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl">
            <div className="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={showNextRandomTeam}
                disabled={visibleTeams.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-ink transition hover:bg-skyglass disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                Next
              </button>
              <button
                type="button"
                onClick={closeRandomTeam}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-ink transition hover:bg-skyglass"
                aria-label="Close random team"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div
              className={`transition duration-200 ${
                isThrowingTeam
                  ? "translate-x-full rotate-3 opacity-0"
                  : "translate-x-0 rotate-0 opacity-100"
              }`}
            >
              {randomTeam ? (
                <TeamCard
                  isSpotlight
                  isWantToTry={wantToTryIds.includes(randomTeam.id)}
                  selectedPokemon={selectedPokemon}
                  team={randomTeam}
                  togglePokemon={togglePokemon}
                  toggleWantToTry={toggleWantToTry}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-white/40 bg-white p-6 text-sm text-ink/60">
                  No teams match that filter.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
