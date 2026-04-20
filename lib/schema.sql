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
    construction_status in ('pre_launch','under_construction','ready_to_move')
  ),
  construction_percent integer default 0
    check (construction_percent >= 0 and construction_percent <= 100),
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

-- projects_public view - ALWAYS use this in client queries
create view projects_public as
  select
    id, slug, name, builder_name, builder_score, builder_logo,
    location, city, lat, lng, tagline, description,
    trust_score, risk_label, rera_id, rera_expiry,
    launch_date, possession_date, total_units, available_units,
    pros, cons, amenities, images,
    construction_status, construction_percent,
    is_published, created_at, updated_at
  from projects
  where is_published = true;

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

create policy "Public read unit_configs"
  on unit_configs for select using (true);

create policy "Users manage own intent"
  on user_intents for all using (auth.uid() = user_id);

create policy "Users manage own saved"
  on saved_projects for all using (auth.uid() = user_id);

create policy "Users manage own rejected"
  on rejected_projects for all using (auth.uid() = user_id);

create policy "Anyone can submit lead"
  on leads for insert with check (true);
