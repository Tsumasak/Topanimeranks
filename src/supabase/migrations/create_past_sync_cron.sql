-- ============================================
-- CRON JOBS: SYNC PAST ANIME DATA (2025)
-- ============================================
-- Executa sync de todas as temporadas de 2025 automaticamente
-- Roda UMA VEZ por dia às 03:00 AM
-- ============================================

-- Habilitar pg_cron extension (se ainda não estiver habilitado)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. WINTER 2025 - Roda todo dia às 03:00
-- ============================================
SELECT cron.schedule(
  'sync-winter-2025',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-past-anime-data/winter/2025?key=sync2025',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      )
    ) AS request_id;
  $$
);

-- ============================================
-- 2. SPRING 2025 - Roda todo dia às 04:00
-- ============================================
SELECT cron.schedule(
  'sync-spring-2025',
  '0 4 * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-past-anime-data/spring/2025?key=sync2025',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      )
    ) AS request_id;
  $$
);

-- ============================================
-- 3. SUMMER 2025 - Roda todo dia às 05:00
-- ============================================
SELECT cron.schedule(
  'sync-summer-2025',
  '0 5 * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-past-anime-data/summer/2025?key=sync2025',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      )
    ) AS request_id;
  $$
);

-- ============================================
-- 4. FALL 2025 - Roda todo dia às 06:00
-- ============================================
SELECT cron.schedule(
  'sync-fall-2025-past',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-past-anime-data/fall/2025?key=sync2025',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      )
    ) AS request_id;
  $$
);

-- ============================================
-- VERIFICAR CRON JOBS CRIADOS
-- ============================================
-- Use esta query para verificar se os cron jobs foram criados:
-- SELECT * FROM cron.job WHERE jobname LIKE 'sync-%2025%';

-- ============================================
-- REMOVER CRON JOBS (se necessário)
-- ============================================
-- SELECT cron.unschedule('sync-winter-2025');
-- SELECT cron.unschedule('sync-spring-2025');
-- SELECT cron.unschedule('sync-summer-2025');
-- SELECT cron.unschedule('sync-fall-2025-past');