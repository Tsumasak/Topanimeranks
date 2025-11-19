-- ============================================
-- CLEANUP: Delete duplicate episodes in wrong weeks
-- Keep only episodes in the correct week based on aired_at
-- ============================================

-- First, let's see how many duplicates we have
SELECT 
  anime_id,
  episode_number,
  COUNT(*) as duplicate_count,
  array_agg(week_number ORDER BY week_number) as weeks,
  array_agg(episode_score ORDER BY week_number) as scores,
  MIN(aired_at) as aired_date
FROM weekly_episodes
WHERE is_manual = false
GROUP BY anime_id, episode_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, anime_id, episode_number;

-- ============================================
-- DELETE LOGIC: Remove episodes in wrong weeks
-- ============================================

-- Calculate the correct week for each episode and delete those in wrong weeks
WITH correct_weeks AS (
  SELECT 
    id,
    anime_id,
    episode_number,
    week_number,
    aired_at,
    -- Calculate correct week based on aired_at
    -- Week 1 = 2025-09-29 to 2025-10-05 (7 days)
    CASE 
      WHEN aired_at IS NULL THEN NULL
      ELSE FLOOR(EXTRACT(EPOCH FROM (aired_at - TIMESTAMP '2025-09-29 00:00:00+00')) / (7 * 24 * 60 * 60)) + 1
    END AS calculated_week
  FROM weekly_episodes
  WHERE is_manual = false
)
DELETE FROM weekly_episodes
WHERE id IN (
  SELECT id 
  FROM correct_weeks
  WHERE 
    calculated_week IS NOT NULL 
    AND week_number != calculated_week
);

-- ============================================
-- VERIFICATION: Check if duplicates are gone
-- ============================================

-- This should return 0 rows if cleanup was successful
SELECT 
  anime_id,
  episode_number,
  COUNT(*) as duplicate_count,
  array_agg(week_number ORDER BY week_number) as weeks
FROM weekly_episodes
WHERE is_manual = false
GROUP BY anime_id, episode_number
HAVING COUNT(*) > 1
ORDER BY anime_id, episode_number;

-- Show summary
SELECT 
  COUNT(DISTINCT anime_id) as total_animes,
  COUNT(*) as total_episodes,
  COUNT(DISTINCT (anime_id, episode_number)) as unique_episodes
FROM weekly_episodes
WHERE is_manual = false;
