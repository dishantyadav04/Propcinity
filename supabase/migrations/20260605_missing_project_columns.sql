-- Add missing columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS builder_years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS builder_completed_projects INTEGER,
  ADD COLUMN IF NOT EXISTS builder_cities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS builder_top_projects JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS builder_description TEXT,
  ADD COLUMN IF NOT EXISTS rera_link TEXT,
  ADD COLUMN IF NOT EXISTS rera_possession_date DATE,
  ADD COLUMN IF NOT EXISTS land_parcel_acres NUMERIC,
  ADD COLUMN IF NOT EXISTS total_towers INTEGER,
  ADD COLUMN IF NOT EXISTS floors_per_tower TEXT,
  ADD COLUMN IF NOT EXISTS litigation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS litigation_details TEXT,
  ADD COLUMN IF NOT EXISTS commencement_certificate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS occupancy_certificate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_notes TEXT,
  ADD COLUMN IF NOT EXISTS payment_plans JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_approvals JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brochure_url TEXT;

-- Fix construction_status to include new_launch
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_construction_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_construction_status_check
  CHECK (construction_status IN ('pre_launch','new_launch','under_construction','ready_to_move'));
