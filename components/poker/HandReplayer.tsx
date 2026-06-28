"use client";

import { ChevronLeft, ChevronRight, Download, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { loadPokerData, pokerStorageKeys, savePokerData } from "@/lib/poker/storage";
import { phhToReplay, replayToPhh, type PokerReplay, type ReplayAction, type ReplayActionType, type ReplayStreet } from "@/lib/poker/phh";

const inputClass = "h-10 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-moss";
const streets: ReplayStreet[] = ["Preflop", "Flop", "Turn", "River", "Showdown"];
const actionTypes: ReplayActionType[] = ["Check / Call", "Bet / Raise to", "Fold", "Show / Muck"];

function blankReplay(): PokerReplay {
  return {
    actions: [], bigBlind: 2, board: [], heroCards: "AsKh", id: `${Date.now()}`,
    players: ["Hero", "Villain"], savedAt: new Date().toISOString(), smallBlind: 1,
    startingStacks: [200, 200], title: "New cash hand", villainCards: "????",
  };
}

function parseCards(value: string) {
  return value.replace(/\s/g, "").match(/.{2}/g) ?? [];
}

function Card({ value }: { value?: string }) {
  const red = value?.endsWith("h") || value?.endsWith("d");
  return <span className={clsx("inline-flex h-14 w-10 items-center justify-center rounded-md border bg-white text-lg font-black shadow-sm", value ? red ? "text-rose-600" : "text-zinc-950" : "border-dashed text-zinc-300")}>{value || "?"}</span>;
}

export function HandReplayer() {
  const [replay, setReplay] = useState<PokerReplay>(blankReplay);
  const [saved, setSaved] = useState<PokerReplay[]>(() => loadPokerData(pokerStorageKeys.replays, []));
  const [cursor, setCursor] = useState(0);
  const [draft, setDraft] = useState<Omit<ReplayAction, "id">>({ actor: "Hero", street: "Preflop", type: "Check / Call" });
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const phh = useMemo(() => replayToPhh(replay), [replay]);
  const visibleActions = replay.actions.slice(0, cursor);
  const visibleStreet = visibleActions.at(-1)?.street ?? "Preflop";
  const boardCount = visibleStreet === "Preflop" ? 0 : visibleStreet === "Flop" ? 3 : visibleStreet === "Turn" ? 4 : 5;
  const board = replay.board.slice(0, boardCount);

  function updateSaved(next: PokerReplay[]) {
    setSaved(next);
    savePokerData(pokerStorageKeys.replays, next);
  }

  function addAction() {
    const action = { ...draft, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    const actions = [...replay.actions, action];
    setReplay({ ...replay, actions });
    setCursor(actions.length);
  }

  function saveReplay() {
    const next = { ...replay, savedAt: new Date().toISOString() };
    updateSaved([next, ...saved.filter((item) => item.id !== next.id)]);
    setReplay(next);
    setMessage("Replay saved");
  }

  function download() {
    const blob = new Blob([phh], { type: "application/toml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${replay.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "poker-hand"}.phh`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importPhh() {
    try {
      const imported = phhToReplay(importText);
      setReplay(imported);
      setCursor(imported.actions.length);
      setMessage("PHH hand imported");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That PHH hand could not be imported.");
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">PokerKit bridge</p><h2 className="mt-1 text-xl font-bold text-ink">Hand replayer</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">Record and replay heads-up no-limit hold&apos;em hands in the open Poker Hand History format used by PokerKit.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => { setReplay(blankReplay()); setCursor(0); setMessage(""); }} className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/10 bg-white px-3 text-sm font-bold text-ink"><RotateCcw className="h-4 w-4" />New</button><button type="button" onClick={saveReplay} className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-bold text-white"><Save className="h-4 w-4" />Save</button></div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <div className="grid gap-2">
            <label className="text-xs font-bold text-ink/55">Hand title<input aria-label="Hand title" value={replay.title} onChange={(event) => setReplay({ ...replay, title: event.target.value })} className={`${inputClass} mt-1 w-full`} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-ink/55">Hero<input value={replay.players[0]} onChange={(event) => setReplay({ ...replay, players: [event.target.value, replay.players[1]] })} className={`${inputClass} mt-1 w-full`} /></label>
              <label className="text-xs font-bold text-ink/55">Villain<input value={replay.players[1]} onChange={(event) => setReplay({ ...replay, players: [replay.players[0], event.target.value] })} className={`${inputClass} mt-1 w-full`} /></label>
              <label className="text-xs font-bold text-ink/55">Hero cards<input value={replay.heroCards} onChange={(event) => setReplay({ ...replay, heroCards: event.target.value })} placeholder="AsKh" className={`${inputClass} mt-1 w-full`} /></label>
              <label className="text-xs font-bold text-ink/55">Villain cards<input value={replay.villainCards} onChange={(event) => setReplay({ ...replay, villainCards: event.target.value })} placeholder="????" className={`${inputClass} mt-1 w-full`} /></label>
            </div>
            <label className="text-xs font-bold text-ink/55">Board<input aria-label="Board cards" value={replay.board.join("")} onChange={(event) => setReplay({ ...replay, board: parseCards(event.target.value).slice(0, 5) })} placeholder="Qs7h2cTd9s" className={`${inputClass} mt-1 w-full`} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-ink/55">Hero stack<input type="number" value={replay.startingStacks[0]} onChange={(event) => setReplay({ ...replay, startingStacks: [Number(event.target.value), replay.startingStacks[1]] })} className={`${inputClass} mt-1 w-full`} /></label>
              <label className="text-xs font-bold text-ink/55">Villain stack<input type="number" value={replay.startingStacks[1]} onChange={(event) => setReplay({ ...replay, startingStacks: [replay.startingStacks[0], Number(event.target.value)] })} className={`${inputClass} mt-1 w-full`} /></label>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">Add action</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select value={draft.street} onChange={(event) => setDraft({ ...draft, street: event.target.value as ReplayStreet })} className={inputClass}>{streets.map((street) => <option key={street}>{street}</option>)}</select>
              <select value={draft.actor} onChange={(event) => setDraft({ ...draft, actor: event.target.value as ReplayAction["actor"] })} className={inputClass}><option>Hero</option><option>Villain</option></select>
              <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as ReplayActionType })} className={`${inputClass} col-span-2`}>{actionTypes.map((type) => <option key={type}>{type}</option>)}</select>
              {draft.type === "Bet / Raise to" && <input aria-label="Raise to amount" type="number" value={draft.amount ?? ""} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} placeholder="Raise to" className={inputClass} />}
              <button type="button" onClick={addAction} className={clsx("inline-flex h-10 items-center justify-center gap-2 rounded-md bg-moss px-3 text-sm font-bold text-white", draft.type !== "Bet / Raise to" && "col-span-2")}><Plus className="h-4 w-4" />Add action</button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-lg bg-emerald-950 text-white shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">{visibleStreet}</p><h3 className="mt-1 font-bold">{replay.title}</h3></div><p className="text-sm text-white/60">Action {cursor} of {replay.actions.length}</p></div>
            <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div><p className="text-xs font-bold uppercase text-white/50">{replay.players[0]}</p><div className="mt-2 flex gap-2">{parseCards(replay.heroCards).map((card, index) => <Card key={`${card}-${index}`} value={card} />)}</div><p className="mt-2 text-xs text-white/55">Started {replay.startingStacks[0]}</p></div>
              <div className="flex gap-2">{Array.from({ length: 5 }, (_, index) => <Card key={index} value={board[index]} />)}</div>
              <div className="sm:text-right"><p className="text-xs font-bold uppercase text-white/50">{replay.players[1]}</p><div className="mt-2 flex gap-2 sm:justify-end">{parseCards(replay.villainCards).map((card, index) => <Card key={`${card}-${index}`} value={card} />)}</div><p className="mt-2 text-xs text-white/55">Started {replay.startingStacks[1]}</p></div>
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-white/10 p-3"><button aria-label="Previous action" onClick={() => setCursor(Math.max(0, cursor - 1))} disabled={cursor === 0} className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/10 disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button><button aria-label="Next action" onClick={() => setCursor(Math.min(replay.actions.length, cursor + 1))} disabled={cursor === replay.actions.length} className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/10 disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button></div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <div className="max-h-64 space-y-1 overflow-y-auto">{replay.actions.map((action, index) => <div key={action.id} className={clsx("flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm", index === cursor - 1 ? "bg-ink text-white" : "bg-mist text-ink")}><span><strong>{action.street}</strong> · {action.actor} {action.type}{action.amount ? ` ${action.amount}` : ""}</span><button aria-label={`Delete action ${index + 1}`} onClick={() => { const actions = replay.actions.filter((item) => item.id !== action.id); setReplay({ ...replay, actions }); setCursor(Math.min(cursor, actions.length)); }} className="shrink-0"><Trash2 className="h-4 w-4" /></button></div>)}{replay.actions.length === 0 && <p className="rounded-md bg-mist p-4 text-sm text-ink/55">Add the first action to begin the replay.</p>}</div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-moss">Portable history</p><h3 className="mt-1 font-bold text-ink">PokerKit PHH export</h3></div><button type="button" onClick={download} className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-xs font-bold text-white"><Download className="h-4 w-4" />Export</button></div><textarea readOnly value={phh} className="mt-3 h-56 w-full resize-none rounded-md bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-100" /></section>
        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.1em] text-moss">Import</p><h3 className="mt-1 font-bold text-ink">Open a PHH hand</h3><textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste PHH text here" className="mt-3 h-40 w-full resize-none rounded-md border border-ink/10 bg-mist p-3 font-mono text-xs leading-5 text-ink outline-none focus:border-moss" /><button type="button" onClick={importPhh} disabled={!importText.trim()} className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-bold text-white disabled:opacity-40"><Upload className="h-4 w-4" />Import PHH</button>{message && <p aria-live="polite" className="mt-2 text-sm font-semibold text-moss">{message}</p>}</section>
      </div>

      {saved.length > 0 && <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.1em] text-moss">Saved replays</p><div className="mt-3 grid gap-2 md:grid-cols-2">{saved.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-mist p-3"><button type="button" onClick={() => { setReplay(item); setCursor(item.actions.length); }} className="min-w-0 text-left"><span className="block truncate font-bold text-ink">{item.title}</span><span className="text-xs text-ink/50">{item.actions.length} actions · {new Date(item.savedAt).toLocaleDateString()}</span></button><button aria-label={`Delete ${item.title}`} onClick={() => updateSaved(saved.filter((savedItem) => savedItem.id !== item.id))} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div></section>}
    </div>
  );
}
