"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  Inbox,
  PackageSearch,
  RefreshCcw,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RestockSnapshot } from "@/lib/restocks/types";
import { cn } from "@/lib/utils";

type InboxSource = "career" | "dynasty" | "restocks" | "briefing";
type InboxPriority = "critical" | "high" | "normal";

type ActionItem = {
  id: string;
  source: InboxSource;
  priority: InboxPriority;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  createdAt: string;
};

type CareerJob = {
  id: string;
  jobKey: string;
  title: string;
  company: string;
  location: string;
  score: number;
  firstSeenAt: string;
  closedAt: string | null;
  feedback?: unknown;
};

type InboxState = {
  dismissed: string[];
  snoozedUntil: Record<string, string>;
};

const storageKey = "owens-hub:action-inbox:v1";
const recentCareerWindowMs = 21 * 24 * 60 * 60 * 1000;

const sourceMeta = {
  career: { label: "Career", icon: BriefcaseBusiness, className: "bg-emerald-50 text-emerald-800" },
  dynasty: { label: "Dynasty", icon: Shield, className: "bg-sky-50 text-sky-800" },
  restocks: { label: "Restocks", icon: PackageSearch, className: "bg-amber-50 text-amber-900" },
  briefing: { label: "Briefing", icon: BellRing, className: "bg-mist text-ink/70" },
} as const;

function getStoredState(): InboxState {
  if (typeof window === "undefined") return { dismissed: [], snoozedUntil: {} };
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? "") as InboxState;
  } catch {
    return { dismissed: [], snoozedUntil: {} };
  }
}

function saveState(state: InboxState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function ageLabel(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const hours = Math.max(0, Math.floor(elapsed / 3_600_000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isStillSnoozed(value?: string) {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

function tomorrowIso() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function baseActions(): ActionItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: `briefing-${new Date().toISOString().slice(0, 10)}`,
      source: "briefing",
      priority: "normal",
      title: "Your daily briefing is ready",
      detail: "Scan the latest updates across your interests in one focused view.",
      href: "/dashboard/briefing",
      actionLabel: "Read briefing",
      createdAt: now,
    },
  ];
}

async function fetchActionItems() {
  const [careerResponse, restockResponse] = await Promise.all([
    fetch("/api/career/discovered-jobs", { cache: "no-store" }),
    fetch("/api/restocks", { cache: "no-store" }),
  ]);
  const careerPayload = careerResponse.ok ? await careerResponse.json() as { jobs: CareerJob[] } : { jobs: [] };
  const restockPayload = restockResponse.ok ? await restockResponse.json() as RestockSnapshot : null;

  const careerItems = careerPayload.jobs
    .filter(
      (job) =>
        !job.closedAt &&
        !job.feedback &&
        job.score >= 75 &&
        Date.now() - new Date(job.firstSeenAt).getTime() <= recentCareerWindowMs,
    )
    .slice(0, 5)
    .map((job): ActionItem => ({
      id: `career-${job.jobKey}`,
      source: "career",
      priority: job.score >= 90 ? "high" : "normal",
      title: `${job.title} at ${job.company}`,
      detail: `${job.score}% fit · ${job.location}`,
      href: "/dashboard/career",
      actionLabel: "Review job",
      createdAt: job.firstSeenAt,
    }));

  const restockItems = (restockPayload?.events ?? [])
    .filter((event) => event.stockStatus === "in-stock")
    .slice(0, 5)
    .map((event): ActionItem => ({
      id: `restock-${event.id}`,
      source: "restocks",
      priority: event.priceStatus === "msrp" ? "critical" : "high",
      title: `${event.productName} is available`,
      detail: `${event.retailerName} · ${event.currentPrice === null ? "Price unavailable" : `$${event.currentPrice.toFixed(2)}`}`,
      href: event.productUrl,
      actionLabel: "Open product",
      createdAt: event.detectedAt,
    }));

  return [...restockItems, ...careerItems, ...baseActions()];
}

export function UnifiedActionInbox() {
  const [items, setItems] = useState<ActionItem[]>(baseActions);
  const [inboxState, setInboxState] = useState<InboxState>(getStoredState);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      setItems(await fetchActionItems());
      if (!silent) toast.success("Action inbox refreshed");
    } catch {
      if (!silent) toast.error("Some inbox sources could not refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchActionItems()
      .then((nextItems) => { if (!cancelled) setItems(nextItems); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visibleItems = useMemo(() => {
    return items
      .filter((item) => !inboxState.dismissed.includes(item.id))
      .filter((item) => !isStillSnoozed(inboxState.snoozedUntil[item.id]))
      .sort((a, b) => {
        const weight = { critical: 3, high: 2, normal: 1 };
        return weight[b.priority] - weight[a.priority] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [inboxState, items]);

  function dismiss(id: string) {
    const next = { ...inboxState, dismissed: [...inboxState.dismissed, id] };
    setInboxState(next);
    saveState(next);
  }

  function snooze(id: string) {
    const until = tomorrowIso();
    const next = { ...inboxState, snoozedUntil: { ...inboxState.snoozedUntil, [id]: until } };
    setInboxState(next);
    saveState(next);
    toast.success("Snoozed until tomorrow");
  }

  return (
    <section className="overflow-hidden rounded-md border border-ink/10 bg-white shadow-[0_12px_35px_rgba(23,33,31,0.04)]">
      <div className="flex flex-col gap-3 border-b border-ink/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-moss" aria-hidden="true" />
            <h2 className="text-lg font-bold text-ink">Action Inbox</h2>
            {!loading && <Badge variant="outline">{visibleItems.length}</Badge>}
          </div>
          <p className="mt-1 text-sm text-ink/50">The next decisions waiting across your Hub.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={refreshing}>
          <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3 p-4 sm:p-5">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 w-full" />)}
        </div>
      ) : visibleItems.length ? (
        <div className="divide-y divide-ink/10">
          {visibleItems.map((item) => {
            const meta = sourceMeta[item.source];
            const Icon = meta.icon;
            const external = item.href.startsWith("http");
            return (
              <article key={item.id} className="grid gap-3 px-4 py-4 transition hover:bg-mist/45 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", meta.className)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{item.title}</p>
                    {item.priority === "critical" && <Badge className="bg-emerald-100 text-emerald-800">MSRP live</Badge>}
                    {item.priority === "high" && <Badge variant="outline">High priority</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-ink/55">{item.detail}</p>
                  <p className="mt-1 text-xs font-semibold text-ink/35">{meta.label} · {ageLabel(item.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 sm:justify-end">
                  <Button asChild size="sm">
                    <Link href={item.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                      {item.actionLabel}<ChevronRight />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => snooze(item.id)} aria-label={`Snooze ${item.title}`} title="Snooze until tomorrow"><Clock3 /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => dismiss(item.id)} aria-label={`Dismiss ${item.title}`} title="Dismiss"><X /></Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <Check className="mx-auto h-7 w-7 text-emerald-700" />
          <p className="mt-3 font-bold text-ink">You are caught up</p>
          <p className="mt-1 text-sm text-ink/50">New jobs, restocks, and Hub actions will appear here.</p>
        </div>
      )}
    </section>
  );
}
