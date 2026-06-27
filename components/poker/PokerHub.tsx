"use client";

import {
  BarChart3, BookOpen, Brain, CalendarCheck, FileSearch, Library, NotebookPen,
  Search, Settings2, Spade, Star, Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { HandTrainer } from "@/components/poker/HandTrainer";
import { OpeningRangeViewer } from "@/components/poker/OpeningRangeViewer";
import { defaultPokerSettings, pokerConcepts, trainingSpots } from "@/lib/poker/data";
import { loadPokerData, pokerStorageKeys, savePokerData } from "@/lib/poker/storage";
import type { HandHistory, PokerNote, PokerSettings, SolverSolution, StudySession, TrainingSpot } from "@/lib/poker/types";

type View = "Home" | "Ranges" | "Trainer" | "Daily" | "Concepts" | "Solver" | "Hands" | "Notes" | "Progress" | "Settings";

const views = [
  { icon: Spade, label: "Home" as const }, { icon: BookOpen, label: "Ranges" as const },
  { icon: Brain, label: "Trainer" as const }, { icon: CalendarCheck, label: "Daily" as const },
  { icon: Library, label: "Concepts" as const }, { icon: FileSearch, label: "Solver" as const },
  { icon: FileSearch, label: "Hands" as const }, { icon: NotebookPen, label: "Notes" as const },
  { icon: BarChart3, label: "Progress" as const }, { icon: Settings2, label: "Settings" as const },
];

const inputClass = "h-10 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-moss";
const panelClass = "rounded-lg border border-ink/10 bg-white p-4 shadow-soft";

function id() { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export function PokerHub() {
  const [view, setView] = useState<View>("Home");
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<StudySession[]>(() => loadPokerData(pokerStorageKeys.sessions, []));
  const [notes, setNotes] = useState<PokerNote[]>(() => loadPokerData(pokerStorageKeys.notes, []));
  const [hands, setHands] = useState<HandHistory[]>(() => loadPokerData(pokerStorageKeys.hands, []));
  const [solutions, setSolutions] = useState<SolverSolution[]>(() => loadPokerData(pokerStorageKeys.solutions, []));
  const [settings, setSettings] = useState<PokerSettings>(() => loadPokerData(pokerStorageKeys.settings, defaultPokerSettings));

  function record(module: StudySession["module"], referenceId: string, correct = true) {
    const next = [{ completedAt: new Date().toISOString(), correct, minutes: 2, module, referenceId }, ...sessions];
    setSessions(next); savePokerData(pokerStorageKeys.sessions, next);
  }
  function answer(spot: TrainingSpot, correct: boolean) { record(spot.id === trainingSpots[Math.floor(Date.now() / 86400000) % trainingSpots.length].id ? "Daily Spot" : "Hand Trainer", spot.id, correct); }
  function updateSettings(next: PokerSettings) { setSettings(next); savePokerData(pokerStorageKeys.settings, next); }

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [
      ...pokerConcepts.map((item) => ({ kind: "Concept", title: item.title, text: item.body, view: "Concepts" as View })),
      ...notes.map((item) => ({ kind: "Note", title: item.title, text: item.body, view: "Notes" as View })),
      ...hands.map((item) => ({ kind: "Hand", title: item.title, text: `${item.heroCards} ${item.board} ${item.notes}`, view: "Hands" as View })),
      ...solutions.map((item) => ({ kind: "Solution", title: item.title, text: `${item.description} ${item.tags.join(" ")}`, view: "Solver" as View })),
    ].filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(normalized)).slice(0, 8);
  }, [hands, notes, query, solutions]);

  return (
    <div className={clsx("space-y-5", settings.darkMode && "rounded-lg bg-zinc-900 p-4 text-white [&_.bg-white]:bg-zinc-800 [&_.text-ink]:text-zinc-50 [&_.text-ink\/55]:text-zinc-400 [&_.text-ink\/60]:text-zinc-300 [&_.text-ink\/65]:text-zinc-300 [&_.border-ink\/10]:border-white/10")}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-ink/35" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search poker notes, concepts, hands, and solutions" className={`${inputClass} w-full pl-9`} />
        {searchResults.length ? <div className="absolute z-20 mt-1 w-full rounded-md border border-ink/10 bg-white p-2 shadow-xl">{searchResults.map((result, index) => <button key={`${result.kind}-${result.title}-${index}`} type="button" onClick={() => { setView(result.view); setQuery(""); }} className="block w-full rounded-md px-3 py-2 text-left hover:bg-mist"><span className="text-xs font-bold text-moss">{result.kind}</span><span className="ml-2 text-sm font-bold text-ink">{result.title}</span></button>)}</div> : null}
      </div>

      <nav aria-label="Poker Hub sections" className="flex gap-1 overflow-x-auto border-b border-ink/10">
        {views.map(({ icon: Icon, label }) => <button key={label} type="button" onClick={() => setView(label)} className={clsx("inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-bold transition", view === label ? "border-moss text-ink" : "border-transparent text-ink/50 hover:text-ink")}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>

      {view === "Home" ? <Dashboard sessions={sessions} dailyGoal={settings.dailyGoal} open={setView} /> : null}
      {view === "Ranges" ? <div className={panelClass}><OpeningRangeViewer onStudy={() => record("Range", "starter-range")} /></div> : null}
      {view === "Trainer" ? <div className={panelClass}><HandTrainer onAnswer={answer} /></div> : null}
      {view === "Daily" ? <div className={panelClass}><HandTrainer daily onAnswer={answer} /></div> : null}
      {view === "Concepts" ? <ConceptLibrary onLearn={(conceptId) => record("Concept", conceptId)} /> : null}
      {view === "Solver" ? <SolverLibrary items={solutions} setItems={(next) => { setSolutions(next); savePokerData(pokerStorageKeys.solutions, next); }} /> : null}
      {view === "Hands" ? <HandLibrary items={hands} setItems={(next) => { setHands(next); savePokerData(pokerStorageKeys.hands, next); }} /> : null}
      {view === "Notes" ? <NoteLibrary items={notes} setItems={(next) => { setNotes(next); savePokerData(pokerStorageKeys.notes, next); }} /> : null}
      {view === "Progress" ? <Progress sessions={sessions} /> : null}
      {view === "Settings" ? <Settings settings={settings} update={updateSettings} /> : null}
    </div>
  );
}

function Dashboard({ sessions, dailyGoal, open }: { sessions: StudySession[]; dailyGoal: number; open: (view: View) => void }) {
  const today = new Date().toDateString();
  const todayCount = sessions.filter((session) => new Date(session.completedAt).toDateString() === today).length;
  const modules = [
    ["Ranges", "Study position-by-position preflop decisions", BookOpen], ["Trainer", "Practice decisions and receive instant feedback", Brain],
    ["Daily", "Complete today's hand and keep your streak", CalendarCheck], ["Concepts", "Build a searchable poker fundamentals library", Library],
    ["Hands", "Save difficult hands for deliberate review", FileSearch], ["Notes", "Keep strategy ideas organized and searchable", NotebookPen],
  ] as const;
  return <div className="space-y-5"><div className="grid gap-4 lg:grid-cols-[1fr_300px]"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Poker Hub</p><h2 className="mt-1 text-2xl font-bold text-ink">Your poker study desk</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">Study ranges, test decisions, and build a review library that gets more useful with every session.</p></div><div className="rounded-lg bg-ink p-4 text-white"><p className="text-xs font-bold uppercase text-white/55">Daily goal</p><p className="mt-1 text-2xl font-black">{todayCount} / {dailyGoal}</p><div className="mt-3 h-2 overflow-hidden rounded bg-white/15"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, todayCount / dailyGoal * 100)}%` }} /></div></div></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{modules.map(([label, description, Icon]) => <button key={label} type="button" onClick={() => open(label)} className={`${panelClass} text-left transition hover:border-moss`}><Icon className="h-5 w-5 text-moss" /><h3 className="mt-4 font-bold text-ink">{label}</h3><p className="mt-1 text-sm leading-5 text-ink/55">{description}</p></button>)}</div></div>;
}

function ConceptLibrary({ onLearn }: { onLearn: (id: string) => void }) {
  const [query, setQuery] = useState(""); const [selected, setSelected] = useState(pokerConcepts[0]);
  const visible = pokerConcepts.filter((item) => `${item.title} ${item.body} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="grid gap-4 lg:grid-cols-[320px_1fr]"><section className={panelClass}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search concepts" className={`${inputClass} w-full`} /><div className="mt-3 max-h-[520px] space-y-1 overflow-y-auto">{visible.map((item) => <button key={item.id} onClick={() => setSelected(item)} className={clsx("w-full rounded-md p-3 text-left", selected.id === item.id ? "bg-ink text-white" : "bg-mist text-ink")}><span className="text-xs font-bold opacity-60">{item.category}</span><span className="block font-bold">{item.title}</span></button>)}</div></section><article className={panelClass}><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">{selected.category}</p><h2 className="mt-2 text-2xl font-bold text-ink">{selected.title}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-ink/65">{selected.body}</p><div className="mt-6 rounded-md bg-mist p-4 text-sm leading-6 text-ink/60"><strong className="text-ink">Study prompt:</strong> Find one hand from your last session where this concept changed the best action.</div><button type="button" onClick={() => onLearn(selected.id)} className="mt-5 h-10 rounded-md bg-ink px-4 text-sm font-bold text-white">Mark learned</button></article></div>;
}

function SolverLibrary({ items, setItems }: { items: SolverSolution[]; setItems: (items: SolverSolution[]) => void }) {
  const [title, setTitle] = useState(""); const [folder, setFolder] = useState("General");
  function add() { if (!title.trim()) return; setItems([{ id: id(), title: title.trim(), description: "", gameType: "Cash", stackDepth: 100, positions: "", board: "", solverName: "", dateAdded: new Date().toISOString(), notes: "", tags: [], folder, favorite: false }, ...items]); setTitle(""); }
  return <LibraryShell eyebrow="Solver Library" title="Saved solver studies" fields={<><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solution title" className={inputClass}/><input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Folder" className={inputClass}/><button onClick={add} className="h-10 rounded-md bg-ink px-4 text-sm font-bold text-white">Add solution</button></>} empty="No solver studies saved yet.">{items.map((item) => <SavedRow key={item.id} title={item.title} detail={`${item.folder} · ${item.gameType} · ${item.stackDepth}bb`} favorite={item.favorite} onFavorite={() => setItems(items.map((value) => value.id === item.id ? { ...value, favorite: !value.favorite } : value))} onDelete={() => setItems(items.filter((value) => value.id !== item.id))}/>)}</LibraryShell>;
}

function HandLibrary({ items, setItems }: { items: HandHistory[]; setItems: (items: HandHistory[]) => void }) {
  const [title, setTitle] = useState(""); const [cards, setCards] = useState("");
  function add() { if (!title.trim()) return; setItems([{ id: id(), title: title.trim(), heroCards: cards, villainPosition: "BTN", board: "", actionHistory: "", result: "", notes: "", tags: [], difficulty: "Medium", status: "New" }, ...items]); setTitle(""); setCards(""); }
  return <LibraryShell eyebrow="Hand History" title="Hands to review" fields={<><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hand title" className={inputClass}/><input value={cards} onChange={(e) => setCards(e.target.value)} placeholder="Hero cards (As Kh)" className={inputClass}/><button onClick={add} className="h-10 rounded-md bg-ink px-4 text-sm font-bold text-white">Save hand</button></>} empty="No hands saved yet.">{items.map((item) => <SavedRow key={item.id} title={item.title} detail={`${item.heroCards || "Cards not entered"} · ${item.status}`} onDelete={() => setItems(items.filter((value) => value.id !== item.id))}/>)}</LibraryShell>;
}

function NoteLibrary({ items, setItems }: { items: PokerNote[]; setItems: (items: PokerNote[]) => void }) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  function add() { if (!title.trim()) return; setItems([{ id: id(), title: title.trim(), body, folder: "General", pinned: false, tags: [], createdAt: new Date().toISOString() }, ...items]); setTitle(""); setBody(""); }
  return <LibraryShell eyebrow="Poker Notes" title="Strategy notebook" fields={<><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className={inputClass}/><input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Idea or observation" className={inputClass}/><button onClick={add} className="h-10 rounded-md bg-ink px-4 text-sm font-bold text-white">Save note</button></>} empty="No poker notes yet.">{items.map((item) => <SavedRow key={item.id} title={item.title} detail={item.body || "Empty note"} favorite={item.pinned} onFavorite={() => setItems(items.map((value) => value.id === item.id ? { ...value, pinned: !value.pinned } : value))} onDelete={() => setItems(items.filter((value) => value.id !== item.id))}/>)}</LibraryShell>;
}

function LibraryShell({ eyebrow, title, fields, empty, children }: { eyebrow: string; title: string; fields: React.ReactNode; empty: string; children: React.ReactNode }) { return <section className={panelClass}><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-ink">{title}</h2><div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">{fields}</div><div className="mt-5 space-y-2">{children || <p className="rounded-md bg-mist p-4 text-sm text-ink/55">{empty}</p>}</div></section>; }
function SavedRow({ title, detail, favorite, onFavorite, onDelete }: { title: string; detail: string; favorite?: boolean; onFavorite?: () => void; onDelete: () => void }) { return <article className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-mist p-3"><div className="min-w-0"><h3 className="font-bold text-ink">{title}</h3><p className="truncate text-sm text-ink/55">{detail}</p></div><div className="flex shrink-0 gap-1">{onFavorite ? <button onClick={onFavorite} aria-label="Favorite" className={clsx("inline-flex h-9 w-9 items-center justify-center rounded-md", favorite ? "bg-amber-100 text-amber-700" : "bg-white text-ink/40")}><Star className="h-4 w-4" fill={favorite ? "currentColor" : "none"}/></button> : null}<button onClick={onDelete} aria-label="Delete" className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-rose-600"><Trash2 className="h-4 w-4"/></button></div></article>; }

function Progress({ sessions }: { sessions: StudySession[] }) {
  const correct = sessions.filter((item) => item.correct).length; const accuracy = sessions.length ? Math.round(correct / sessions.length * 100) : 0;
  const stats = [["Hands studied", sessions.length], ["Accuracy", `${accuracy}%`], ["Study time", `${sessions.reduce((sum, item) => sum + item.minutes, 0)} min`], ["Concepts learned", new Set(sessions.filter((item) => item.module === "Concept").map((item) => item.referenceId)).size]];
  return <section className={panelClass}><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Progress</p><h2 className="mt-1 text-xl font-bold text-ink">Study performance</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-md bg-mist p-4"><p className="text-xs font-bold uppercase text-ink/45">{label}</p><p className="mt-2 text-2xl font-black text-ink">{value}</p></div>)}</div><div className="mt-5 space-y-2">{sessions.slice(0, 8).map((session, index) => <div key={`${session.completedAt}-${index}`} className="flex justify-between rounded-md border border-ink/10 px-3 py-2 text-sm"><span className="font-bold text-ink">{session.module}</span><span className="text-ink/55">{session.correct ? "Correct" : "Review"} · {new Date(session.completedAt).toLocaleDateString()}</span></div>)}</div></section>;
}

function Settings({ settings, update }: { settings: PokerSettings; update: (settings: PokerSettings) => void }) {
  return <section className={`${panelClass} max-w-3xl`}><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Settings</p><h2 className="mt-1 text-xl font-bold text-ink">Study preferences</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-bold text-ink">Preferred game<select value={settings.preferredGame} onChange={(e) => update({ ...settings, preferredGame: e.target.value as PokerSettings["preferredGame"] })} className={inputClass}><option>Cash</option><option>Tournament</option></select></label><label className="grid gap-1 text-sm font-bold text-ink">Daily goal<input type="number" min="1" value={settings.dailyGoal} onChange={(e) => update({ ...settings, dailyGoal: Number(e.target.value) || 1 })} className={inputClass}/></label><label className="grid gap-1 text-sm font-bold text-ink">Preferred stakes<input value={settings.preferredStakes} onChange={(e) => update({ ...settings, preferredStakes: e.target.value })} className={inputClass}/></label><label className="grid gap-1 text-sm font-bold text-ink">Difficulty<select value={settings.difficulty} onChange={(e) => update({ ...settings, difficulty: e.target.value as PokerSettings["difficulty"] })} className={inputClass}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div><label className="mt-5 flex items-center justify-between rounded-md bg-mist p-3 text-sm font-bold text-ink">Dark poker workspace<input type="checkbox" checked={settings.darkMode} onChange={(e) => update({ ...settings, darkMode: e.target.checked })} className="h-5 w-5 accent-emerald-700"/></label></section>;
}
