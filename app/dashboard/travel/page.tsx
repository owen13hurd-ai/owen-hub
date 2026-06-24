import { HubPlaceholder } from "@/components/hubs/HubPlaceholder";

export default function TravelHubPage() {
  return (
    <HubPlaceholder
      title="Travel Hub"
      description="A future planning board for trip ideas, itineraries, budgets, places, and packing lists."
      plannedFeatures={[
        "Trip idea backlog",
        "Itinerary builder",
        "Saved places",
        "Travel budget tracker",
      ]}
    />
  );
}
