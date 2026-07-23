import { PageHeader } from "@/components/layout/PageHeader";
import { JarvisHubClient } from "@/components/jarvis/JarvisHubClient";

export default function JarvisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jarvis"
        title="Second Brain Control Center"
        description="Search your Obsidian vault, connect structured Hub records, and prepare the citation layer for future AI answers."
      />
      <JarvisHubClient />
    </div>
  );
}
