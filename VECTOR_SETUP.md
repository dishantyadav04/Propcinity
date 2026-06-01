# Vector Search Setup (Run Once in Supabase Dashboard)

## Step 1: Enable pgvector in Supabase
1. Go to your Supabase project → Database → Extensions
2. Search for "vector" 
3. Enable it (toggle on)

## Step 2: Run the migration SQL
Go to Supabase → SQL Editor → New query
Copy and paste the contents of:
  supabase/migrations/20260601_vector_search.sql
Run it.

## Step 3: Verify
Run this query to confirm:
  select extname from pg_extension where extname = 'vector';
  -- Should return 1 row

  select column_name from information_schema.columns 
  where table_name = 'projects' and column_name = 'embedding';
  -- Should return 1 row

## Step 4: What happens automatically
- The /api/ai/embed endpoint is now ready
- Dashboard uses pure JS scoring (free) until embeddings are populated
- AI Chat has response caching to reduce duplicate API calls
- Session budget (15 msgs/day) prevents runaway costs

## Phase 2 (optional, when you have 50+ properties):
Run the one-time embedding script to populate project embeddings.
Contact your dev team for the script — it's in services/recommendations.ts
