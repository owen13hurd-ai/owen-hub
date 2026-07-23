create table if not exists public.jarvis_sources (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  title text not null,
  source_type text not null default 'manual',
  url text,
  file_path text,
  source_date date,
  reliability text not null default 'medium' check (reliability in ('high', 'medium', 'low')),
  citation_label text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.jarvis_notes (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  path text not null,
  title text not null,
  note_type text not null default 'note',
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'archived')),
  source_type text not null default 'personal',
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  last_reviewed date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_key, path)
);

create table if not exists public.jarvis_projects (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  name text not null,
  status text not null default 'active',
  area text,
  priority integer not null default 3,
  note_path text,
  created_at timestamptz not null default now(),
  unique (profile_key, name)
);

create table if not exists public.jarvis_topics (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  name text not null,
  area text,
  created_at timestamptz not null default now(),
  unique (profile_key, name)
);

create table if not exists public.jarvis_decisions (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  decision text not null,
  rationale text,
  decision_date date not null default current_date,
  status text not null default 'active',
  note_path text,
  source_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.jarvis_tasks (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  title text not null,
  status text not null default 'open' check (status in ('open', 'doing', 'done', 'archived')),
  due_date date,
  project_id uuid references public.jarvis_projects(id) on delete set null,
  note_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jarvis_memories (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  memory text not null,
  category text,
  confidence text not null default 'high' check (confidence in ('high', 'medium', 'low')),
  source_ids uuid[] not null default '{}',
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.jarvis_artifacts (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  title text not null,
  artifact_type text not null,
  file_path text,
  url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.jarvis_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  title text not null,
  summary text not null,
  source_label text,
  note_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.pokemon_intelligence_sets (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  name text not null,
  release_date date,
  era text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_key, name)
);

create table if not exists public.pokemon_intelligence_products (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  name text not null,
  product_type text not null default 'sealed',
  set_name text,
  msrp numeric(10, 2),
  pack_count integer,
  release_date date,
  image_url text,
  source_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_key, name)
);

create table if not exists public.pokemon_intelligence_collection_items (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  product_id uuid references public.pokemon_intelligence_products(id) on delete set null,
  item_name text not null,
  item_kind text not null default 'sealed',
  quantity integer not null default 1 check (quantity > 0),
  condition text not null default 'sealed',
  storage_location text,
  estimated_value numeric(10, 2),
  notes text,
  acquired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pokemon_intelligence_purchases (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  product_id uuid references public.pokemon_intelligence_products(id) on delete set null,
  product_name text not null,
  retailer text,
  quantity integer not null default 1 check (quantity > 0),
  item_price numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  shipping numeric(10, 2) not null default 0,
  fees numeric(10, 2) not null default 0,
  total_cost numeric(10, 2) generated always as ((quantity * item_price) + tax + shipping + fees) stored,
  purchase_date date not null default current_date,
  purpose text not null default 'collecting',
  source_url text,
  notes text,
  jarvis_note_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.pokemon_intelligence_price_observations (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  product_id uuid references public.pokemon_intelligence_products(id) on delete set null,
  product_name text not null,
  source text not null,
  price numeric(10, 2) not null,
  shipping numeric(10, 2) not null default 0,
  observed_at timestamptz not null default now(),
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  source_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.pokemon_intelligence_watchlist (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  name text not null,
  target_type text not null default 'sealed-product',
  max_price numeric(10, 2),
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (profile_key, name)
);

create table if not exists public.pokemon_intelligence_restock_observations (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null default 'owen-main',
  product_id uuid references public.pokemon_intelligence_products(id) on delete set null,
  product_name text not null,
  retailer text not null,
  stock_status text not null default 'unknown' check (stock_status in ('in-stock', 'out-of-stock', 'unknown')),
  current_price numeric(10, 2),
  msrp numeric(10, 2),
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  source_url text,
  observed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.jarvis_sources enable row level security;
alter table public.jarvis_notes enable row level security;
alter table public.jarvis_projects enable row level security;
alter table public.jarvis_topics enable row level security;
alter table public.jarvis_decisions enable row level security;
alter table public.jarvis_tasks enable row level security;
alter table public.jarvis_memories enable row level security;
alter table public.jarvis_artifacts enable row level security;
alter table public.jarvis_conversations enable row level security;
alter table public.pokemon_intelligence_sets enable row level security;
alter table public.pokemon_intelligence_products enable row level security;
alter table public.pokemon_intelligence_collection_items enable row level security;
alter table public.pokemon_intelligence_purchases enable row level security;
alter table public.pokemon_intelligence_price_observations enable row level security;
alter table public.pokemon_intelligence_watchlist enable row level security;
alter table public.pokemon_intelligence_restock_observations enable row level security;

create policy "jarvis sources personal access" on public.jarvis_sources for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis notes personal access" on public.jarvis_notes for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis projects personal access" on public.jarvis_projects for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis topics personal access" on public.jarvis_topics for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis decisions personal access" on public.jarvis_decisions for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis tasks personal access" on public.jarvis_tasks for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis memories personal access" on public.jarvis_memories for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis artifacts personal access" on public.jarvis_artifacts for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "jarvis conversations personal access" on public.jarvis_conversations for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "pokemon intelligence sets personal access" on public.pokemon_intelligence_sets for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "pokemon intelligence products personal access" on public.pokemon_intelligence_products for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "pokemon intelligence collection personal access" on public.pokemon_intelligence_collection_items for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "pokemon intelligence purchases personal access" on public.pokemon_intelligence_purchases for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "pokemon intelligence prices personal access" on public.pokemon_intelligence_price_observations for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "pokemon intelligence watchlist personal access" on public.pokemon_intelligence_watchlist for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');
create policy "pokemon intelligence restocks personal access" on public.pokemon_intelligence_restock_observations for all to anon, authenticated using (profile_key = 'owen-main') with check (profile_key = 'owen-main');

create index if not exists jarvis_notes_type_idx on public.jarvis_notes (profile_key, note_type, status);
create index if not exists jarvis_tasks_status_idx on public.jarvis_tasks (profile_key, status, due_date);
create index if not exists pokemon_intelligence_products_name_idx on public.pokemon_intelligence_products (profile_key, name);
create index if not exists pokemon_intelligence_purchases_date_idx on public.pokemon_intelligence_purchases (profile_key, purchase_date desc);
create index if not exists pokemon_intelligence_prices_product_idx on public.pokemon_intelligence_price_observations (profile_key, product_name, observed_at desc);
create index if not exists pokemon_intelligence_restocks_observed_idx on public.pokemon_intelligence_restock_observations (profile_key, observed_at desc);
