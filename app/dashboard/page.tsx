import { HubCard } from "@/components/hubs/HubCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { hubs } from "@/lib/navigation";

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Overview" title="Welcome back, Owen" description="Choose a workspace and pick up where you left off." />

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-ink">Workspaces</h2><span className="text-xs font-semibold text-ink/40">{hubs.length} active</span></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {hubs.map((hub) => (
          <HubCard key={hub.href} hub={hub} />
        ))}
        </div>
      </section>
    </div>
  );
}
