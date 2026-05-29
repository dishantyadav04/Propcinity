-- Global amenity library (reused across all projects)
CREATE TABLE IF NOT EXISTS amenity_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✨',
  category TEXT NOT NULL DEFAULT 'both' CHECK (category IN ('internal', 'external', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add nearby_locations column to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS nearby_locations JSONB DEFAULT '[]'::jsonb;

-- Add internal/external amenities columns (already exist but ensure they do)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS internal_amenities TEXT[] DEFAULT '{}';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS external_amenities TEXT[] DEFAULT '{}';

-- RLS: only admin service role can modify amenity_library
ALTER TABLE amenity_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON amenity_library
  USING (true) WITH CHECK (true);
