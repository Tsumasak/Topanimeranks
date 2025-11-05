-- ============================================
-- 🎯 Test Auto Week Detection
-- ============================================
-- Use este SQL para testar o sistema de detecção automática de weeks

-- ============================================
-- 1. Ver contagem de episódios por week
-- ============================================
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score,
  COUNT(*) as total_episodes,
  CASE 
    WHEN COUNT(*) FILTER (WHERE episode_score IS NOT NULL) >= 5 THEN '✅ VISIBLE'
    ELSE '❌ HIDDEN'
  END as status
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;

-- Expected output example:
-- week_number | episodes_with_score | total_episodes | status
-- ------------|---------------------|----------------|----------
--      1      |         45          |      45        | ✅ VISIBLE
--      2      |         42          |      42        | ✅ VISIBLE
--      3      |         38          |      38        | ✅ VISIBLE
--      4      |         35          |      35        | ✅ VISIBLE
--      5      |         28          |      28        | ✅ VISIBLE
--      6      |         12          |      12        | ✅ VISIBLE
--      7      |          4          |       4        | ❌ HIDDEN (needs 5+)


-- ============================================
-- 2. Ver qual é a "Latest Week" detectada
-- ============================================
WITH week_counts AS (
  SELECT 
    week_number,
    COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as scored_episodes
  FROM weekly_episodes
  GROUP BY week_number
  HAVING COUNT(*) FILTER (WHERE episode_score IS NOT NULL) >= 5
)
SELECT MAX(week_number) as latest_week
FROM week_counts;

-- Expected output:
-- latest_week
-- -----------
--      6      (se Week 7 ainda tem menos de 5 episódios)
--      7      (se Week 7 atingiu 5+ episódios)


-- ============================================
-- 3. Ver episódios da Latest Week
-- ============================================
WITH latest_week AS (
  SELECT MAX(week_number) as week_num
  FROM (
    SELECT week_number
    FROM weekly_episodes
    WHERE episode_score IS NOT NULL
    GROUP BY week_number
    HAVING COUNT(*) >= 5
  ) t
)
SELECT 
  w.week_number,
  w.position_in_week,
  w.anime_title_english,
  w.episode_number,
  w.episode_score,
  w.aired_at
FROM weekly_episodes w
CROSS JOIN latest_week l
WHERE w.week_number = l.week_num
  AND w.episode_score IS NOT NULL
ORDER BY w.episode_score DESC, w.position_in_week
LIMIT 10;


-- ============================================
-- 4. Simular adição de novos episódios
-- ============================================
-- Exemplo: Adicionar episódio para fazer Week 7 aparecer

-- Ver quantos episódios Week 7 tem agora
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score
FROM weekly_episodes
WHERE week_number = 7
GROUP BY week_number;

-- Se Week 7 tem 4 episódios, você pode:
-- 1. Fazer sync manual: Ver /supabase/WEEKLY_SYNC_DEBUG.md
-- 2. Aguardar o cron rodar (a cada hora)
-- 3. Adicionar manualmente para teste (NÃO RECOMENDADO em produção)


-- ============================================
-- 5. Verificar quando foi o último sync
-- ============================================
SELECT 
  week_number,
  MAX(updated_at) as last_sync,
  COUNT(*) as total_episodes,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as scored_episodes
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number DESC
LIMIT 5;


-- ============================================
-- 6. Ver log de changes (novos vs atualizados)
-- ============================================
SELECT 
  week_number,
  anime_title_english,
  episode_number,
  episode_score,
  created_at,
  updated_at,
  CASE 
    WHEN DATE(created_at) = CURRENT_DATE THEN '➕ CRIADO HOJE'
    WHEN DATE(updated_at) = CURRENT_DATE AND DATE(created_at) < CURRENT_DATE THEN '🔄 ATUALIZADO HOJE'
    ELSE '📅 Antigo'
  END as status
FROM weekly_episodes
WHERE week_number IN (
  SELECT DISTINCT week_number 
  FROM weekly_episodes 
  WHERE DATE(created_at) = CURRENT_DATE 
     OR DATE(updated_at) = CURRENT_DATE
)
ORDER BY week_number, episode_score DESC;


-- ============================================
-- 7. Testar chamada HTTP ao endpoint (via SQL)
-- ============================================
SELECT net.http_get(
  url := (SELECT value FROM app_config WHERE key = 'supabase_url') || 
         '/functions/v1/make-server-c1d1bfd8/available-weeks',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
  )
) AS request_id;

-- Aguarde 2-3 segundos e veja o resultado:
SELECT 
  created,
  status_code,
  content::text as response
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;

-- Expected response:
-- {
--   "success": true,
--   "weeks": [1, 2, 3, 4, 5, 6],
--   "latestWeek": 6,
--   "weekCounts": [...]
-- }


-- ============================================
-- 📊 Dashboard Query (tudo em um)
-- ============================================
WITH week_stats AS (
  SELECT 
    week_number,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as with_score,
    COUNT(*) FILTER (WHERE episode_score IS NULL) as without_score,
    AVG(episode_score) FILTER (WHERE episode_score IS NOT NULL) as avg_score,
    MAX(updated_at) as last_sync
  FROM weekly_episodes
  GROUP BY week_number
),
latest_week AS (
  SELECT MAX(week_number) as week_num
  FROM week_stats
  WHERE with_score >= 5
)
SELECT 
  ws.week_number,
  ws.total || ' eps' as total_episodes,
  ws.with_score || ' scored' as episodes_with_score,
  ws.without_score || ' N/A' as episodes_without_score,
  ROUND(ws.avg_score::numeric, 2) || ' ★' as average_score,
  CASE 
    WHEN ws.with_score >= 5 THEN '✅ VISIBLE'
    ELSE '❌ HIDDEN (' || (5 - ws.with_score) || ' more needed)'
  END as controller_status,
  CASE 
    WHEN ws.week_number = l.week_num THEN '🎯 LATEST WEEK'
    ELSE ''
  END as is_latest,
  ws.last_sync::date as last_update
FROM week_stats ws
CROSS JOIN latest_week l
ORDER BY ws.week_number DESC;

-- Expected output:
-- week | total | scored  | N/A    | avg    | status      | latest     | last_update
-- -----|-------|---------|--------|--------|-------------|------------|------------
--  7   | 4 eps | 4 scored| 0 N/A  | 8.45 ★ | ❌ HIDDEN   |            | 2025-11-05
--  6   | 12 eps| 12 scored| 0 N/A | 8.23 ★ | ✅ VISIBLE  | 🎯 LATEST  | 2025-11-05
--  5   | 28 eps| 28 scored| 0 N/A | 7.98 ★ | ✅ VISIBLE  |            | 2025-11-01
--  4   | 35 eps| 35 scored| 0 N/A | 7.85 ★ | ✅ VISIBLE  |            | 2025-10-28
