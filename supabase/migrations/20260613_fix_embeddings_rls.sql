-- Fix: user_intent_embeddings INSERT policy was overly permissive (WITH CHECK (true))
-- This allowed anon role to insert arbitrary embeddings, polluting vector search
-- Security reason: anonymous users should not be able to write to the embeddings table.
-- Only the authenticated user who owns the row (or the service role for server-side ops) should be able to insert.

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service insert embeddings" ON user_intent_embeddings;

-- New policy: only authenticated users can insert their own embedding row
-- Service role bypasses RLS automatically for server-side inserts
CREATE POLICY "Auth users insert own embeddings"
  ON user_intent_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Keep the public read policy as-is (it's intentional)
