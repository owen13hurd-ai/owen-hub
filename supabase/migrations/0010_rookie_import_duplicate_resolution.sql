alter table public.rookie_import_rows
  add column duplicate_candidates jsonb not null default '[]'::jsonb,
  add column resolution_status text not null default 'create'
    check (resolution_status in ('pending', 'matched', 'create'));

create index rookie_import_pending_resolution_idx
  on public.rookie_import_rows (user_id, resolution_status, created_at desc);

comment on column public.rookie_import_rows.duplicate_candidates is
  'Advisory candidate IDs and labels. A candidate is never merged without an explicit resolution.';
