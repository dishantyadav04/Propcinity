-- Projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  builder_name text,
  builder_score integer check (builder_score >= 0 and builder_score <= 100),
  builder_logo text,
  location text,
  city text default 'Pune',
  lat numeric,
  lng numeric,
  tagline text,
  description text,
  trust_score integer check (trust_score >= 0 and trust_score <= 100),
  risk_label text check (risk_label in ('low','medium','high')),
  rera_id text,
  rera_expiry date,
  launch_date date,
  possession_date date,
  total_units integer,
  available_units integer,
  pros text[] default '{}',
  cons text[] default '{}',
  amenities text[] default '{}',
  images text[] default '{}',
  construction_status text check (
    construction_status in ('pre_launch','new_launch','under_construction','ready_to_move')
  ),
  construction_percent integer default 0
    check (construction_percent >= 0 and construction_percent <= 100),

  -- Builder info (denormalised for display)
  builder_id uuid references builders,
  builder_years_experience integer,
  builder_completed_projects integer,
  builder_cities text[] default '{}',
  builder_top_projects jsonb default '[]'::jsonb,
  builder_description text,

  -- RERA
  rera_link text,
  rera_possession_date date,

  -- Project specs
  land_parcel_acres numeric,
  total_towers integer,
  floors_per_tower text,

  -- Legal
  litigation boolean default false,
  litigation_details text,
  commencement_certificate boolean default false,
  occupancy_certificate boolean default false,
  legal_notes text,

  -- Financial
  payment_plans jsonb default '[]'::jsonb,
  bank_approvals jsonb default '[]'::jsonb,

  -- Media
  videos jsonb default '[]'::jsonb,
  brochure_url text,

  commission_rate numeric,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unit configs
create table unit_configs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  type text check (type in ('1BHK','2BHK','3BHK','4BHK','Villa','Plot')),
  area numeric,
  price_min numeric,
  price_max numeric,
  price_per_sqft numeric generated always as (
    case when area > 0 then price_min / area else null end
  ) stored,
  available integer default 0,
  total integer default 0,
  floor_range text,
  facing text[] default '{}',
  images text[] default '{}',
  highlights text[] default '{}',
  created_at timestamptz default now()
);

-- User intents
create table user_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade unique,
  budget_min numeric,
  budget_max numeric,
  location text,
  work_location text,
  purpose text check (purpose in ('self-use','investment')),
  property_types text[] default '{}',
  timeline text,
  updated_at timestamptz default now()
);

-- Saved projects
create table saved_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  project_id uuid references projects on delete cascade,
  saved_at timestamptz default now(),
  unique(user_id, project_id)
);

-- Rejected projects
create table rejected_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  project_id uuid references projects on delete cascade,
  reason text,
  rejected_at timestamptz default now(),
  unique(user_id, project_id)
);

-- Leads - ops only, NEVER expose to client
create table leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects,
  unit_config_id uuid references unit_configs,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  timeline text,
  budget_ready text,
  finance_type text,
  decision_maker text,
  purpose text,
  preferred_date date,
  preferred_time text,
  family_joining boolean default false,
  weekend_preferred boolean default false,
  virtual_tour_first boolean default false,
  intent_score integer,
  intent_label text,
  trigger_source text,
  status text default 'new',
  booking_ref text unique default
    'REF-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at timestamptz default now()
);

-- Prevent duplicate lead submissions from same logged-in user for same project
create unique index if not exists leads_user_project_unique
  on leads (user_id, project_id)
  where user_id is not null;

-- Drop and recreate to update column list
drop view if exists projects_public;

create view projects_public as
  select
    id, slug, name,
    builder_name, builder_logo,
    builder_years_experience, builder_completed_projects,
    builder_cities, builder_top_projects, builder_description,
    location, city, lat, lng, tagline, description,
    rera_id, rera_expiry, rera_link,
    launch_date, possession_date, rera_possession_date,
    land_parcel_acres, total_towers, floors_per_tower,
    total_units, available_units,
    pros, cons, amenities, internal_amenities, external_amenities,
    images, videos, brochure_url,
    construction_status, construction_percent,
    litigation, litigation_details,
    commencement_certificate, occupancy_certificate,
    payment_plans, bank_approvals,
    is_published, created_at, updated_at
    -- commission_rate is deliberately excluded
    -- trust_score, risk_label, builder_score are deliberately excluded
  from projects
  where is_published = true;

comment on view projects_public is
  'Public project view. commission_rate, trust_score, risk_label,
   builder_score are intentionally excluded for security.';

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- Enable RLS
alter table projects enable row level security;
alter table unit_configs enable row level security;
alter table user_intents enable row level security;
alter table saved_projects enable row level security;
alter table rejected_projects enable row level security;
alter table leads enable row level security;

-- RLS policies
create policy "Public read published projects"
  on projects for select using (is_published = true);

create policy "Public read unit_configs for published projects"
  on unit_configs for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_id and p.is_published = true
    )
  );

create policy "Users manage own intent"
  on user_intents for all using (auth.uid() = user_id);

create policy "Users manage own saved"
  on saved_projects for all using (auth.uid() = user_id);

create policy "Users manage own rejected"
  on rejected_projects for all using (auth.uid() = user_id);

create policy "Anyone can submit lead"
  on leads for insert with check (true);

-- Builders table (create once, reuse across projects)
create table if not exists builders (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  name text not null,
  logo text,
  website text,
  established_year integer,
  headquartered text,
  description text,

  -- Static data (admin enters once)
  rera_registered boolean default false,
  rera_id text,
  total_projects_delivered integer default 0,
  total_units_delivered integer default 0,
  years_in_business integer default 0,

  -- Dynamic data (updated per-project, affects score)
  avg_delay_months numeric default 0,       -- avg across all projects
  on_time_delivery_percent numeric default 100,
  legal_cases integer default 0,
  customer_complaints integer default 0,
  refund_disputes integer default 0,

  -- Computed score (0-100, auto-calculated)
  builder_score integer default 50,
  score_breakdown jsonb,                     -- { rera:25, track:30, delay:20, legal:15, customer:10 }

  -- Meta
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Builder project updates (tracks per-project delivery data)
create table if not exists builder_project_updates (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid references builders on delete cascade,
  project_id uuid references projects on delete cascade,
  project_name text,

  -- Per-project delivery record
  promised_possession date,
  actual_possession date,          -- null if ongoing
  delay_months numeric default 0,
  is_delivered boolean default false,
  quality_rating integer,          -- 1-5, can be entered by admin
  complaints_count integer default 0,
  notes text,

  updated_at timestamptz default now()
);

-- Users table (reads from auth.users, admin view)
create table if not exists user_profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  phone text,
  email text,
  city text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  last_active timestamptz
);

-- RLS
alter table builders enable row level security;
alter table builder_project_updates enable row level security;
alter table user_profiles enable row level security;

-- builders: public read of active builders only; service role bypasses RLS for writes
create policy "Public read active builders"
  on builders for select using (is_active = true);

-- builder_project_updates: no public access (service role only)

-- user_profiles: users can only access their own row
create policy "Users access own profile"
  on user_profiles for all using (auth.uid() = id);

-- Add builder_id FK to projects table
alter table projects add column if not exists builder_id uuid references builders;

-- Contact form messages
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  status text default 'new', -- new | read | replied
  created_at timestamptz default now()
);

-- Only admins can read; anyone can insert
alter table contact_messages enable row level security;

create policy "Anyone can submit contact message"
  on contact_messages for insert with check (true);

create policy "Admins can read contact messages"
  on contact_messages for select
  using (auth.role() = 'service_role');

create policy "Admins can update contact messages"
  on contact_messages for update
  using (auth.role() = 'service_role');
