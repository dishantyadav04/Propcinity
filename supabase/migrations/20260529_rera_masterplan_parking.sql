-- Multiple RERA registrations per project
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS rera_registrations JSONB DEFAULT '[]'::jsonb;

-- Project-level master plan images
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS master_plan_images TEXT[] DEFAULT '{}';

-- Parking spots per unit config
ALTER TABLE unit_configs
  ADD COLUMN IF NOT EXISTS parking INTEGER;
