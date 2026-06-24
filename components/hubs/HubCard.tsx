import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Hub } from "@/lib/navigation";

export function HubCard({ hub }: { hub: Hub }) {
  const Icon = hub.icon;

  return (
    <Link
      href={hub.href}
      className="group rounded-lg border border-ink/10 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-moss/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-skyglass text-ink">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <ArrowRight
          className="h-4 w-4 text-ink/35 transition group-hover:translate-x-1 group-hover:text-ember"
          aria-hidden="true"
        />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-ink">{hub.label}</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">{hub.description}</p>
    </Link>
  );
}
