"use client";

import { emptyBattleJournal, type BattleJournalData } from "@/lib/pokemon/battle-journal-types";

const storageKey = "owen-hub-pokemon-battle-journal-v1";

export function loadBattleJournalLocal(): BattleJournalData {
  if (typeof window === "undefined") return emptyBattleJournal;
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as BattleJournalData : emptyBattleJournal;
  } catch { return emptyBattleJournal; }
}

export function saveBattleJournalLocal(data: BattleJournalData) {
  window.localStorage.setItem(storageKey, JSON.stringify(data));
}
