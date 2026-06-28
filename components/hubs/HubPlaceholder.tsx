import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export function HubPlaceholder({
  title,
  description,
  plannedFeatures,
}: {
  title: string;
  description: string;
  plannedFeatures: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title={title} description={description} />

      <section className="rounded-md border border-ink/10 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Planned features</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {plannedFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-ink/75">
              <CheckCircle2 className="h-5 w-5 text-moss" aria-hidden="true" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
