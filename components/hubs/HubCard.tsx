import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Hub } from "@/lib/navigation";

const accentClasses: Record<Hub["accent"], string> = {
  ember: "bg-ember/10 text-ember",
  ink: "bg-ink text-white",
  moss: "bg-moss/10 text-moss",
  sky: "bg-skyglass text-ink",
};

export function HubCard({ hub }: { hub: Hub }) {
  const Icon = hub.icon;

  return (
    <Link
      href={hub.href}
      className="group flex h-full min-h-[190px] flex-col rounded-md border border-ink/10 bg-white/90 p-4 shadow-[0_12px_35px_rgba(23,33,31,0.04)] transition hover:-translate-y-0.5 hover:border-moss/50 hover:bg-white hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${accentClasses[hub.accent]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="rounded-md border border-ink/10 px-2 py-1 text-xs font-bold text-ink/45">
          {hub.status}
        </span>
      </div>
      <div className="mt-5 flex-1">
        <h2 className="text-base font-bold text-ink">{hub.label}</h2>
        <p className="mt-1 text-sm leading-5 text-ink/55">{hub.description}</p>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3">
        <span className="text-xs font-bold text-ink/45">{hub.focus}</span>
        <ArrowRight
          className="h-4 w-4 text-ink/35 transition group-hover:translate-x-1 group-hover:text-ember"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
