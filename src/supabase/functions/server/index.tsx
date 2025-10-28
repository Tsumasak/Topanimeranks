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

// ============================================
// DATA ENDPOINTS
// ============================================

// Get available weeks (weeks with at least 1 episode)
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

    // Get distinct week numbers that have episodes
    // Only return weeks up to the current week (no future weeks)
    const { data, error } = await supabase
      .from('weekly_episodes')
      .select('week_number')
      .lte('week_number', CURRENT_WEEK)
      .order('week_number', { ascending: true });

    if (error) {
      console.error("Error fetching available weeks:", error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }

    // Get unique week numbers
    const uniqueWeeks = [...new Set(data?.map(row => row.week_number) || [])];
    
    console.log(`[Server] Available weeks (up to week ${CURRENT_WEEK}): ${uniqueWeeks.join(', ')}`);

    return c.json({
      success: true,
      weeks: uniqueWeeks
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

    // Get episodes for the week, ordered by position
    // FILTER: Only show episodes with a valid score (NOT NULL)
    const { data: episodes, error } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .not('episode_score', 'is', null)
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
