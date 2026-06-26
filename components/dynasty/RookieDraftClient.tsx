"use client";

import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { calculateRookieModelScore } from "@/lib/dynasty/rookies";
import type { RookiePosition, RookieProspect } from "@/types/rookies";

type DragState = {
  prospectId: string;
} | null;

const positions: ("ALL" | RookiePosition)[] = ["ALL", "QB", "RB", "WR", "TE"];
const tiers = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"];
const storageKey = "owen-hub-rookie-draft-board";

function getSavedProspects(fallbackProspects: RookieProspect[]) {
  if (typeof window === "undefined") {
    return fallbackProspects;
  }

  try {
    const savedValue = window.localStorage.getItem(storageKey);
    const parsedProspects = savedValue
      ? (JSON.parse(savedValue) as RookieProspect[])
      : null;

    return Array.isArray(parsedProspects) ? parsedProspects : fallbackProspects;
  } catch {
    return fallbackProspects;
  }
}

function clampScore(value: number) {
  return Math.min(Math.max(value, 0), 10);
}

function getModelLabel(score: number) {
  if (score >= 8.2) {
    return "Priority target";
  }

  if (score >= 7) {
    return "Strong profile";
  }

  if (score >= 5.8) {
    return "Worth digging";
  }

  if (score >= 4.5) {
    return "Needs discount";
  }

  return "Long shot";
}

function getModelClass(score: number) {
  if (score >= 8.2) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (score >= 7) {
    return "bg-sky-50 text-sky-800 ring-sky-200";
  }

  if (score >= 5.8) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }

  return "bg-rose-50 text-rose-800 ring-rose-200";
}

function getNewProspect(nextRank: number): RookieProspect {
  return {
    ageScore: 5,
    athleticScore: 5,
    draftCapitalScore: 5,
    id: `rookie-${Date.now()}`,
    landingSpotScore: 5,
    name: "New Prospect",
    notes: "",
    position: "WR",
    productionScore: 5,
    projectedPick: `${Math.ceil(nextRank / 12)}.${String(
      ((nextRank - 1) % 12) + 1,
    ).padStart(2, "0")}`,
    riskScore: 5,
    school: "",
    tier: "Tier 3",
  };
}

function reorderProspects(
  prospects: RookieProspect[],
  draggedId: string,
  targetId: string,
) {
  const draggedIndex = prospects.findIndex((prospect) => prospect.id === draggedId);
  const targetIndex = prospects.findIndex((prospect) => prospect.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return prospects;
  }

  const nextProspects = [...prospects];
  const [draggedProspect] = nextProspects.splice(draggedIndex, 1);
  nextProspects.splice(targetIndex, 0, draggedProspect);

  return nextProspects;
}

export function RookieDraftClient({
  initialProspects,
}: {
  initialProspects: RookieProspect[];
}) {
  const [dragState, setDragState] = useState<DragState>(null);
  const [position, setPosition] = useState<"ALL" | RookiePosition>("ALL");
  const [prospects, setProspects] = useState<RookieProspect[]>(() =>
    getSavedProspects(initialProspects),
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(prospects));
  }, [prospects]);

  const visibleProspects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return prospects.filter((prospect) => {
      const matchesPosition = position === "ALL" || prospect.position === position;
      const matchesQuery =
        !normalizedQuery ||
        prospect.name.toLowerCase().includes(normalizedQuery) ||
        prospect.school.toLowerCase().includes(normalizedQuery) ||
        prospect.notes.toLowerCase().includes(normalizedQuery);

      return matchesPosition && matchesQuery;
    });
  }, [position, prospects, query]);

  const modelLeaders = useMemo(() => {
    return [...prospects]
      .sort((firstProspect, secondProspect) => {
        return (
          calculateRookieModelScore(secondProspect) -
            calculateRookieModelScore(firstProspect) ||
          firstProspect.name.localeCompare(secondProspect.name)
        );
      })
      .slice(0, 5);
  }, [prospects]);

  const tierCounts = tiers.map((tier) => {
    return {
      count: prospects.filter((prospect) => prospect.tier === tier).length,
      tier,
    };
  });

  function updateProspect(
    prospectId: string,
    updates: Partial<RookieProspect>,
  ) {
    setProspects((currentProspects) => {
      return currentProspects.map((prospect) => {
        return prospect.id === prospectId ? { ...prospect, ...updates } : prospect;
      });
    });
  }

  function updateScore(
    prospectId: string,
    key:
      | "ageScore"
      | "athleticScore"
      | "draftCapitalScore"
      | "landingSpotScore"
      | "productionScore"
      | "riskScore",
    value: string,
  ) {
    updateProspect(prospectId, {
      [key]: clampScore(Number(value)),
    });
  }

  function addProspect() {
    setProspects((currentProspects) => [
      ...currentProspects,
      getNewProspect(currentProspects.length + 1),
    ]);
  }

  function deleteProspect(prospectId: string) {
    setProspects((currentProspects) =>
      currentProspects.filter((prospect) => prospect.id !== prospectId),
    );
  }

  function moveProspect(targetId: string) {
    if (!dragState || dragState.prospectId === targetId || position !== "ALL") {
      return;
    }

    setProspects((currentProspects) =>
      reorderProspects(currentProspects, dragState.prospectId, targetId),
    );
  }

  function resetBoard() {
    setProspects(initialProspects);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Prospects</p>
          <p className="mt-1 text-2xl font-bold text-ink">{prospects.length}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Top model score</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {modelLeaders[0]
              ? calculateRookieModelScore(modelLeaders[0]).toFixed(1)
              : "-"}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Tier 1</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {tierCounts.find((tier) => tier.tier === "Tier 1")?.count ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Saved</p>
          <p className="mt-1 text-sm font-bold text-ink">
            Saved in this browser
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Prospect Model
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Model leaders
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">
              Score inputs from 0-10. Draft capital and production matter most,
              while risk works as a penalty.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-5 lg:min-w-[520px]">
            {modelLeaders.map((prospect, index) => {
              const score = calculateRookieModelScore(prospect);

              return (
                <div key={prospect.id} className="rounded-md bg-mist p-3">
                  <p className="text-xs font-bold text-ink/45">#{index + 1}</p>
                  <p className="mt-1 truncate text-sm font-bold text-ink">
                    {prospect.name}
                  </p>
                  <p className="mt-1 text-xl font-bold text-moss">
                    {score.toFixed(1)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {positions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPosition(item)}
                className={clsx(
                  "h-9 rounded-md px-3 text-sm font-semibold transition",
                  position === item
                    ? "bg-ink text-white"
                    : "bg-mist text-ink/70 hover:bg-skyglass hover:text-ink",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search rookies"
              className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
            />
            <button
              type="button"
              onClick={addProspect}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add prospect
            </button>
            <button
              type="button"
              onClick={resetBoard}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/10 bg-white px-4 text-sm font-bold text-ink transition hover:bg-skyglass"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        {position !== "ALL" ? (
          <p className="mt-3 rounded-md bg-mist px-3 py-2 text-sm text-ink/55">
            Drag reordering is enabled on ALL so your main rookie board stays
            consistent across positions.
          </p>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-lg border border-ink/10">
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
              <thead className="bg-mist text-xs uppercase tracking-[0.08em] text-ink/55">
                <tr>
                  <th className="w-10 px-3 py-3" aria-label="Drag handle" />
                  <th className="px-3 py-3">Rank</th>
                  <th className="px-3 py-3">Prospect</th>
                  <th className="px-3 py-3">Pos</th>
                  <th className="px-3 py-3">Tier</th>
                  <th className="px-3 py-3">Pick</th>
                  <th className="px-3 py-3">Draft</th>
                  <th className="px-3 py-3">Prod</th>
                  <th className="px-3 py-3">Ath</th>
                  <th className="px-3 py-3">Age</th>
                  <th className="px-3 py-3">Landing</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3">Model</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3" aria-label="Delete" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {visibleProspects.map((prospect) => {
                  const rank =
                    prospects.findIndex((item) => item.id === prospect.id) + 1;
                  const score = calculateRookieModelScore(prospect);

                  return (
                    <tr
                      key={prospect.id}
                      draggable={position === "ALL"}
                      onDragStart={() =>
                        setDragState({ prospectId: prospect.id })
                      }
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => moveProspect(prospect.id)}
                      onDragEnd={() => setDragState(null)}
                      className={clsx(
                        "bg-white transition hover:bg-mist/70",
                        dragState?.prospectId === prospect.id && "opacity-40",
                      )}
                    >
                      <td className="px-3 py-3 text-ink/35">
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      </td>
                      <td className="px-3 py-3 font-semibold text-ink">
                        {rank}
                      </td>
                      <td className="px-3 py-3">
                        <div className="grid gap-1">
                          <input
                            value={prospect.name}
                            onChange={(event) =>
                              updateProspect(prospect.id, {
                                name: event.target.value,
                              })
                            }
                            className="h-8 min-w-44 rounded-md border border-ink/10 bg-white px-2 font-semibold text-ink outline-none focus:border-moss"
                          />
                          <input
                            value={prospect.school}
                            onChange={(event) =>
                              updateProspect(prospect.id, {
                                school: event.target.value,
                              })
                            }
                            placeholder="School"
                            className="h-7 min-w-44 rounded-md border border-ink/10 bg-mist px-2 text-xs text-ink outline-none focus:border-moss"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={prospect.position}
                          onChange={(event) =>
                            updateProspect(prospect.id, {
                              position: event.target.value as RookiePosition,
                            })
                          }
                          className="h-9 rounded-md border border-ink/10 bg-mist px-2 text-sm font-bold text-ink"
                        >
                          {positions.slice(1).map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={prospect.tier}
                          onChange={(event) =>
                            updateProspect(prospect.id, {
                              tier: event.target.value,
                            })
                          }
                          className="h-9 rounded-md border border-ink/10 bg-mist px-2 text-sm font-bold text-ink"
                        >
                          {tiers.map((tier) => (
                            <option key={tier} value={tier}>
                              {tier}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={prospect.projectedPick}
                          onChange={(event) =>
                            updateProspect(prospect.id, {
                              projectedPick: event.target.value,
                            })
                          }
                          className="h-9 w-20 rounded-md border border-ink/10 bg-mist px-2 text-sm font-bold text-ink outline-none focus:border-moss"
                        />
                      </td>
                      {(
                        [
                          ["draftCapitalScore", "Draft capital"],
                          ["productionScore", "Production"],
                          ["athleticScore", "Athleticism"],
                          ["ageScore", "Age"],
                          ["landingSpotScore", "Landing spot"],
                          ["riskScore", "Risk"],
                        ] as const
                      ).map(([key, label]) => (
                        <td key={key} className="px-3 py-3">
                          <input
                            aria-label={`${prospect.name} ${label}`}
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={prospect[key]}
                            onChange={(event) =>
                              updateScore(prospect.id, key, event.target.value)
                            }
                            className="h-9 w-16 rounded-md border border-ink/10 bg-mist px-2 text-sm font-bold text-ink outline-none focus:border-moss"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-ink">
                            {score.toFixed(1)}
                          </p>
                          <span
                            className={clsx(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-bold ring-1",
                              getModelClass(score),
                            )}
                          >
                            {getModelLabel(score)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={prospect.notes}
                          onChange={(event) =>
                            updateProspect(prospect.id, {
                              notes: event.target.value,
                            })
                          }
                          placeholder="Notes"
                          className="h-9 min-w-56 rounded-md border border-ink/10 bg-mist px-2 text-sm text-ink outline-none focus:border-moss"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => deleteProspect(prospect.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/45 transition hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Delete ${prospect.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
