import { calculate, Field, Generations, Move, Pokemon } from "@smogon/calc";

import { bestStabMultiplier } from "@/lib/pokemon/bring-four";
import type { PokemonBuilderOption } from "@/lib/pokemon/team-builder";

export type MatrixDamage = {
  fallbackMultiplier: number;
  maximumPercent: number | null;
  minimumPercent: number | null;
  move: string | null;
};

export type MatrixMatchup = {
  incoming: MatrixDamage;
  opponent: PokemonBuilderOption;
  outgoing: MatrixDamage;
  pokemon: PokemonBuilderOption;
};

function calcName(name: string) {
  return name.replace(/-Mega-([XY])$/, "-Mega-$1").replace(/-Mega$/, "-Mega");
}

function strongestMove(attacker: PokemonBuilderOption, defender: PokemonBuilderOption): MatrixDamage {
  const fallbackMultiplier = bestStabMultiplier(attacker, defender);

  try {
    const generation = Generations.get(9);
    const attackingPokemon = new Pokemon(generation, calcName(attacker.name), {
      level: 50,
      nature: attacker.natures[0] ?? "Hardy",
    });
    const defendingPokemon = new Pokemon(generation, calcName(defender.name), {
      level: 50,
      nature: defender.natures[0] ?? "Hardy",
    });
    const hp = defendingPokemon.maxHP();
    const field = new Field({ gameType: "Doubles" });

    const results = attacker.moves.flatMap((moveName) => {
      try {
        const result = calculate(
          generation,
          attackingPokemon,
          defendingPokemon,
          new Move(generation, moveName),
          field,
        );
        const [minimum, maximum] = result.range();
        if (maximum <= 0) return [];
        return [{ maximumPercent: (maximum / hp) * 100, minimumPercent: (minimum / hp) * 100, move: moveName }];
      } catch {
        return [];
      }
    });

    const best = results.sort((a, b) => b.maximumPercent - a.maximumPercent)[0];
    return best ? { ...best, fallbackMultiplier } : { fallbackMultiplier, maximumPercent: null, minimumPercent: null, move: null };
  } catch {
    return { fallbackMultiplier, maximumPercent: null, minimumPercent: null, move: null };
  }
}

export function buildMatchupMatrix(team: PokemonBuilderOption[], opponents: PokemonBuilderOption[]) {
  return team.flatMap((pokemon) =>
    opponents.map((opponent): MatrixMatchup => ({
      incoming: strongestMove(opponent, pokemon),
      opponent,
      outgoing: strongestMove(pokemon, opponent),
      pokemon,
    })),
  );
}
