"use client";

import { ArrowLeftRight, Calculator, Shield, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { calculate, Field, Generations, Move, Pokemon } from "@smogon/calc";
import clsx from "clsx";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import type { PokemonBuilderData, PokemonBuilderOption, PokemonStatKey, PokemonType } from "@/lib/pokemon/team-builder";

type CalcPokemon = {
  ability: string;
  boosts: Partial<Record<PokemonStatKey, number>>;
  investments: Record<PokemonStatKey, number>;
  item: string;
  name: string;
  nature: string;
  teraType: "" | PokemonType;
};
type CalcWeather = "" | "Sun" | "Rain" | "Sand" | "Hail" | "Snow" | "Harsh Sunshine" | "Heavy Rain";
type CalcTerrain = "" | "Electric" | "Grassy" | "Psychic" | "Misty";

const stats: PokemonStatKey[] = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
const statIds: Record<PokemonStatKey, "hp" | "atk" | "def" | "spa" | "spd" | "spe"> = {
  HP: "hp", Atk: "atk", Def: "def", SpA: "spa", SpD: "spd", Spe: "spe",
};
const maxInvestment = 32;
const inputClass = "h-10 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-moss";

function blankInvestments(): Record<PokemonStatKey, number> {
  return { HP: 0, Atk: 0, Def: 0, SpA: 0, SpD: 0, Spe: 0 };
}

function createCalcPokemon(option: PokemonBuilderOption): CalcPokemon {
  return {
    ability: option.abilities[0] ?? "",
    boosts: {},
    investments: blankInvestments(),
    item: "",
    name: option.name,
    nature: option.natures[0] ?? "Hardy",
    teraType: "",
  };
}

function equivalentEv(investment: number) {
  return Math.round(Math.min(maxInvestment, Math.max(0, investment)) / maxInvestment * 252);
}

function calcName(name: string) {
  return name
    .replace(/-Mega-([XY])$/, "-Mega-$1")
    .replace(/-Mega$/, "-Mega");
}

function toPokemon(gen: ReturnType<typeof Generations.get>, pokemon: CalcPokemon) {
  return new Pokemon(gen, calcName(pokemon.name), {
    ability: pokemon.ability || undefined,
    boosts: Object.fromEntries(Object.entries(pokemon.boosts).map(([stat, value]) => [statIds[stat as PokemonStatKey], value])),
    evs: Object.fromEntries(stats.map((stat) => [statIds[stat], equivalentEv(pokemon.investments[stat])])),
    item: pokemon.item || undefined,
    level: 50,
    nature: pokemon.nature || "Hardy",
    teraType: pokemon.teraType || undefined,
  });
}

function PokemonPanel({ data, label, pokemon, setPokemon }: { data: PokemonBuilderData; label: string; pokemon: CalcPokemon; setPokemon: (pokemon: CalcPokemon) => void }) {
  const option = data.pokemon.find((candidate) => candidate.name === pokemon.name) ?? data.pokemon[0];
  return <section className="rounded-lg border border-ink/10 bg-mist p-4"><div className="flex items-center gap-3"><PokemonSprite name={pokemon.name} className="h-16 w-16" /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">{label}</p><select value={pokemon.name} onChange={(e) => { const next = data.pokemon.find((candidate) => candidate.name === e.target.value); if (next) setPokemon(createCalcPokemon(next)); }} className="mt-1 h-10 w-full rounded-md border border-ink/10 bg-white px-2 text-sm font-bold text-ink outline-none"><option value={pokemon.name}>{pokemon.name}</option>{data.pokemon.filter((candidate) => candidate.name !== pokemon.name).map((candidate) => <option key={candidate.name}>{candidate.name}</option>)}</select></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><select value={pokemon.nature} onChange={(e) => setPokemon({ ...pokemon, nature: e.target.value })} className={inputClass}><option value="Hardy">Hardy</option>{option.natures.filter((nature) => nature !== "Hardy").map((nature) => <option key={nature}>{nature}</option>)}</select><select value={pokemon.ability} onChange={(e) => setPokemon({ ...pokemon, ability: e.target.value })} className={inputClass}><option value="">No ability</option>{option.abilities.map((ability) => <option key={ability}>{ability}</option>)}</select><input value={pokemon.item} onChange={(e) => setPokemon({ ...pokemon, item: e.target.value })} placeholder="Item" className={inputClass} /><select value={pokemon.teraType} onChange={(e) => setPokemon({ ...pokemon, teraType: e.target.value as CalcPokemon["teraType"] })} className={inputClass}><option value="">No Tera</option>{data.types.map((type) => <option key={type}>{type}</option>)}</select></div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{stats.map((stat) => <label key={stat} className="rounded-md bg-white p-2 text-center"><span className="text-[10px] font-black text-ink/45">{stat}</span><input type="number" min="0" max="32" value={pokemon.investments[stat]} onChange={(e) => setPokemon({ ...pokemon, investments: { ...pokemon.investments, [stat]: Math.min(32, Math.max(0, Number(e.target.value) || 0)) } })} className="mt-1 h-8 w-full text-center text-sm font-bold text-ink outline-none" /><span className="block text-[9px] text-ink/35">/{maxInvestment}</span></label>)}</div><div className="mt-3 grid grid-cols-4 gap-2">{(["Atk", "Def", "SpA", "SpD"] as const).map((stat) => <label key={stat} className="text-[10px] font-bold text-ink/45">{stat} stage<select value={pokemon.boosts[stat] ?? 0} onChange={(e) => setPokemon({ ...pokemon, boosts: { ...pokemon.boosts, [stat]: Number(e.target.value) } })} className="mt-1 h-8 w-full rounded-md border border-ink/10 bg-white px-1 text-xs text-ink">{[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map((value) => <option key={value} value={value}>{value > 0 ? `+${value}` : value}</option>)}</select></label>)}</div></section>;
}

export function PokemonDamageCalculator({ data }: { data: PokemonBuilderData }) {
  const attackerDefault = data.pokemon.find((pokemon) => pokemon.name === "Garchomp") ?? data.pokemon[0];
  const defenderDefault = data.pokemon.find((pokemon) => pokemon.name === "Incineroar") ?? data.pokemon[1] ?? data.pokemon[0];
  const [attacker, setAttacker] = useState(() => createCalcPokemon(attackerDefault));
  const [defender, setDefender] = useState(() => createCalcPokemon(defenderDefault));
  const [move, setMove] = useState(attackerDefault.moves.find((name) => name === "Earthquake") ?? attackerDefault.moves[0] ?? "Tackle");
  const [weather, setWeather] = useState<CalcWeather>("");
  const [terrain, setTerrain] = useState<CalcTerrain>("");
  const [reflect, setReflect] = useState(false);
  const [lightScreen, setLightScreen] = useState(false);
  const [helpingHand, setHelpingHand] = useState(false);
  const [friendGuard, setFriendGuard] = useState(false);
  const [critical, setCritical] = useState(false);
  const attackerOption = data.pokemon.find((pokemon) => pokemon.name === attacker.name) ?? attackerDefault;

  function updateAttacker(next: CalcPokemon) {
    if (next.name !== attacker.name) {
      const nextOption = data.pokemon.find((pokemon) => pokemon.name === next.name);
      setMove(nextOption?.moves[0] ?? "Tackle");
    }
    setAttacker(next);
  }

  const result = useMemo(() => {
    try {
      const gen = Generations.get(9);
      const attackingPokemon = toPokemon(gen, attacker);
      const defendingPokemon = toPokemon(gen, defender);
      const selectedMove = new Move(gen, move, { isCrit: critical });
      const field = new Field({
        gameType: "Doubles",
        weather: weather || undefined,
        terrain: terrain || undefined,
        attackerSide: { isHelpingHand: helpingHand },
        defenderSide: { isFriendGuard: friendGuard, isLightScreen: lightScreen, isReflect: reflect },
      });
      const calculation = calculate(gen, attackingPokemon, defendingPokemon, selectedMove, field);
      const [minimum, maximum] = calculation.range();
      const hp = defendingPokemon.maxHP();
      return { calculation, error: "", hp, maximum, maximumPercent: maximum / hp * 100, minimum, minimumPercent: minimum / hp * 100 };
    } catch (error) {
      return { calculation: null, error: error instanceof Error ? error.message : "This combination is not supported yet.", hp: 0, maximum: 0, maximumPercent: 0, minimum: 0, minimumPercent: 0 };
    }
  }, [attacker, critical, defender, friendGuard, helpingHand, lightScreen, move, reflect, terrain, weather]);

  function swap() {
    setAttacker(defender); setDefender(attacker);
  }

  return <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Champions Damage Calc</p><h2 className="mt-1 text-xl font-bold text-ink">Instant matchup damage</h2><p className="mt-1 text-sm text-ink/55">Gen 9 engine with Champions 0–32 investment conversion.</p></div><button onClick={swap} className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/10 bg-white px-4 text-sm font-bold text-ink"><ArrowLeftRight className="h-4 w-4" />Swap sides</button></div><div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><PokemonPanel data={data} label="Attacker" pokemon={attacker} setPokemon={updateAttacker} /><PokemonPanel data={data} label="Defender" pokemon={defender} setPokemon={setDefender} /></div><div className="grid gap-4 xl:grid-cols-[1fr_360px]"><div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><div className="flex items-center gap-2"><Swords className="h-5 w-5 text-moss" /><h3 className="font-bold text-ink">Move and battlefield</h3></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><select value={move} onChange={(e) => setMove(e.target.value)} className={inputClass}><option value={move}>{move}</option>{attackerOption.moves.filter((name) => name !== move).map((name) => <option key={name}>{name}</option>)}</select><select value={weather} onChange={(e) => setWeather(e.target.value as CalcWeather)} className={inputClass}><option value="">No weather</option><option>Sun</option><option>Rain</option><option>Sand</option><option>Hail</option><option>Snow</option><option>Harsh Sunshine</option><option>Heavy Rain</option></select><select value={terrain} onChange={(e) => setTerrain(e.target.value as CalcTerrain)} className={inputClass}><option value="">No terrain</option><option>Electric</option><option>Grassy</option><option>Psychic</option><option>Misty</option></select></div><div className="mt-4 flex flex-wrap gap-2">{[["Critical hit", critical, setCritical], ["Reflect", reflect, setReflect], ["Light Screen", lightScreen, setLightScreen], ["Helping Hand", helpingHand, setHelpingHand], ["Friend Guard", friendGuard, setFriendGuard]].map(([label, checked, setter]) => <label key={String(label)} className={clsx("inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-xs font-bold", checked ? "bg-ink text-white" : "bg-mist text-ink")}><input type="checkbox" checked={Boolean(checked)} onChange={(e) => (setter as (value: boolean) => void)(e.target.checked)} className="sr-only" />{String(label)}</label>)}</div></div><aside className="rounded-lg bg-ink p-5 text-white shadow-soft"><div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-emerald-300" /><p className="text-xs font-bold uppercase text-white/55">Damage result</p></div>{result.calculation ? <><p className="mt-4 text-3xl font-black">{result.minimum}–{result.maximum}</p><p className="mt-1 text-lg font-bold text-emerald-300">{result.minimumPercent.toFixed(1)}–{result.maximumPercent.toFixed(1)}%</p><div className="mt-4 h-3 overflow-hidden rounded bg-white/15"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, result.maximumPercent)}%` }} /></div><p className="mt-4 text-sm font-bold">{result.calculation.kochance().text || "KO chance unavailable"}</p><p className="mt-3 text-xs leading-5 text-white/60">{result.calculation.fullDesc()}</p></> : <p className="mt-4 rounded-md bg-rose-500/15 p-3 text-sm text-rose-100">{result.error}</p>}</aside></div><p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-900"><Shield className="mt-0.5 h-4 w-4 shrink-0" />Champions investment is translated proportionally to standard EVs. Custom Champions mechanics should be verified in-game while the format is still evolving.</p></section>;
}
