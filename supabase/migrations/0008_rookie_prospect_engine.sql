create type public.rookie_position as enum ('RB', 'WR');
create type public.rookie_model_status as enum ('draft', 'published', 'retired');
create type public.rookie_methodology_class as enum ('documented', 'partial', 'inference', 'opinion');

create table public.rookie_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  url text,
  author text,
  publication text,
  published_on date,
  accessed_at timestamptz not null default now(),
  license text,
  reliability text not null check (reliability in ('high', 'medium', 'low')),
  methodology_class public.rookie_methodology_class not null,
  summary text,
  created_at timestamptz not null default now()
);

create table public.rookie_import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.rookie_sources(id) on delete set null,
  filename text not null,
  status text not null check (status in ('previewed', 'committed', 'failed')),
  mapping jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  valid_row_count integer not null default 0,
  invalid_row_count integer not null default 0,
  committed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rookie_players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text,
  name text not null,
  position public.rookie_position not null,
  class_year integer not null check (class_year between 2000 and 2100),
  school text,
  conference text,
  birthdate date,
  age_at_draft numeric,
  height_inches numeric,
  weight_pounds numeric,
  bmi numeric,
  recruiting_rating numeric,
  early_declare boolean,
  nfl_team text,
  draft_round integer,
  overall_pick integer,
  source_id uuid references public.rookie_sources(id) on delete set null,
  import_batch_id uuid references public.rookie_import_batches(id) on delete set null,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, class_year, position, name)
);

create table public.rookie_player_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  alias text not null,
  source_id uuid references public.rookie_sources(id) on delete set null,
  unique (user_id, alias)
);

create table public.rookie_import_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.rookie_import_batches(id) on delete cascade,
  source_row integer not null,
  raw_data jsonb not null,
  normalized_data jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  matched_player_id uuid references public.rookie_players(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (batch_id, source_row)
);

create table public.rookie_seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  season integer not null,
  games integer,
  attempts integer,
  carries integer,
  targets integer,
  receptions integer,
  routes integer,
  passing_yards numeric,
  rushing_yards numeric,
  receiving_yards numeric,
  touchdowns numeric,
  team_pass_attempts integer,
  team_targets integer,
  team_rushing_yards numeric,
  team_receiving_yards numeric,
  yards_per_route_run numeric,
  target_share numeric,
  receiving_yard_share numeric,
  rushing_yard_share numeric,
  missed_tackles_per_attempt numeric,
  yards_after_contact_per_attempt numeric,
  source_id uuid references public.rookie_sources(id) on delete set null,
  import_batch_id uuid references public.rookie_import_batches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (player_id, season)
);

create table public.rookie_player_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  metric_key text not null,
  value numeric,
  as_of_date date not null,
  source_id uuid references public.rookie_sources(id) on delete set null,
  import_batch_id uuid references public.rookie_import_batches(id) on delete set null,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  unique (player_id, metric_key, as_of_date, source_id)
);

create table public.rookie_athletic_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  event_type text not null check (event_type in ('combine', 'pro_day', 'other')),
  event_date date,
  forty_seconds numeric,
  vertical_inches numeric,
  broad_inches numeric,
  shuttle_seconds numeric,
  three_cone_seconds numeric,
  bench_reps integer,
  speed_score numeric,
  burst_score numeric,
  ras numeric,
  source_id uuid references public.rookie_sources(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.rookie_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  observed_at timestamptz not null,
  overall_pick integer,
  nfl_team text,
  landing_spot_score numeric check (landing_spot_score between 0 and 100),
  coaching_score numeric check (coaching_score between 0 and 100),
  quarterback_score numeric check (quarterback_score between 0 and 100),
  offensive_line_score numeric check (offensive_line_score between 0 and 100),
  depth_chart_score numeric check (depth_chart_score between 0 and 100),
  source_id uuid references public.rookie_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (player_id, observed_at)
);

create table public.rookie_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  observed_at timestamptz not null,
  provider text not null,
  format text not null,
  rookie_adp numeric,
  dynasty_adp numeric,
  market_value numeric,
  source_id uuid references public.rookie_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (player_id, provider, format, observed_at)
);

create table public.rookie_model_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position public.rookie_position not null,
  label text not null,
  semantic_version text not null,
  status public.rookie_model_status not null default 'draft',
  configuration jsonb not null,
  reference_cohort jsonb not null default '{}'::jsonb,
  code_version text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, position, semantic_version)
);

create table public.rookie_score_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  model_version_id uuid not null references public.rookie_model_versions(id) on delete restrict,
  as_of_date date not null,
  prospect_score numeric,
  draft_capital_score numeric,
  situation_score numeric,
  market_score numeric,
  overall_score numeric,
  data_coverage numeric not null check (data_coverage between 0 and 100),
  position_rank integer,
  overall_rank integer,
  tier text,
  normalization text not null check (normalization in ('class-relative', 'historical-percentile')),
  created_at timestamptz not null default now()
);

create table public.rookie_score_components (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score_run_id uuid not null references public.rookie_score_runs(id) on delete cascade,
  metric_key text not null,
  metric_label text not null,
  family_key text not null,
  raw_value numeric,
  normalized_value numeric,
  effective_weight numeric not null,
  contribution numeric,
  missing boolean not null,
  explanation text not null,
  source_id uuid references public.rookie_sources(id) on delete set null,
  unique (score_run_id, metric_key)
);

create table public.rookie_manual_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  format text not null default '12-team-superflex',
  manual_rank integer,
  manual_tier text,
  updated_at timestamptz not null default now(),
  unique (user_id, player_id, format)
);

create table public.rookie_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  body text not null,
  source_id uuid references public.rookie_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rookie_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.rookie_players(id) on delete cascade,
  nfl_season integer not null,
  games integer,
  fantasy_points numeric,
  fantasy_ppg numeric,
  position_finish integer,
  peak_dynasty_value numeric,
  end_of_season_dynasty_value numeric,
  source_id uuid references public.rookie_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (player_id, nfl_season)
);

create index rookie_players_class_position_idx on public.rookie_players (user_id, class_year, position);
create index rookie_scores_ranking_idx on public.rookie_score_runs (user_id, model_version_id, overall_score desc);
create index rookie_market_history_idx on public.rookie_market_snapshots (player_id, observed_at desc);

create or replace function public.prevent_published_rookie_model_change()
returns trigger language plpgsql as $$
begin
  if old.status = 'published' then
    raise exception 'Published rookie model versions are immutable';
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger prevent_published_rookie_model_change
before update or delete on public.rookie_model_versions
for each row execute function public.prevent_published_rookie_model_change();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'rookie_sources', 'rookie_import_batches', 'rookie_players', 'rookie_player_aliases',
    'rookie_import_rows', 'rookie_seasons', 'rookie_player_metrics', 'rookie_athletic_tests', 'rookie_context_snapshots',
    'rookie_market_snapshots', 'rookie_model_versions', 'rookie_score_runs',
    'rookie_score_components', 'rookie_manual_rankings', 'rookie_notes', 'rookie_outcomes'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      table_name || '_insert_own', table_name
    );
  end loop;
end $$;

create policy rookie_players_update_own on public.rookie_players
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_players_delete_own on public.rookie_players
for delete to authenticated using (auth.uid() = user_id);
create policy rookie_model_versions_update_drafts on public.rookie_model_versions
for update to authenticated using (auth.uid() = user_id and status = 'draft')
with check (auth.uid() = user_id);
create policy rookie_import_batches_update_own on public.rookie_import_batches
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_manual_rankings_update_own on public.rookie_manual_rankings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_notes_update_own on public.rookie_notes
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.rookie_score_runs is 'Immutable calculated snapshots. Insert a new run rather than overwriting history.';
comment on table public.rookie_sources is 'Field and research provenance. Proprietary sources require documented permission.';
