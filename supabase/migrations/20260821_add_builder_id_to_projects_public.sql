-- Migration: add builder_id, builder_score and score_breakdown to projects_public
-- so the read path can join-at-read against the builders table for rich builder data.

drop view if exists projects_public;

create view projects_public as
  select
    id, slug, name,
    builder_id, builder_name, builder_logo,
    builder_years_experience, builder_completed_projects,
    builder_cities, builder_top_projects, builder_description,
    builder_score, score_breakdown,
    location, city, lat, lng, tagline, description,
    rera_id, rera_status, rera_expiry, rera_link,
    possession_date, rera_possession_date,
    land_parcel_acres, total_towers, floors_per_tower,
    pros, cons, amenities, internal_amenities, external_amenities,
    nearby_locations, master_plan_images, rera_registrations,
    images, videos, brochure_url, floor_plan_images,
    construction_status, construction_percent,
    litigation, litigation_details, legal_notes,
    commencement_certificate, occupancy_certificate,
    payment_plans, bank_approvals,
    is_published, created_at, updated_at
  from projects
  where is_published = true;

grant select on projects_public to anon, authenticated;
