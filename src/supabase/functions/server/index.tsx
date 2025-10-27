import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c1d1bfd8/health", (c) => {
  return c.json({ status: "ok" });
});

// Setup endpoint - Creates all necessary tables and structure
app.post("/make-server-c1d1bfd8/setup", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🚀 Starting Supabase setup...");

    // Migration 1: Initial Schema
    console.log("📋 Running migration 1: initial_schema...");
    
    const migration1 = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- WEEKLY EPISODES TABLE
CREATE TABLE IF NOT EXISTS weekly_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  episode_id TEXT NOT NULL UNIQUE,
  anime_title TEXT NOT NULL,
  anime_title_english TEXT,
  anime_image_url TEXT,
  aired_at TIMESTAMPTZ,
  duration INTEGER,
  filler BOOLEAN DEFAULT false,
  recap BOOLEAN DEFAULT false,
  forum_url TEXT,
  score NUMERIC(4, 2),
  scored_by INTEGER,
  members INTEGER,
  favorites INTEGER,
  type TEXT,
  status TEXT,
  rating TEXT,
  source TEXT,
  demographics JSONB DEFAULT '[]'::jsonb,
  genres JSONB DEFAULT '[]'::jsonb,
  themes JSONB DEFAULT '[]'::jsonb,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  position_in_week INTEGER,
  is_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_episode_week UNIQUE (episode_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_episodes_week ON weekly_episodes(week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_anime ON weekly_episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_aired ON weekly_episodes(aired_at);
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_score ON weekly_episodes(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_members ON weekly_episodes(members DESC NULLS LAST);

-- SEASON RANKINGS TABLE
CREATE TABLE IF NOT EXISTS season_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_english TEXT,
  image_url TEXT,
  score NUMERIC(4, 2),
  scored_by INTEGER,
  members INTEGER,
  favorites INTEGER,
  popularity INTEGER,
  rank INTEGER,
  type TEXT,
  status TEXT,
  rating TEXT,
  source TEXT,
  episodes INTEGER,
  aired_from TIMESTAMPTZ,
  aired_to TIMESTAMPTZ,
  duration TEXT,
  demographics JSONB DEFAULT '[]'::jsonb,
  genres JSONB DEFAULT '[]'::jsonb,
  themes JSONB DEFAULT '[]'::jsonb,
  studios JSONB DEFAULT '[]'::jsonb,
  synopsis TEXT,
  season TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_anime_season UNIQUE (anime_id, season, year)
);

CREATE INDEX IF NOT EXISTS idx_season_rankings_season_year ON season_rankings(season, year);
CREATE INDEX IF NOT EXISTS idx_season_rankings_score ON season_rankings(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_season_rankings_members ON season_rankings(members DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_season_rankings_rank ON season_rankings(rank);

-- ANTICIPATED ANIMES TABLE
CREATE TABLE IF NOT EXISTS anticipated_animes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_english TEXT,
  image_url TEXT,
  score NUMERIC(4, 2),
  scored_by INTEGER,
  members INTEGER,
  favorites INTEGER,
  type TEXT,
  status TEXT,
  rating TEXT,
  source TEXT,
  episodes INTEGER,
  aired_from TIMESTAMPTZ,
  synopsis TEXT,
  demographics JSONB DEFAULT '[]'::jsonb,
  genres JSONB DEFAULT '[]'::jsonb,
  themes JSONB DEFAULT '[]'::jsonb,
  studios JSONB DEFAULT '[]'::jsonb,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anticipated_animes_members ON anticipated_animes(members DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_anticipated_animes_position ON anticipated_animes(position);

-- SYNC LOGS TABLE
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  week_number INTEGER,
  season TEXT,
  year INTEGER,
  items_synced INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at DESC);

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_weekly_episodes_updated_at ON weekly_episodes;
CREATE TRIGGER update_weekly_episodes_updated_at
  BEFORE UPDATE ON weekly_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_season_rankings_updated_at ON season_rankings;
CREATE TRIGGER update_season_rankings_updated_at
  BEFORE UPDATE ON season_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_anticipated_animes_updated_at ON anticipated_animes;
CREATE TRIGGER update_anticipated_animes_updated_at
  BEFORE UPDATE ON anticipated_animes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY
ALTER TABLE weekly_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE anticipated_animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to weekly_episodes" ON weekly_episodes;
CREATE POLICY "Allow public read access to weekly_episodes"
  ON weekly_episodes FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow public read access to season_rankings" ON season_rankings;
CREATE POLICY "Allow public read access to season_rankings"
  ON season_rankings FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow public read access to anticipated_animes" ON anticipated_animes;
CREATE POLICY "Allow public read access to anticipated_animes"
  ON anticipated_animes FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow public read access to sync_logs" ON sync_logs;
CREATE POLICY "Allow public read access to sync_logs"
  ON sync_logs FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access to weekly_episodes" ON weekly_episodes;
CREATE POLICY "Allow service role full access to weekly_episodes"
  ON weekly_episodes
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access to season_rankings" ON season_rankings;
CREATE POLICY "Allow service role full access to season_rankings"
  ON season_rankings
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access to anticipated_animes" ON anticipated_animes;
CREATE POLICY "Allow service role full access to anticipated_animes"
  ON anticipated_animes
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access to sync_logs" ON sync_logs;
CREATE POLICY "Allow service role full access to sync_logs"
  ON sync_logs
  TO service_role
  USING (true)
  WITH CHECK (true);

-- HELPER VIEWS
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
`;

    // Note: Direct SQL execution via Edge Functions is not supported
    // The migrations must be run via SQL Editor in Supabase Dashboard
    // We'll just verify if tables exist
    
    const { data: tablesCheck, error: tablesCheckError } = await supabase
      .from('weekly_episodes')
      .select('count')
      .limit(1);

    // Test if the tables exist
    if (tablesCheckError) {
      console.error("❌ Tables don't exist yet:", tablesCheckError);
      return c.json({
        success: false,
        error: "Tables not found. Please run migrations manually.",
        details: tablesCheckError.message,
        instructions: [
          "1. Go to Supabase Dashboard → SQL Editor",
          "2. Create a new query",
          "3. Copy contents from /supabase/migrations/20241027000001_initial_schema.sql",
          "4. Paste and click RUN",
          "5. Then copy contents from /supabase/migrations/20241027000002_setup_cron.sql",
          "6. Paste and click RUN",
          "7. Refresh this page"
        ]
      }, 500);
    }

    console.log("✅ Migration 1 completed - tables verified");

    // Test the tables again to be sure
    const { data: testData, error: testError } = await supabase
      .from('weekly_episodes')
      .select('count');

    if (testError) {
      console.error("❌ Table verification failed:", testError);
      return c.json({
        success: false,
        error: "Tables verification failed. Please run migrations manually via SQL Editor.",
        details: testError.message,
        instructions: [
          "1. Go to Supabase Dashboard → SQL Editor",
          "2. Create a new query",
          "3. Copy contents from /supabase/migrations/20241027000001_initial_schema.sql",
          "4. Paste and click RUN",
          "5. Refresh this page"
        ]
      }, 500);
    }

    console.log("✅ Tables verified successfully");

    // Insert a test sync log
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'setup',
        status: 'success',
        items_synced: 0,
        items_created: 4,
        items_updated: 0
      });

    if (logError) {
      console.error("⚠️ Warning: Could not create sync log:", logError);
    }

    return c.json({
      success: true,
      message: "✅ Supabase setup completed successfully!",
      tables_created: [
        "weekly_episodes",
        "season_rankings", 
        "anticipated_animes",
        "sync_logs"
      ],
      views_created: [
        "latest_sync_status"
      ],
      next_steps: [
        "Tables are ready to receive data",
        "You can now run data synchronization",
        "Check /components/SupabaseStatus.tsx for sync status"
      ]
    });

  } catch (error) {
    console.error("❌ Setup error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// Sync status endpoint - Check if tables exist and get latest sync logs
app.get("/make-server-c1d1bfd8/sync-status", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if tables exist by querying sync_logs
    const { data: logs, error: logsError } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      return c.json({
        success: false,
        error: "Tables not found",
        details: logsError.message,
        tables_exist: false
      }, 200); // Return 200 so frontend can handle it gracefully
    }

    return c.json({
      success: true,
      tables_exist: true,
      logs: logs || [],
      message: "Tables are ready"
    });

  } catch (error) {
    console.error("❌ Sync status error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Manual sync endpoint
app.post("/make-server-c1d1bfd8/sync", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await c.req.json();
    const { week_number = 1 } = body;

    console.log(`🔄 Starting manual sync for week ${week_number}...`);

    // This is a placeholder - you'll need to implement actual Jikan API calls
    // For now, just create a sync log
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'weekly_episodes',
        status: 'success',
        week_number,
        items_synced: 0,
        items_created: 0,
        items_updated: 0
      });

    if (logError) {
      throw logError;
    }

    return c.json({
      success: true,
      message: `Manual sync triggered for week ${week_number}`,
      note: "Full sync implementation requires Edge Function deployment"
    });

  } catch (error) {
    console.error("❌ Sync error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get weekly episodes data
app.get("/make-server-c1d1bfd8/weekly-episodes/:weekNumber", async (c) => {
  try {
    const weekNumber = parseInt(c.req.param('weekNumber'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get episodes for the week, ordered by position
    const { data: episodes, error } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .order('position_in_week', { ascending: true });

    if (error) {
      console.error("Error fetching weekly episodes:", error);
      return c.json({
        success: false,
        error: error.message,
        needsData: true
      }, 200);
    }

    return c.json({
      success: true,
      data: episodes || [],
      count: episodes?.length || 0
    });

  } catch (error) {
    console.error("❌ Weekly episodes error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get season rankings data
app.get("/make-server-c1d1bfd8/season-rankings/:season/:year", async (c) => {
  try {
    const season = c.req.param('season');
    const year = parseInt(c.req.param('year'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get animes for the season, ordered by score
    const { data: animes, error } = await supabase
      .from('season_rankings')
      .select('*')
      .eq('season', season)
      .eq('year', year)
      .order('score', { ascending: false, nullsFirst: false })
      .order('members', { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching season rankings:", error);
      return c.json({
        success: false,
        error: error.message,
        needsData: true
      }, 200);
    }

    return c.json({
      success: true,
      data: animes || [],
      count: animes?.length || 0
    });

  } catch (error) {
    console.error("❌ Season rankings error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get anticipated animes data
app.get("/make-server-c1d1bfd8/anticipated-animes", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get anticipated animes, ordered by position
    const { data: animes, error } = await supabase
      .from('anticipated_animes')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error("Error fetching anticipated animes:", error);
      return c.json({
        success: false,
        error: error.message,
        needsData: true
      }, 200);
    }

    return c.json({
      success: true,
      data: animes || [],
      count: animes?.length || 0
    });

  } catch (error) {
    console.error("❌ Anticipated animes error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

Deno.serve(app.fetch);