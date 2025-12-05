-- ============================================
-- FIX SEASON AND YEAR IN WEEKLY_EPISODES
-- ============================================
-- Atualiza os valores de season e year baseado na tabela season_rankings
-- que contém os dados corretos vindos do Jikan API
-- ============================================

-- Step 1: Update season and year from season_rankings table
UPDATE weekly_episodes we
SET 
  season = sr.season,
  year = sr.year
FROM season_rankings sr
WHERE we.anime_id = sr.anime_id
  AND (we.season IS NULL OR we.year IS NULL OR we.season != sr.season OR we.year != sr.year);

-- Log de sucesso
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Atualizados % episódios com season/year corretos!', updated_count;
END $$;
