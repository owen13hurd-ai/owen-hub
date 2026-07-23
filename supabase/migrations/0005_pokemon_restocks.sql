create table if not exists public.pokemon_restock_events (
  id text primary key,
  retailer_id text not null,
  retailer_name text not null,
  product_name text not null,
  product_url text not null,
  image_url text,
  msrp numeric(10, 2),
  current_price numeric(10, 2),
  stock_status text not null check (stock_status in ('in-stock', 'out-of-stock', 'unknown')),
  price_status text not null check (price_status in ('msrp', 'above-msrp', 'unknown')),
  source_label text not null,
  source_support text not null,
  confidence text not null,
  detected_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.pokemon_restock_watchlist (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  name text not null,
  kind text not null check (kind in ('set', 'sealed-product', 'card')),
  max_price_percent integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_key, name)
);

create table if not exists public.pokemon_restock_locations (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  retailer_id text not null,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  typical_restock_day text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.pokemon_restock_events enable row level security;
alter table public.pokemon_restock_watchlist enable row level security;
alter table public.pokemon_restock_locations enable row level security;

create policy "restock events personal read" on public.pokemon_restock_events for select to anon, authenticated using (true);
create policy "restock watchlist personal access" on public.pokemon_restock_watchlist for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "restock locations personal access" on public.pokemon_restock_locations for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');

create index if not exists pokemon_restock_events_detected_at_idx on public.pokemon_restock_events (detected_at desc);
create index if not exists pokemon_restock_events_product_idx on public.pokemon_restock_events (retailer_id, product_name);
