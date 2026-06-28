import { DailyBriefing } from "@/components/briefing/DailyBriefing";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BriefingPage() {
  return <div className="space-y-6">
    <PageHeader eyebrow="Daily Briefing" title="What matters today" description="A focused scan across your teams, games, career path, technology, travel, and the wider world." />
    <DailyBriefing />
  </div>;
}
