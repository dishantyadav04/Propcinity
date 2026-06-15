ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Prevent duplicate submissions from same logged-in user for same project
CREATE UNIQUE INDEX IF NOT EXISTS leads_user_project_unique
  ON leads (user_id, project_id)
  WHERE user_id IS NOT NULL;
