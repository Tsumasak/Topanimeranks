-- ============================================
-- COMANDOS PRONTOS PARA COPIAR E COLAR
-- ============================================
-- Use este arquivo no Supabase SQL Editor
-- Execute em ordem (de cima para baixo)
-- ============================================

-- ============================================
-- PASSO 1: MIGRATION 008 (30 segundos)
-- ============================================

ALTER TABLE weekly_episodes RENAME COLUMN score TO episode_score;
ALTER TABLE season_rankings RENAME COLUMN score TO anime_score;

COMMENT ON COLUMN weekly_episodes.episode_score IS 'Score of the specific episode';
COMMENT ON COLUMN season_rankings.anime_score IS 'Overall score of the anime';

SELECT '✅ Migration 008 completed!' as status;

-- ============================================
-- PASSO 2: MIGRATION 009 (30 segundos)
-- ============================================

DROP INDEX IF EXISTS idx_weekly_episodes_score;
DROP INDEX IF EXISTS idx_season_rankings_score;

CREATE INDEX IF NOT EXISTS idx_episode_score ON weekly_episodes(episode_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_week_position ON weekly_episodes(week_number, position_in_week);
CREATE INDEX IF NOT EXISTS idx_anime_weeks ON weekly_episodes(anime_id, week_number);
CREATE INDEX IF NOT EXISTS idx_week_score ON weekly_episodes(week_number, episode_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_week_ranking ON weekly_episodes(week_number, position_in_week, episode_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend ON weekly_episodes(trend) WHERE trend IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anime_score ON season_rankings(anime_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_season_year_score ON season_rankings(season, year, anime_score DESC NULLS LAST);

ANALYZE weekly_episodes;
ANALYZE season_rankings;

SELECT '✅ Migration 009 completed!' as status;

-- ============================================
-- PASSO 3: HABILITAR HTTP (obrigatório)
-- ============================================

CREATE EXTENSION IF NOT EXISTS http;

SELECT '✅ HTTP extension enabled!' as status;

-- ============================================
-- PASSO 4: CONFIGURAR SETTINGS (obrigatório)
-- ============================================
-- ⚠️ SUBSTITUA PELOS SEUS VALORES REAIS!

ALTER DATABASE postgres SET app.settings.supabase_url = 'https://SEU-PROJECT-ID.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'SUA-ANON-KEY-AQUI';
SELECT pg_reload_conf();

SELECT '✅ Settings configured!' as status;

-- Verificar se configurou corretamente:
SHOW app.settings.supabase_url;
SHOW app.settings.supabase_anon_key;

-- ============================================
-- PASSO 5: MIGRATION 010 - SYNC FUNCTIONS
-- ============================================
-- ⚠️ SE DER ERRO "cannot change return type", EXECUTE ISSO PRIMEIRO:

DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

SELECT '✅ Funções antigas removidas. Agora cole a Migration 010!' as status;

-- ============================================
-- AGORA COLE AQUI O CONTEÚDO DO ARQUIVO:
-- /supabase/migrations/20241027000010_sync_functions.sql
-- ============================================

-- [COLE AS FUNÇÕES AQUI DO ARQUIVO 20241027000010_sync_functions.sql]
-- (Não colei aqui para evitar duplicação, use o arquivo original)

-- ============================================
-- PASSO 6: SINCRONIZAR DADOS (10-15 minutos)
-- ============================================

-- Opção A: Sync tudo de uma vez (recomendado)
SELECT * FROM sync_everything();

-- Opção B: Sync manual (um por vez)
-- SELECT * FROM sync_all_weeks();
-- SELECT sync_season('fall', 2024);
-- SELECT sync_season('winter', 2025);
-- SELECT sync_anticipated();

-- ============================================
-- PASSO 7: VALIDAR (10 segundos)
-- ============================================

-- 1. Ver status geral
SELECT * FROM sync_status();

-- 2. Ver top 5 episódios da week 5
SELECT 
  position_in_week,
  anime_title,
  episode_number,
  episode_score,
  trend
FROM weekly_episodes
WHERE week_number = 5
ORDER BY position_in_week
LIMIT 5;

-- 3. Ver top 5 animes Fall 2024
SELECT 
  title,
  anime_score,
  members
FROM season_rankings
WHERE season = 'fall' AND year = 2024
ORDER BY anime_score DESC
LIMIT 5;

-- 4. Verificar erros (deve retornar vazio)
SELECT * FROM sync_logs WHERE status = 'error' ORDER BY created_at DESC LIMIT 5;

-- ============================================
-- ✅ SETUP COMPLETO!
-- ============================================

SELECT '🎉 Setup completo! Site pronto para usar!' as status;

-- ============================================
-- COMANDOS ÚTEIS (MANUTENÇÃO)
-- ============================================

-- Sync week atual (executar toda semana)
-- SELECT sync_week(5);

-- Ver status
-- SELECT * FROM sync_status();

-- Ver últimos syncs
-- SELECT sync_type, status, items_synced, created_at 
-- FROM sync_logs 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- Limpar tudo (CUIDADO!)
-- TRUNCATE weekly_episodes, season_rankings, sync_logs CASCADE;

-- ============================================
-- FIM
-- ============================================
