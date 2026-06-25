import type { VgcPastesData } from "@/lib/pokemon/vgc-pastes";

export type PokemonStatKey = "HP" | "Atk" | "Def" | "SpA" | "SpD" | "Spe";

export type PokemonBaseStats = Record<PokemonStatKey, number>;

export type PokemonType =
  | "Normal"
  | "Fire"
  | "Water"
  | "Electric"
  | "Grass"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon"
  | "Dark"
  | "Steel"
  | "Fairy";

export type PokemonBuilderOption = {
  abilities: string[];
  baseStats: PokemonBaseStats | null;
  count: number;
  moves: string[];
  name: string;
  natures: string[];
  types: PokemonType[];
};

export type PokemonSpeedTier = {
  baseSpeed: number | null;
  count: number;
  evs: number;
  name: string;
  nature: string;
  speed: number | null;
};

export type PokemonBuilderData = {
  pokemon: PokemonBuilderOption[];
  speedTiers: PokemonSpeedTier[];
  types: PokemonType[];
};

const maxChampionsInvestment = 32;
const maxComparableEv = 252;

type PastePokemonSet = {
  ability: string | null;
  evs: Partial<Record<PokemonStatKey, number>>;
  moves: string[];
  name: string;
  nature: string | null;
};

const statLabels: Record<string, PokemonStatKey> = {
  attack: "Atk",
  atk: "Atk",
  def: "Def",
  defense: "Def",
  hp: "HP",
  "special-attack": "SpA",
  "special-defense": "SpD",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
  speed: "Spe",
};

const natureModifiers: Record<string, { down?: PokemonStatKey; up?: PokemonStatKey }> = {
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

const pokemonTypes: PokemonType[] = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
];

const fallbackTypes: Record<string, PokemonType[]> = {
  Archaludon: ["Steel", "Dragon"],
  Amoonguss: ["Grass", "Poison"],
  Basculegion: ["Water", "Ghost"],
  "Blastoise-Mega": ["Water"],
  "Blaziken-Mega": ["Fire", "Fighting"],
  "Calyrex-Shadow": ["Psychic", "Ghost"],
  "Charizard-Mega-X": ["Fire", "Dragon"],
  "Charizard-Mega-Y": ["Fire", "Flying"],
  "Chien-Pao": ["Dark", "Ice"],
  "Chi-Yu": ["Dark", "Fire"],
  "Delphox-Mega": ["Fire", "Psychic"],
  "Dragonite-Mega": ["Dragon", "Flying"],
  "Eelektross-Mega": ["Electric"],
  Farigiraf: ["Normal", "Psychic"],
  "Floette-Eternal-Mega": ["Fairy"],
  "Floette-Mega": ["Fairy"],
  Garchomp: ["Dragon", "Ground"],
  "Gardevoir-Mega": ["Psychic", "Fairy"],
  Gholdengo: ["Steel", "Ghost"],
  Grimmsnarl: ["Dark", "Fairy"],
  Hydreigon: ["Dark", "Dragon"],
  Incineroar: ["Fire", "Dark"],
  "Iron Hands": ["Fighting", "Electric"],
  Kingambit: ["Dark", "Steel"],
  Koraidon: ["Fighting", "Dragon"],
  "Landorus-Therian": ["Ground", "Flying"],
  "Mawile-Mega": ["Steel", "Fairy"],
  "Metagross-Mega": ["Steel", "Psychic"],
  Metagross: ["Steel", "Psychic"],
  Miraidon: ["Electric", "Dragon"],
  "Ninetales-Alola": ["Ice", "Fairy"],
  "Ogerpon-Wellspring": ["Grass", "Water"],
  Pelipper: ["Water", "Flying"],
  Raichu: ["Electric"],
  Rillaboom: ["Grass"],
  "Sceptile-Mega": ["Grass", "Dragon"],
  Sinistcha: ["Grass", "Ghost"],
  Sneasler: ["Fighting", "Poison"],
  "Staraptor-Mega": ["Normal", "Flying"],
  "Swampert-Mega": ["Water", "Ground"],
  Sylveon: ["Fairy"],
  Terapagos: ["Normal"],
  "Tornadus-Incarnate": ["Flying"],
  "Urshifu-Rapid-Strike": ["Fighting", "Water"],
  Whimsicott: ["Grass", "Fairy"],
};

const slugOverrides: Record<string, string> = {
  "Calyrex-Shadow": "calyrex-shadow",
  "Landorus-Therian": "landorus-therian",
  "Ogerpon-Wellspring": "ogerpon-wellspring-mask",
  "Tornadus-Incarnate": "tornadus-incarnate",
  "Urshifu-Rapid-Strike": "urshifu-rapid-strike",
};

function normalizePokemonName(value: string) {
  return value
    .replace(/\s+\(.+\)$/g, "")
    .replace(/ @ .+$/g, "")
    .trim();
}

function toPokemonSlug(name: string) {
  return (
    slugOverrides[name] ??
    name
      .toLowerCase()
      .replace(/♀/g, "-f")
      .replace(/♂/g, "-m")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function getLookupNames(name: string) {
  const lookupNames = [name];

  if (name.endsWith("-Mega")) {
    lookupNames.push(name.replace(/-Mega$/, ""));
  }

  if (name.endsWith("-Mega-X") || name.endsWith("-Mega-Y")) {
    lookupNames.push(name.replace(/-Mega-[XY]$/, ""));
  }

  if (name === "Floette-Eternal-Mega") {
    lookupNames.push("Floette-Eternal", "Floette");
  }

  return Array.from(new Set(lookupNames));
}

function addCount(map: Map<string, number>, value: string | null) {
  if (!value) {
    return;
  }

  map.set(value, (map.get(value) ?? 0) + 1);
}

function getNatureMultiplier(nature: string | null, stat: PokemonStatKey) {
  const modifier = nature ? natureModifiers[nature] : undefined;

  if (modifier?.up === stat) {
    return 1.1;
  }

  if (modifier?.down === stat) {
    return 0.9;
  }

  return 1;
}

function toComparableEv(investment: number) {
  const boundedInvestment = Math.min(Math.max(investment, 0), maxChampionsInvestment);

  return Math.round((boundedInvestment / maxChampionsInvestment) * maxComparableEv);
}

function calculateLevel50Stat({
  base,
  ev,
  nature,
  stat,
}: {
  base: number;
  ev: number;
  nature: string | null;
  stat: PokemonStatKey;
}) {
  const iv = 31;
  const level = 50;
  const comparableEv = toComparableEv(ev);

  if (stat === "HP") {
    return Math.floor(((2 * base + iv + Math.floor(comparableEv / 4)) * level) / 100) + level + 10;
  }

  const rawStat =
    Math.floor(((2 * base + iv + Math.floor(comparableEv / 4)) * level) / 100) + 5;

  return Math.floor(rawStat * getNatureMultiplier(nature, stat));
}

function getTopValues(map: Map<string, number>, limit: number) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function parsePasteSets(text: string): PastePokemonSet[] {
  return text
    .split(/\n\s*\n/g)
    .map((block) => {
      const lines = block
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .filter(Boolean);
      const header = lines[0];

      if (!header) {
        return null;
      }

      const abilityLine = lines.find((line) => line.startsWith("Ability:"));
      const evLine = lines.find((line) => line.startsWith("EVs:"));
      const natureLine = lines.find((line) => line.endsWith(" Nature"));
      const evs =
        evLine
          ?.replace("EVs:", "")
          .split("/")
          .reduce<Partial<Record<PokemonStatKey, number>>>((spreads, entry) => {
            const match = entry.trim().match(/^(\d+)\s+([A-Za-z]+)/);
            const stat = match?.[2]
              ? statLabels[match[2].toLowerCase()]
              : undefined;

            if (stat && match?.[1]) {
              spreads[stat] = Number(match[1]);
            }

            return spreads;
          }, {}) ?? {};

      return {
        ability: abilityLine?.replace("Ability:", "").trim() ?? null,
        evs,
        moves: lines
          .filter((line) => line.startsWith("- "))
          .map((line) => line.replace("- ", "").trim()),
        name: normalizePokemonName(header),
        nature: natureLine?.replace(" Nature", "").trim() ?? null,
      };
    })
    .filter((set): set is PastePokemonSet => set !== null);
}

async function getPokemonBaseStats(name: string): Promise<PokemonBaseStats | null> {
  const lookupNames = getLookupNames(name);

  for (const lookupName of lookupNames) {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${toPokemonSlug(lookupName)}`,
      { next: { revalidate: 60 * 60 * 24 } },
    ).catch(() => null);

    if (!response?.ok) {
      continue;
    }

    const data = (await response.json()) as {
      stats?: { base_stat?: number; stat?: { name?: string } }[];
    };
    const stats = data.stats?.reduce<Partial<PokemonBaseStats>>((baseStats, entry) => {
      const stat = entry.stat?.name ? statLabels[entry.stat.name] : undefined;

      if (stat && typeof entry.base_stat === "number") {
        baseStats[stat] = entry.base_stat;
      }

      return baseStats;
    }, {});

    if (
      stats?.HP &&
      stats.Atk &&
      stats.Def &&
      stats.SpA &&
      stats.SpD &&
      stats.Spe
    ) {
      return stats as PokemonBaseStats;
    }
  }

  return null;
}

async function getPasteText(url: string) {
  if (!url.startsWith("https://pokepast.es/")) {
    return "";
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/raw`, {
    next: { revalidate: 60 * 60 },
  }).catch(() => null);

  if (!response?.ok) {
    return "";
  }

  return response.text();
}

async function getPokemonTypes(name: string): Promise<PokemonType[]> {
  if (fallbackTypes[name]) {
    return fallbackTypes[name];
  }

  const lookupNames = getLookupNames(name);

  for (const lookupName of lookupNames) {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${toPokemonSlug(lookupName)}`,
      { next: { revalidate: 60 * 60 * 24 } },
    ).catch(() => null);

    if (!response?.ok) {
      continue;
    }

    const data = (await response.json()) as {
      types?: { type?: { name?: string } }[];
    };
    const types =
      data.types
      ?.map((entry) => entry.type?.name)
      .filter((type): type is string => Boolean(type))
      .map((type) => {
        return `${type.charAt(0).toUpperCase()}${type.slice(1)}` as PokemonType;
      })
      .filter((type) => pokemonTypes.includes(type)) ?? [];

    if (types.length > 0) {
      return types;
    }
  }

  return [];
}

function getMergedTopValues(
  source: Map<string, Map<string, number>>,
  pokemonName: string,
  limit: number,
) {
  const mergedValues = new Map<string, number>();

  getLookupNames(pokemonName).forEach((lookupName) => {
    source.get(lookupName)?.forEach((count, value) => {
      mergedValues.set(value, (mergedValues.get(value) ?? 0) + count);
    });
  });

  return getTopValues(mergedValues, limit);
}

function getCommonSpeedSpread(
  source: Map<string, PastePokemonSet[]>,
  pokemonName: string,
) {
  const spreads = new Map<string, { count: number; evs: number; nature: string }>();

  getLookupNames(pokemonName).forEach((lookupName) => {
    source.get(lookupName)?.forEach((set) => {
      const evs = set.evs.Spe ?? 0;
      const nature = set.nature ?? "Neutral";
      const key = `${nature}-${evs}`;
      const existingSpread = spreads.get(key);

      spreads.set(key, {
        count: (existingSpread?.count ?? 0) + 1,
        evs,
        nature,
      });
    });
  });

  return (
    Array.from(spreads.values()).sort((a, b) => {
      return b.count - a.count || b.evs - a.evs || a.nature.localeCompare(b.nature);
    })[0] ?? { count: 0, evs: 0, nature: "Neutral" }
  );
}

export async function getPokemonBuilderData(
  data: VgcPastesData,
): Promise<PokemonBuilderData> {
  const usageCounts = new Map<string, number>();
  const movesByPokemon = new Map<string, Map<string, number>>();
  const abilitiesByPokemon = new Map<string, Map<string, number>>();
  const naturesByPokemon = new Map<string, Map<string, number>>();
  const setsByPokemon = new Map<string, PastePokemonSet[]>();

  data.teams.forEach((team) => {
    team.pokemon.forEach((pokemon) => {
      usageCounts.set(pokemon, (usageCounts.get(pokemon) ?? 0) + 1);
    });
  });

  const pasteTexts = await Promise.all(
    data.teams
      .filter((team) => team.pokepasteUrl)
      .slice(0, 80)
      .map((team) => getPasteText(team.pokepasteUrl)),
  );

  pasteTexts.forEach((pasteText) => {
    parsePasteSets(pasteText).forEach((set) => {
      const moves = movesByPokemon.get(set.name) ?? new Map<string, number>();
      const abilities =
        abilitiesByPokemon.get(set.name) ?? new Map<string, number>();
      const natures = naturesByPokemon.get(set.name) ?? new Map<string, number>();

      set.moves.forEach((move) => addCount(moves, move));
      addCount(abilities, set.ability);
      addCount(natures, set.nature);

      movesByPokemon.set(set.name, moves);
      abilitiesByPokemon.set(set.name, abilities);
      naturesByPokemon.set(set.name, natures);
      setsByPokemon.set(set.name, [...(setsByPokemon.get(set.name) ?? []), set]);
    });
  });

  const popularPokemon = Array.from(usageCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 60);
  const pokemon = await Promise.all(
    popularPokemon.map(async ([name, count]) => {
      const baseStats = await getPokemonBaseStats(name);

      return {
        abilities: getMergedTopValues(abilitiesByPokemon, name, 4),
        baseStats,
        count,
        moves: getMergedTopValues(movesByPokemon, name, 12),
        name,
        natures: getMergedTopValues(naturesByPokemon, name, 6),
        types: await getPokemonTypes(name),
      };
    }),
  );
  const speedTiers = pokemon
    .map((pokemonOption) => {
      const commonSpeedSpread = getCommonSpeedSpread(setsByPokemon, pokemonOption.name);
      const speed =
        pokemonOption.baseStats?.Spe !== undefined
          ? calculateLevel50Stat({
              base: pokemonOption.baseStats.Spe,
              ev: commonSpeedSpread.evs,
              nature:
                commonSpeedSpread.nature === "Neutral"
                  ? null
                  : commonSpeedSpread.nature,
              stat: "Spe",
            })
          : null;

      return {
        baseSpeed: pokemonOption.baseStats?.Spe ?? null,
        count: pokemonOption.count,
        evs: commonSpeedSpread.evs,
        name: pokemonOption.name,
        nature: commonSpeedSpread.nature,
        speed,
      };
    })
    .sort((a, b) => (b.speed ?? 0) - (a.speed ?? 0) || b.count - a.count)
    .slice(0, 24);

  return {
    pokemon,
    speedTiers,
    types: pokemonTypes,
  };
}
