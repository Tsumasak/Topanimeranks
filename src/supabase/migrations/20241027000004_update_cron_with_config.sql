-- ============================================
-- Update cron jobs to use app_config table
-- ============================================

-- First, remove old cron jobs
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated-animes');

-- ============================================
-- Schedule: Sync Weekly Episodes (every 1 hour)
-- Rate limit: 3 req/sec, 60 req/min (Jikan API)
-- Current delay: 1000ms between requests = 1 req/sec (safe)
-- ============================================
SELECT cron.schedule(
  'sync-weekly-episodes',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'weekly_episodes'
      )
    ) AS request_id;
  $$
);

-- ============================================
-- Schedule: Sync Season Rankings (every 1 hour at 15min)
-- Offset by 15 minutes to avoid overlapping with weekly episodes
-- ============================================
SELECT cron.schedule(
  'sync-season-rankings',
  '15 * * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'season_rankings',
        'season', 'fall',
        'year', 2025
      )
    ) AS request_id;
  $$
);

-- ============================================
-- Schedule: Sync Anticipated Animes (every 1 hour at 30min)
-- Offset by 30 minutes to avoid overlapping
-- ============================================
SELECT cron.schedule(
  'sync-anticipated-animes',
  '30 * * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'anticipated'
      )
    ) AS request_id;
  $$
);

-- Show success
DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs updated successfully!';
  RAISE NOTICE '⚠️  Make sure to update app_config table with your credentials!';
  RAISE NOTICE '';
  RAISE NOTICE 'Check jobs: SELECT * FROM cron.job;';
END $$;