-- ============================================
-- CLEANUP SEASON DUPLICATES
-- ============================================
-- Remove duplicatas da tabela season_rankings onde animes foram
-- inseridos em seasons incorretas devido a dados conflitantes da API
-- ============================================

-- PASSO 1: Identificar duplicatas (anime_id aparece em múltiplas seasons)
-- ============================================
SELECT 
  anime_id,
  title_english,
  COUNT(*) as count,
  STRING_AGG(DISTINCT season || ' ' || year::text, ', ' ORDER BY season || ' ' || year::text) as seasons_found
FROM season_rankings
GROUP BY anime_id, title_english
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- PASSO 2: Para cada duplicata, manter apenas a entrada cuja season/year
-- corresponde ao aired_from do anime
-- ============================================

-- Esta query identifica registros INVÁLIDOS que devem ser deletados:
-- - anime_id duplicado
-- - aired_from NÃO corresponde à season/year do registro
WITH duplicates AS (
  SELECT anime_id
  FROM season_rankings
  GROUP BY anime_id
  HAVING COUNT(*) > 1
),
invalid_entries AS (
  SELECT 
    sr.id,
    sr.anime_id,
    sr.title_english,
    sr.season,
    sr.year,
    sr.aired_from,
    EXTRACT(MONTH FROM sr.aired_from) as aired_month,
    EXTRACT(YEAR FROM sr.aired_from) as aired_year,
    CASE 
      WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 1 AND 3 THEN 'winter'
      WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 4 AND 6 THEN 'spring'
      WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 7 AND 9 THEN 'summer'
      WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 10 AND 12 THEN 'fall'
      ELSE 'unknown'
    END as actual_season,
    -- É inválido se:
    -- 1. Season não corresponde ao mês do aired_from
    -- 2. Year não corresponde ao ano do aired_from
    (
      sr.season != CASE 
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 1 AND 3 THEN 'winter'
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 4 AND 6 THEN 'spring'
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 7 AND 9 THEN 'summer'
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 10 AND 12 THEN 'fall'
        ELSE 'unknown'
      END
      OR 
      sr.year != EXTRACT(YEAR FROM sr.aired_from)
    ) as is_invalid
  FROM season_rankings sr
  INNER JOIN duplicates d ON sr.anime_id = d.anime_id
  WHERE sr.aired_from IS NOT NULL
)
SELECT 
  id,
  anime_id,
  title_english,
  season,
  year,
  actual_season,
  aired_year,
  aired_from
FROM invalid_entries
WHERE is_invalid = true
ORDER BY anime_id, season, year;

-- PASSO 3: DELETAR registros inválidos
-- ============================================
-- ⚠️  ATENÇÃO: Esta query vai DELETAR dados! Execute com cuidado!
-- Execute apenas DEPOIS de revisar os resultados do PASSO 2

WITH duplicates AS (
  SELECT anime_id
  FROM season_rankings
  GROUP BY anime_id
  HAVING COUNT(*) > 1
),
invalid_entries AS (
  SELECT 
    sr.id,
    sr.anime_id,
    sr.title_english,
    sr.season,
    sr.year,
    sr.aired_from,
    (
      sr.season != CASE 
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 1 AND 3 THEN 'winter'
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 4 AND 6 THEN 'spring'
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 7 AND 9 THEN 'summer'
        WHEN EXTRACT(MONTH FROM sr.aired_from) BETWEEN 10 AND 12 THEN 'fall'
        ELSE 'unknown'
      END
      OR 
      sr.year != EXTRACT(YEAR FROM sr.aired_from)
    ) as is_invalid
  FROM season_rankings sr
  INNER JOIN duplicates d ON sr.anime_id = d.anime_id
  WHERE sr.aired_from IS NOT NULL
)
DELETE FROM season_rankings
WHERE id IN (
  SELECT id 
  FROM invalid_entries 
  WHERE is_invalid = true
);

-- PASSO 4: Verificar duplicatas restantes (animes sem aired_from)
-- ============================================
-- Para animes que ainda têm duplicatas mas sem aired_from,
-- manteremos apenas a entrada mais recente (updated_at mais recente)

WITH duplicates_no_date AS (
  SELECT anime_id
  FROM season_rankings
  WHERE aired_from IS NULL
  GROUP BY anime_id
  HAVING COUNT(*) > 1
),
entries_to_keep AS (
  SELECT DISTINCT ON (sr.anime_id)
    sr.id,
    sr.anime_id,
    sr.title_english,
    sr.updated_at
  FROM season_rankings sr
  INNER JOIN duplicates_no_date d ON sr.anime_id = d.anime_id
  WHERE sr.aired_from IS NULL
  ORDER BY sr.anime_id, sr.updated_at DESC
)
SELECT 
  sr.id,
  sr.anime_id,
  sr.title_english,
  sr.season,
  sr.year,
  sr.updated_at,
  CASE WHEN etk.id IS NOT NULL THEN 'KEEP' ELSE 'DELETE' END as action
FROM season_rankings sr
INNER JOIN duplicates_no_date d ON sr.anime_id = d.anime_id
LEFT JOIN entries_to_keep etk ON sr.id = etk.id
WHERE sr.aired_from IS NULL
ORDER BY sr.anime_id, sr.updated_at DESC;

-- PASSO 5: DELETAR duplicatas sem data (manter apenas o mais recente)
-- ============================================
-- ⚠️  ATENÇÃO: Esta query vai DELETAR dados! Execute com cuidado!

WITH duplicates_no_date AS (
  SELECT anime_id
  FROM season_rankings
  WHERE aired_from IS NULL
  GROUP BY anime_id
  HAVING COUNT(*) > 1
),
entries_to_keep AS (
  SELECT DISTINCT ON (sr.anime_id)
    sr.id
  FROM season_rankings sr
  INNER JOIN duplicates_no_date d ON sr.anime_id = d.anime_id
  WHERE sr.aired_from IS NULL
  ORDER BY sr.anime_id, sr.updated_at DESC
)
DELETE FROM season_rankings
WHERE anime_id IN (SELECT anime_id FROM duplicates_no_date)
  AND aired_from IS NULL
  AND id NOT IN (SELECT id FROM entries_to_keep);

-- PASSO 6: Verificação final - deve retornar 0 duplicatas
-- ============================================
SELECT 
  anime_id,
  title_english,
  COUNT(*) as count
FROM season_rankings
GROUP BY anime_id, title_english
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ============================================
-- INSTRUÇÕES DE USO:
-- ============================================
-- 1. Execute PASSO 1 para ver todas as duplicatas
-- 2. Execute PASSO 2 para ver quais registros serão deletados
-- 3. Revise cuidadosamente os resultados
-- 4. Execute PASSO 3 para deletar registros inválidos com aired_from incorreto
-- 5. Execute PASSO 4 para ver duplicatas sem aired_from
-- 6. Execute PASSO 5 para deletar duplicatas sem aired_from (manter mais recente)
-- 7. Execute PASSO 6 para verificar que não há mais duplicatas
-- ============================================
