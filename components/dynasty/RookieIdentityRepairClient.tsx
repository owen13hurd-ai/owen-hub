"use client";

import { ScanSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { repairImportedRookieNameVariants } from "@/app/dashboard/dynasty/rookies/actions";
import { Button } from "@/components/ui/button";

export function RookieIdentityRepairClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h2 className="font-bold text-ink">Identity cleanup</h2><p className="mt-1 max-w-2xl text-sm text-ink/55">Consolidate known legal-name and punctuation variants from the 2025 public-data import while preserving established rankings and imported metrics.</p></div>
      <Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(async () => {
        const result = await repairImportedRookieNameVariants();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        if (result.ok) router.refresh();
      })}><ScanSearch className="h-4 w-4" />{pending ? "Checking..." : "Repair name variants"}</Button>
    </div>
  </section>;
}
