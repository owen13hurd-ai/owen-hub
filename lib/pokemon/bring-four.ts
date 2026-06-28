import type { PokemonBuilderOption } from "@/lib/pokemon/team-builder";
import { typeEffectiveness } from "@/lib/pokemon/type-chart";

export type BringFourMatchup = {
  incoming: number;
  offense: number;
  opponent: PokemonBuilderOption;
};

export type BringFourPick = {
  matchups: BringFourMatchup[];
  pokemon: PokemonBuilderOption;
  score: number;
};

export type BringFourResult = {
  bench: PokemonBuilderOption[];
  coverageCount: number;
  lead: PokemonBuilderOption[];
  picks: BringFourPick[];
  uncovered: PokemonBuilderOption[];
};

export function bestStabMultiplier(attacker: PokemonBuilderOption, defender: PokemonBuilderOption) {
  if (attacker.types.length === 0) return 1;
  return Math.max(...attacker.types.map((type) => typeEffectiveness(type, defender.types)));
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  return items.flatMap((item, index) => combinations(items.slice(index + 1), size - 1).map((tail) => [item, ...tail]));
}

// Adapted from EricTron-FR/PokeCounter.app (MIT). The score balances
// offensive STAB coverage with defensive safety and immunity pivots.
export function scorePokemon(pokemon: PokemonBuilderOption, opponents: PokemonBuilderOption[]) {
  const matchups = opponents.map((opponent) => ({
    incoming: bestStabMultiplier(opponent, pokemon),
    offense: bestStabMultiplier(pokemon, opponent),
    opponent,
  }));
  const score = matchups.reduce((total, matchup) => {
    let next = total;
    if (matchup.offense >= 2) next += 1;
    if (matchup.offense >= 4) next += 1;
    if (matchup.incoming === 0) next += 1;
    else if (matchup.incoming >= 4) next -= 2;
    else if (matchup.incoming >= 2) next -= 1;
    if (matchup.offense >= 2 && matchup.incoming < 2) next += 0.5;
    return next;
  }, 0);
  return { matchups, pokemon, score };
}

function bestSubset(team: PokemonBuilderOption[], opponents: PokemonBuilderOption[], size: number) {
  return combinations(team, Math.min(size, team.length)).map((subset) => {
    const picks = subset.map((pokemon) => scorePokemon(pokemon, opponents));
    const uncovered = opponents.filter((opponent) => !subset.some((pokemon) => bestStabMultiplier(pokemon, opponent) >= 2));
    return { coverageCount: opponents.length - uncovered.length, picks, score: picks.reduce((sum, pick) => sum + pick.score, 0), subset, uncovered };
  }).sort((a, b) => b.score - a.score || b.coverageCount - a.coverageCount)[0];
}

export function recommendBringFour(team: PokemonBuilderOption[], opponents: PokemonBuilderOption[]): BringFourResult | null {
  if (team.length < 4 || opponents.length === 0) return null;
  const bring = bestSubset(team, opponents, 4);
  const lead = bestSubset(bring.subset, opponents, 2);
  const pickByName = new Map(bring.picks.map((pick) => [pick.pokemon.name, pick]));
  return {
    bench: team.filter((pokemon) => !bring.subset.some((pick) => pick.name === pokemon.name)),
    coverageCount: bring.coverageCount,
    lead: lead.subset,
    picks: bring.subset.map((pokemon) => pickByName.get(pokemon.name)!).sort((a, b) => b.score - a.score),
    uncovered: bring.uncovered,
  };
}
