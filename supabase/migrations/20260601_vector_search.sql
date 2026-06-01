-- Enable pgvector extension (run once in Supabase dashboard Extensions tab too)
create extension if not exists vector;

-- Add embedding column to projects table (nullable — populated lazily)
alter table public.projects
  add column if not exists embedding vector(1536);

-- Store user intent embeddings to avoid re-embedding on every visit
create table if not exists public.user_intent_embeddings (
  id uuid primary key default gen_random_uuid(),
  intent_hash text not null unique,
  embedding vector(1536) not null,
  created_at timestamptz default now()
);

-- Index for fast similarity search on projects
create index if not exists projects_embedding_idx
  on public.projects using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- RPC function for vector similarity search
create or replace function match_projects(
  query_embedding vector(1536),
  match_count int default 15
)
returns table (
  id text,
  similarity float
)
language sql stable
as $$
  select
    id::text,
    1 - (embedding <=> query_embedding) as similarity
  from public.projects
  where embedding is not null
    and is_published = true
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- RLS for user_intent_embeddings — allow all reads/writes (no auth in this app)
alter table public.user_intent_embeddings enable row level security;
create policy "Public access" on public.user_intent_embeddings
  for all using (true) with check (true);
