import { HubPlaceholder } from "@/components/hubs/HubPlaceholder";

export default function NotesHubPage() {
  return (
    <HubPlaceholder
      title="Notes Hub"
      description="A personal knowledge base for notes, saved research, plans, and future AI-powered question answering."
      plannedFeatures={[
        "Markdown notes",
        "Tags and folders",
        "Saved source links",
        "Ask questions about notes",
      ]}
    />
  );
}
