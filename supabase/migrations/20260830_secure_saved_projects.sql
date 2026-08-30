-- Ensure saved_projects has RLS enabled and is scoped to the owning user only.
-- This table is written to directly from the browser (anon key + user JWT),
-- so RLS is the ONLY enforcement boundary — there is no server-side
-- ownership check in application code.

alter table if exists saved_projects enable row level security;

drop policy if exists "Users can read own saved projects" on saved_projects;
create policy "Users can read own saved projects"
  on saved_projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved projects" on saved_projects;
create policy "Users can insert own saved projects"
  on saved_projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved projects" on saved_projects;
create policy "Users can update own saved projects"
  on saved_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved projects" on saved_projects;
create policy "Users can delete own saved projects"
  on saved_projects for delete
  using (auth.uid() = user_id);
