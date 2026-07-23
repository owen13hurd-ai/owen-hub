"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PanelLeft } from "lucide-react";
import clsx from "clsx";

import { navigationItems } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-ink/10 bg-white/85 px-3 py-4 shadow-[8px_0_30px_rgba(23,33,31,0.04)] backdrop-blur-xl lg:block">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 transition hover:bg-mist">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-sm font-black text-white shadow-sm">OH</span>
        <span className="min-w-0">
          <span className="block truncate text-base font-bold text-ink">Owen&apos;s Hub</span>
          <span className="block truncate text-xs font-medium text-ink/45">Private command center</span>
        </span>
      </Link>

      <nav className="mt-6 space-y-1">
        <p className="mb-2 px-3 text-xs font-bold text-ink/35">Home</p>
        <Link
          href="/dashboard"
          className={clsx(
            "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
            pathname === "/dashboard"
              ? "bg-ink text-white shadow-sm"
              : "text-ink/65 hover:bg-mist hover:text-ink",
          )}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Overview
        </Link>

        <p className="mb-2 mt-6 px-3 text-xs font-bold text-ink/35">Workspaces</p>
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                isActive
                  ? "bg-ink text-white shadow-sm"
                  : "text-ink/65 hover:bg-mist hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="absolute inset-x-3 bottom-4 rounded-md border border-ink/10 bg-mist/70 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink/55">
          <PanelLeft className="h-4 w-4" aria-hidden="true" />
          Built around your data
        </div>
      </div>
    </aside>
  );
}
