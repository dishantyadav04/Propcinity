CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT NOT NULL DEFAULT '',
  content_json JSONB,
  cover_image TEXT,
  cover_image_alt TEXT,
  author_name TEXT NOT NULL DEFAULT 'Propcinity Team',
  author_avatar TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  reading_time_minutes INTEGER,

  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_image TEXT,
  faq_jsonld JSONB,
  keywords TEXT[] DEFAULT '{}',

  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blogs_status_published_at_idx ON blogs (status, published_at DESC);
CREATE INDEX IF NOT EXISTS blogs_category_idx ON blogs (category);
CREATE INDEX IF NOT EXISTS blogs_tags_idx ON blogs USING GIN (tags);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published blogs" ON blogs
  FOR SELECT
  USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "Service role full access" ON blogs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION set_blogs_updated_at();
