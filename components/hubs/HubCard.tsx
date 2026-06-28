import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Hub } from "@/lib/navigation";

export function HubCard({ hub }: { hub: Hub }) {
  const Icon = hub.icon;

  return (
    <Link
      href={hub.href}
      className="group block h-full rounded-md border border-ink/10 bg-white p-4 transition hover:border-moss/50 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-skyglass text-ink">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <ArrowRight
          className="h-4 w-4 text-ink/35 transition group-hover:translate-x-1 group-hover:text-ember"
          aria-hidden="true"
        />
      </div>
      <h2 className="mt-4 text-base font-bold text-ink">{hub.label}</h2>
      <p className="mt-1 text-sm leading-5 text-ink/55">{hub.description}</p>
    </Link>
  );
}
