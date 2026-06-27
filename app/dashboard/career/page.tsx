import { CareerHubClient } from "@/components/career/CareerHubClient";

const latestResume = {
  modifiedAt: "September 4, 2025",
  name: "Hurd, Owen Resume.pdf",
  path: "/Users/hurd/Library/Mobile Documents/com~apple~CloudDocs/Hurd, Owen Resume.pdf",
};

export default function CareerHubPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Career Hub
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Career Agent
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Find strong matches, tune your search, and manage applications in one place.
        </p>
      </section>

      <CareerHubClient
        resumeModifiedAt={latestResume.modifiedAt}
        resumeName={latestResume.name}
        resumePath={latestResume.path}
      />
    </div>
  );
}
