"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import clsx from "clsx";

import { navigationItems } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-ink/10 bg-[#fcfdfc] px-4 py-5 lg:block">
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-sm font-black text-white">OH</span>
        <span>
          <span className="block text-base font-bold text-ink">Owen&apos;s Hub</span>
          <span className="block text-xs text-ink/45">Personal workspace</span>
        </span>
      </Link>

      <nav className="mt-8 space-y-1">
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/35">Home</p>
        <Link
          href="/dashboard"
          className={clsx(
            "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
            pathname === "/dashboard"
              ? "bg-skyglass text-ink"
              : "text-ink/65 hover:bg-mist hover:text-ink",
          )}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Overview
        </Link>

        <p className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/35">Workspaces</p>
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                isActive
                  ? "bg-ink text-white"
                  : "text-ink/65 hover:bg-mist hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute inset-x-4 bottom-5 border-t border-ink/10 pt-4">
        <p className="px-3 text-xs font-semibold text-ink/45">Built for Owen</p>
      </div>
    </aside>
  );
}
