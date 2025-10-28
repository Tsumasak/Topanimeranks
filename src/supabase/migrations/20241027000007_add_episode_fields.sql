-- ============================================
-- ADD EPISODE TITLE, URL AND TREND FIELDS
-- ============================================

-- Add episode_title column
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS episode_title TEXT;

-- Add episode_url column
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS episode_url TEXT;

-- Add trend column (for position changes)
-- Values: 'NEW', '+1', '+2', '-1', '-2', '='
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS trend TEXT DEFAULT 'NEW';

-- Add comments
COMMENT ON COLUMN weekly_episodes.episode_title IS 'Title of the specific episode';
COMMENT ON COLUMN weekly_episodes.episode_url IS 'MyAnimeList URL for the episode page';
COMMENT ON COLUMN weekly_episodes.trend IS 'Position change from previous week: NEW, +N, -N, or =';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Episode fields added successfully!';
  RAISE NOTICE '   - episode_title: Episode name';
  RAISE NOTICE '   - episode_url: Link to MAL episode page';
  RAISE NOTICE '   - trend: Position change indicator';
END $$;
