-- Drop all broken permissive policies
DROP POLICY IF EXISTS "Service role full access builders" ON builders;
DROP POLICY IF EXISTS "Service role full access bpu" ON builder_project_updates;
DROP POLICY IF EXISTS "Service role full access users" ON user_profiles;
DROP POLICY IF EXISTS "Public access" ON user_intent_embeddings;
DROP POLICY IF EXISTS "Service role only" ON admin_settings;
DROP POLICY IF EXISTS "Admin full access" ON amenity_library;

-- builders: public read of safe fields only (service role bypasses RLS for writes)
CREATE POLICY "Public read active builders"
  ON builders FOR SELECT
  USING (is_active = true);

-- builder_project_updates: no public access (service role only)
-- No policy needed — service role bypasses RLS by default

-- user_profiles: users can only access their own row
-- (These correct policies already exist in 20260608 migration — just ensure the bad one is dropped above)

-- admin_settings: no public access (service role only)
-- No policy needed — service role bypasses RLS

-- amenity_library: public read, no public write
CREATE POLICY "Public read amenity_library"
  ON amenity_library FOR SELECT USING (true);
-- Write access is service role only (no insert/update/delete policy = denied for anon/authed)

-- user_intent_embeddings: public read only
CREATE POLICY "Public read embeddings"
  ON user_intent_embeddings FOR SELECT USING (true);
CREATE POLICY "Service insert embeddings"
  ON user_intent_embeddings FOR INSERT
  WITH CHECK (true); -- still allows server-side inserts via service role

-- unit_configs: only expose configs for PUBLISHED projects (prevents draft enumeration)
DROP POLICY IF EXISTS "Public read unit_configs" ON unit_configs;
CREATE POLICY "Public read unit_configs for published projects"
  ON unit_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.is_published = true
    )
  );

-- leads: explicit deny for non-service-role reads
DROP POLICY IF EXISTS "No public lead reads" ON leads;
CREATE POLICY "No public lead reads"
  ON leads FOR SELECT USING (false);
