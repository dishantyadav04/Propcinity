-- Migration: create projects_public view
-- This view was referenced in code but never deployed.

drop view if exists projects_public;

create view projects_public as
  select
    id, slug, name,
    builder_name, builder_logo,
    builder_years_experience, builder_completed_projects,
    builder_cities, builder_top_projects, builder_description,
    location, city, lat, lng, tagline, description,
    rera_id, rera_status, rera_expiry, rera_link,
    launch_date, possession_date, rera_possession_date,
    land_parcel_acres, total_towers, floors_per_tower,
    total_units, available_units,
    pros, cons, amenities, internal_amenities, external_amenities,
    nearby_locations, master_plan_images, rera_registrations,
    images, videos, brochure_url,
    construction_status, construction_percent,
    litigation, litigation_details, legal_notes,
    commencement_certificate, occupancy_certificate,
    payment_plans, bank_approvals,
    is_published, created_at, updated_at
  from projects
  where is_published = true;

grant select on projects_public to anon, authenticated;
