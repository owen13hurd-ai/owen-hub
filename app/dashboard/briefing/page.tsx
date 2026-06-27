import { DailyBriefing } from "@/components/briefing/DailyBriefing";

export default function BriefingPage() {
  return <div className="space-y-6">
    <section><p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">Daily Briefing</p><h1 className="mt-2 text-3xl font-bold text-ink">What matters today</h1><p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">A focused scan across your teams, games, career path, technology, travel, and the wider world.</p></section>
    <DailyBriefing />
  </div>;
}

