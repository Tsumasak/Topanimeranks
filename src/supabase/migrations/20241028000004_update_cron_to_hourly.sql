-- ============================================
-- Update cron jobs to run every 1 hour
-- ============================================

-- Remove existing cron jobs
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated-animes');

-- ============================================
-- Schedule: Sync Weekly Episodes (every 1 hour)
-- ============================================
SELECT cron.schedule(
  'sync-weekly-episodes',
  '0 * * * *',  -- Every hour at minute 0
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
-- Schedule: Sync Season Rankings - Fall 2025 (every 1 hour at :15)
-- ============================================
SELECT cron.schedule(
  'sync-season-fall-2025',
  '15 * * * *',  -- Every hour at minute 15
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
-- Schedule: Sync Season Rankings - Winter 2026 (every 1 hour at :20)
-- ============================================
SELECT cron.schedule(
  'sync-season-winter-2026',
  '20 * * * *',  -- Every hour at minute 20
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

-- ============================================
-- Schedule: Sync Season Rankings - Spring 2026 (every 1 hour at :25)
-- ============================================
SELECT cron.schedule(
  'sync-season-spring-2026',
  '25 * * * *',  -- Every hour at minute 25
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

-- ============================================
-- Schedule: Sync Upcoming Animes for "Later" tab (every 1 hour at :30)
-- ============================================
SELECT cron.schedule(
  'sync-upcoming-animes',
  '30 * * * *',  -- Every hour at minute 30
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'upcoming'
      )
    ) AS request_id;
  $$
);

-- ============================================
-- Schedule: Sync Anticipated Animes (every 1 hour at :35)
-- ============================================
SELECT cron.schedule(
  'sync-anticipated-animes',
  '35 * * * *',  -- Every hour at minute 35
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

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs updated to run every 1 hour!';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Schedule:';
  RAISE NOTICE '  :00 - Weekly Episodes';
  RAISE NOTICE '  :15 - Fall 2025 Season';
  RAISE NOTICE '  :20 - Winter 2026 Season';
  RAISE NOTICE '  :25 - Spring 2026 Season';
  RAISE NOTICE '  :30 - Upcoming Animes (Later tab)';
  RAISE NOTICE '  :35 - Anticipated Animes';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Check jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '📊 Check history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;';
END $$;
