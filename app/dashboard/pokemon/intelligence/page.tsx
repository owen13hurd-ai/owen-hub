import { PageHeader } from "@/components/layout/PageHeader";
import { PokemonIntelligenceClient } from "@/components/pokemon-intelligence/PokemonIntelligenceClient";

export const dynamic = "force-dynamic";

export default function PokemonIntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pokemon Intelligence"
        title="Collection and Buying Command Center"
        description="Track products, collection value, purchase math, watchlist targets, manual restocks, and Jarvis purchase decisions."
      />
      <PokemonIntelligenceClient />
    </div>
  );
}
