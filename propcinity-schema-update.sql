-- ============================================================
-- propcinity-schema-update.sql
-- Safe migration: Adds missing columns/tables to Supabase DB.
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── 1. builders: Add 6 score columns if missing ─────────────
ALTER TABLE builders ADD COLUMN IF NOT EXISTS total_projects_delivered INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS on_time_delivery_percent NUMERIC DEFAULT 100;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS avg_delay_months NUMERIC DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS legal_cases INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS customer_complaints INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS refund_disputes INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS builder_score INTEGER DEFAULT 50;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS total_units_delivered INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS years_in_business INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS rera_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS rera_id TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS established_year INTEGER;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS headquartered TEXT;

-- ── 2. contact_messages: Create table if not exists ─────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for contact_messages (safe to re-run)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Anyone can submit contact message'
  ) THEN
    CREATE POLICY "Anyone can submit contact message"
      ON contact_messages FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Admins can read contact messages'
  ) THEN
    CREATE POLICY "Admins can read contact messages"
      ON contact_messages FOR SELECT USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Admins can update contact messages'
  ) THEN
    CREATE POLICY "Admins can update contact messages"
      ON contact_messages FOR UPDATE USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ── 3. user_profiles: Add missing columns ───────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

-- ── 4. leads: Add booking_ref column + trigger if missing ───
ALTER TABLE leads ADD COLUMN IF NOT EXISTS booking_ref TEXT UNIQUE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unit_config_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_ready TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS finance_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS decision_maker TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_time TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS family_joining BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS weekend_preferred BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS virtual_tour_first BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_label TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS trigger_source TEXT;

-- Auto-generate booking_ref for existing rows
UPDATE leads SET booking_ref = 'REF-' || upper(substring(gen_random_uuid()::text, 1, 8))
WHERE booking_ref IS NULL;

-- Set NOT NULL after backfill
ALTER TABLE leads ALTER COLUMN booking_ref SET NOT NULL;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_booking_ref_key' AND conrelid = 'leads'::regclass
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_booking_ref_key UNIQUE (booking_ref);
  END IF;
END $$;

-- Auto-generate booking_ref on INSERT
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_ref IS NULL THEN
    NEW.booking_ref := 'REF-' || upper(substring(gen_random_uuid()::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_booking_ref ON leads;
CREATE TRIGGER trg_leads_booking_ref
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION generate_booking_ref();

-- ── 5. user_intents: Add missing columns ────────────────────
ALTER TABLE user_intents ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE user_intents ADD COLUMN IF NOT EXISTS bhk_types TEXT[] DEFAULT '{}';
ALTER TABLE user_intents ADD COLUMN IF NOT EXISTS intent_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE user_intents ADD COLUMN IF NOT EXISTS raw_answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE user_intents ADD COLUMN IF NOT EXISTS property_types TEXT[] DEFAULT '{}';
ALTER TABLE user_intents ADD COLUMN IF NOT EXISTS work_location TEXT;
ALTER TABLE user_intents ADD COLUMN IF NOT EXISTS location TEXT;

-- ── 6. user_profiles: Ensure RLS policies exist ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users access own profile'
  ) THEN
    CREATE POLICY "Users access own profile"
      ON user_profiles FOR ALL USING (auth.uid() = id);
  END IF;
END $$;

-- ── 7. builders: RLS policies if missing ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'builders' AND policyname = 'Public read active builders'
  ) THEN
    CREATE POLICY "Public read active builders"
      ON builders FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- ── 8. user_intents: RLS policies if missing ────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_intents' AND policyname = 'Users manage own intent'
  ) THEN
    CREATE POLICY "Users manage own intent"
      ON user_intents FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 9. leads: Unique index for user+project if missing ──────
CREATE INDEX IF NOT EXISTS leads_user_project_unique
  ON leads (user_id, project_id)
  WHERE user_id IS NOT NULL;
