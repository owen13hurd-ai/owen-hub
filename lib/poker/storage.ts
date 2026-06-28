"use client";

export const pokerStorageKeys = {
  hands: "owen-hub-poker-hands",
  notes: "owen-hub-poker-notes",
  replays: "owen-hub-poker-replays",
  sessions: "owen-hub-poker-sessions",
  settings: "owen-hub-poker-settings",
  solutions: "owen-hub-poker-solutions",
} as const;

export function loadPokerData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function savePokerData<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
