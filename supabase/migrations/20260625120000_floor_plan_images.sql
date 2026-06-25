-- Project-level floor plan images (parallel to master_plan_images)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS floor_plan_images TEXT[] DEFAULT '{}';
