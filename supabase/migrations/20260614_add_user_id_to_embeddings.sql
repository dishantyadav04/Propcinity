-- 20260614_add_user_id_to_embeddings.sql
-- Adds the user_id column that the RLS policy in 20260613 references.
-- Without this column, the INSERT policy silently fails for authenticated users,
-- breaking the recommendation engine's embedding storage.

ALTER TABLE public.user_intent_embeddings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS user_intent_embeddings_user_id_idx
  ON public.user_intent_embeddings (user_id);

-- The RLS policy in 20260613 already correctly references this column:
-- CREATE POLICY "Auth users insert own embeddings"
--   ON user_intent_embeddings FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- No policy changes needed here.
