-- ============================================
-- FUNÇÕES DE SINCRONIZAÇÃO VIA SUPABASE (V2)
-- ============================================
-- Versão atualizada que lê configurações da tabela app_config
-- ao invés de parâmetros de banco (que não funcionam no Supabase)
-- ============================================

-- ============================================
-- LIMPAR FUNÇÕES ANTIGAS (se existirem)
-- ============================================
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

-- ============================================
-- HABILITAR EXTENSÃO HTTP
-- ============================================
CREATE EXTENSION IF NOT EXISTS http;

-- ============================================
-- 1. FUNÇÃO: SYNC SINGLE WEEK
-- ============================================
CREATE FUNCTION sync_week(week_num INTEGER DEFAULT 1)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  base_url TEXT;
  anon_key TEXT;
BEGIN
  -- Ler configurações da tabela app_config
  SELECT value INTO base_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO anon_key FROM app_config WHERE key = 'supabase_anon_key';
  
  IF base_url IS NULL OR anon_key IS NULL THEN
    RAISE EXCEPTION 'Configurações não encontradas. Execute: UPDATE app_config SET value = ''sua-url'' WHERE key = ''supabase_url'';';
  END IF;
  
  -- Chamar edge function via HTTP
  SELECT content::json INTO result
  FROM http((
    'POST',
    base_url || '/functions/v1/make-server-c1d1bfd8/sync',
    ARRAY[http_header('Authorization', 'Bearer ' || anon_key)],
    'application/json',
    json_build_object('sync_type', 'weekly_episodes', 'week_number', week_num)::text
  )::http_request);
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION sync_week IS 'Sincroniza uma week específica. Uso: SELECT sync_week(1);';

-- ============================================
-- 2. FUNÇÃO: SYNC ALL WEEKS (1-13)
-- ============================================
CREATE FUNCTION sync_all_weeks()
RETURNS TABLE(week_number INTEGER, status TEXT, items INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i INTEGER;
  result json;
BEGIN
  FOR i IN 1..13 LOOP
    -- Sync cada week
    SELECT sync_week(i) INTO result;
    
    week_number := i;
    status := result->>'status';
    items := (result->>'items_synced')::INTEGER;
    
    RETURN NEXT;
    
    -- Rate limit: aguardar 2 segundos entre requests
    PERFORM pg_sleep(2);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION sync_all_weeks IS 'Sincroniza todas as 13 weeks. Uso: SELECT * FROM sync_all_weeks();';

-- ============================================
-- 3. FUNÇÃO: SYNC SEASON
-- ============================================
CREATE FUNCTION sync_season(
  season_name TEXT DEFAULT 'fall',
  season_year INTEGER DEFAULT 2024
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  base_url TEXT;
  anon_key TEXT;
BEGIN
  -- Ler configurações da tabela app_config
  SELECT value INTO base_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO anon_key FROM app_config WHERE key = 'supabase_anon_key';
  
  IF base_url IS NULL OR anon_key IS NULL THEN
    RAISE EXCEPTION 'Configurações não encontradas. Execute: UPDATE app_config SET value = ''sua-url'' WHERE key = ''supabase_url'';';
  END IF;
  
  SELECT content::json INTO result
  FROM http((
    'POST',
    base_url || '/functions/v1/make-server-c1d1bfd8/sync',
    ARRAY[http_header('Authorization', 'Bearer ' || anon_key)],
    'application/json',
    json_build_object('sync_type', 'season_rankings', 'season', season_name, 'year', season_year)::text
  )::http_request);
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION sync_season IS 'Sincroniza uma season. Uso: SELECT sync_season(''fall'', 2024);';

-- ============================================
-- 4. FUNÇÃO: SYNC MOST ANTICIPATED
-- ============================================
CREATE FUNCTION sync_anticipated()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  base_url TEXT;
  anon_key TEXT;
BEGIN
  -- Ler configurações da tabela app_config
  SELECT value INTO base_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO anon_key FROM app_config WHERE key = 'supabase_anon_key';
  
  IF base_url IS NULL OR anon_key IS NULL THEN
    RAISE EXCEPTION 'Configurações não encontradas. Execute: UPDATE app_config SET value = ''sua-url'' WHERE key = ''supabase_url'';';
  END IF;
  
  SELECT content::json INTO result
  FROM http((
    'POST',
    base_url || '/functions/v1/make-server-c1d1bfd8/sync',
    ARRAY[http_header('Authorization', 'Bearer ' || anon_key)],
    'application/json',
    json_build_object('sync_type', 'anticipated')::text
  )::http_request);
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION sync_anticipated IS 'Sincroniza most anticipated animes. Uso: SELECT sync_anticipated();';

-- ============================================
-- 5. FUNÇÃO: SYNC TUDO DE UMA VEZ
-- ============================================
CREATE FUNCTION sync_everything()
RETURNS TABLE(
  step TEXT,
  status TEXT,
  items INTEGER,
  duration_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  result json;
  week_count INTEGER := 0;
BEGIN
  -- 1. Sync all weeks (1-13)
  start_time := clock_timestamp();
  
  FOR i IN 1..13 LOOP
    SELECT sync_week(i) INTO result;
    week_count := week_count + COALESCE((result->>'items_synced')::INTEGER, 0);
    PERFORM pg_sleep(2); -- Rate limit
  END LOOP;
  
  end_time := clock_timestamp();
  step := 'Weekly Episodes (1-13)';
  status := 'success';
  items := week_count;
  duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time));
  RETURN NEXT;
  
  -- 2. Sync Fall 2024
  start_time := clock_timestamp();
  SELECT sync_season('fall', 2024) INTO result;
  end_time := clock_timestamp();
  
  step := 'Fall 2024 Season';
  status := COALESCE(result->>'status', 'error');
  items := COALESCE((result->>'items_synced')::INTEGER, 0);
  duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time));
  RETURN NEXT;
  
  PERFORM pg_sleep(2);
  
  -- 3. Sync Winter 2025
  start_time := clock_timestamp();
  SELECT sync_season('winter', 2025) INTO result;
  end_time := clock_timestamp();
  
  step := 'Winter 2025 Season';
  status := COALESCE(result->>'status', 'error');
  items := COALESCE((result->>'items_synced')::INTEGER, 0);
  duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time));
  RETURN NEXT;
  
  PERFORM pg_sleep(2);
  
  -- 4. Sync Most Anticipated
  start_time := clock_timestamp();
  SELECT sync_anticipated() INTO result;
  end_time := clock_timestamp();
  
  step := 'Most Anticipated';
  status := COALESCE(result->>'status', 'error');
  items := COALESCE((result->>'items_synced')::INTEGER, 0);
  duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time));
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION sync_everything IS 'Sincroniza TUDO (weeks 1-13, seasons, anticipated). Uso: SELECT * FROM sync_everything();';

-- ============================================
-- 6. FUNÇÃO: STATUS DA SINCRONIZAÇÃO
-- ============================================
CREATE FUNCTION sync_status()
RETURNS TABLE(
  category TEXT,
  total_items BIGINT,
  last_sync TIMESTAMP,
  needs_sync BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Weekly episodes
  RETURN QUERY
  SELECT 
    'Weekly Episodes'::TEXT as category,
    COUNT(*) as total_items,
    MAX(updated_at) as last_sync,
    (MAX(updated_at) < NOW() - INTERVAL '1 day') as needs_sync
  FROM weekly_episodes;
  
  -- Season rankings
  RETURN QUERY
  SELECT 
    'Season Rankings'::TEXT as category,
    COUNT(*) as total_items,
    MAX(updated_at) as last_sync,
    (MAX(updated_at) < NOW() - INTERVAL '7 days') as needs_sync
  FROM season_rankings;
  
  -- Sync logs
  RETURN QUERY
  SELECT 
    'Last Sync Activity'::TEXT as category,
    COUNT(*) as total_items,
    MAX(created_at) as last_sync,
    (MAX(created_at) < NOW() - INTERVAL '1 day') as needs_sync
  FROM sync_logs
  WHERE status = 'success';
END;
$$;

COMMENT ON FUNCTION sync_status IS 'Verifica status da sincronização. Uso: SELECT * FROM sync_status();';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
DECLARE
  config_url TEXT;
  config_key TEXT;
BEGIN
  -- Verificar se as configurações estão definidas
  SELECT value INTO config_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO config_key FROM app_config WHERE key = 'supabase_anon_key';
  
  RAISE NOTICE '✅ Funções de sincronização criadas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📚 FUNÇÕES DISPONÍVEIS:';
  RAISE NOTICE '   1. SELECT sync_week(1);              -- Sync week específica';
  RAISE NOTICE '   2. SELECT * FROM sync_all_weeks();   -- Sync todas 13 weeks';
  RAISE NOTICE '   3. SELECT sync_season(''fall'', 2024); -- Sync season';
  RAISE NOTICE '   4. SELECT sync_anticipated();        -- Sync anticipated';
  RAISE NOTICE '   5. SELECT * FROM sync_everything();  -- Sync TUDO';
  RAISE NOTICE '   6. SELECT * FROM sync_status();      -- Ver status';
  RAISE NOTICE '';
  
  IF config_url LIKE '%YOUR-PROJECT%' OR config_key LIKE '%YOUR-ANON%' THEN
    RAISE NOTICE '⚠️  CONFIGURAÇÃO NECESSÁRIA!';
    RAISE NOTICE '';
    RAISE NOTICE 'Execute estes comandos para configurar:';
    RAISE NOTICE '';
    RAISE NOTICE 'UPDATE app_config SET value = ''https://SEU-ID.supabase.co'' WHERE key = ''supabase_url'';';
    RAISE NOTICE 'UPDATE app_config SET value = ''SUA-ANON-KEY'' WHERE key = ''supabase_anon_key'';';
    RAISE NOTICE '';
    RAISE NOTICE 'Depois execute: SELECT * FROM sync_everything();';
  ELSE
    RAISE NOTICE '✅ Configurações OK! Você pode executar:';
    RAISE NOTICE '   SELECT * FROM sync_everything();';
  END IF;
END $$;
