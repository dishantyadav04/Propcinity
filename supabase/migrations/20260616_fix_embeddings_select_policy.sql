-- Drop the overly-permissive public read policy
DROP POLICY IF EXISTS "Public read embeddings" ON user_intent_embeddings;

-- Add owner-only read policy
CREATE POLICY "Users can read own embeddings"
  ON user_intent_embeddings
  FOR SELECT
  USING (auth.uid() = user_id);
