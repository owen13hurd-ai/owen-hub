import { CheckCircle2 } from "lucide-react";

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
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Placeholder hub
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          {description}
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
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
