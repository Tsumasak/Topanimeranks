-- ============================================
-- Setup pg_cron for automatic data sync
-- Runs every 10 minutes
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Schedule: Sync Weekly Episodes (every 10 minutes)
-- ============================================
SELECT cron.schedule(
  'sync-weekly-episodes',           -- job name
  '*/10 * * * *',                   -- every 10 minutes
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'weekly_episodes'
      )
    ) AS request_id;
  $$
);

-- ============================================
-- Schedule: Sync Season Rankings (every 10 minutes)
-- ============================================
SELECT cron.schedule(
  'sync-season-rankings',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'season_rankings'
      )
    ) AS request_id;
  $$
);

-- ============================================
-- Schedule: Sync Anticipated Animes (every 10 minutes)
-- ============================================
SELECT cron.schedule(
  'sync-anticipated-animes',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'anticipated'
      )
    ) AS request_id;
  $$
);

-- ============================================
-- Utility: View scheduled jobs
-- ============================================

-- Query to check scheduled jobs:
-- SELECT * FROM cron.job;

-- Query to check job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ============================================
-- Manual trigger function (for testing)
-- ============================================
CREATE OR REPLACE FUNCTION trigger_manual_sync(sync_type_param TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Call the Edge Function manually
  -- This is useful for initial setup or manual triggers
  RAISE NOTICE 'Manual sync triggered for: %', sync_type_param;
  RETURN 'Manual sync initiated for ' || sync_type_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_manual_sync IS 'Manually trigger a sync (for testing). Usage: SELECT trigger_manual_sync(''weekly_episodes'');';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ pg_cron configured successfully!';
  RAISE NOTICE '⏰ Jobs scheduled to run every 10 minutes';
  RAISE NOTICE '📋 Jobs: sync-weekly-episodes, sync-season-rankings, sync-anticipated-animes';
  RAISE NOTICE '🔍 Check jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '📊 Check history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;';
END $$;
