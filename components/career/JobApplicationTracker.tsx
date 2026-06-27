"use client";

import { BriefcaseBusiness, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import {
  applicationStatuses,
  emptyApplication,
  getApplicationsFromStorage,
  jobApplicationsChangedEvent,
  saveApplications,
  type ApplicationStatus,
  type JobApplication,
} from "@/lib/career/applications";
import { loadCareerApplicationsFromCloud } from "@/lib/career/cloud";

function getStatusClass(status: ApplicationStatus) {
  if (status === "Offer") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (status === "Interviewing") {
    return "bg-sky-50 text-sky-800 ring-sky-200";
  }

  if (status === "Applied") {
    return "bg-violet-50 text-violet-800 ring-violet-200";
  }

  if (status === "Rejected") {
    return "bg-rose-50 text-rose-800 ring-rose-200";
  }

  if (status === "Archived") {
    return "bg-stone-100 text-stone-700 ring-stone-200";
  }

  return "bg-amber-50 text-amber-800 ring-amber-200";
}

function getPriorityClass(priority: JobApplication["priority"]) {
  if (priority === "High") {
    return "bg-rose-50 text-rose-800";
  }

  if (priority === "Low") {
    return "bg-mist text-ink/55";
  }

  return "bg-amber-50 text-amber-800";
}

export function JobApplicationTracker({
  resumeModifiedAt,
  resumeName,
  resumePath,
}: {
  resumeModifiedAt: string;
  resumeName: string;
  resumePath: string;
}) {
  const [applications, setApplications] = useState<JobApplication[]>(
    getApplicationsFromStorage,
  );
  const [draft, setDraft] = useState(emptyApplication);
  const [statusFilter, setStatusFilter] = useState<
    "All" | ApplicationStatus
  >("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    function refreshApplications() {
      setApplications(getApplicationsFromStorage());
    }

    window.addEventListener(jobApplicationsChangedEvent, refreshApplications);
    void loadCareerApplicationsFromCloud().then((cloudApplications) => {
      if (cloudApplications && cloudApplications.length > 0) {
        saveApplications(cloudApplications);
      }
    });

    return () => {
      window.removeEventListener(jobApplicationsChangedEvent, refreshApplications);
    };
  }, []);

  const visibleApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          application.company,
          application.role,
          application.source,
          application.notes,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [applications, query, statusFilter]);

  const activeApplications = applications.filter((application) => {
    return !["Rejected", "Archived"].includes(application.status);
  });
  const followUpsDue = applications.filter((application) => {
    if (!application.followUpDate) {
      return false;
    }

    return (
      !["Rejected", "Archived", "Offer"].includes(application.status) &&
      application.followUpDate <= new Date().toISOString().slice(0, 10)
    );
  });

  function updateApplications(nextApplications: JobApplication[]) {
    setApplications(nextApplications);
    saveApplications(nextApplications);
  }

  function addApplication() {
    if (!draft.company.trim() || !draft.role.trim()) {
      return;
    }

    const nextApplication: JobApplication = {
      ...draft,
      company: draft.company.trim(),
      id: `${Date.now()}`,
      role: draft.role.trim(),
    };
    updateApplications([nextApplication, ...applications]);
    setDraft(emptyApplication);
  }

  function updateApplication(
    applicationId: string,
    updates: Partial<JobApplication>,
  ) {
    updateApplications(
      applications.map((application) => {
        return application.id === applicationId
          ? { ...application, ...updates }
          : application;
      }),
    );
  }

  function deleteApplication(applicationId: string) {
    updateApplications(
      applications.filter((application) => application.id !== applicationId),
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Active applications</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {activeApplications.length}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Interviewing</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">
            {
              applications.filter(
                (application) => application.status === "Interviewing",
              ).length
            }
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Follow-ups due</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">
            {followUpsDue.length}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Resume found</p>
          <p className="mt-1 truncate text-sm font-bold text-ink">
            {resumeName}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Application Tracker
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Add a job lead
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={draft.company}
                onChange={(event) =>
                  setDraft({ ...draft, company: event.target.value })
                }
                placeholder="Company"
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
              />
              <input
                value={draft.role}
                onChange={(event) =>
                  setDraft({ ...draft, role: event.target.value })
                }
                placeholder="Role"
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
              />
              <input
                value={draft.jobUrl}
                onChange={(event) =>
                  setDraft({ ...draft, jobUrl: event.target.value })
                }
                placeholder="Job link"
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
              />
              <input
                value={draft.source}
                onChange={(event) =>
                  setDraft({ ...draft, source: event.target.value })
                }
                placeholder="Source"
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
              />
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
                  Applied
                </span>
                <input
                  type="date"
                  value={draft.appliedDate}
                  onChange={(event) =>
                    setDraft({ ...draft, appliedDate: event.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">
                  Follow up
                </span>
                <input
                  type="date"
                  value={draft.followUpDate}
                  onChange={(event) =>
                    setDraft({ ...draft, followUpDate: event.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white"
                />
              </label>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    status: event.target.value as ApplicationStatus,
                  })
                }
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm font-semibold text-ink outline-none focus:border-moss focus:bg-white"
              >
                {applicationStatuses.slice(1).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    priority: event.target.value as JobApplication["priority"],
                  })
                }
                className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm font-semibold text-ink outline-none focus:border-moss focus:bg-white"
              >
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
            </div>
            <textarea
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
              placeholder="Notes"
              className="mt-3 min-h-20 w-full rounded-md border border-ink/10 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-moss focus:bg-white"
            />
            <button
              type="button"
              onClick={addApplication}
              disabled={!draft.company.trim() || !draft.role.trim()}
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add application
            </button>
          </div>

          <aside className="rounded-lg bg-mist p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <BriefcaseBusiness className="h-4 w-4 text-moss" aria-hidden="true" />
              Default resume
            </div>
            <p className="mt-3 text-sm font-bold text-ink">{resumeName}</p>
            <p className="mt-1 text-xs text-ink/45">
              Last modified {resumeModifiedAt}
            </p>
            <p className="mt-3 break-words rounded-md bg-white px-3 py-2 text-xs leading-5 text-ink/55">
              {resumePath}
            </p>
          </aside>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {applicationStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  "h-9 rounded-md px-3 text-sm font-semibold transition",
                  statusFilter === status
                    ? "bg-ink text-white"
                    : "bg-mist text-ink/70 hover:bg-skyglass hover:text-ink",
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applications"
            className="h-10 rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none focus:border-moss focus:bg-white lg:w-72"
          />
        </div>

        <div className="mt-4 space-y-3">
          {visibleApplications.map((application) => (
            <article
              key={application.id}
              className="rounded-lg border border-ink/10 bg-mist p-3"
            >
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                        getStatusClass(application.status),
                      )}
                    >
                      {application.status}
                    </span>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        getPriorityClass(application.priority),
                      )}
                    >
                      {application.priority}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-ink">
                    {application.role}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-ink/60">
                    {application.company}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {application.jobUrl ? (
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-xs font-bold text-moss transition hover:text-ink"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      Job post
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => deleteApplication(application.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-ink/45 transition hover:bg-rose-50 hover:text-rose-700"
                    aria-label={`Delete ${application.company} application`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-5">
                <select
                  value={application.status}
                  onChange={(event) =>
                    updateApplication(application.id, {
                      status: event.target.value as ApplicationStatus,
                    })
                  }
                  className="h-9 rounded-md border border-ink/10 bg-white px-2 text-xs font-bold text-ink"
                >
                  {applicationStatuses.slice(1).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-xs text-ink/45">Applied</p>
                  <p className="text-sm font-bold text-ink">
                    {application.appliedDate || "-"}
                  </p>
                </div>
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-xs text-ink/45">Follow up</p>
                  <p className="text-sm font-bold text-ink">
                    {application.followUpDate || "-"}
                  </p>
                </div>
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-xs text-ink/45">Source</p>
                  <p className="truncate text-sm font-bold text-ink">
                    {application.source || "-"}
                  </p>
                </div>
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-xs text-ink/45">Resume</p>
                  <p className="truncate text-sm font-bold text-ink">
                    {application.resumeVersion}
                  </p>
                </div>
              </div>

              <textarea
                value={application.notes}
                onChange={(event) =>
                  updateApplication(application.id, {
                    notes: event.target.value,
                  })
                }
                placeholder="Notes"
                className="mt-3 min-h-16 w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
              />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-xs font-bold text-ink/50">Recruiter contact
                  <input value={application.recruiterContact}
                    onChange={(event) => updateApplication(application.id, { recruiterContact: event.target.value })}
                    placeholder="Name, email, or phone"
                    className="mt-1 h-9 w-full rounded-md border border-ink/10 bg-white px-3 text-sm font-normal text-ink outline-none focus:border-moss" />
                </label>
                <label className="text-xs font-bold text-ink/50">Salary
                  <input value={application.salary}
                    onChange={(event) => updateApplication(application.id, { salary: event.target.value })}
                    placeholder="$70,000 - $85,000"
                    className="mt-1 h-9 w-full rounded-md border border-ink/10 bg-white px-3 text-sm font-normal text-ink outline-none focus:border-moss" />
                </label>
                <label className="text-xs font-bold text-ink/50">Rating
                  <select value={application.rating}
                    onChange={(event) => updateApplication(application.id, { rating: Number(event.target.value) })}
                    className="mt-1 h-9 w-full rounded-md border border-ink/10 bg-white px-3 text-sm font-normal text-ink outline-none focus:border-moss">
                    <option value={0}>Not rated</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                  </select>
                </label>
              </div>
              <textarea value={application.interviewNotes}
                onChange={(event) => updateApplication(application.id, { interviewNotes: event.target.value })}
                placeholder="Interview notes"
                className="mt-3 min-h-16 w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss" />
            </article>
          ))}

          {visibleApplications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink/20 bg-mist p-6 text-sm text-ink/55">
              No applications match this view yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
