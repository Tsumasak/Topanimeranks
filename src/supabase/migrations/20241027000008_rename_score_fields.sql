-- ============================================
-- RENAME SCORE FIELDS FOR CLARITY
-- ============================================
-- Purpose: Differentiate between anime score and episode score

-- 1. Rename score → episode_score in weekly_episodes
ALTER TABLE weekly_episodes 
RENAME COLUMN score TO episode_score;

-- 2. Rename score → anime_score in season_rankings
ALTER TABLE season_rankings 
RENAME COLUMN score TO anime_score;

-- 3. Add comments for clarity
COMMENT ON COLUMN weekly_episodes.episode_score IS 'Score of the specific episode (not the anime overall score)';
COMMENT ON COLUMN season_rankings.anime_score IS 'Overall score of the anime';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Score fields renamed successfully!';
  RAISE NOTICE '   - weekly_episodes.score → episode_score';
  RAISE NOTICE '   - season_rankings.score → anime_score';
END $$;
