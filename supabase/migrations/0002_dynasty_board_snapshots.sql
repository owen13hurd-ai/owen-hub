create table if not exists public.dynasty_boards (
  board_key text primary key,
  label text not null default 'Dynasty Board',
  rows_by_scope jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dynasty_boards enable row level security;

drop policy if exists "Anyone can read Owen dynasty board" on public.dynasty_boards;
create policy "Anyone can read Owen dynasty board"
on public.dynasty_boards
for select
to anon, authenticated
using (board_key = 'owen-main');

drop policy if exists "Anyone can insert Owen dynasty board" on public.dynasty_boards;
create policy "Anyone can insert Owen dynasty board"
on public.dynasty_boards
for insert
to anon, authenticated
with check (board_key = 'owen-main');

drop policy if exists "Anyone can update Owen dynasty board" on public.dynasty_boards;
create policy "Anyone can update Owen dynasty board"
on public.dynasty_boards
for update
to anon, authenticated
using (board_key = 'owen-main')
with check (board_key = 'owen-main');

