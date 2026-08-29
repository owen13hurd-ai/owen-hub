import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RookieModelConfigurationClient } from "@/components/dynasty/RookieModelConfigurationClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { rookieModelConfigurations } from "@/lib/dynasty/rookie-model/config";
import { getRookieModelVersions } from "@/lib/dynasty/rookie-model/repository";

export const dynamic = "force-dynamic";

export default async function RookieConfigurationPage() {
  const versions = await getRookieModelVersions();
  return <div className="space-y-6"><Link href="/dashboard/dynasty/rookies" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-moss"><ArrowLeft className="h-4 w-4" />Rookie rankings</Link><PageHeader eyebrow="Explainable Rookie Engine" title="Model configuration" description="Draft, validate, and publish position-specific model versions. Published versions and their score runs are immutable." /><RookieModelConfigurationClient defaults={rookieModelConfigurations} versions={versions} /></div>;
}
