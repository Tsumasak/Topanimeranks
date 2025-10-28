-- ============================================
-- QUICK FIX: Add Week Date Columns
-- ============================================
-- Execute este SQL no Supabase Dashboard para corrigir o erro "No dates in weekData"
--
-- Como usar:
-- 1. Acesse Supabase Dashboard → Database → SQL Editor
-- 2. Cole este código
-- 3. Clique em "Run"
-- 4. Recarregue a página do site
--
-- ============================================

-- Add week_start_date and week_end_date columns
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS week_start_date DATE,
ADD COLUMN IF NOT EXISTS week_end_date DATE;

-- Update existing records to populate these dates based on week_number
-- Week 1 starts on September 29, 2025
UPDATE weekly_episodes
SET 
  week_start_date = DATE '2025-09-29' + ((week_number - 1) * 7),
  week_end_date = DATE '2025-09-29' + ((week_number - 1) * 7) + 6
WHERE week_start_date IS NULL OR week_end_date IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_dates ON weekly_episodes(week_start_date, week_end_date);

-- Verify the fix worked
SELECT 
  week_number,
  week_start_date,
  week_end_date,
  COUNT(*) as episodes_count
FROM weekly_episodes
GROUP BY week_number, week_start_date, week_end_date
ORDER BY week_number;

-- ✅ Se você ver as datas preenchidas acima, a correção funcionou!
