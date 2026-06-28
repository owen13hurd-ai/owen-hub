"use client";

import {
  BarChart3,
  Bell,
  ClipboardList,
  Lightbulb,
  ListOrdered,
  ShieldCheck,
  TableProperties,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/dashboard/dynasty", icon: ListOrdered, label: "Rankings" },
  { href: "/dashboard/dynasty/portfolio", icon: BarChart3, label: "Portfolio" },
  { href: "/dashboard/dynasty/my-teams", icon: ShieldCheck, label: "My Teams" },
  { href: "/dashboard/dynasty/leagues", icon: TableProperties, label: "Power Rankings" },
  { href: "/dashboard/dynasty/trade-inbox", icon: Bell, label: "Trade Inbox" },
  { href: "/dashboard/dynasty/trade-lab", icon: Lightbulb, label: "Trade Notebook" },
  { href: "/dashboard/dynasty/leaguemates", icon: Users, label: "Leaguemates" },
  { href: "/dashboard/dynasty/rookies", icon: ClipboardList, label: "Rookies" },
];

export function DynastyNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dynasty Hub sections" className="mb-7 overflow-x-auto border-b border-ink/10">
      <div className="flex min-w-max gap-1">
        {items.map(({ href, icon: Icon, label }) => {
          const active = href === "/dashboard/dynasty" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "inline-flex h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition",
                active
                  ? "border-ember text-ink"
                  : "border-transparent text-ink/45 hover:border-ink/20 hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

