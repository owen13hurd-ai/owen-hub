-- Complete the owner-only mutation policies required by rookie imports and manual corrections.
-- Published model versions and score runs intentionally remain immutable.

create policy rookie_import_rows_update_own on public.rookie_import_rows
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy rookie_player_metrics_update_own on public.rookie_player_metrics
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_player_metrics_delete_own on public.rookie_player_metrics
for delete to authenticated using (auth.uid() = user_id);

create policy rookie_sources_update_own on public.rookie_sources
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_sources_delete_own on public.rookie_sources
for delete to authenticated using (auth.uid() = user_id);

create policy rookie_notes_delete_own on public.rookie_notes
for delete to authenticated using (auth.uid() = user_id);

create policy rookie_aliases_update_own on public.rookie_player_aliases
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_aliases_delete_own on public.rookie_player_aliases
for delete to authenticated using (auth.uid() = user_id);
