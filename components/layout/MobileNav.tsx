"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import clsx from "clsx";

import { navigationItems } from "@/lib/navigation";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-ink/10 bg-white/85 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/dashboard"
          className={clsx(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
            pathname === "/dashboard"
              ? "bg-ink text-white"
              : "text-ink/65 hover:bg-mist hover:text-ink",
          )}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Overview
        </Link>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                isActive
                  ? "bg-ink text-white"
                  : "text-ink/65 hover:bg-mist hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label.replace(" Hub", "")}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
