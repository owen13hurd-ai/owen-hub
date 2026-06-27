create table if not exists public.pokemon_battle_journals (
  profile_key text primary key,
  payload jsonb not null default '{"battles":[],"currentRating":0,"opponentNotes":[],"teamNotes":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pokemon_battle_journals enable row level security;

create policy "battle journal personal access"
on public.pokemon_battle_journals for all
to anon, authenticated
using (profile_key = 'owen-main')
with check (profile_key = 'owen-main');
