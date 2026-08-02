-- ============================================================
-- Migration: cities + localities tables
-- Mirrors the amenity_library pattern for RLS policies.
-- ============================================================

-- 1. cities table
CREATE TABLE IF NOT EXISTS cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  state       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. localities table
CREATE TABLE IF NOT EXISTS localities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id     UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (city_id, name)
);

-- 3. Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — mirror amenity_library pattern from 20260611_fix_rls_policies.sql
--    Public SELECT where is_active = true; writes are service-role only (no insert/update/delete policy = denied for anon/authed)

CREATE POLICY "Public read active cities"
  ON cities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public read active localities"
  ON localities FOR SELECT
  USING (is_active = true);

-- 5. Seed cities
INSERT INTO cities (name, state) VALUES ('Pune', 'Maharashtra'), ('Mumbai', 'Maharashtra')
  ON CONFLICT (name) DO NOTHING;

-- 6. Seed localities for Pune and Mumbai
WITH pune AS (SELECT id FROM cities WHERE name = 'Pune' LIMIT 1),
mumbai AS (SELECT id FROM cities WHERE name = 'Mumbai' LIMIT 1)
INSERT INTO localities (city_id, name)
SELECT pune.id, locality_name FROM pune,
(VALUES
  ('Wakad'),
  ('Hinjewadi'),
  ('Baner'),
  ('Balewadi'),
  ('Kothrud'),
  ('Kharadi'),
  ('Viman Nagar'),
  ('Koregaon Park'),
  ('Hadapsar'),
  ('NIBM')
) AS t(locality_name)
ON CONFLICT (city_id, name) DO NOTHING;

INSERT INTO localities (city_id, name)
SELECT mumbai.id, locality_name FROM mumbai,
(VALUES
  ('Bandra'),
  ('Andheri'),
  ('Juhu'),
  ('Powai'),
  ('Thane'),
  ('Borivali'),
  ('Dadar'),
  ('Marine Lines'),
  ('Goregaon'),
  ('Vile Parle')
) AS t(locality_name)
ON CONFLICT (city_id, name) DO NOTHING;
