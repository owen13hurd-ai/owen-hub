create table public.rookie_benchmark_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  observed_at timestamptz not null,
  provider text not null,
  format text not null default '12-team-superflex',
  consensus_rank numeric not null check (consensus_rank > 0),
  source_id uuid not null references public.rookie_sources(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (player_id, provider, format, observed_at)
);

create index rookie_benchmark_history_idx
  on public.rookie_benchmark_snapshots (player_id, observed_at desc);

alter table public.rookie_benchmark_snapshots enable row level security;
create policy rookie_benchmarks_select_own on public.rookie_benchmark_snapshots
for select to authenticated using (auth.uid() = user_id);
create policy rookie_benchmarks_insert_own on public.rookie_benchmark_snapshots
for insert to authenticated with check (auth.uid() = user_id);
create policy rookie_benchmarks_update_own on public.rookie_benchmark_snapshots
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_benchmarks_delete_own on public.rookie_benchmark_snapshots
for delete to authenticated using (auth.uid() = user_id);

comment on table public.rookie_benchmark_snapshots is
  'Dated, sourced external consensus ranks used only as validation benchmarks.';
