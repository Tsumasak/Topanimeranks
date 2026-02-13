-- ============================================
-- Migration: Add forum_url column to weekly_episodes
-- Created: 2025-02-13
-- Purpose: Store the Jikan API forum_url (discussion forum URL) for each episode
-- ============================================

-- Add forum_url column to weekly_episodes table
-- This is the URL to the MAL episode discussion forum, provided by Jikan API
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS forum_url TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN weekly_episodes.forum_url IS 'URL to the MAL episode discussion forum, obtained from Jikan API /episodes endpoint';

DO $$
BEGIN
  RAISE NOTICE '✅ Added forum_url column to weekly_episodes table';
END $$;
