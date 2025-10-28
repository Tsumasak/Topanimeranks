-- ============================================
-- CONFIGURAR E SINCRONIZAR - COPY & PASTE
-- ============================================
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- PASSO 1: LIMPAR FUNÇÕES ANTIGAS
-- ============================================
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

SELECT '✅ Funções antigas removidas' as status;

-- ============================================
-- PASSO 2: HABILITAR EXTENSÃO HTTP
-- ============================================
CREATE EXTENSION IF NOT EXISTS http;

SELECT '✅ Extensão HTTP habilitada' as status;

-- ============================================
-- PASSO 3: CONFIGURAR CREDENCIAIS
-- ============================================
-- ⚠️ SUBSTITUA os valores abaixo com suas credenciais reais!

-- Encontre em: Settings > API > Project URL
UPDATE app_config 
SET value = 'https://SEU-PROJECT-ID.supabase.co' 
WHERE key = 'supabase_url';

-- Encontre em: Settings > API > Project API keys > anon public
UPDATE app_config 
SET value = 'SUA-ANON-KEY-AQUI' 
WHERE key = 'supabase_anon_key';

-- Verificar configuração
SELECT key, 
       CASE 
         WHEN key = 'supabase_anon_key' THEN LEFT(value, 20) || '...' 
         ELSE value 
       END as value_preview
FROM app_config 
WHERE key IN ('supabase_url', 'supabase_anon_key');

-- ============================================
-- PASSO 4: CRIAR FUNÇÕES DE SINCRONIZAÇÃO
-- ============================================
-- Agora cole AQUI o conteúdo completo do arquivo:
-- /supabase/migrations/20241027000010_sync_functions_v2.sql
--
-- Ou continue abaixo se já colou o conteúdo...
-- ============================================

-- [COLE AS FUNÇÕES AQUI]

-- ============================================
-- PASSO 5: SINCRONIZAR TUDO
-- ============================================
-- Depois que as funções forem criadas, execute:

/*
SELECT * FROM sync_everything();

-- Aguarde... isso vai levar alguns minutos (rate limit de 2s entre requests)

-- Ver status depois
SELECT * FROM sync_status();

-- Ver logs
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
*/

-- ============================================
-- COMANDOS ÚTEIS
-- ============================================

-- Sync apenas uma week específica
-- SELECT sync_week(1);

-- Sync todas as weeks
-- SELECT * FROM sync_all_weeks();

-- Sync uma season específica
-- SELECT sync_season('fall', 2024);

-- Sync most anticipated
-- SELECT sync_anticipated();

-- Ver quantos animes temos
-- SELECT 
--   COUNT(*) as total_episodes,
--   COUNT(DISTINCT mal_id) as unique_animes,
--   MAX(week_number) as max_week
-- FROM weekly_episodes;

-- SELECT 
--   COUNT(*) as total_animes,
--   season,
--   year
-- FROM season_rankings
-- GROUP BY season, year;
