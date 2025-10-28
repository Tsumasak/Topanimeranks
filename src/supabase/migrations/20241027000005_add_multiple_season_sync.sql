-- ============================================
-- Add cron jobs for multiple seasons
-- ============================================

-- Schedule: Sync Winter 2026 Rankings (every 10 minutes)
SELECT cron.schedule(
  'sync-winter-2026',
  '*/10 * * * *',
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
        'season', 'winter',
        'year', 2026
      )
    ) AS request_id;
  $$
);

-- Schedule: Sync Spring 2026 Rankings (every 10 minutes)
SELECT cron.schedule(
  'sync-spring-2026',
  '*/10 * * * *',
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
        'season', 'spring',
        'year', 2026
      )
    ) AS request_id;
  $$
);

-- Schedule: Sync Summer 2026 Rankings (every 10 minutes)
SELECT cron.schedule(
  'sync-summer-2026',
  '*/10 * * * *',
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
        'season', 'summer',
        'year', 2026
      )
    ) AS request_id;
  $$
);

-- Show success
DO $$
BEGIN
  RAISE NOTICE '✅ Multiple season sync jobs created successfully!';
  RAISE NOTICE '📅 Syncing: Winter 2026, Spring 2026, Summer 2026';
  RAISE NOTICE '';
  RAISE NOTICE 'Check all jobs: SELECT jobname, schedule FROM cron.job ORDER BY jobname;';
END $$;
