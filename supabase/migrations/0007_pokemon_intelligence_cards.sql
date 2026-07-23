create table if not exists public.pokemon_intelligence_cards (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  external_id text,
  name text not null,
  set_name text,
  number text,
  rarity text,
  supertype text,
  subtypes text[] not null default '{}',
  image_url text,
  source_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_key, external_id)
);

alter table public.pokemon_intelligence_cards enable row level security;

create policy "pokemon intelligence cards personal access" on public.pokemon_intelligence_cards
  for all to anon, authenticated
  using (profile_key = 'owen-main')
  with check (profile_key = 'owen-main');

create index if not exists pokemon_intelligence_cards_name_idx
  on public.pokemon_intelligence_cards (profile_key, name);

create index if not exists pokemon_intelligence_cards_set_idx
  on public.pokemon_intelligence_cards (profile_key, set_name);
