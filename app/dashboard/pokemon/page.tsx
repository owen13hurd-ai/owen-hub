import { HubPlaceholder } from "@/components/hubs/HubPlaceholder";

export default function PokemonHubPage() {
  return (
    <HubPlaceholder
      title="Pokémon Hub"
      description="A planning area for teams, type coverage, move ideas, and game-specific notes."
      plannedFeatures={[
        "Team builder",
        "Type weakness checker",
        "Saved team templates",
        "Competitive notes",
      ]}
    />
  );
}
