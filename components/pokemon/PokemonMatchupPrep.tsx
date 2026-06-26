"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type MatchupNote = {
  archetype: string;
  gamePlan: string;
  id: string;
  keyMons: string;
  leadPlan: string;
  status: "Learning" | "Comfortable" | "Problem";
};

const storageKey = "owen-hub-pokemon-matchup-prep";
const emptyNote: Omit<MatchupNote, "id"> = {
  archetype: "",
  gamePlan: "",
  keyMons: "",
  leadPlan: "",
  status: "Learning",
};

function getNotesFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(storageKey);
    const parsedNotes = savedValue ? (JSON.parse(savedValue) as MatchupNote[]) : [];

    return Array.isArray(parsedNotes) ? parsedNotes : [];
  } catch {
    return [];
  }
}

function getStatusClass(status: MatchupNote["status"]) {
  if (status === "Comfortable") {
    return "bg-emerald-50 text-emerald-800";
  }

  if (status === "Problem") {
    return "bg-rose-50 text-rose-800";
  }

  return "bg-amber-50 text-amber-800";
}

export function PokemonMatchupPrep() {
  const [draft, setDraft] = useState(emptyNote);
  const [notes, setNotes] = useState<MatchupNote[]>(getNotesFromStorage);

  function updateNotes(nextNotes: MatchupNote[]) {
    setNotes(nextNotes);
    window.localStorage.setItem(storageKey, JSON.stringify(nextNotes));
  }

  function addNote() {
    if (!draft.archetype.trim()) {
      return;
    }

    updateNotes([
      {
        ...draft,
        archetype: draft.archetype.trim(),
        id: `${Date.now()}`,
      },
      ...notes,
    ]);
    setDraft(emptyNote);
  }

  function updateNote(noteId: string, updates: Partial<MatchupNote>) {
    updateNotes(
      notes.map((note) => {
        return note.id === noteId ? { ...note, ...updates } : note;
      }),
    );
  }

  function deleteNote(noteId: string) {
    updateNotes(notes.filter((note) => note.id !== noteId));
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
            Matchup Prep
          </p>
          <h2 className="mt-1 text-lg font-bold text-ink">
            Save plans by archetype
          </h2>
          <div className="mt-4 grid gap-2">
            <input
              value={draft.archetype}
              onChange={(event) =>
                setDraft({ ...draft, archetype: event.target.value })
              }
              placeholder="Archetype"
              className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <input
              value={draft.keyMons}
              onChange={(event) =>
                setDraft({ ...draft, keyMons: event.target.value })
              }
              placeholder="Key mons to respect"
              className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <input
              value={draft.leadPlan}
              onChange={(event) =>
                setDraft({ ...draft, leadPlan: event.target.value })
              }
              placeholder="Lead plan"
              className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <textarea
              value={draft.gamePlan}
              onChange={(event) =>
                setDraft({ ...draft, gamePlan: event.target.value })
              }
              placeholder="Game plan"
              className="min-h-24 rounded-md border border-ink/10 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={!draft.archetype.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add prep note
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {notes.map((note) => (
            <article key={note.id} className="rounded-lg bg-mist p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink">{note.archetype}</h3>
                  <select
                    value={note.status}
                    onChange={(event) =>
                      updateNote(note.id, {
                        status: event.target.value as MatchupNote["status"],
                      })
                    }
                    className={`mt-2 h-8 rounded-md border border-ink/10 px-2 text-xs font-bold ${getStatusClass(
                      note.status,
                    )}`}
                  >
                    <option value="Learning">Learning</option>
                    <option value="Comfortable">Comfortable</option>
                    <option value="Problem">Problem</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-ink/45 hover:bg-rose-50 hover:text-rose-700"
                  aria-label={`Delete ${note.archetype}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span className="font-bold text-ink">Key mons:</span>{" "}
                  <span className="text-ink/65">{note.keyMons || "-"}</span>
                </p>
                <p>
                  <span className="font-bold text-ink">Lead:</span>{" "}
                  <span className="text-ink/65">{note.leadPlan || "-"}</span>
                </p>
                <textarea
                  value={note.gamePlan}
                  onChange={(event) =>
                    updateNote(note.id, { gamePlan: event.target.value })
                  }
                  placeholder="Game plan"
                  className="min-h-20 w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                />
              </div>
            </article>
          ))}
          {notes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink/20 bg-mist p-6 text-sm text-ink/55">
              Add matchup notes for teams you keep running into.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
