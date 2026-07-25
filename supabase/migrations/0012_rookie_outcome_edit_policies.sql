create policy rookie_outcomes_update_own on public.rookie_outcomes
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_outcomes_delete_own on public.rookie_outcomes
for delete to authenticated using (auth.uid() = user_id);

comment on table public.rookie_outcomes is
  'Sourced NFL and dynasty outcome snapshots used only for validation, never as prospect inputs.';
