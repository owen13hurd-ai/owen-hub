import { CareerHubClient } from "@/components/career/CareerHubClient";
import { PageHeader } from "@/components/layout/PageHeader";

const latestResume = {
  modifiedAt: "September 4, 2025",
  name: "Hurd, Owen Resume.pdf",
  path: "/Users/hurd/Library/Mobile Documents/com~apple~CloudDocs/Hurd, Owen Resume.pdf",
};

export default function CareerHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career Hub"
        title="Career Agent"
        description="Discover strong Atlanta matches and move each application forward."
      />

      <CareerHubClient
        resumeModifiedAt={latestResume.modifiedAt}
        resumeName={latestResume.name}
        resumePath={latestResume.path}
      />
    </div>
  );
}
