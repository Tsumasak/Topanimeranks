-- ============================================
-- ADD OPTIMIZED INDEXES FOR PERFORMANCE
-- ============================================
-- Purpose: Improve query performance for weekly episodes and season rankings

-- ============================================
-- 1. CLEAN UP OLD INDEXES
-- ============================================

-- Drop old score indexes (now renamed)
DROP INDEX IF EXISTS idx_weekly_episodes_score;
DROP INDEX IF EXISTS idx_season_rankings_score;

-- ============================================
-- 2. WEEKLY EPISODES - NEW OPTIMIZED INDEXES
-- ============================================

-- Episode score index (for ranking by episode score)
CREATE INDEX IF NOT EXISTS idx_episode_score 
ON weekly_episodes(episode_score DESC NULLS LAST);

-- Week + Position composite (for fetching ranked episodes by week)
CREATE INDEX IF NOT EXISTS idx_week_position 
ON weekly_episodes(week_number, position_in_week);

-- Anime + Week composite (for tracking anime across weeks)
CREATE INDEX IF NOT EXISTS idx_anime_weeks 
ON weekly_episodes(anime_id, week_number);

-- Week + Score composite (for ranking within a week)
CREATE INDEX IF NOT EXISTS idx_week_score 
ON weekly_episodes(week_number, episode_score DESC NULLS LAST);

-- Complete ranking index (most used query pattern)
CREATE INDEX IF NOT EXISTS idx_week_ranking 
ON weekly_episodes(week_number, position_in_week, episode_score DESC);

-- Trend analysis index
CREATE INDEX IF NOT EXISTS idx_trend 
ON weekly_episodes(trend) WHERE trend IS NOT NULL;

-- ============================================
-- 3. SEASON RANKINGS - NEW OPTIMIZED INDEXES
-- ============================================

-- Anime score index (for ranking by anime score)
CREATE INDEX IF NOT EXISTS idx_anime_score 
ON season_rankings(anime_score DESC NULLS LAST);

-- Season + Year + Score composite (most common query)
CREATE INDEX IF NOT EXISTS idx_season_year_score 
ON season_rankings(season, year, anime_score DESC NULLS LAST);

-- ============================================
-- 4. ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================================

ANALYZE weekly_episodes;
ANALYZE season_rankings;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Optimized indexes created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Weekly Episodes Indexes:';
  RAISE NOTICE '   - idx_episode_score: Score ranking';
  RAISE NOTICE '   - idx_week_position: Week + Position lookup';
  RAISE NOTICE '   - idx_anime_weeks: Anime tracking across weeks';
  RAISE NOTICE '   - idx_week_score: Week + Score ranking';
  RAISE NOTICE '   - idx_week_ranking: Complete ranking query';
  RAISE NOTICE '   - idx_trend: Trend analysis';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Season Rankings Indexes:';
  RAISE NOTICE '   - idx_anime_score: Anime score ranking';
  RAISE NOTICE '   - idx_season_year_score: Season lookup + ranking';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Tables analyzed for optimal query planning!';
END $$;
