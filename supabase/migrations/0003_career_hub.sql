-- Career Hub v2 storage. Run this migration before enabling cloud sync.
create table if not exists public.career_profiles (
  profile_key text primary key,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.career_applications (
  id text primary key,
  profile_key text not null references public.career_profiles(profile_key) on delete cascade,
  company text not null,
  role text not null,
  job_url text not null default '',
  source text not null default '',
  status text not null default 'Interested',
  priority text not null default 'Medium',
  rating integer not null default 0 check (rating between 0 and 5),
  notes text not null default '',
  interview_notes text not null default '',
  recruiter_contact text not null default '',
  salary text not null default '',
  applied_date date,
  follow_up_date date,
  resume_version text not null default '',
  attachment_paths jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_key, company, role)
);

create table if not exists public.career_seen_jobs (
  profile_key text not null references public.career_profiles(profile_key) on delete cascade,
  job_key text not null,
  payload jsonb not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  closed_at timestamptz,
  primary key (profile_key, job_key)
);

create table if not exists public.career_saved_searches (
  id bigint generated always as identity primary key,
  profile_key text not null references public.career_profiles(profile_key) on delete cascade,
  name text not null,
  preferences jsonb not null,
  created_at timestamptz not null default now(),
  unique (profile_key, name)
);

alter table public.career_profiles enable row level security;
alter table public.career_applications enable row level security;
alter table public.career_seen_jobs enable row level security;
alter table public.career_saved_searches enable row level security;

-- This personal app currently permits its publishable key, matching the existing
-- dynasty-board setup. Replace these with auth.uid() policies when auth is required.
create policy "career profile personal access" on public.career_profiles for all using (true) with check (true);
create policy "career applications personal access" on public.career_applications for all using (true) with check (true);
create policy "career seen jobs personal access" on public.career_seen_jobs for all using (true) with check (true);
create policy "career searches personal access" on public.career_saved_searches for all using (true) with check (true);

insert into public.career_profiles (profile_key) values ('owen-main') on conflict do nothing;

