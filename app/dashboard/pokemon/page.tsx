import Link from "next/link";
import { ExternalLink, RefreshCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getChampionsMbTeams } from "@/lib/pokemon/vgc-pastes";

function includesQuery(values: string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => value.toLowerCase().includes(normalizedQuery));
}

export default async function PokemonHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const data = await getChampionsMbTeams();
  const visibleTeams = data.teams.filter((team) => {
    return includesQuery(
      [
        team.id,
        team.description,
        team.fullName,
        team.creator,
        team.event,
        team.rank,
        ...team.pokemon,
      ],
      query,
    );
  });

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

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Sheet</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data.sheetName}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Teams loaded</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {data.teams.length}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Visible teams</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {visibleTeams.length}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-sm text-ink/55">Last checked</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {data.lastCheckedAt}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">
              Usage snapshot
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Most common Pokémon
            </h2>
          </div>
          <form className="relative w-full xl:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search player, team, event, Pokémon"
              className="h-10 w-full rounded-md border border-ink/10 bg-mist pl-9 pr-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
            />
          </form>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.topPokemon.map((pokemon) => (
            <div
              key={pokemon.name}
              className="rounded-md border border-ink/10 bg-mist p-3"
            >
              <p className="font-semibold text-ink">{pokemon.name}</p>
              <p className="mt-1 text-sm text-ink/55">
                {pokemon.count} team{pokemon.count === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="overflow-hidden rounded-lg border border-ink/10">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
              <thead className="bg-mist text-xs uppercase tracking-[0.08em] text-ink/55">
                <tr>
                  <th className="px-3 py-3">Team</th>
                  <th className="px-3 py-3">Creator</th>
                  <th className="px-3 py-3">Event</th>
                  <th className="px-3 py-3">Rank</th>
                  <th className="px-3 py-3">Pokémon</th>
                  <th className="px-3 py-3">Replica</th>
                  <th className="px-3 py-3">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {visibleTeams.map((team) => (
                  <tr key={team.id} className="bg-white align-top">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink">{team.id}</p>
                      <p className="mt-1 max-w-72 text-xs leading-5 text-ink/55">
                        {team.description}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink">
                        {team.fullName || team.creator || "-"}
                      </p>
                      {team.creator ? (
                        <p className="mt-1 text-xs text-ink/45">
                          @{team.creator}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-ink/70">
                      <p>{team.event}</p>
                      <p className="mt-1 text-xs text-ink/45">
                        {team.dateShared}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">
                      {team.rank}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex max-w-md flex-wrap gap-1.5">
                        {team.pokemon.map((pokemon) => (
                          <span
                            key={`${team.id}-${pokemon}`}
                            className="rounded-md bg-skyglass px-2 py-1 text-xs font-bold text-ink"
                          >
                            {pokemon}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink">
                        {team.replicaCode}
                      </p>
                      <p className="mt-1 text-xs text-ink/45">
                        {team.replicaStatus}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        {team.pokepasteUrl ? (
                          <Link
                            href={team.pokepasteUrl}
                            target="_blank"
                            className="font-semibold text-moss hover:text-ink"
                          >
                            Pokepaste
                          </Link>
                        ) : null}
                        {team.sourceUrl && team.sourceUrl !== "-" ? (
                          <Link
                            href={team.sourceUrl}
                            target="_blank"
                            className="font-semibold text-moss hover:text-ink"
                          >
                            Source
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
