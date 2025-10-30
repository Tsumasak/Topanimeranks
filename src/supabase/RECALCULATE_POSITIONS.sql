-- ============================================
-- RECALCULATE WEEKLY EPISODE POSITIONS
-- ============================================
-- This script recalculates position_in_week for all episodes
-- based on their episode_score, ensuring correct ranking order
--
-- Run this in Supabase SQL Editor to fix existing data
-- ============================================

-- Disable triggers temporarily to avoid conflicts
BEGIN;

-- Create temporary table with correct positions
CREATE TEMP TABLE temp_positions AS
WITH ranked_episodes AS (
  SELECT 
    id,
    anime_id,
    week_number,
    episode_score,
    position_in_week as old_position,
    ROW_NUMBER() OVER (
      PARTITION BY week_number 
      ORDER BY 
        CASE WHEN episode_score IS NULL THEN 1 ELSE 0 END,
        episode_score DESC
    ) as new_position
  FROM weekly_episodes
  WHERE episode_score IS NOT NULL
)
SELECT 
  id,
  anime_id,
  week_number,
  new_position,
  old_position,
  (old_position - new_position) as position_change
FROM ranked_episodes
WHERE old_position != new_position;

-- Show what will be updated
SELECT 
  week_number,
  COUNT(*) as episodes_to_update,
  STRING_AGG(
    'Anime ' || anime_id || ': #' || old_position || ' → #' || new_position,
    ', '
  ) as changes
FROM temp_positions
GROUP BY week_number
ORDER BY week_number;

-- Update the positions
UPDATE weekly_episodes we
SET 
  position_in_week = tp.new_position,
  updated_at = NOW()
FROM temp_positions tp
WHERE we.id = tp.id;

-- Recalculate trends based on new positions
WITH trend_calc AS (
  SELECT 
    curr.id,
    curr.week_number,
    curr.anime_id,
    curr.position_in_week as curr_position,
    prev.position_in_week as prev_position,
    CASE 
      WHEN prev.position_in_week IS NULL THEN 'NEW'
      WHEN prev.position_in_week > curr.position_in_week THEN '+' || (prev.position_in_week - curr.position_in_week)::text
      WHEN prev.position_in_week < curr.position_in_week THEN (prev.position_in_week - curr.position_in_week)::text
      ELSE '='
    END as new_trend
  FROM weekly_episodes curr
  LEFT JOIN weekly_episodes prev 
    ON curr.anime_id = prev.anime_id 
    AND prev.week_number = curr.week_number - 1
  WHERE curr.week_number > 1
)
UPDATE weekly_episodes we
SET 
  trend = tc.new_trend,
  updated_at = NOW()
FROM trend_calc tc
WHERE we.id = tc.id
  AND (we.trend IS NULL OR we.trend != tc.new_trend);

-- Set trend to 'NEW' for week 1
UPDATE weekly_episodes
SET trend = 'NEW'
WHERE week_number = 1 AND (trend IS NULL OR trend != 'NEW');

-- Show summary
SELECT 
  week_number,
  COUNT(*) as total_episodes,
  COUNT(CASE WHEN trend = 'NEW' THEN 1 END) as new_entries,
  COUNT(CASE WHEN trend LIKE '+%' THEN 1 END) as moved_up,
  COUNT(CASE WHEN trend LIKE '-%' THEN 1 END) as moved_down,
  COUNT(CASE WHEN trend = '=' THEN 1 END) as same_position
FROM weekly_episodes
WHERE episode_score IS NOT NULL
GROUP BY week_number
ORDER BY week_number;

COMMIT;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the positions are correct
SELECT 
  week_number,
  position_in_week,
  anime_title_english,
  episode_number,
  episode_score,
  trend
FROM weekly_episodes
WHERE week_number = 3
  AND episode_score IS NOT NULL
ORDER BY position_in_week ASC
LIMIT 20;
