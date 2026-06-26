"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

type TradeIdeaStatus = "Idea" | "Ask Around" | "Sent" | "Accepted" | "Dead";

type TradeIdea = {
  give: string;
  id: string;
  league: string;
  notes: string;
  status: TradeIdeaStatus;
  targetManager: string;
  want: string;
};

const storageKey = "owen-hub-dynasty-trade-ideas";
const statuses: ("All" | TradeIdeaStatus)[] = [
  "All",
  "Idea",
  "Ask Around",
  "Sent",
  "Accepted",
  "Dead",
];

const emptyIdea: Omit<TradeIdea, "id"> = {
  give: "",
  league: "",
  notes: "",
  status: "Idea",
  targetManager: "",
  want: "",
};

function getIdeasFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(storageKey);
    const parsedIdeas = savedValue ? (JSON.parse(savedValue) as TradeIdea[]) : [];

    return Array.isArray(parsedIdeas) ? parsedIdeas : [];
  } catch {
    return [];
  }
}

function getStatusClass(status: TradeIdeaStatus) {
  if (status === "Accepted") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (status === "Sent") {
    return "bg-sky-50 text-sky-800 ring-sky-200";
  }

  if (status === "Ask Around") {
    return "bg-violet-50 text-violet-800 ring-violet-200";
  }

  if (status === "Dead") {
    return "bg-rose-50 text-rose-800 ring-rose-200";
  }

  return "bg-amber-50 text-amber-800 ring-amber-200";
}

export function TradeIdeaNotebook() {
  const [draft, setDraft] = useState(emptyIdea);
  const [ideas, setIdeas] = useState<TradeIdea[]>(getIdeasFromStorage);
  const [statusFilter, setStatusFilter] = useState<"All" | TradeIdeaStatus>("All");

  const visibleIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      return statusFilter === "All" || idea.status === statusFilter;
    });
  }, [ideas, statusFilter]);

  function updateIdeas(nextIdeas: TradeIdea[]) {
    setIdeas(nextIdeas);
    window.localStorage.setItem(storageKey, JSON.stringify(nextIdeas));
  }

  function addIdea() {
    if (!draft.want.trim() && !draft.give.trim()) {
      return;
    }

    updateIdeas([
      {
        ...draft,
        id: `${Date.now()}`,
      },
      ...ideas,
    ]);
    setDraft(emptyIdea);
  }

  function updateIdea(ideaId: string, updates: Partial<TradeIdea>) {
    updateIdeas(
      ideas.map((idea) => {
        return idea.id === ideaId ? { ...idea, ...updates } : idea;
      }),
    );
  }

  function deleteIdea(ideaId: string) {
    updateIdeas(ideas.filter((idea) => idea.id !== ideaId));
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
            Trade Notebook
          </p>
          <h2 className="mt-1 text-lg font-bold text-ink">Idea parking lot</h2>
          <div className="mt-4 grid gap-2">
            <input
              value={draft.want}
              onChange={(event) => setDraft({ ...draft, want: event.target.value })}
              placeholder="I want"
              className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <input
              value={draft.give}
              onChange={(event) => setDraft({ ...draft, give: event.target.value })}
              placeholder="I would give"
              className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={draft.league}
                onChange={(event) =>
                  setDraft({ ...draft, league: event.target.value })
                }
                placeholder="League"
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
              />
              <input
                value={draft.targetManager}
                onChange={(event) =>
                  setDraft({ ...draft, targetManager: event.target.value })
                }
                placeholder="Manager"
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
              />
            </div>
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              placeholder="Angle"
              className="min-h-20 rounded-md border border-ink/10 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <button
              type="button"
              onClick={addIdea}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add idea
            </button>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  "h-8 rounded-md px-2 text-xs font-bold transition",
                  statusFilter === status
                    ? "bg-ink text-white"
                    : "bg-mist text-ink/65 hover:bg-skyglass hover:text-ink",
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {visibleIdeas.map((idea) => (
              <article key={idea.id} className="rounded-lg bg-mist p-3">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                      getStatusClass(idea.status),
                    )}
                  >
                    {idea.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteIdea(idea.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-ink/45 hover:bg-rose-50 hover:text-rose-700"
                    aria-label="Delete trade idea"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 grid gap-2">
                  <p className="text-sm font-bold text-ink">Want: {idea.want || "-"}</p>
                  <p className="text-sm font-bold text-ink">Give: {idea.give || "-"}</p>
                  <p className="text-xs font-semibold text-ink/50">
                    {idea.league || "No league"} · {idea.targetManager || "No manager"}
                  </p>
                  <select
                    value={idea.status}
                    onChange={(event) =>
                      updateIdea(idea.id, {
                        status: event.target.value as TradeIdeaStatus,
                      })
                    }
                    className="h-9 rounded-md border border-ink/10 bg-white px-2 text-xs font-bold text-ink"
                  >
                    {statuses.slice(1).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={idea.notes}
                    onChange={(event) =>
                      updateIdea(idea.id, { notes: event.target.value })
                    }
                    placeholder="Angle"
                    className="min-h-16 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                  />
                </div>
              </article>
            ))}
            {visibleIdeas.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink/20 bg-mist p-6 text-sm text-ink/55">
                No trade ideas in this view yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
