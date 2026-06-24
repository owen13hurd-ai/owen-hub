create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.dynasty_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_key text not null,
  player_name text not null,
  position text not null,
  overall_rank integer not null,
  tier_label text,
  pick_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, player_key)
);

alter table public.dynasty_rankings enable row level security;

create policy "Users can read their own dynasty rankings"
on public.dynasty_rankings
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own dynasty rankings"
on public.dynasty_rankings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own dynasty rankings"
on public.dynasty_rankings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own dynasty rankings"
on public.dynasty_rankings
for delete
to authenticated
using (auth.uid() = user_id);
