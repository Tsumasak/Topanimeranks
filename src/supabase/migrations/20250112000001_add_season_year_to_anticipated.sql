-- ============================================
-- Migration: Add season and year columns to anticipated_animes
-- Date: 2025-01-12
-- ============================================

-- Add season and year columns to anticipated_animes table
ALTER TABLE anticipated_animes
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_anticipated_animes_season_year 
ON anticipated_animes(season, year);

-- Update comment
COMMENT ON COLUMN anticipated_animes.season IS 'Season when anime airs: winter, spring, summer, fall';
COMMENT ON COLUMN anticipated_animes.year IS 'Year when anime airs';
