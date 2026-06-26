"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type CompanyResearchNote = {
  company: string;
  id: string;
  mission: string;
  people: string;
  questions: string;
  roleFit: string;
};

const storageKey = "owen-hub-company-research";
const emptyNote: Omit<CompanyResearchNote, "id"> = {
  company: "",
  mission: "",
  people: "",
  questions: "",
  roleFit: "",
};

function getNotesFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(storageKey);
    const parsedNotes = savedValue
      ? (JSON.parse(savedValue) as CompanyResearchNote[])
      : [];

    return Array.isArray(parsedNotes) ? parsedNotes : [];
  } catch {
    return [];
  }
}

export function CompanyResearchBoard() {
  const [draft, setDraft] = useState(emptyNote);
  const [notes, setNotes] = useState<CompanyResearchNote[]>(getNotesFromStorage);

  function updateNotes(nextNotes: CompanyResearchNote[]) {
    setNotes(nextNotes);
    window.localStorage.setItem(storageKey, JSON.stringify(nextNotes));
  }

  function addNote() {
    if (!draft.company.trim()) {
      return;
    }

    updateNotes([
      {
        ...draft,
        company: draft.company.trim(),
        id: `${Date.now()}`,
      },
      ...notes,
    ]);
    setDraft(emptyNote);
  }

  function updateNote(noteId: string, updates: Partial<CompanyResearchNote>) {
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
            Company Research
          </p>
          <h2 className="mt-1 text-lg font-bold text-ink">
            Interview prep notes
          </h2>
          <div className="mt-4 grid gap-2">
            <input
              value={draft.company}
              onChange={(event) =>
                setDraft({ ...draft, company: event.target.value })
              }
              placeholder="Company"
              className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <textarea
              value={draft.roleFit}
              onChange={(event) =>
                setDraft({ ...draft, roleFit: event.target.value })
              }
              placeholder="Why this role fits"
              className="min-h-20 rounded-md border border-ink/10 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <textarea
              value={draft.questions}
              onChange={(event) =>
                setDraft({ ...draft, questions: event.target.value })
              }
              placeholder="Questions to ask"
              className="min-h-20 rounded-md border border-ink/10 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={!draft.company.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add company
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {notes.map((note) => (
            <article key={note.id} className="rounded-lg bg-mist p-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-ink">{note.company}</h3>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-ink/45 hover:bg-rose-50 hover:text-rose-700"
                  aria-label={`Delete ${note.company}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                <textarea
                  value={note.roleFit}
                  onChange={(event) =>
                    updateNote(note.id, { roleFit: event.target.value })
                  }
                  placeholder="Why this role fits"
                  className="min-h-16 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                />
                <textarea
                  value={note.mission}
                  onChange={(event) =>
                    updateNote(note.id, { mission: event.target.value })
                  }
                  placeholder="Mission or product notes"
                  className="min-h-16 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                />
                <textarea
                  value={note.people}
                  onChange={(event) =>
                    updateNote(note.id, { people: event.target.value })
                  }
                  placeholder="People, recruiter, hiring manager"
                  className="min-h-16 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                />
                <textarea
                  value={note.questions}
                  onChange={(event) =>
                    updateNote(note.id, { questions: event.target.value })
                  }
                  placeholder="Questions to ask"
                  className="min-h-16 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                />
              </div>
            </article>
          ))}
          {notes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink/20 bg-mist p-6 text-sm text-ink/55">
              Add a company before an interview to keep your research in one place.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
