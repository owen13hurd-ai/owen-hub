"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

import { buildStarterRange } from "@/lib/poker/ranges";
import type { PokerGameType, PokerPosition, PreflopAction, RangeCell, StackDepth } from "@/lib/poker/types";

const games: PokerGameType[] = ["Cash", "Tournament"];
const depths: StackDepth[] = [20, 40, 60, 100, 200];
const positions: PokerPosition[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const actions: PreflopAction[] = ["Open", "3-Bet", "4-Bet", "Call", "Defend"];

const cellStyles: Record<RangeCell["action"], string> = {
  Raise: "bg-emerald-500 text-white",
  Mix: "bg-sky-500 text-white",
  Call: "bg-amber-300 text-amber-950",
  Fold: "bg-rose-100 text-rose-800",
};

function Select<T extends string | number>({ label, options, value, onChange }: {
  label: string; options: readonly T[]; value: T; onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold text-ink/55">
      {label}
      <select value={value} onChange={(event) => onChange(options.find((option) => String(option) === event.target.value) ?? value)}
        className="h-10 rounded-md border border-ink/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-moss">
        {options.map((option) => <option key={option} value={option}>{option}{label === "Stack" ? "bb" : ""}</option>)}
      </select>
    </label>
  );
}

export function OpeningRangeViewer({ onStudy }: { onStudy: () => void }) {
  const [gameType, setGameType] = useState<PokerGameType>("Cash");
  const [stackDepth, setStackDepth] = useState<StackDepth>(100);
  const [position, setPosition] = useState<PokerPosition>("BTN");
  const [action, setAction] = useState<PreflopAction>("Open");
  const [selected, setSelected] = useState<RangeCell | null>(null);
  const cells = useMemo(() => buildStarterRange({ action, gameType, position, stackDepth }), [action, gameType, position, stackDepth]);
  const active = selected ?? cells[0];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Opening Ranges</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Preflop range viewer</h2>
          <p className="mt-1 text-sm text-ink/55">Starter study estimates. Importable solver ranges can replace this data later.</p>
        </div>
        <button type="button" onClick={onStudy} className="h-10 rounded-md bg-ink px-4 text-sm font-bold text-white">Mark studied</button>
      </div>
      <div className="grid gap-3 rounded-lg border border-ink/10 bg-mist p-3 sm:grid-cols-2 xl:grid-cols-5">
        <Select label="Game" options={games} value={gameType} onChange={setGameType} />
        <Select label="Stack" options={depths} value={stackDepth} onChange={setStackDepth} />
        <Select label="Position" options={positions} value={position} onChange={setPosition} />
        <Select label="Action" options={actions} value={action} onChange={setAction} />
        <div className="rounded-md bg-white px-3 py-2 text-sm">
          <p className="text-xs font-bold text-ink/45">Selected hand</p>
          <p className="font-bold text-ink">{active.hand} · {active.action}</p>
          <p className="text-ink/55">{active.frequency}% frequency</p>
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div
          className="grid w-[520px] gap-0.5"
          style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
          role="grid"
          aria-label={`${position} ${action} range`}
        >
          {cells.map((cell) => (
            <button key={cell.hand} type="button" onMouseEnter={() => setSelected(cell)} onFocus={() => setSelected(cell)} onClick={() => setSelected(cell)}
              title={`${cell.hand}: ${cell.action} ${cell.frequency}%`}
              className={clsx("aspect-square rounded-sm text-[10px] font-extrabold transition hover:ring-2 hover:ring-ink focus:outline-none focus:ring-2 focus:ring-ink", cellStyles[cell.action])}>
              {cell.hand}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs font-bold text-ink/60">
        {Object.entries(cellStyles).map(([label, style]) => <span key={label} className="inline-flex items-center gap-1.5"><span className={clsx("h-3 w-3 rounded-sm", style)} />{label}</span>)}
      </div>
    </section>
  );
}
