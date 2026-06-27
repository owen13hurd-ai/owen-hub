"use client";

import {
  BarChart3, BookOpen, Check, ChevronRight, Cloud, CloudOff, History,
  NotebookPen, Play, Plus, Search, Shield, Swords, Trophy, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { loadBattleJournalCloud, saveBattleJournalCloud } from "@/lib/pokemon/battle-journal-cloud";
import { buildBattleInsights, getBattleJournalStats, getLeadMatchups } from "@/lib/pokemon/battle-journal-stats";
import { loadBattleJournalLocal, saveBattleJournalLocal } from "@/lib/pokemon/battle-journal-storage";
import {
  emptyBattleReview, type BattleJournalData, type BattlePokemonState,
  type BattleTag, type OpponentNote, type PokemonBattle,
} from "@/lib/pokemon/battle-journal-types";

type View = "Dashboard" | "Battle" | "History" | "Matchups" | "Notes" | "Statistics";
type NewBattleDraft = Pick<PokemonBattle, "archetype" | "date" | "format" | "myLead" | "myTeam" | "opponentLead" | "opponentName" | "opponentTeam" | "rank">;

const quickTags: BattleTag[] = ["Good Play", "Mistake", "Prediction Correct", "Prediction Wrong", "Misplay", "Throw", "Missed Win", "Lucky", "Unlucky"];
const reviewTags = ["Lead", "Endgame", "Positioning", "Win Condition", "Speed Control", "Priority", "Setup", "Critical Hit", "Calc Error", "Terastal", "Switch"];
const inputClass = "h-10 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-moss";
const panelClass = "rounded-lg border border-ink/10 bg-white p-4 shadow-soft";

function newDraft(): NewBattleDraft {
  return { archetype: "", date: new Date().toISOString().slice(0, 10), format: "Champions M-B", myLead: "", myTeam: Array(6).fill(""), opponentLead: "", opponentName: "", opponentTeam: Array(6).fill(""), rank: "" };
}

function emptyPokemonState(): BattlePokemonState {
  return { ability: "", boosts: "", fainted: false, item: "", moves: [], status: "", terastallized: false };
}

function TeamEditor({ label, names, options, onChange }: { label: string; names: string[]; options: string[]; onChange: (names: string[]) => void }) {
  const listId = `pokemon-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return <fieldset><legend className="text-sm font-bold text-ink">{label}</legend><datalist id={listId}>{options.map((name) => <option key={name} value={name} />)}</datalist><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{names.map((name, index) => <label key={index} className="relative rounded-md border border-ink/10 bg-mist p-2"><span className="absolute left-2 top-2 text-[10px] font-bold text-ink/35">{index + 1}</span>{name ? <PokemonSprite name={name} className="mx-auto h-12 w-12" /> : <div className="mx-auto h-12 w-12" />}<input list={listId} value={name} onChange={(event) => onChange(names.map((value, slot) => slot === index ? event.target.value : value))} placeholder="Pokémon" className="h-8 w-full bg-transparent text-center text-xs font-bold text-ink outline-none" /></label>)}</div></fieldset>;
}

function TeamPreview({ names, lead, label, states, side, onSelect }: { names: string[]; lead: string; label: string; states?: Record<string, BattlePokemonState>; side: "my" | "opp"; onSelect?: (key: string) => void }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{label}</p><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{names.filter(Boolean).map((name) => { const key = `${side}:${name}`; const state = states?.[key]; return <button key={key} type="button" onClick={() => onSelect?.(key)} className={clsx("relative min-w-0 rounded-md border bg-mist p-2 text-center", lead === name ? "border-amber-400 ring-2 ring-amber-200" : "border-ink/10", state?.fainted && "opacity-35 grayscale")}><PokemonSprite name={name} className="mx-auto h-12 w-12" /><p className="truncate text-[11px] font-bold text-ink">{name}</p>{state?.terastallized ? <span className="absolute right-1 top-1 rounded bg-violet-600 px-1 text-[9px] font-black text-white">TERA</span> : null}</button>; })}</div></div>;
}

export function BattleJournal({ pokemonNames }: { pokemonNames: string[] }) {
  const [data, setData] = useState<BattleJournalData>(loadBattleJournalLocal);
  const [view, setView] = useState<View>("Dashboard");
  const [draft, setDraft] = useState<NewBattleDraft>(newDraft);
  const [query, setQuery] = useState("");
  const [syncState, setSyncState] = useState<"loading" | "cloud" | "local">("loading");
  const [hydrated, setHydrated] = useState(false);
  const stats = useMemo(() => getBattleJournalStats(data), [data]);
  const liveBattle = data.battles.find((battle) => battle.status !== "Complete");

  useEffect(() => {
    let cancelled = false;
    void loadBattleJournalCloud().then((cloudData) => {
      if (cancelled) return;
      if (cloudData) setData(cloudData);
      setSyncState(cloudData ? "cloud" : "local");
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    saveBattleJournalLocal(data);
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      void saveBattleJournalCloud(data).then((saved) => setSyncState(saved ? "cloud" : "local"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data, hydrated]);

  function updateBattle(id: string, update: (battle: PokemonBattle) => PokemonBattle) {
    setData((current) => ({ ...current, battles: current.battles.map((battle) => battle.id === id ? update(battle) : battle) }));
  }

  function startBattle() {
    if (!draft.myTeam.some(Boolean) || !draft.opponentTeam.some(Boolean)) return;
    const pokemonState: Record<string, BattlePokemonState> = {};
    draft.myTeam.filter(Boolean).forEach((name) => { pokemonState[`my:${name}`] = emptyPokemonState(); });
    draft.opponentTeam.filter(Boolean).forEach((name) => { pokemonState[`opp:${name}`] = emptyPokemonState(); });
    const battle: PokemonBattle = { ...draft, id: crypto.randomUUID(), currentTurn: 1, outcome: null, pokemonState, review: { ...emptyBattleReview }, status: "Live", turns: [] };
    setData((current) => ({ ...current, battles: [battle, ...current.battles.filter((item) => item.status === "Complete")] }));
    setView("Battle");
  }

  const tabs: { icon: typeof Shield; label: View }[] = [
    { icon: Shield, label: "Dashboard" }, { icon: Swords, label: "Battle" },
    { icon: History, label: "History" }, { icon: Trophy, label: "Matchups" },
    { icon: NotebookPen, label: "Notes" }, { icon: BarChart3, label: "Statistics" },
  ];

  return <section className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Battle Journal</p><h2 className="mt-1 text-2xl font-bold text-ink">Champions match desk</h2></div><span className={clsx("inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 text-xs font-bold", syncState === "cloud" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>{syncState === "cloud" ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}{syncState === "loading" ? "Loading journal" : syncState === "cloud" ? "Saved to Supabase" : "Saved on this device"}</span></div>
    <nav className="flex gap-1 overflow-x-auto border-b border-ink/10" aria-label="Battle Journal sections">{tabs.map(({ icon: Icon, label }) => <button key={label} onClick={() => setView(label)} className={clsx("inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-bold", view === label ? "border-moss text-ink" : "border-transparent text-ink/50")}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    {view === "Dashboard" ? <JournalDashboard data={data} stats={stats} liveBattle={liveBattle} setData={setData} open={setView} /> : null}
    {view === "Battle" ? liveBattle ? <LiveBattle battle={liveBattle} update={(fn) => updateBattle(liveBattle.id, fn)} /> : <NewBattle draft={draft} setDraft={setDraft} pokemonNames={pokemonNames} start={startBattle} /> : null}
    {view === "History" ? <BattleHistory battles={data.battles} query={query} setQuery={setQuery} /> : null}
    {view === "Matchups" ? <LeadMatchups battles={data.battles} /> : null}
    {view === "Notes" ? <JournalNotes data={data} setData={setData} pokemonNames={pokemonNames} /> : null}
    {view === "Statistics" ? <JournalStatistics data={data} /> : null}
  </section>;
}

function JournalDashboard({ data, stats, liveBattle, setData, open }: { data: BattleJournalData; stats: ReturnType<typeof getBattleJournalStats>; liveBattle?: PokemonBattle; setData: React.Dispatch<React.SetStateAction<BattleJournalData>>; open: (view: View) => void }) {
  const cards = [["Record", stats.record], ["Win rate", `${stats.winRate}%`], ["Current streak", stats.currentStreak], ["Longest streak", stats.longestStreak]];
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <div key={label} className={panelClass}><p className="text-xs font-bold uppercase text-ink/45">{label}</p><p className="mt-2 text-2xl font-black text-ink">{value}</p></div>)}<label className={panelClass}><span className="text-xs font-bold uppercase text-ink/45">Current rating</span><input type="number" value={data.currentRating || ""} onChange={(event) => setData((current) => ({ ...current, currentRating: Number(event.target.value) || 0 }))} placeholder="Enter rating" className="mt-2 h-9 w-full bg-transparent text-xl font-black text-ink outline-none" /></label></div><div className="grid gap-4 xl:grid-cols-[1fr_340px]"><div className={panelClass}><div className="flex items-center justify-between"><div><h3 className="font-bold text-ink">Recent battles</h3><p className="text-sm text-ink/50">Fast access to your latest reviews</p></div><button onClick={() => open(liveBattle ? "Battle" : "Battle")} className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white">{liveBattle ? <Play className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{liveBattle ? "Resume" : "New battle"}</button></div><div className="mt-4 space-y-2">{data.battles.filter((battle) => battle.status === "Complete").slice(0, 5).map((battle) => <div key={battle.id} className="flex items-center justify-between rounded-md bg-mist p-3"><div><p className="font-bold text-ink">{battle.opponentName || battle.archetype || "Unknown opponent"}</p><p className="text-xs text-ink/45">{battle.date} · {battle.currentTurn} turns</p></div><span className={clsx("rounded-md px-2 py-1 text-xs font-black", battle.outcome === "Win" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>{battle.outcome}</span></div>)}{stats.battles.length === 0 ? <p className="rounded-md bg-mist p-4 text-sm text-ink/50">Your completed battles will appear here.</p> : null}</div></div><div className={panelClass}><h3 className="font-bold text-ink">Automatic insights</h3><div className="mt-3 space-y-2">{buildBattleInsights(data).map((insight) => <p key={insight} className="rounded-md bg-skyglass p-3 text-sm leading-5 text-ink/70">{insight}</p>)}</div><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-ink/50">Favorite lead</dt><dd className="font-bold text-ink">{stats.favoriteLead[0]}</dd></div><div className="flex justify-between"><dt className="text-ink/50">Common opponent</dt><dd className="font-bold text-ink">{stats.commonOpponent[0]}</dd></div></dl></div></div></div>;
}

function NewBattle({ draft, setDraft, pokemonNames, start }: { draft: NewBattleDraft; setDraft: React.Dispatch<React.SetStateAction<NewBattleDraft>>; pokemonNames: string[]; start: () => void }) {
  return <div className={panelClass}><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Pre-match setup</p><h3 className="mt-1 text-xl font-bold text-ink">Create battle</h3></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input value={draft.opponentName} onChange={(e) => setDraft({ ...draft, opponentName: e.target.value })} placeholder="Opponent (optional)" className={inputClass} /><input value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} placeholder="Format" className={inputClass} /><input value={draft.rank} onChange={(e) => setDraft({ ...draft, rank: e.target.value })} placeholder="Rank" className={inputClass} /><input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={inputClass} /><input value={draft.archetype} onChange={(e) => setDraft({ ...draft, archetype: e.target.value })} placeholder="Opponent archetype" className={inputClass} /></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><TeamEditor label="My team" names={draft.myTeam} options={pokemonNames} onChange={(myTeam) => setDraft({ ...draft, myTeam })} /><TeamEditor label="Opponent team" names={draft.opponentTeam} options={pokemonNames} onChange={(opponentTeam) => setDraft({ ...draft, opponentTeam })} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={draft.myLead} onChange={(e) => setDraft({ ...draft, myLead: e.target.value })} className={inputClass}><option value="">My lead</option>{draft.myTeam.filter(Boolean).map((name) => <option key={name}>{name}</option>)}</select><select value={draft.opponentLead} onChange={(e) => setDraft({ ...draft, opponentLead: e.target.value })} className={inputClass}><option value="">Opponent lead</option>{draft.opponentTeam.filter(Boolean).map((name) => <option key={name}>{name}</option>)}</select></div><button onClick={start} disabled={!draft.myTeam.some(Boolean) || !draft.opponentTeam.some(Boolean)} className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-bold text-white disabled:opacity-30"><Play className="h-4 w-4" />Start battle</button></div>;
}

function LiveBattle({ battle, update }: { battle: PokemonBattle; update: (fn: (battle: PokemonBattle) => PokemonBattle) => void }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const selectedState = selectedKey ? battle.pokemonState[selectedKey] : undefined;
  const selectedName = selectedKey?.split(":").slice(1).join(":") ?? "";

  function addTurnNote(tags = selectedTags, text = note) {
    if (!text.trim() && tags.length === 0) return;
    update((current) => ({ ...current, turns: [...current.turns, { createdAt: new Date().toISOString(), id: crypto.randomUUID(), note: text.trim(), tags, turn: current.currentTurn }] }));
    setNote(""); setSelectedTags([]);
  }

  function quickTag(tag: string) { addTurnNote([tag], ""); }
  function updatePokemon(changes: Partial<BattlePokemonState>) {
    if (!selectedKey) return;
    update((current) => ({ ...current, pokemonState: { ...current.pokemonState, [selectedKey]: { ...current.pokemonState[selectedKey], ...changes } } }));
  }

  if (battle.status === "Review") return <BattleReviewForm battle={battle} update={update} />;

  return <div className="space-y-4"><div className="rounded-lg bg-ink p-4 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase text-white/50">Live battle · Turn {battle.currentTurn}</p><h3 className="mt-1 text-xl font-bold">{battle.opponentName || battle.archetype || "Opponent"}</h3></div><button onClick={() => update((current) => ({ ...current, status: "Review" }))} className="h-10 rounded-md bg-white px-4 text-sm font-bold text-ink">Finish battle</button></div><div className="mt-5 space-y-5"><TeamPreview label="Opponent" names={battle.opponentTeam} lead={battle.opponentLead} states={battle.pokemonState} side="opp" onSelect={setSelectedKey} /><TeamPreview label="My team" names={battle.myTeam} lead={battle.myLead} states={battle.pokemonState} side="my" onSelect={setSelectedKey} /></div></div>
    {selectedState ? <div className={panelClass}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><PokemonSprite name={selectedName} className="h-12 w-12" /><div><p className="font-bold text-ink">{selectedName}</p><p className="text-xs text-ink/45">Fast state controls</p></div></div><button onClick={() => setSelectedKey(null)} aria-label="Close Pokémon controls" className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-mist"><X className="h-4 w-4" /></button></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => updatePokemon({ fainted: !selectedState.fainted })} className={clsx("h-9 rounded-md px-3 text-xs font-bold", selectedState.fainted ? "bg-rose-600 text-white" : "bg-mist text-ink")}>Fainted</button><button onClick={() => updatePokemon({ terastallized: !selectedState.terastallized })} className={clsx("h-9 rounded-md px-3 text-xs font-bold", selectedState.terastallized ? "bg-violet-600 text-white" : "bg-mist text-ink")}>Terastallized</button><select value={selectedState.status} onChange={(e) => updatePokemon({ status: e.target.value })} className={`${inputClass} h-9`}><option value="">No status</option><option>Burn</option><option>Poison</option><option>Paralysis</option><option>Sleep</option><option>Freeze</option></select></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={selectedState.item} onChange={(e) => updatePokemon({ item: e.target.value })} placeholder="Revealed item" className={inputClass} /><input value={selectedState.ability} onChange={(e) => updatePokemon({ ability: e.target.value })} placeholder="Revealed ability" className={inputClass} /><input value={selectedState.boosts} onChange={(e) => updatePokemon({ boosts: e.target.value })} placeholder="Stat boosts" className={inputClass} /><input value={selectedState.moves.join(", ")} onChange={(e) => updatePokemon({ moves: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="Moves, comma separated" className={inputClass} /></div></div> : null}
    <div className={panelClass}><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-ink">Turn {battle.currentTurn}</p><p className="text-xs text-ink/45">One tap records a timestamped event</p></div><button onClick={() => update((current) => ({ ...current, currentTurn: current.currentTurn + 1 }))} className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white">Next turn<ChevronRight className="h-4 w-4" /></button></div><div className="mt-4 flex gap-2 overflow-x-auto pb-2">{quickTags.map((tag) => <button key={tag} onClick={() => quickTag(tag)} className={clsx("h-10 shrink-0 rounded-md px-3 text-xs font-bold", ["Mistake", "Misplay", "Throw", "Missed Win"].includes(tag) ? "bg-rose-50 text-rose-800" : ["Good Play", "Prediction Correct"].includes(tag) ? "bg-emerald-50 text-emerald-800" : "bg-mist text-ink")}>{tag}</button>)}</div><div className="mt-3 flex flex-wrap gap-1.5">{reviewTags.map((tag) => <button key={tag} onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag])} className={clsx("rounded-md px-2 py-1 text-xs font-bold", selectedTags.includes(tag) ? "bg-moss text-white" : "bg-skyglass text-ink/60")}>{tag}</button>)}</div><div className="mt-3 flex gap-2"><input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTurnNote(); }} placeholder="What happened?" className={`${inputClass} min-w-0 flex-1`} /><button onClick={() => addTurnNote()} aria-label="Add turn note" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-white"><Plus className="h-4 w-4" /></button></div></div>
    <div className={panelClass}><h3 className="font-bold text-ink">Turn timeline</h3><div className="mt-3 space-y-2">{[...battle.turns].reverse().map((turn) => <article key={turn.id} className="rounded-md border border-ink/10 bg-mist p-3"><div className="flex justify-between"><span className="text-xs font-black text-moss">TURN {turn.turn}</span><span className="text-[11px] text-ink/35">{new Date(turn.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div>{turn.note ? <p className="mt-1 text-sm text-ink">{turn.note}</p> : null}<div className="mt-2 flex flex-wrap gap-1">{turn.tags.map((tag) => <span key={tag} className="rounded bg-white px-2 py-1 text-[11px] font-bold text-ink/55">{tag}</span>)}</div></article>)}{battle.turns.length === 0 ? <p className="text-sm text-ink/45">No events recorded yet.</p> : null}</div></div></div>;
}

function BattleReviewForm({ battle, update }: { battle: PokemonBattle; update: (fn: (battle: PokemonBattle) => PokemonBattle) => void }) {
  const review = battle.review;
  const setReview = (changes: Partial<typeof review>) => update((current) => ({ ...current, review: { ...current.review, ...changes } }));
  const fields: [keyof typeof review, string][] = [["biggestMistake", "Biggest mistake"], ["bestPlay", "Best play"], ["turningPoint", "Turning point"], ["leadThoughts", "Lead matchup thoughts"], ["remember", "Things to remember"], ["lesson", "Overall lesson"]];
  return <div className={`${panelClass} max-w-5xl`}><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Post-match review</p><h3 className="mt-1 text-xl font-bold text-ink">Finish the record while it is fresh</h3><div className="mt-5 flex gap-2">{(["Win", "Loss"] as const).map((outcome) => <button key={outcome} onClick={() => update((current) => ({ ...current, outcome }))} className={clsx("h-11 flex-1 rounded-md text-sm font-black", battle.outcome === outcome ? outcome === "Win" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white" : "bg-mist text-ink")}>{outcome}</button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-3"><Rating label="Difficulty" value={review.difficulty} onChange={(difficulty) => setReview({ difficulty })} /><Rating label="Confidence" value={review.confidence} onChange={(confidence) => setReview({ confidence })} /><label className="flex items-center justify-between rounded-md bg-mist p-3 text-sm font-bold text-ink">Played well<input type="checkbox" checked={review.playedWell} onChange={(e) => setReview({ playedWell: e.target.checked })} className="h-5 w-5 accent-emerald-700" /></label></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="grid gap-1 text-sm font-bold text-ink">{label}<textarea value={String(review[key])} onChange={(e) => setReview({ [key]: e.target.value })} className="min-h-20 rounded-md border border-ink/10 bg-mist p-3 text-sm font-normal outline-none focus:border-moss" /></label>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={review.mvp} onChange={(e) => setReview({ mvp: e.target.value })} className={inputClass}><option value="">MVP Pokémon</option>{battle.myTeam.filter(Boolean).map((name) => <option key={name}>{name}</option>)}</select><select value={review.worstPokemon} onChange={(e) => setReview({ worstPokemon: e.target.value })} className={inputClass}><option value="">Worst Pokémon</option>{battle.myTeam.filter(Boolean).map((name) => <option key={name}>{name}</option>)}</select></div><div className="mt-5 flex gap-2"><button onClick={() => update((current) => ({ ...current, status: "Live" }))} className="h-10 rounded-md border border-ink/10 px-4 text-sm font-bold text-ink">Back to battle</button><button disabled={!battle.outcome} onClick={() => update((current) => ({ ...current, status: "Complete" }))} className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white disabled:opacity-30"><Check className="h-4 w-4" />Save review</button></div></div>;
}

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <div><p className="text-sm font-bold text-ink">{label}</p><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} onClick={() => onChange(rating)} className={clsx("h-9 flex-1 rounded-md text-xs font-black", value === rating ? "bg-ink text-white" : "bg-mist text-ink")}>{rating}</button>)}</div></div>; }

function BattleHistory({ battles, query, setQuery }: { battles: PokemonBattle[]; query: string; setQuery: (query: string) => void }) {
  const normalized = query.toLowerCase().trim();
  const visible = battles.filter((battle) => battle.status === "Complete" && (!normalized || JSON.stringify(battle).toLowerCase().includes(normalized)));
  return <div className={panelClass}><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-ink/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search battles, Pokémon, tags, or lessons" className={`${inputClass} w-full pl-9`} /></div><div className="mt-4 space-y-3">{visible.map((battle) => <article key={battle.id} className="rounded-lg border border-ink/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={clsx("rounded-md px-2 py-1 text-xs font-black", battle.outcome === "Win" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>{battle.outcome}</span><h3 className="font-bold text-ink">{battle.opponentName || battle.archetype || "Unknown opponent"}</h3></div><p className="mt-1 text-xs text-ink/45">{battle.date} · {battle.format} · {battle.currentTurn} turns</p></div><div className="text-right text-xs text-ink/50"><p>Difficulty {battle.review.difficulty}/5</p><p>Confidence {battle.review.confidence}/5</p></div></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><TeamPreview label="My team" names={battle.myTeam} lead={battle.myLead} side="my" /><TeamPreview label="Opponent" names={battle.opponentTeam} lead={battle.opponentLead} side="opp" /></div>{battle.review.lesson ? <p className="mt-4 rounded-md bg-skyglass p-3 text-sm text-ink/70"><strong>Lesson:</strong> {battle.review.lesson}</p> : null}<div className="mt-3 flex flex-wrap gap-1">{Array.from(new Set(battle.turns.flatMap((turn) => turn.tags))).map((tag) => <span key={tag} className="rounded bg-mist px-2 py-1 text-[11px] font-bold text-ink/55">{tag}</span>)}</div></article>)}{visible.length === 0 ? <p className="rounded-md bg-mist p-4 text-sm text-ink/50">No completed battles match this search.</p> : null}</div></div>;
}

function LeadMatchups({ battles }: { battles: PokemonBattle[] }) {
  const matchups = getLeadMatchups(battles);
  return <div className={panelClass}><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Lead database</p><h3 className="mt-1 text-xl font-bold text-ink">Matchup history</h3><div className="mt-5 grid gap-3 md:grid-cols-2">{matchups.map((matchup) => <article key={`${matchup.myLead}-${matchup.opponentLead}`} className="rounded-lg border border-ink/10 bg-mist p-4"><div className="flex items-center gap-3"><PokemonSprite name={matchup.myLead} className="h-14 w-14" /><span className="font-black text-ink/30">VS</span><PokemonSprite name={matchup.opponentLead} className="h-14 w-14" /></div><h4 className="mt-3 font-bold text-ink">{matchup.myLead} vs {matchup.opponentLead}</h4><div className="mt-2 flex gap-3 text-sm"><span>{matchup.battles.length} battles</span><span className="font-black text-emerald-700">{matchup.winRate}% win rate</span></div><div className="mt-3 space-y-1">{matchup.battles.slice(0, 3).flatMap((battle) => battle.turns.filter((turn) => turn.note).slice(-1)).map((turn) => <p key={turn.id} className="text-xs text-ink/55">Turn {turn.turn}: {turn.note}</p>)}</div></article>)}{matchups.length === 0 ? <p className="text-sm text-ink/50">Complete battles with both leads selected to build this database.</p> : null}</div></div>;
}

function JournalNotes({ data, setData, pokemonNames }: { data: BattleJournalData; setData: React.Dispatch<React.SetStateAction<BattleJournalData>>; pokemonNames: string[] }) {
  const [mode, setMode] = useState<"Opponents" | "Teams">("Opponents");
  const [opponent, setOpponent] = useState<Omit<OpponentNote, "id">>({ commonLeads: "", name: "", notes: "", threats: "", typicalSwitches: "", weaknesses: "" });
  const [teamName, setTeamName] = useState(""); const [team, setTeam] = useState(Array(6).fill("")); const [gameplan, setGameplan] = useState("");
  function addOpponent() { if (!opponent.name.trim()) return; setData((current) => ({ ...current, opponentNotes: [{ ...opponent, id: crypto.randomUUID() }, ...current.opponentNotes] })); setOpponent({ commonLeads: "", name: "", notes: "", threats: "", typicalSwitches: "", weaknesses: "" }); }
  function addTeam() { if (!teamName.trim()) return; setData((current) => ({ ...current, teamNotes: [{ id: crypto.randomUUID(), name: teamName.trim(), pokemon: team.filter(Boolean), gameplan, description: "", leadOptions: "", winConditions: "", badMatchups: "", goodMatchups: "", remember: "" }, ...current.teamNotes] })); setTeamName(""); setTeam(Array(6).fill("")); setGameplan(""); }
  return <div className="space-y-4"><div className="flex gap-2">{(["Opponents", "Teams"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={clsx("h-10 rounded-md px-4 text-sm font-bold", mode === item ? "bg-ink text-white" : "bg-mist text-ink")}>{item}</button>)}</div>{mode === "Opponents" ? <div className="grid gap-4 xl:grid-cols-[360px_1fr]"><div className={panelClass}><h3 className="font-bold text-ink">Opponent or archetype</h3><div className="mt-3 grid gap-2"><input value={opponent.name} onChange={(e) => setOpponent({ ...opponent, name: e.target.value })} placeholder="Rain, Trick Room, player name..." className={inputClass} /><input value={opponent.commonLeads} onChange={(e) => setOpponent({ ...opponent, commonLeads: e.target.value })} placeholder="Common leads" className={inputClass} /><input value={opponent.typicalSwitches} onChange={(e) => setOpponent({ ...opponent, typicalSwitches: e.target.value })} placeholder="Typical switches" className={inputClass} /><input value={opponent.threats} onChange={(e) => setOpponent({ ...opponent, threats: e.target.value })} placeholder="Threats" className={inputClass} /><input value={opponent.weaknesses} onChange={(e) => setOpponent({ ...opponent, weaknesses: e.target.value })} placeholder="Weaknesses" className={inputClass} /><textarea value={opponent.notes} onChange={(e) => setOpponent({ ...opponent, notes: e.target.value })} placeholder="Notes" className="min-h-24 rounded-md border border-ink/10 bg-mist p-3 text-sm outline-none" /><button onClick={addOpponent} className="h-10 rounded-md bg-ink text-sm font-bold text-white">Save notes</button></div></div><div className="grid gap-3 md:grid-cols-2">{data.opponentNotes.map((item) => <article key={item.id} className={panelClass}><h3 className="font-bold text-ink">{item.name}</h3><p className="mt-2 text-sm text-ink/60">{item.notes}</p><dl className="mt-3 space-y-1 text-xs"><div><dt className="font-bold text-ink">Leads</dt><dd className="text-ink/55">{item.commonLeads || "-"}</dd></div><div><dt className="font-bold text-ink">Threats</dt><dd className="text-ink/55">{item.threats || "-"}</dd></div></dl></article>)}</div></div> : <div className="grid gap-4 xl:grid-cols-[420px_1fr]"><div className={panelClass}><h3 className="font-bold text-ink">Save a team plan</h3><div className="mt-3 grid gap-2"><input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" className={inputClass} /><TeamEditor label="Team" names={team} options={pokemonNames} onChange={setTeam} /><textarea value={gameplan} onChange={(e) => setGameplan(e.target.value)} placeholder="Gameplan and win conditions" className="min-h-24 rounded-md border border-ink/10 bg-mist p-3 text-sm outline-none" /><button onClick={addTeam} className="h-10 rounded-md bg-ink text-sm font-bold text-white">Save team</button></div></div><div className="space-y-3">{data.teamNotes.map((item) => <article key={item.id} className={panelClass}><h3 className="font-bold text-ink">{item.name}</h3><div className="mt-3"><TeamPreview label="Roster" names={item.pokemon} lead="" side="my" /></div><p className="mt-3 text-sm text-ink/60">{item.gameplan}</p></article>)}</div></div>}</div>;
}

function JournalStatistics({ data }: { data: BattleJournalData }) {
  const stats = getBattleJournalStats(data);
  const byTeam = Array.from(new Set(stats.battles.map((battle) => battle.myTeam.join(" / ")))).map((team) => { const battles = stats.battles.filter((battle) => battle.myTeam.join(" / ") === team); return { label: team, games: battles.length, rate: Math.round(battles.filter((battle) => battle.outcome === "Win").length / battles.length * 100) }; }).sort((a, b) => b.games - a.games).slice(0, 8);
  const values = [["Overall win rate", `${stats.winRate}%`], ["Record", stats.record], ["Average length", stats.battles.length ? `${Math.round(stats.battles.reduce((sum, battle) => sum + battle.currentTurn, 0) / stats.battles.length)} turns` : "-"], ["Most common mistake", stats.commonMistake[0]]];
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{values.map(([label, value]) => <div key={label} className={panelClass}><p className="text-xs font-bold uppercase text-ink/45">{label}</p><p className="mt-2 text-xl font-black text-ink">{value}</p></div>)}</div><div className={panelClass}><h3 className="font-bold text-ink">Win rate by team</h3><div className="mt-4 space-y-3">{byTeam.map((item) => <div key={item.label}><div className="flex justify-between gap-3 text-sm"><span className="truncate font-bold text-ink">{item.label}</span><span className="shrink-0 text-ink/55">{item.rate}% · {item.games} games</span></div><div className="mt-1 h-2 overflow-hidden rounded bg-mist"><div className="h-full bg-emerald-600" style={{ width: `${item.rate}%` }} /></div></div>)}{byTeam.length === 0 ? <p className="text-sm text-ink/50">Statistics grow as you complete battles.</p> : null}</div></div><div className={panelClass}><h3 className="font-bold text-ink">Insight engine</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{buildBattleInsights(data).map((insight) => <p key={insight} className="rounded-md bg-skyglass p-3 text-sm text-ink/70">{insight}</p>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-ink/40"><BookOpen className="h-4 w-4" />Future AI analysis will use this same structured battle history.</p></div></div>;
}
