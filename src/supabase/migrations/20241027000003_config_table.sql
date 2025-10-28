-- ============================================
-- Create configuration table for cron jobs
-- ============================================

-- Create config table
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for cron)
DROP POLICY IF EXISTS "Allow public read access to app_config" ON app_config;
CREATE POLICY "Allow public read access to app_config"
  ON app_config FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access to app_config" ON app_config;
CREATE POLICY "Allow service role full access to app_config"
  ON app_config
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create helper function to get config
CREATE OR REPLACE FUNCTION get_config(config_key TEXT)
RETURNS TEXT AS $$
  SELECT value FROM app_config WHERE key = config_key;
$$ LANGUAGE SQL STABLE;

-- Insert placeholder values (YOU NEED TO UPDATE THESE!)
INSERT INTO app_config (key, value) 
VALUES 
  ('supabase_url', 'https://YOUR-PROJECT-ID.supabase.co'),
  ('supabase_anon_key', 'YOUR-ANON-KEY-HERE')
ON CONFLICT (key) DO NOTHING;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Config table created successfully!';
  RAISE NOTICE '⚠️  IMPORTANT: Update the config values with your actual Supabase credentials!';
  RAISE NOTICE '';
  RAISE NOTICE 'Run this SQL to update:';
  RAISE NOTICE '';
  RAISE NOTICE 'UPDATE app_config SET value = ''https://YOUR-PROJECT.supabase.co'' WHERE key = ''supabase_url'';';
  RAISE NOTICE 'UPDATE app_config SET value = ''YOUR-ANON-KEY'' WHERE key = ''supabase_anon_key'';';
END $$;
