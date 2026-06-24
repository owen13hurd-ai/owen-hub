import { HubPlaceholder } from "@/components/hubs/HubPlaceholder";

export default function CareerHubPage() {
  return (
    <HubPlaceholder
      title="Career Hub"
      description="A place to organize job searches, resumes, interview notes, contacts, and career planning."
      plannedFeatures={[
        "Job application tracker",
        "Resume versions",
        "Interview prep notes",
        "Networking follow-ups",
      ]}
    />
  );
}
