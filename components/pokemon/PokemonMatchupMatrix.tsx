"use client";

import { AlertTriangle, Swords } from "lucide-react";
import { useMemo } from "react";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { buildMatchupMatrix, type MatrixDamage } from "@/lib/pokemon/matchup-matrix";
import type { PokemonBuilderOption } from "@/lib/pokemon/team-builder";

function damageLabel(damage: MatrixDamage) {
  if (damage.minimumPercent !== null && damage.maximumPercent !== null) {
    return `${damage.minimumPercent.toFixed(0)}-${damage.maximumPercent.toFixed(0)}%`;
  }
  if (damage.fallbackMultiplier > 1) return `${damage.fallbackMultiplier}x STAB edge`;
  if (damage.fallbackMultiplier === 0) return "No STAB damage";
  return "Damage unavailable";
}

function matchupClass(outgoing: MatrixDamage, incoming: MatrixDamage) {
  if (outgoing.maximumPercent === null || incoming.maximumPercent === null) {
    if (outgoing.fallbackMultiplier > incoming.fallbackMultiplier) return "bg-emerald-50";
    if (outgoing.fallbackMultiplier < incoming.fallbackMultiplier) return "bg-rose-50";
    return "bg-mist/60";
  }
  if (outgoing.maximumPercent >= incoming.maximumPercent * 1.25) return "bg-emerald-50";
  if (incoming.maximumPercent >= outgoing.maximumPercent * 1.25) return "bg-rose-50";
  return "bg-amber-50";
}

export function PokemonMatchupMatrix({
  opponents,
  team,
}: {
  opponents: PokemonBuilderOption[];
  team: PokemonBuilderOption[];
}) {
  const matrix = useMemo(() => buildMatchupMatrix(team, opponents), [opponents, team]);
  const matchupByPair = new Map(matrix.map((matchup) => [`${matchup.pokemon.name}:${matchup.opponent.name}`, matchup]));
  const unavailableCount = matrix.filter((matchup) => matchup.outgoing.maximumPercent === null).length;

  if (team.length === 0 || opponents.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <div className="flex flex-col justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Damage matrix</p>
          <h3 className="mt-1 text-lg font-bold text-ink">How every matchup trades</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">Advantage</span>
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-800">Close trade</span>
          <span className="rounded bg-rose-50 px-2 py-1 text-rose-800">Danger</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
          <thead>
            <tr>
              <th className="w-32 border-b border-r border-ink/10 bg-mist p-3 text-xs font-bold uppercase tracking-[0.1em] text-ink/45">My Pokemon</th>
              {opponents.map((opponent) => (
                <th className="border-b border-ink/10 bg-mist p-2 text-center" key={opponent.name}>
                  <PokemonSprite className="mx-auto h-10 w-10" name={opponent.name} />
                  <span className="mt-1 block truncate text-xs font-bold text-ink">{opponent.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map((pokemon) => (
              <tr key={pokemon.name}>
                <th className="border-b border-r border-ink/10 p-2">
                  <div className="flex items-center gap-2">
                    <PokemonSprite className="h-10 w-10 shrink-0" name={pokemon.name} />
                    <span className="truncate text-xs font-bold text-ink">{pokemon.name}</span>
                  </div>
                </th>
                {opponents.map((opponent) => {
                  const matchup = matchupByPair.get(`${pokemon.name}:${opponent.name}`)!;
                  return (
                    <td className={`border-b border-ink/10 p-2 align-top ${matchupClass(matchup.outgoing, matchup.incoming)}`} key={opponent.name}>
                      <p className="truncate text-xs font-bold text-ink" title={matchup.outgoing.move ?? undefined}>
                        {matchup.outgoing.move ?? "Type estimate"}
                      </p>
                      <p className="mt-1 text-sm font-black text-ink">{damageLabel(matchup.outgoing)}</p>
                      <p className="mt-2 border-t border-ink/10 pt-1 text-[10px] leading-4 text-ink/50">
                        Takes {damageLabel(matchup.incoming)}
                        {matchup.incoming.move ? ` from ${matchup.incoming.move}` : ""}
                      </p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 bg-mist/50 px-4 py-3 text-xs leading-5 text-ink/55 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="flex items-start gap-2">
          <Swords className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden="true" />
          Level 50 doubles, common imported moves, no item, and the most common imported nature.
        </p>
        {unavailableCount > 0 && (
          <p className="flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {unavailableCount} cells use type estimates
          </p>
        )}
      </div>
    </section>
  );
}
