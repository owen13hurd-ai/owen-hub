import { JobApplicationTracker } from "@/components/career/JobApplicationTracker";

const latestResume = {
  modifiedAt: "September 4, 2025",
  name: "Hurd, Owen Resume.pdf",
  path: "/Users/hurd/Library/Mobile Documents/com~apple~CloudDocs/Hurd, Owen Resume.pdf",
};

export default function CareerHubPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Career Hub
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Job Application Tracker
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Track roles, application status, follow-ups, notes, and which resume
          version you used.
        </p>
      </section>

      <JobApplicationTracker
        resumeModifiedAt={latestResume.modifiedAt}
        resumeName={latestResume.name}
        resumePath={latestResume.path}
      />
    </div>
  );
}
