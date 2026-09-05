import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Newspaper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { UnifiedActionInbox } from "@/components/dashboard/UnifiedActionInbox";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hubs } from "@/lib/navigation";

const focusActions = [
  {
    href: "/dashboard/dynasty/weekly",
    icon: ShieldCheck,
    label: "Set weekly lineups",
    text: "Review submitted starters and any huge waiver value.",
    meta: "Dynasty",
  },
  {
    href: "/dashboard/career",
    icon: BriefcaseBusiness,
    label: "Review career inbox",
    text: "Work the strongest new Atlanta opportunities first.",
    meta: "Career",
  },
  {
    href: "/dashboard/briefing",
    icon: Newspaper,
    label: "Read daily briefing",
    text: "Catch up on the developments worth your attention.",
    meta: "Briefing",
  },
  {
    href: "/dashboard/pokemon/intelligence",
    icon: Sparkles,
    label: "Open Pokémon intelligence",
    text: "Continue collection analysis and buying decisions.",
    meta: "Pokémon",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command Center"
        title="Welcome back, Owen"
        description="Live decisions first, with every workspace one step away."
        actions={
          <Button asChild>
            <Link href="/dashboard/dynasty/weekly">
              Weekly review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <UnifiedActionInbox />

      <section aria-labelledby="continue-heading">
        <div className="mb-3">
          <h2 id="continue-heading" className="text-lg font-bold text-ink">
            Continue working
          </h2>
          <p className="mt-1 text-sm text-ink/50">
            Direct paths into the decisions you return to most.
          </p>
        </div>
        <div className="overflow-hidden rounded-md border border-ink/10 bg-white">
          <div className="grid md:grid-cols-2">
            {focusActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group grid min-h-28 grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-ink/10 p-4 transition hover:bg-mist/60 active:bg-mist md:odd:border-r md:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-moss/10 text-moss">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="text-xs font-bold text-moss">{item.meta}</span>
                    <span className="mt-1 block font-bold text-ink">{item.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-ink/55">{item.text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-moss" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="workspaces-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="workspaces-heading" className="text-lg font-bold text-ink">
              All workspaces
            </h2>
            <p className="mt-1 text-sm text-ink/50">Everything else in the Hub.</p>
          </div>
          <span className="text-xs font-semibold text-ink/45">{hubs.length} areas</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub) => {
            const Icon = hub.icon;

            return (
              <Link
                key={hub.href}
                href={hub.href}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-ink/10 bg-white px-3 py-3 transition hover:border-moss/40 hover:bg-mist/45 active:bg-mist"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-mist text-ink/65">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{hub.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink/45">{hub.focus}</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-ink/50">
                  {hub.status}
                </Badge>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
