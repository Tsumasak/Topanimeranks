-- ============================================
-- QUERIES SQL PRONTAS PARA COPIAR E COLAR
-- ============================================
-- Use este arquivo no Supabase SQL Editor
-- Data: 27 de Outubro de 2024
-- Versão: 2.0 - Rename Score Fields
-- ============================================

-- ============================================
-- MIGRATION 008: RENAME SCORE FIELDS
-- ============================================
-- Execute primeiro (30 segundos)

ALTER TABLE weekly_episodes RENAME COLUMN score TO episode_score;
ALTER TABLE season_rankings RENAME COLUMN score TO anime_score;

COMMENT ON COLUMN weekly_episodes.episode_score IS 'Score of the specific episode (not the anime overall score)';
COMMENT ON COLUMN season_rankings.anime_score IS 'Overall score of the anime';

SELECT '✅ Migration 008 completed successfully!' as status;

-- ============================================
-- MIGRATION 009: ADD OPTIMIZED INDEXES
-- ============================================
-- Execute depois da Migration 008 (30 segundos)

-- Clean up old indexes
DROP INDEX IF EXISTS idx_weekly_episodes_score;
DROP INDEX IF EXISTS idx_season_rankings_score;

-- Weekly episodes indexes
CREATE INDEX IF NOT EXISTS idx_episode_score 
ON weekly_episodes(episode_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_week_position 
ON weekly_episodes(week_number, position_in_week);

CREATE INDEX IF NOT EXISTS idx_anime_weeks 
ON weekly_episodes(anime_id, week_number);

CREATE INDEX IF NOT EXISTS idx_week_score 
ON weekly_episodes(week_number, episode_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_week_ranking 
ON weekly_episodes(week_number, position_in_week, episode_score DESC);

CREATE INDEX IF NOT EXISTS idx_trend 
ON weekly_episodes(trend) WHERE trend IS NOT NULL;

-- Season rankings indexes
CREATE INDEX IF NOT EXISTS idx_anime_score 
ON season_rankings(anime_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_season_year_score 
ON season_rankings(season, year, anime_score DESC NULLS LAST);

-- Optimize query planner
ANALYZE weekly_episodes;
ANALYZE season_rankings;

SELECT '✅ Migration 009 completed successfully!' as status;

-- ============================================
-- VALIDAÇÃO: VERIFICAR COLUNAS RENOMEADAS
-- ============================================
-- Execute para verificar se as migrations funcionaram

SELECT 
  '✅ Columns renamed successfully!' as status,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('weekly_episodes', 'season_rankings')
  AND column_name IN ('episode_score', 'anime_score')
ORDER BY table_name, column_name;

-- Deve retornar:
-- weekly_episodes | episode_score | double precision
-- season_rankings | anime_score   | double precision

-- ============================================
-- VALIDAÇÃO: VERIFICAR INDEXES CRIADOS
-- ============================================

SELECT 
  '✅ Indexes created successfully!' as status,
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('weekly_episodes', 'season_rankings')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Deve retornar pelo menos 8 indexes

-- ============================================
-- VALIDAÇÃO: TESTAR WEEKLY EPISODES
-- ============================================

SELECT 
  week_number,
  position_in_week as rank,
  anime_title,
  episode_number,
  episode_score,
  trend
FROM weekly_episodes
WHERE week_number = 1
ORDER BY position_in_week
LIMIT 10;

-- Se retornar dados ou "no rows", está OK
-- Se retornar erro "column does not exist", algo deu errado

-- ============================================
-- VALIDAÇÃO: TESTAR SEASON RANKINGS
-- ============================================

SELECT 
  title,
  anime_score,
  members,
  season,
  year
FROM season_rankings
WHERE season = 'fall' AND year = 2024
ORDER BY anime_score DESC NULLS LAST
LIMIT 10;

-- Se retornar dados ou "no rows", está OK
-- Se retornar erro "column does not exist", algo deu errado

-- ============================================
-- OPCIONAL: LIMPAR DADOS (USE COM CUIDADO!)
-- ============================================
-- Execute apenas se quiser começar do zero

-- DELETE FROM weekly_episodes;
-- DELETE FROM season_rankings;
-- SELECT '⚠️ All data deleted! Now sync again.' as status;

-- ============================================
-- MONITORAR: VER LOGS DE SINCRONIZAÇÃO
-- ============================================

SELECT 
  sync_type,
  status,
  items_synced,
  duration_ms,
  error_message,
  created_at
FROM sync_logs
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- ÚTEIS: QUERIES DE ANÁLISE
-- ============================================

-- Ver quantos episódios por week
SELECT 
  week_number,
  COUNT(*) as total_episodes,
  COUNT(DISTINCT anime_id) as unique_animes,
  AVG(episode_score) as avg_score,
  MAX(episode_score) as max_score
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;

-- Ver distribuição de trends
SELECT 
  trend,
  COUNT(*) as count
FROM weekly_episodes
WHERE trend IS NOT NULL
GROUP BY trend
ORDER BY count DESC;

-- Ver animes que mais aparecem nas weeks
SELECT 
  anime_title,
  COUNT(*) as appearances,
  AVG(episode_score) as avg_episode_score,
  AVG(position_in_week) as avg_rank
FROM weekly_episodes
GROUP BY anime_title, anime_id
HAVING COUNT(*) >= 3
ORDER BY avg_episode_score DESC
LIMIT 20;

-- Ver top 10 episodes de todas as weeks
SELECT 
  anime_title,
  episode_number,
  episode_title,
  episode_score,
  week_number,
  position_in_week,
  trend
FROM weekly_episodes
WHERE episode_score IS NOT NULL
ORDER BY episode_score DESC
LIMIT 10;

-- Ver animes que mais subiram
SELECT 
  anime_title,
  week_number,
  position_in_week,
  episode_score,
  trend,
  CAST(REPLACE(trend, '+', '') AS INTEGER) as rise
FROM weekly_episodes 
WHERE trend LIKE '+%'
ORDER BY rise DESC
LIMIT 20;

-- Ver animes que mais caíram
SELECT 
  anime_title,
  week_number,
  position_in_week,
  episode_score,
  trend,
  CAST(REPLACE(trend, '-', '') AS INTEGER) as fall
FROM weekly_episodes 
WHERE trend LIKE '-%'
ORDER BY fall DESC
LIMIT 20;

-- Ver histórico de um anime específico
SELECT 
  week_number,
  position_in_week as rank,
  episode_number,
  episode_title,
  episode_score,
  trend,
  aired_at
FROM weekly_episodes 
WHERE anime_id = 60098 -- My Hero Academia S7
ORDER BY week_number;

-- Ver animes por season
SELECT 
  season,
  year,
  COUNT(*) as total_animes,
  AVG(anime_score) as avg_score,
  MAX(anime_score) as max_score,
  SUM(members) as total_members
FROM season_rankings
GROUP BY season, year
ORDER BY year DESC, 
  CASE season
    WHEN 'winter' THEN 1
    WHEN 'spring' THEN 2
    WHEN 'summer' THEN 3
    WHEN 'fall' THEN 4
  END;

-- Ver top animes por score
SELECT 
  title,
  anime_score,
  members,
  type,
  season,
  year
FROM season_rankings
WHERE season = 'fall' AND year = 2024
ORDER BY anime_score DESC NULLS LAST
LIMIT 50;

-- Ver top animes por members
SELECT 
  title,
  members,
  anime_score,
  type,
  season,
  year
FROM season_rankings
WHERE season = 'fall' AND year = 2024
ORDER BY members DESC
LIMIT 50;

-- ============================================
-- PERFORMANCE: ANALISAR QUERY PLAN
-- ============================================

EXPLAIN ANALYZE
SELECT * FROM weekly_episodes 
WHERE week_number = 1 
ORDER BY position_in_week 
LIMIT 10;

-- Deve usar Index Scan, não Seq Scan
-- Execution Time deve ser < 5ms

EXPLAIN ANALYZE
SELECT * FROM season_rankings
WHERE season = 'fall' AND year = 2024
ORDER BY anime_score DESC NULLS LAST
LIMIT 10;

-- Deve usar Index Scan, não Seq Scan
-- Execution Time deve ser < 10ms

-- ============================================
-- MANUTENÇÃO: VACUUM E ANALYZE
-- ============================================
-- Execute periodicamente para manter performance

VACUUM ANALYZE weekly_episodes;
VACUUM ANALYZE season_rankings;

SELECT '✅ Maintenance completed!' as status;

-- ============================================
-- ESTATÍSTICAS: INFO DAS TABELAS
-- ============================================

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('weekly_episodes', 'season_rankings')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- FIM
-- ============================================

SELECT '🎉 All queries ready to use!' as status;
