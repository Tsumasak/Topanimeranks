-- ============================================
-- DIAGNOSTIC: Discover Real Column Names
-- ============================================

-- 1. Check WEEKLY_EPISODES columns
SELECT 
  'weekly_episodes' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'weekly_episodes'
ORDER BY ordinal_position;

-- 2. Check SEASON_RANKINGS columns
SELECT 
  'season_rankings' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'season_rankings'
ORDER BY ordinal_position;

-- 3. Check ANTICIPATED_ANIMES columns
SELECT 
  'anticipated_animes' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'anticipated_animes'
ORDER BY ordinal_position;
