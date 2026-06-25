import Link from "next/link";
import { ExternalLink, RefreshCcw, Search } from "lucide-react";

import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
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
              className="flex items-center gap-3 rounded-md border border-ink/10 bg-mist p-3"
            >
              <PokemonSprite
                name={pokemon.name}
                className="h-14 w-14 shrink-0"
              />
              <div>
                <p className="font-semibold text-ink">{pokemon.name}</p>
                <p className="mt-1 text-sm text-ink/55">
                  {pokemon.count} team{pokemon.count === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {visibleTeams.map((team) => (
          <article
            key={team.id}
            className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"
          >
            <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">
                    {team.id}
                  </span>
                  <span className="rounded-md bg-mist px-2 py-1 text-xs font-bold text-ink/65">
                    {team.rank}
                  </span>
                  {team.replicaCode !== "None" ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                      Code {team.replicaCode}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {team.pokemon.map((pokemon) => (
                    <div
                      key={`${team.id}-${pokemon}`}
                      className="flex min-h-24 items-center gap-3 rounded-lg border border-ink/10 bg-skyglass px-3 py-2"
                    >
                      <PokemonSprite
                        name={pokemon}
                        className="h-16 w-16 shrink-0"
                      />
                      <span className="text-sm font-bold leading-5 text-ink">
                        {pokemon}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-lg bg-mist p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">
                  Team info
                </p>
                <h2 className="mt-2 text-base font-bold leading-6 text-ink">
                  {team.description}
                </h2>

                <div className="mt-3 space-y-3 text-sm text-ink/65">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink/40">
                      Creator / Event
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {team.fullName || team.creator || "-"}
                    </p>
                    <p className="mt-1 break-words">
                      {team.creator ? `@${team.creator}` : ""}
                      {team.creator && team.event !== "-" ? " · " : ""}
                      {team.event !== "-" ? team.event : ""}
                    </p>
                    <p className="mt-1 text-xs text-ink/45">
                      {team.dateShared}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink/40">
                      Replica
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {team.replicaCode}
                    </p>
                    <p className="mt-1 text-xs text-ink/45">
                      {team.replicaStatus}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {team.pokepasteUrl ? (
                      <Link
                        href={team.pokepasteUrl}
                        target="_blank"
                        className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss transition hover:text-ink"
                      >
                        Pokepaste
                      </Link>
                    ) : null}
                    {team.sourceUrl && team.sourceUrl !== "-" ? (
                      <Link
                        href={team.sourceUrl}
                        target="_blank"
                        className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss transition hover:text-ink"
                      >
                        Source
                      </Link>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          </article>
        ))}

        {visibleTeams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink/20 bg-white p-6 text-sm text-ink/60">
            No teams match that search.
          </div>
        ) : null}
      </section>
    </div>
  );
}
