-- 20260608_auth_user_profiles.sql
-- Ensure user_profiles RLS allows users to read/update their own row

alter table user_profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can insert their own profile (first-time upsert from onboarding)
create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- Trigger: auto-create user_profiles row on first auth.users insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
