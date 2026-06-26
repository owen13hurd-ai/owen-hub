import Link from "next/link";
import { ExternalLink, RefreshCcw } from "lucide-react";

import { PokemonHubTabs } from "@/components/pokemon/PokemonHubTabs";
import { PokemonMatchupPrep } from "@/components/pokemon/PokemonMatchupPrep";
import { PokemonSpeedTiers } from "@/components/pokemon/PokemonSpeedTiers";
import { PokemonTeamBuilder } from "@/components/pokemon/PokemonTeamBuilder";
import { PokemonTeamsClient } from "@/components/pokemon/PokemonTeamsClient";
import { Button } from "@/components/ui/Button";
import { getPokemonBuilderData } from "@/lib/pokemon/team-builder";
import { getChampionsMbTeams } from "@/lib/pokemon/vgc-pastes";

export default async function PokemonHubPage() {
  const data = await getChampionsMbTeams();
  const builderData = await getPokemonBuilderData(data);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Pokémon Hub
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Champions M-B Teams
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">
          Live view of the VGCPastes Champions M-B repository. The page checks
          the public Google Sheet every few minutes, so new teams should appear
          here after a refresh without needing a code change.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={data.sourceUrl} target="_blank">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open source sheet
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/pokemon">
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refresh view
            </Link>
          </Button>
        </div>
      </section>

      <PokemonHubTabs
        builder={<PokemonTeamBuilder data={builderData} />}
        matchupPrep={<PokemonMatchupPrep />}
        speedTiers={<PokemonSpeedTiers data={builderData} />}
        teams={<PokemonTeamsClient data={data} />}
      />
    </div>
  );
}
