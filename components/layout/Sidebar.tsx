"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import clsx from "clsx";

import { navigationItems } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink/10 bg-white px-5 py-6 lg:block">
      <Link href="/dashboard" className="block">
        <p className="text-xl font-bold text-ink">Owen&apos;s Hub</p>
        <p className="mt-1 text-sm text-ink/55">Personal dashboard</p>
      </Link>

      <nav className="mt-8 space-y-1">
        <Link
          href="/dashboard"
          className={clsx(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
            pathname === "/dashboard"
              ? "bg-skyglass text-ink"
              : "text-ink/65 hover:bg-mist hover:text-ink",
          )}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Overview
        </Link>

        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-skyglass text-ink"
                  : "text-ink/65 hover:bg-mist hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
