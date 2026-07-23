import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Shield, Sparkles } from "lucide-react";

import { HubCard } from "@/components/hubs/HubCard";
import { UnifiedActionInbox } from "@/components/dashboard/UnifiedActionInbox";
import { PageHeader } from "@/components/layout/PageHeader";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { hubs } from "@/lib/navigation";

const primaryWorkspaces = [
  {
    href: "/dashboard/dynasty",
    icon: Shield,
    label: "Dynasty",
    text: "Tune rankings, check offers, and review roster value.",
  },
  {
    href: "/dashboard/pokemon",
    icon: Sparkles,
    label: "Pokémon",
    text: "Build teams, prep matchups, and log battle notes.",
  },
  {
    href: "/dashboard/career",
    icon: BriefcaseBusiness,
    label: "Career",
    text: "Review new jobs, track applications, and plan outreach.",
  },
];

const roadmapItems = [
  "Sharper dynasty rookie model",
  "Saved Pokémon builds and battle trends",
  "Morning career inbox from alerts",
  "AI search over notes and history",
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Welcome back, Owen"
        description="A cleaner launch point for the parts of the hub you use most."
        actions={
          <Button asChild>
            <Link href="/dashboard/dynasty">
              Open Dynasty
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <UnifiedActionInbox />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-md border border-ink/10 bg-ink p-5 text-white shadow-soft">
          <div className="grid gap-4 md:grid-cols-3">
            {primaryWorkspaces.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-md border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/[0.1]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold">{item.label}</h2>
                  <p className="mt-2 text-sm leading-5 text-white/65">{item.text}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-white/80">
                    Continue
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="rounded-md border border-ink/10 bg-white/85 p-5 shadow-[0_12px_35px_rgba(23,33,31,0.04)]">
          <p className="text-sm font-bold text-ink">Next useful builds</p>
          <div className="mt-4 space-y-3">
            {roadmapItems.map((item) => (
              <div key={item} className="rounded-md border border-ink/10 bg-mist px-3 py-3 text-sm font-semibold text-ink/70">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">All workspaces</h2>
          <span className="text-xs font-semibold text-ink/45">{hubs.length} areas</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub, index) => (
            <BlurFade key={hub.href} delay={index * 0.035} duration={0.25} blur="3px" className="h-full">
              <HubCard hub={hub} />
            </BlurFade>
          ))}
        </div>
      </section>
    </div>
  );
}
