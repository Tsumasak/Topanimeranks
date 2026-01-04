-- ============================================
-- CLEANUP ESPECÍFICO DAS 3 DUPLICATAS RESTANTES
-- ============================================
-- Animes identificados:
-- 1. Classroom of the Elite IV (59708) - "upcoming 9999" + "spring 2026"
-- 2. Re:ZERO Season 4 (61316) - "winter 2026" + "spring 2026"
-- 3. Witch Hat Atelier (51553) - "winter 2026" + "spring 2026"
-- ============================================

-- ============================================
-- PASSO 1: INVESTIGAR DETALHES DE CADA DUPLICATA
-- ============================================

-- Ver TODOS os detalhes dos 3 animes duplicados
SELECT 
  anime_id,
  title_english,
  season,
  year,
  aired_from,
  status,
  members,
  EXTRACT(MONTH FROM aired_from) as aired_month,
  EXTRACT(YEAR FROM aired_from) as aired_year,
  CASE 
    WHEN aired_from IS NULL THEN 'NO_DATE'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 1 AND 3 THEN 'winter'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 4 AND 6 THEN 'spring'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 7 AND 9 THEN 'summer'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 10 AND 12 THEN 'fall'
  END as correct_season,
  created_at,
  updated_at
FROM season_rankings
WHERE anime_id IN (59708, 61316, 51553)
ORDER BY anime_id, season, year;

-- ============================================
-- PASSO 2: IDENTIFICAR QUAL REGISTRO MANTER
-- ============================================

-- Esta query mostra qual registro está CORRETO (baseado em aired_from)
-- e qual deve ser DELETADO
WITH duplicate_details AS (
  SELECT 
    id,
    anime_id,
    title_english,
    season,
    year,
    aired_from,
    status,
    members,
    updated_at,
    CASE 
      WHEN aired_from IS NULL THEN 'NO_DATE'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 1 AND 3 THEN 'winter'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 4 AND 6 THEN 'spring'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 7 AND 9 THEN 'summer'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 10 AND 12 THEN 'fall'
    END as correct_season,
    EXTRACT(YEAR FROM aired_from) as correct_year
  FROM season_rankings
  WHERE anime_id IN (59708, 61316, 51553)
)
SELECT 
  id,
  anime_id,
  title_english,
  season as current_season,
  year as current_year,
  correct_season,
  correct_year,
  aired_from,
  status,
  members,
  updated_at,
  CASE 
    WHEN aired_from IS NULL THEN '❓ NO_DATE - Manter mais recente'
    WHEN season = 'upcoming' AND year = 9999 THEN '❌ DELETE - Upcoming incorreto'
    WHEN season = correct_season AND year = correct_year THEN '✅ KEEP - Season correta'
    WHEN season != correct_season OR year != correct_year THEN '❌ DELETE - Season incorreta'
    ELSE '❓ REVISAR'
  END as action
FROM duplicate_details
ORDER BY anime_id, action;

-- ============================================
-- PASSO 3: DELETAR REGISTROS INCORRETOS
-- ============================================

-- ⚠️ ATENÇÃO: Revise os resultados do PASSO 2 antes de executar!

-- Deletar registros onde season/year NÃO corresponde ao aired_from
-- OU onde season = 'upcoming' e year = 9999
WITH duplicate_details AS (
  SELECT 
    id,
    anime_id,
    title_english,
    season,
    year,
    aired_from,
    CASE 
      WHEN aired_from IS NULL THEN 'NO_DATE'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 1 AND 3 THEN 'winter'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 4 AND 6 THEN 'spring'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 7 AND 9 THEN 'summer'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 10 AND 12 THEN 'fall'
    END as correct_season,
    EXTRACT(YEAR FROM aired_from) as correct_year
  FROM season_rankings
  WHERE anime_id IN (59708, 61316, 51553)
),
invalid_records AS (
  SELECT id
  FROM duplicate_details
  WHERE 
    -- Caso 1: season = 'upcoming' e year = 9999 (placeholder incorreto)
    (season = 'upcoming' AND year = 9999)
    OR
    -- Caso 2: season/year não corresponde ao aired_from (quando aired_from existe)
    (
      aired_from IS NOT NULL 
      AND (
        season != correct_season 
        OR year != correct_year
      )
    )
)
DELETE FROM season_rankings
WHERE id IN (SELECT id FROM invalid_records);

-- ============================================
-- PASSO 4: CASOS ESPECIAIS - Animes sem aired_from
-- ============================================

-- Se houver duplicatas SEM aired_from, manter o mais recente
WITH duplicates_no_date AS (
  SELECT anime_id
  FROM season_rankings
  WHERE anime_id IN (59708, 61316, 51553)
    AND aired_from IS NULL
  GROUP BY anime_id
  HAVING COUNT(*) > 1
),
latest_record AS (
  SELECT DISTINCT ON (sr.anime_id)
    sr.id
  FROM season_rankings sr
  INNER JOIN duplicates_no_date d ON sr.anime_id = d.anime_id
  WHERE sr.aired_from IS NULL
  ORDER BY sr.anime_id, sr.updated_at DESC, sr.members DESC
)
DELETE FROM season_rankings
WHERE anime_id IN (SELECT anime_id FROM duplicates_no_date)
  AND aired_from IS NULL
  AND id NOT IN (SELECT id FROM latest_record);

-- ============================================
-- PASSO 5: VERIFICAÇÃO FINAL
-- ============================================

-- Esta query deve retornar 0 linhas (sem duplicatas)
SELECT 
  anime_id,
  title_english,
  COUNT(*) as count,
  STRING_AGG(season || ' ' || year::text, ', ' ORDER BY season, year) as seasons
FROM season_rankings
WHERE anime_id IN (59708, 61316, 51553)
GROUP BY anime_id, title_english
HAVING COUNT(*) > 1;

-- ============================================
-- PASSO 6: VERIFICAR REGISTROS FINAIS
-- ============================================

-- Ver o que sobrou após limpeza (deve ter apenas 1 registro por anime)
SELECT 
  anime_id,
  title_english,
  season,
  year,
  aired_from,
  status,
  members,
  CASE 
    WHEN aired_from IS NULL THEN 'NO_DATE'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 1 AND 3 THEN 'winter'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 4 AND 6 THEN 'spring'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 7 AND 9 THEN 'summer'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 10 AND 12 THEN 'fall'
  END as actual_season_from_date
FROM season_rankings
WHERE anime_id IN (59708, 61316, 51553)
ORDER BY anime_id;

-- ============================================
-- ANÁLISE COMPLEMENTAR: Ver em anticipated_animes
-- ============================================

-- Verificar se esses animes também existem em anticipated_animes
SELECT 
  'anticipated_animes' as table_name,
  anime_id,
  title_english,
  season,
  year,
  aired_from,
  status
FROM anticipated_animes
WHERE anime_id IN (59708, 61316, 51553)
ORDER BY anime_id;

-- ============================================
-- INSTRUÇÕES DE USO:
-- ============================================
-- 1. Execute PASSO 1 para ver detalhes completos
-- 2. Execute PASSO 2 para ver qual registro manter/deletar
-- 3. Revise cuidadosamente os resultados
-- 4. Execute PASSO 3 para deletar registros incorretos
-- 5. Execute PASSO 4 para limpar duplicatas sem aired_from
-- 6. Execute PASSO 5 para confirmar que não há mais duplicatas
-- 7. Execute PASSO 6 para ver o resultado final
-- 8. Execute ANÁLISE COMPLEMENTAR para ver se existem em anticipated_animes
-- ============================================
