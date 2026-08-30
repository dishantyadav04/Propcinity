-- AI chat message history, scoped to the owning user only.
-- Written server-side via the user's authenticated session (see
-- app/api/ai/ask/route.ts), so RLS is still the enforcement boundary.

create table if not exists ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_user_id_created_at_idx
  on ai_chat_messages (user_id, created_at);

alter table ai_chat_messages enable row level security;

drop policy if exists "Users can read own chat messages" on ai_chat_messages;
create policy "Users can read own chat messages"
  on ai_chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat messages" on ai_chat_messages;
create policy "Users can insert own chat messages"
  on ai_chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat messages" on ai_chat_messages;
create policy "Users can delete own chat messages"
  on ai_chat_messages for delete
  using (auth.uid() = user_id);
