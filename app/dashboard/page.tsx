import { HubCard } from "@/components/hubs/HubCard";
import { hubs } from "@/lib/navigation";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Welcome back, Owen</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          This first version gives each major interest a dedicated home. The
          pages are simple now, but the structure is ready for real tools and
          data once we add them.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hubs.map((hub) => (
          <HubCard key={hub.href} hub={hub} />
        ))}
      </section>
    </div>
  );
}
