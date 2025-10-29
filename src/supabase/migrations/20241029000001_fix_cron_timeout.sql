-- ============================================
-- Fix: Increase pg_net timeout from 5s to 90s
-- ============================================
-- Problem: Cron jobs were timing out after 5 seconds (default pg_net timeout)
-- Solution: Increase timeout to 90 seconds to allow edge functions to complete
-- ============================================

-- Drop existing cron jobs with 5s timeout
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-fall-2025');
SELECT cron.unschedule('sync-season-winter-2026');
SELECT cron.unschedule('sync-season-spring-2026');
SELECT cron.unschedule('sync-upcoming-animes');
SELECT cron.unschedule('sync-anticipated-animes');

-- ============================================
-- Recreate cron jobs with 90 second timeout
-- ============================================

-- Weekly Episodes (every hour at :00)
SELECT cron.schedule(
  'sync-weekly-episodes',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'weekly_episodes'),
    timeout_milliseconds := 90000
  ) AS request_id;
  $$
);

-- Fall 2025 (every hour at :15)
SELECT cron.schedule(
  'sync-season-fall-2025',
  '15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'season_rankings', 'season', 'fall', 'year', 2025),
    timeout_milliseconds := 90000
  ) AS request_id;
  $$
);

-- Winter 2026 (every hour at :20)
SELECT cron.schedule(
  'sync-season-winter-2026',
  '20 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'season_rankings', 'season', 'winter', 'year', 2026),
    timeout_milliseconds := 90000
  ) AS request_id;
  $$
);

-- Spring 2026 (every hour at :25)
SELECT cron.schedule(
  'sync-season-spring-2026',
  '25 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'season_rankings', 'season', 'spring', 'year', 2026),
    timeout_milliseconds := 90000
  ) AS request_id;
  $$
);

-- Upcoming Animes (every hour at :30)
SELECT cron.schedule(
  'sync-upcoming-animes',
  '30 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'upcoming'),
    timeout_milliseconds := 90000
  ) AS request_id;
  $$
);

-- Anticipated Animes (every hour at :35)
SELECT cron.schedule(
  'sync-anticipated-animes',
  '35 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'anticipated'),
    timeout_milliseconds := 90000
  ) AS request_id;
  $$
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs updated with 90 second timeout!';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Fixed: timeout_milliseconds increased from 5000 to 90000';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Schedule (every hour):';
  RAISE NOTICE '  :00 - Weekly Episodes';
  RAISE NOTICE '  :15 - Fall 2025 Season';
  RAISE NOTICE '  :20 - Winter 2026 Season';
  RAISE NOTICE '  :25 - Spring 2026 Season';
  RAISE NOTICE '  :30 - Upcoming Animes';
  RAISE NOTICE '  :35 - Anticipated Animes';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Monitor: SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;';
END $$;
