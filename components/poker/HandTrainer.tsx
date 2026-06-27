"use client";

import { CheckCircle2, ExternalLink, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { trainingSpots } from "@/lib/poker/data";
import { loadPokerBench } from "@/lib/poker/pokerbench";
import type { TrainingAction, TrainingSpot } from "@/lib/poker/types";

const dayNumber = Math.floor(new Date().getTime() / 86400000);

function CardFace({ card, empty = false }: { card?: string; empty?: boolean }) {
  const isRed = card?.includes("♥") || card?.includes("♦");

  return (
    <span
      aria-label={card || "Community card not dealt"}
      className={clsx(
        "inline-flex h-16 w-12 shrink-0 items-center justify-center rounded-md border text-xl font-black shadow-sm sm:h-20 sm:w-14 sm:text-2xl",
        empty
          ? "border-dashed border-white/30 bg-white/5 text-white/30 shadow-none"
          : "border-zinc-200 bg-white",
        !empty && (isRed ? "text-rose-600" : "text-zinc-950"),
      )}
    >
      {card || "?"}
    </span>
  );
}

function HeroCards({ cards }: { cards: string[] }) {
  return <div className="flex gap-2">{cards.map((card) => <CardFace key={card} card={card} />)}</div>;
}

function CommunityCards({ cards }: { cards: string[] }) {
  const board = Array.from({ length: 5 }, (_, index) => cards[index]);
  return (
    <div>
      <div className="flex gap-1.5 sm:gap-2">
        {board.map((card, index) => <CardFace key={`${index}-${card ?? "empty"}`} card={card} empty={!card} />)}
      </div>
      <p className="mt-2 text-xs font-semibold text-white/55">
        {cards.length === 0 ? "Preflop · board not dealt" : cards.length === 3 ? "Flop · turn and river to come" : cards.length === 4 ? "Turn · river to come" : "River"}
      </p>
    </div>
  );
}

export function HandTrainer({ daily = false, onAnswer }: { daily?: boolean; onAnswer: (spot: TrainingSpot, correct: boolean) => void }) {
  const [spots, setSpots] = useState(trainingSpots);
  const [spotIndex, setSpotIndex] = useState(daily ? dayNumber % trainingSpots.length : 4);
  const [answer, setAnswer] = useState<TrainingAction | null>(null);
  const [libraryStatus, setLibraryStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const spot = spots[spotIndex];

  useEffect(() => {
    let cancelled = false;
    void loadPokerBench()
      .then((library) => {
        if (cancelled || library.spots.length === 0) return;
        setSpots(library.spots);
        setSpotIndex(daily ? dayNumber % library.spots.length : 0);
        setAnswer(null);
        setLibraryStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setLibraryStatus("fallback");
      });
    return () => { cancelled = true; };
  }, [daily]);

  function choose(option: TrainingAction) {
    if (answer) return;
    setAnswer(option);
    onAnswer(spot, option === spot.optimalAction);
  }

  function next() {
    setAnswer(null);
    setSpotIndex((current) => daily ? current : (current + 1) % spots.length);
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">{daily ? "Spot of the Day" : "Hand Trainer"}</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{spot.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/55">
          <span>{spot.gameType} · {spot.stackSize} · {spot.difficulty}</span>
          {libraryStatus === "loading" ? <span className="inline-flex items-center gap-1 rounded-md bg-mist px-2 py-1 text-xs font-bold"><Loader2 className="h-3 w-3 animate-spin" />Loading PokerBench</span> : null}
          {spot.sourceUrl ? <a href={spot.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-skyglass px-2 py-1 text-xs font-bold text-ink">{spot.source}<ExternalLink className="h-3 w-3" /></a> : null}
          {libraryStatus === "ready" ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">11,000 verified labels</span> : null}
          {libraryStatus === "fallback" ? <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">Starter examples</span> : null}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg bg-emerald-900 p-5 text-white shadow-soft">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase text-white/60">Community cards</p>
              <div className="mt-2 overflow-x-auto pb-1"><CommunityCards cards={spot.board} /></div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-white/60">Your hand</p>
              <div className="mt-2"><HeroCards cards={spot.heroCards} /></div>
            </div>
          </div>
          <div className="mt-8 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-3">
            <div><p className="text-xs text-white/55">To act</p><p className="font-bold">{spot.playerToAct}</p></div>
            <div><p className="text-xs text-white/55">Previous action</p><p className="font-bold">{spot.previousAction}</p></div>
            <div><p className="text-xs text-white/55">Pot</p><p className="font-bold">{spot.potSize}</p></div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-ink">What is your action?</p>
          {spot.options.map((option) => (
            <button key={option} type="button" disabled={Boolean(answer)} onClick={() => choose(option)}
              className={clsx("flex h-11 w-full items-center justify-between rounded-md border px-3 text-sm font-bold transition",
                answer === option && option === spot.optimalAction ? "border-emerald-400 bg-emerald-50 text-emerald-900" :
                answer === option ? "border-rose-300 bg-rose-50 text-rose-900" : "border-ink/10 bg-white text-ink hover:border-moss")}>
              {option}{answer === option ? option === spot.optimalAction ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      </div>
      {answer ? (
        <div className="rounded-lg border border-ink/10 bg-mist p-4">
          <p className="font-bold text-ink">{answer === spot.optimalAction ? "Correct decision" : `Best action: ${spot.optimalAction}`}</p>
          <p className="mt-2 text-sm leading-6 text-ink/65">{spot.explanation}</p>
          {Object.keys(spot.frequencies).length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{Object.entries(spot.frequencies).map(([action, frequency]) => <span key={action} className="rounded-md bg-white px-2 py-1 text-xs font-bold text-ink/60">{action} {frequency}%</span>)}</div> : null}
          {spot.sourceNotes ? <p className="mt-3 rounded-md bg-white p-3 text-xs leading-5 text-ink/55">{spot.sourceNotes}</p> : null}
          {!daily ? <button type="button" onClick={next} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" />Next spot</button> : null}
        </div>
      ) : null}
    </section>
  );
}
