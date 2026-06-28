import Link from "next/link";
import { ExternalLink, RefreshCcw } from "lucide-react";

import { PokemonHubTabs } from "@/components/pokemon/PokemonHubTabs";
import { BattleJournal } from "@/components/pokemon/BattleJournal";
import { PokemonBringFourAdvisor } from "@/components/pokemon/PokemonBringFourAdvisor";
import { PokemonDamageCalculator } from "@/components/pokemon/PokemonDamageCalculator";
import { PokemonMatchupPrep } from "@/components/pokemon/PokemonMatchupPrep";
import { PokemonSpeedTiers } from "@/components/pokemon/PokemonSpeedTiers";
import { PokemonTeamBuilder } from "@/components/pokemon/PokemonTeamBuilder";
import { PokemonTeamsClient } from "@/components/pokemon/PokemonTeamsClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { getPokemonBuilderData } from "@/lib/pokemon/team-builder";
import { getChampionsMbTeams } from "@/lib/pokemon/vgc-pastes";

export default async function PokemonHubPage() {
  const data = await getChampionsMbTeams();
  const builderData = await getPokemonBuilderData(data);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pokémon Hub"
        title="Competitive Toolkit"
        description="Build teams, prepare matchups, calculate damage, and review your battles."
        actions={
          <>
          <Button asChild variant="outline">
            <Link href={data.sourceUrl} target="_blank">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open source sheet
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/pokemon">
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refresh view
            </Link>
          </Button>
          </>
        }
      />

      <PokemonHubTabs
        battleJournal={<BattleJournal pokemonNames={builderData.pokemon.map((pokemon) => pokemon.name)} />}
        bringFour={<PokemonBringFourAdvisor data={builderData} />}
        builder={<PokemonTeamBuilder data={builderData} />}
        damageCalc={<PokemonDamageCalculator data={builderData} />}
        matchupPrep={<PokemonMatchupPrep />}
        speedTiers={<PokemonSpeedTiers data={builderData} />}
        teams={<PokemonTeamsClient data={data} />}
      />
    </div>
  );
}
