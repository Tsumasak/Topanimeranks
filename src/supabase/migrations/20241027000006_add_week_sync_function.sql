-- ============================================
-- ADD WEEK-SPECIFIC SYNC FUNCTION
-- ============================================

-- Drop old function
DROP FUNCTION IF EXISTS trigger_manual_sync(TEXT);

-- Create new function with optional week_number parameter
CREATE OR REPLACE FUNCTION trigger_manual_sync(
  sync_type_param TEXT,
  week_number_param INTEGER DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id BIGINT;
  v_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get Supabase URL and service role key from environment
  -- These should be set in your Supabase dashboard under Settings > API
  v_url := current_setting('app.settings.supabase_url', true);
  v_service_role_key := current_setting('app.settings.supabase_service_role_key', true);
  
  -- Fallback: try to get from pg_net if not set
  IF v_url IS NULL THEN
    -- Try to construct URL from database connection
    v_url := 'https://' || current_setting('app.settings.project_id', true) || '.supabase.co';
  END IF;
  
  RAISE NOTICE 'Triggering sync for type: %, week: %', sync_type_param, week_number_param;
  
  -- Call Edge Function via HTTP POST
  SELECT net.http_post(
    url := v_url || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := CASE 
      WHEN week_number_param IS NOT NULL THEN
        jsonb_build_object(
          'sync_type', sync_type_param,
          'week_number', week_number_param
        )
      ELSE
        jsonb_build_object('sync_type', sync_type_param)
    END
  ) INTO v_request_id;
  
  RETURN 'Sync triggered for ' || sync_type_param || 
         COALESCE(' week ' || week_number_param::TEXT, '') || 
         ' (request_id: ' || v_request_id || ')';
         
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error triggering sync: %', SQLERRM;
    RETURN 'Error: ' || SQLERRM || '. Please use the Supabase dashboard to trigger the Edge Function manually.';
END;
$$;

COMMENT ON FUNCTION trigger_manual_sync IS 'Manually trigger a sync. Usage: SELECT trigger_manual_sync(''weekly_episodes'', 1) for Week 1, or SELECT trigger_manual_sync(''season_rankings'') for seasons.';

-- ============================================
-- HELPER FUNCTION: Sync All Weeks
-- ============================================

CREATE OR REPLACE FUNCTION sync_all_weeks()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week INTEGER;
  v_result TEXT := '';
BEGIN
  -- Sync weeks 1-5
  FOR v_week IN 1..5 LOOP
    RAISE NOTICE 'Syncing week %...', v_week;
    PERFORM trigger_manual_sync('weekly_episodes', v_week);
    
    -- Add delay between weeks to respect rate limits
    PERFORM pg_sleep(2);
    
    v_result := v_result || 'Week ' || v_week || ' queued, ';
  END LOOP;
  
  RETURN 'All weeks (1-5) sync triggered. ' || v_result || 'Check sync_logs for status.';
END;
$$;

COMMENT ON FUNCTION sync_all_weeks IS 'Sync all weeks (1-5) at once with delays. Usage: SELECT sync_all_weeks();';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Week sync functions created!';
  RAISE NOTICE '📋 Available functions:';
  RAISE NOTICE '   - trigger_manual_sync(''weekly_episodes'', 1) -- Sync specific week';
  RAISE NOTICE '   - sync_all_weeks() -- Sync all weeks 1-5';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Quick start: SELECT sync_all_weeks();';
END $$;
