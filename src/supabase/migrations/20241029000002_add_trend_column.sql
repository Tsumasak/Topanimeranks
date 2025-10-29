-- ============================================
-- ADD TREND COLUMN BACK TO WEEKLY_EPISODES
-- ============================================

-- Add trend column if it doesn't exist
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS trend TEXT DEFAULT 'NEW';

-- Create index for trend
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_trend 
ON weekly_episodes(trend) WHERE trend IS NOT NULL;

-- Add comment
COMMENT ON COLUMN weekly_episodes.trend IS 'Position change from previous week: NEW, +N, -N, or =';

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Added trend column to weekly_episodes';
END $$;
