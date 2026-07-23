create policy rookie_seasons_update_own on public.rookie_seasons
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_seasons_delete_own on public.rookie_seasons
for delete to authenticated using (auth.uid() = user_id);

create policy rookie_athletic_tests_update_own on public.rookie_athletic_tests
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_athletic_tests_delete_own on public.rookie_athletic_tests
for delete to authenticated using (auth.uid() = user_id);

create policy rookie_context_snapshots_update_own on public.rookie_context_snapshots
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_context_snapshots_delete_own on public.rookie_context_snapshots
for delete to authenticated using (auth.uid() = user_id);

create policy rookie_market_snapshots_update_own on public.rookie_market_snapshots
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rookie_market_snapshots_delete_own on public.rookie_market_snapshots
for delete to authenticated using (auth.uid() = user_id);
