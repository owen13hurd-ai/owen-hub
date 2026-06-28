import { PokerHub } from "@/components/poker/PokerHub";
import { PageHeader } from "@/components/layout/PageHeader";

export default function PokerHubPage() {
  return <div className="space-y-6">
    <PageHeader eyebrow="Poker Hub" title="Study Room" description="Practice decisions, review hands, and organize your poker study." />
    <PokerHub />
  </div>;
}
