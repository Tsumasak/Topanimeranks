import { useState } from 'react';
import { Button } from './ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

// SQL Schema - Same as CopySchemaButton
const SCHEMA_SQL = `-- ============================================
-- Top Anime Ranks - Supabase Schema
-- Created: 2024-10-27
-- Purpose: Cache system for Jikan API data
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. WEEKLY EPISODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Episode identification
  anime_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  episode_id TEXT NOT NULL UNIQUE, -- Format: "animeId_episodeNumber"
  
  -- Anime info
  anime_title TEXT NOT NULL,
  anime_title_english TEXT,
  anime_image_url TEXT,
  
  -- Episode info
  aired_at TIMESTAMPTZ,
  duration INTEGER, -- in minutes
  filler BOOLEAN DEFAULT false,
  recap BOOLEAN DEFAULT false,
  forum_url TEXT,
  
  -- Scores and stats
  score NUMERIC(4, 2),
  scored_by INTEGER,
  members INTEGER,
  favorites INTEGER,
  
  -- Categories
  type TEXT, -- TV, Movie, OVA, etc
  status TEXT, -- Currently Airing, Finished Airing
  rating TEXT, -- PG-13, R-17+, etc
  source TEXT, -- Manga, Light novel, etc
  demographics JSONB DEFAULT '[]'::jsonb,
  genres JSONB DEFAULT '[]'::jsonb,
  themes JSONB DEFAULT '[]'::jsonb,
  
  -- Week tracking
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Position tracking
  position_in_week INTEGER,
  
  -- Manual episode flag
  is_manual BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_episode_week UNIQUE (episode_id, week_number)
);

-- Indexes for fast queries
CREATE INDEX idx_weekly_episodes_week ON weekly_episodes(week_number);
CREATE INDEX idx_weekly_episodes_anime ON weekly_episodes(anime_id);
CREATE INDEX idx_weekly_episodes_aired ON weekly_episodes(aired_at);
CREATE INDEX idx_weekly_episodes_score ON weekly_episodes(score DESC NULLS LAST);
CREATE INDEX idx_weekly_episodes_members ON weekly_episodes(members DESC NULLS LAST);

-- ============================================
-- 2. SEASON RANKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS season_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Anime identification
  anime_id INTEGER NOT NULL,
  
  -- Anime info
  title TEXT NOT NULL,
  title_english TEXT,
  image_url TEXT,
  
  -- Scores and stats
  score NUMERIC(4, 2),
  scored_by INTEGER,
  members INTEGER,
  favorites INTEGER,
  popularity INTEGER,
  rank INTEGER,
  
  -- Anime details
  type TEXT,
  status TEXT,
  rating TEXT,
  source TEXT,
  episodes INTEGER,
  aired_from TIMESTAMPTZ,
  aired_to TIMESTAMPTZ,
  duration TEXT,
  
  -- Categories
  demographics JSONB DEFAULT '[]'::jsonb,
  genres JSONB DEFAULT '[]'::jsonb,
  themes JSONB DEFAULT '[]'::jsonb,
  studios JSONB DEFAULT '[]'::jsonb,
  
  -- Synopsis
  synopsis TEXT,
  
  -- Season tracking
  season TEXT NOT NULL, -- winter, spring, summer, fall
  year INTEGER NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_anime_season UNIQUE (anime_id, season, year)
);

-- Indexes
CREATE INDEX idx_season_rankings_season_year ON season_rankings(season, year);
CREATE INDEX idx_season_rankings_score ON season_rankings(score DESC NULLS LAST);
CREATE INDEX idx_season_rankings_members ON season_rankings(members DESC NULLS LAST);
CREATE INDEX idx_season_rankings_rank ON season_rankings(rank);

-- ============================================
-- 3. ANTICIPATED ANIMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS anticipated_animes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Anime identification
  anime_id INTEGER NOT NULL UNIQUE,
  
  -- Anime info
  title TEXT NOT NULL,
  title_english TEXT,
  image_url TEXT,
  
  -- Scores and stats
  score NUMERIC(4, 2),
  scored_by INTEGER,
  members INTEGER,
  favorites INTEGER,
  
  -- Anime details
  type TEXT,
  status TEXT,
  rating TEXT,
  source TEXT,
  episodes INTEGER,
  aired_from TIMESTAMPTZ,
  synopsis TEXT,
  
  -- Categories
  demographics JSONB DEFAULT '[]'::jsonb,
  genres JSONB DEFAULT '[]'::jsonb,
  themes JSONB DEFAULT '[]'::jsonb,
  studios JSONB DEFAULT '[]'::jsonb,
  
  -- Tracking
  position INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_anticipated_animes_members ON anticipated_animes(members DESC NULLS LAST);
CREATE INDEX idx_anticipated_animes_position ON anticipated_animes(position);

-- ============================================
-- 4. SYNC LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Sync info
  sync_type TEXT NOT NULL, -- 'weekly_episodes', 'season_rankings', 'anticipated'
  status TEXT NOT NULL, -- 'started', 'success', 'error'
  
  -- Details
  week_number INTEGER,
  season TEXT,
  year INTEGER,
  
  -- Stats
  items_synced INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Performance
  duration_ms INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_created ON sync_logs(created_at DESC);

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_weekly_episodes_updated_at
  BEFORE UPDATE ON weekly_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_season_rankings_updated_at
  BEFORE UPDATE ON season_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anticipated_animes_updated_at
  BEFORE UPDATE ON anticipated_animes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE weekly_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE anticipated_animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Allow read access to everyone (anon role)
CREATE POLICY "Allow public read access to weekly_episodes"
  ON weekly_episodes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to season_rankings"
  ON season_rankings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to anticipated_animes"
  ON anticipated_animes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to sync_logs"
  ON sync_logs FOR SELECT
  TO anon
  USING (true);

-- Policies: Allow service role full access (for Edge Functions)
CREATE POLICY "Allow service role full access to weekly_episodes"
  ON weekly_episodes
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to season_rankings"
  ON season_rankings
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to anticipated_animes"
  ON anticipated_animes
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to sync_logs"
  ON sync_logs
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7. HELPER VIEWS
-- ============================================

-- View: Latest sync status
CREATE OR REPLACE VIEW latest_sync_status AS
SELECT DISTINCT ON (sync_type)
  sync_type,
  status,
  items_synced,
  duration_ms,
  created_at,
  error_message
FROM sync_logs
ORDER BY sync_type, created_at DESC;

COMMENT ON VIEW latest_sync_status IS 'Shows the latest sync status for each sync type';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Top Anime Ranks schema created successfully!';
  RAISE NOTICE '📊 Tables: weekly_episodes, season_rankings, anticipated_animes, sync_logs';
  RAISE NOTICE '🔒 RLS enabled with public read access';
  RAISE NOTICE '🚀 Ready for data synchronization!';
END $$;`;

export function SQLTextArea() {
  const [expanded, setExpanded] = useState(false);

  const handleSelectAll = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.select();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          📄 Complete SQL Code (329 lines)
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <Minimize2 className="w-4 h-4 mr-2" />
              Collapse
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 mr-2" />
              Expand
            </>
          )}
        </Button>
      </div>
      
      <textarea
        readOnly
        value={SCHEMA_SQL}
        onClick={handleSelectAll}
        className={`w-full font-mono text-xs bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4 focus:outline-none focus:border-blue-500 transition-all ${
          expanded ? 'h-96' : 'h-40'
        }`}
        placeholder="SQL code will appear here..."
        spellCheck={false}
      />
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 <strong>Tip:</strong> Click inside the box to select all text, then Ctrl+C (or Cmd+C) to copy.
      </p>
    </div>
  );
}
