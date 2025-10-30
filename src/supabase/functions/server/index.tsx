import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { enrichEpisodes } from "./enrich.tsx";
import { syncFall2025 } from "./sync-fall-2024.tsx";

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

// Migration status endpoint - returns SQL to run manually
app.get("/make-server-c1d1bfd8/migration-status", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials",
        migrationNeeded: true
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to check if we have any episodes with dates
    // If columns don't exist, this will throw error code 42703
    const { data: episodesWithDates, error } = await supabase
      .from('weekly_episodes')
      .select('week_start_date, week_end_date')
      .limit(1);

    // If error code is 42703, columns don't exist - migration needed
    if (error) {
      if (error.code === '42703') {
        console.log('[Migration] ℹ️ Columns do not exist - migration needed');
        return c.json({ 
          success: true,
          migrationNeeded: true,
          message: 'Migration needed: week_start_date and week_end_date columns do not exist',
          sqlToRun: `
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS week_start_date DATE,
ADD COLUMN IF NOT EXISTS week_end_date DATE;

UPDATE weekly_episodes
SET 
  week_start_date = DATE '2025-09-29' + ((week_number - 1) * 7),
  week_end_date = DATE '2025-09-29' + ((week_number - 1) * 7) + 6
WHERE week_start_date IS NULL OR week_end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_weekly_episodes_dates ON weekly_episodes(week_start_date, week_end_date);
          `.trim()
        });
      }
      
      console.error('[Migration] Unexpected error checking dates:', error);
      return c.json({ 
        success: false, 
        error: error.message,
        migrationNeeded: true
      }, 500);
    }

    // Columns exist, check if they have data
    const hasDates = episodesWithDates && 
                     episodesWithDates.length > 0 && 
                     episodesWithDates[0].week_start_date !== null &&
                     episodesWithDates[0].week_end_date !== null;

    if (!hasDates) {
      console.log('[Migration] ℹ️ Columns exist but are empty - migration needed');
      return c.json({ 
        success: true,
        migrationNeeded: true,
        message: 'Migration needed: date columns are empty',
        sqlToRun: `
UPDATE weekly_episodes
SET 
  week_start_date = DATE '2025-09-29' + ((week_number - 1) * 7),
  week_end_date = DATE '2025-09-29' + ((week_number - 1) * 7) + 6
WHERE week_start_date IS NULL OR week_end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_weekly_episodes_dates ON weekly_episodes(week_start_date, week_end_date);
        `.trim()
      });
    }

    console.log('[Migration] ✅ Migration already applied');
    return c.json({ 
      success: true,
      migrationNeeded: false,
      message: 'Migration already applied - all good!'
    });

  } catch (error) {
    console.error("❌ Migration status error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      migrationNeeded: true
    }, 500);
  }
});

// ============================================
// DATA ENDPOINTS
// ============================================

// Get available weeks (weeks with at least 5 episodes)
app.get("/make-server-c1d1bfd8/available-weeks", async (c) => {
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

    // Current week is 5 (October 28, 2025)
    const CURRENT_WEEK = 5;

    // Get all episodes grouped by week number
    // Only return weeks up to the current week (no future weeks)
    const { data, error } = await supabase
      .from('weekly_episodes')
      .select('week_number')
      .lte('week_number', CURRENT_WEEK)
      .order('week_number', { ascending: true });

    if (error) {
      console.error("❌ Error fetching available weeks:", error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }

    // Count episodes per week
    const weekCounts = new Map<number, number>();
    data?.forEach(row => {
      const count = weekCounts.get(row.week_number) || 0;
      weekCounts.set(row.week_number, count + 1);
    });

    // Filter weeks with 5+ episodes
    const validWeeks = Array.from(weekCounts.entries())
      .filter(([week, count]) => count >= 5)
      .map(([week]) => week)
      .sort((a, b) => a - b);
    
    console.log(`[Server] 📊 Weeks with episode counts:`, Array.from(weekCounts.entries()).map(([w, c]) => `Week ${w}: ${c} episodes`).join(', '));
    console.log(`[Server] ✅ Available weeks (5+ episodes, up to week ${CURRENT_WEEK}): ${validWeeks.join(', ')}`);

    return c.json({
      success: true,
      weeks: validWeeks
    });

  } catch (error) {
    console.error("❌ Available weeks error:", error);
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

    // Get episodes for the week, ordered by score (primary) and position (fallback)
    // FILTER: Only show episodes with a valid score (NOT NULL)
    const { data: episodes, error } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .not('episode_score', 'is', null)
      .order('episode_score', { ascending: false })
      .order('position_in_week', { ascending: true });

    if (error) {
      console.error("Error fetching weekly episodes:", error);
      return c.json({
        success: false,
        error: error.message,
        needsData: true
      }, 200);
    }

    console.log(`[Server] Week ${weekNumber}: ${episodes?.length || 0} episodes with scores (N/A episodes hidden)`);
    
    // Debug: Log date fields from first episode
    if (episodes && episodes.length > 0) {
      const firstEp = episodes[0];
      console.log(`[Server] First episode date fields:`, {
        week_start_date: firstEp.week_start_date,
        week_end_date: firstEp.week_end_date,
        week_number: firstEp.week_number
      });
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

    // Get animes for the season, ordered by anime_score
    const { data: animes, error } = await supabase
      .from('season_rankings')
      .select('*')
      .eq('season', season)
      .eq('year', year)
      .order('anime_score', { ascending: false, nullsFirst: false })
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

// ============================================
// SYNC FALL 2025 ENDPOINT (AUTOMÁTICO)
// ============================================
app.post("/make-server-c1d1bfd8/sync-fall-2025", async (c) => {
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

    console.log("🚀 Iniciando sync automático Fall 2025...");
    
    const result = await syncFall2025(supabase);

    return c.json({
      success: result.success,
      animes: result.animes,
      episodes: result.episodes,
      errors: result.errors,
      message: result.message
    });

  } catch (error) {
    console.error("❌ Sync Fall 2025 error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// ENRICH EPISODES ENDPOINT (Backup)
// ============================================
app.post("/make-server-c1d1bfd8/enrich-episodes", async (c) => {
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

    console.log("🚀 Iniciando enriquecimento de episódios...");
    
    const result = await enrichEpisodes(supabase);

    return c.json({
      success: result.errors === 0,
      enriched: result.enriched,
      errors: result.errors,
      message: result.message
    });

  } catch (error) {
    console.error("❌ Enrich episodes error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

Deno.serve(app.fetch);
