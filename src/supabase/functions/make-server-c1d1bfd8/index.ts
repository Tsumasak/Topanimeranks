import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { enrichEpisodes, recalculatePositions } from "./enrich.tsx";
import { syncUpcoming } from "./sync-upcoming.tsx";
import { syncSeason } from "./sync-season.tsx";
import { getEpisodeWeekNumber } from "./season-utils.tsx";
import { generateExport } from "./export-ranks.tsx";

const app = new Hono();

// ============================================
// CURRENT SEASON CONFIGURATION
// ============================================
// Atualizar manualmente quando a temporada mudar
const CURRENT_SEASON = 'spring';
const CURRENT_YEAR = 2026;

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

// Get available weeks (weeks with at least 3 episodes WITH SCORE)
app.get("/make-server-c1d1bfd8/available-weeks", async (c) => {
  // Calcular a week atual baseada na data de hoje (moved outside try for catch block access)
  const today = new Date();
  const { season: currentSeason, year: currentYear, weekNumber: currentWeekNumber } = getEpisodeWeekNumber(today);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Server] ❌ Missing Supabase credentials');
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`[Server] 📅 Hoje: ${today.toISOString().split('T')[0]} = ${currentSeason} ${currentYear} Week ${currentWeekNumber}`);

    // Buscar APENAS episódios da season/year ATUAL com score
    const { data, error } = await supabase
      .from('weekly_episodes')
      .select('week_number, episode_score, status, season, year, aired_at')
      .eq('season', currentSeason)
      .eq('year', currentYear)
      .not('episode_score', 'is', null)
      .lte('week_number', currentWeekNumber) // Apenas weeks até a atual (não mostrar futuras)
      .order('week_number', { ascending: true });

    if (error) {
      console.error("[Server] ❌ Error fetching available weeks:", error);
      
      // Fallback: Se houver erro no banco, retornar Week 1 como fallback
      console.log("[Server] 🔄 Returning fallback: Week 1 only");
      return c.json({
        success: true,
        weeks: [1],
        latestWeek: 1,
        currentWeek: currentWeekNumber,
        currentSeason: currentSeason,
        currentYear: currentYear,
        weekCounts: [{ week: 1, count: 0 }],
        isFallback: true,
        fallbackReason: error.message
      });
    }

    // Count episodes WITH SCORE per week
    const weekCounts = new Map<number, number>();
    data?.forEach(row => {
      const count = weekCounts.get(row.week_number) || 0;
      weekCounts.set(row.week_number, count + 1);
    });

    // ✅ FIXED: Filter weeks with 3+ episodes WITH SCORE (changed from 5+)
    const validWeeks = Array.from(weekCounts.entries())
      .filter(([week, count]) => count >= 3) // ✅ Changed from 5 to 3
      .map(([week]) => week)
      .sort((a, b) => a - b);
    
    // Determine the latest week (highest week number with 3+ scored episodes)
    const latestWeek = validWeeks.length > 0 ? Math.max(...validWeeks) : 1;
    
    console.log(`[Server] 📊 Weeks with scored episodes:`, Array.from(weekCounts.entries()).map(([w, c]) => `Week ${w}: ${c} episodes`).join(', '));
    console.log(`[Server] ✅ Available weeks (3+ episodes with score): ${validWeeks.join(', ')}`); // ✅ Updated message
    console.log(`[Server] 🎯 Latest week with 3+ scored episodes: Week ${latestWeek}`); // ✅ Updated message

    // Se não houver weeks válidas, retornar Week 1 como fallback
    if (validWeeks.length === 0) {
      console.log("[Server] ⚠️ No weeks with 3+ scored episodes found"); // ✅ Updated message
      console.log("[Server] 🔄 Returning fallback: Week 1 only");
      return c.json({
        success: true,
        weeks: [1],
        latestWeek: 1,
        currentWeek: currentWeekNumber,
        currentSeason: currentSeason,
        currentYear: currentYear,
        weekCounts: Array.from(weekCounts.entries()).map(([week, count]) => ({ week, count })),
        isFallback: true,
        fallbackReason: 'No weeks with 3+ scored episodes' // ✅ Updated message
      });
    }

    return c.json({
      success: true,
      weeks: validWeeks,
      latestWeek: latestWeek,
      currentWeek: currentWeekNumber,
      currentSeason: currentSeason,
      currentYear: currentYear,
      weekCounts: Array.from(weekCounts.entries()).map(([week, count]) => ({ week, count })),
      weekCountsRecord: Object.fromEntries(weekCounts.entries()) // Record format: { "1": 6 }
    });

  } catch (error) {
    console.error("[Server] ❌ Available weeks error:", error);
    console.error("[Server] ❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    // Fallback final: Retornar Week 1
    return c.json({
      success: true,
      weeks: [1],
      latestWeek: 1,
      currentWeek: 1,
      currentSeason: currentSeason,
      currentYear: currentYear,
      weekCounts: [{ week: 1, count: 0 }],
      isFallback: true,
      fallbackReason: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get weekly episodes data
app.get("/make-server-c1d1bfd8/weekly-episodes/:weekNumber", async (c) => {
  const today = new Date();
  const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);

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

    // Fetch weekly episodes with filters
    console.log(`🔍 Fetching weekly episodes for ${currentSeason} ${currentYear} Week ${weekNumber}...`);
    
    // Buscar APENAS episódios da season/year ATUAL
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('season', currentSeason)
      .eq('year', currentYear)
      .eq('week_number', weekNumber)
      .not('episode_score', 'is', null) // Apenas episódios com score
      .order('episode_score', { ascending: false }); // Ordenar por score DESC (maior = melhor)

    if (weeklyError) {
      console.error("Error fetching weekly episodes:", weeklyError);
      return c.json({
        success: false,
        error: weeklyError.message,
        needsData: true
      }, 200);
    }

    console.log(`[Server] ${currentSeason} ${currentYear} Week ${weekNumber}: ${weeklyData?.length || 0} episodes (sorted by episode_score DESC)`);
    
    // Debug: Log some episode info
    if (weeklyData && weeklyData.length > 0) {
      const firstEp = weeklyData[0];
      console.log(`[Server] First episode:`, {
        anime: firstEp.anime_title_english,
        episode: firstEp.episode_number,
        score: firstEp.episode_score,
        season: firstEp.season,
        year: firstEp.year,
        week: firstEp.week_number,
        aired_at: firstEp.aired_at
      });
    }

    return c.json({
      success: true,
      data: weeklyData || [],
      count: weeklyData?.length || 0,
      season: currentSeason,
      year: currentYear
    });

  } catch (error) {
    console.error("❌ Weekly episodes error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// DEBUG: Get all episodes for a specific anime
app.get("/make-server-c1d1bfd8/debug-anime/:animeId", async (c) => {
  const today = new Date();
  const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
  try {
    const animeId = parseInt(c.req.param('animeId'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log(`🔍 DEBUG: Fetching ALL episodes for anime ${animeId}...`);
    
    // Buscar TODOS os episódios deste anime (sem filtros)
    const { data: allEpisodes, error: allError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('anime_id', animeId)
      .order('episode_number', { ascending: false });

    if (allError) {
      console.error("Error fetching anime episodes:", allError);
      return c.json({
        success: false,
        error: allError.message
      }, 500);
    }

    console.log(`[DEBUG] Found ${allEpisodes?.length || 0} episodes for anime ${animeId}`);
    
    // Log detalhes de cada episódio
    allEpisodes?.forEach(ep => {
      console.log(`[DEBUG] EP${ep.episode_number}: Score=${ep.episode_score}, Week=${ep.week_number}, Season=${ep.season} ${ep.year}, Aired=${ep.aired_at}`);
    });

    return c.json({
      success: true,
      animeId: animeId,
      totalEpisodes: allEpisodes?.length || 0,
      episodes: allEpisodes || [],
      currentSeason: currentSeason,
      currentYear: currentYear
    });

  } catch (error) {
    console.error("❌ Debug anime error:", error);
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

    console.log(`[Server] 🔍 Fetching season rankings for ${season} ${year}...`);

    // Get animes for the season with STRICT filtering
    // CRITICAL: Use .ilike() for case-insensitive season matching
    const { data: animes, error } = await supabase
      .from('season_rankings')
      .select('*')
      .ilike('season', season) // Case-insensitive
      .eq('year', year)
      .order('anime_score', { ascending: false, nullsFirst: false }) // FIXED: Changed 'score' to 'anime_score'
      .order('members', { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching season rankings:", error);
      return c.json({
        success: false,
        error: error.message,
        needsData: true
      }, 200);
    }

    console.log(`[Server] ✅ Found ${animes?.length || 0} animes for ${season} ${year}`);
    
    // Debug: Log first 3 animes
    if (animes && animes.length > 0) {
      console.log('[Server] First 3 animes:', animes.slice(0, 3).map(a => ({
        id: a.anime_id,
        title: a.title_english || a.title,
        season: a.season,
        year: a.year,
        score: a.anime_score
      })));
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

// Get available years for a genre
app.get("/make-server-c1d1bfd8/genre-years", async (c) => {
  try {
    const today = new Date();
    const { year: currentYear } = getEpisodeWeekNumber(today);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const genre = c.req.query('genre');

    if (!genre) {
      return c.json({ 
        success: false, 
        error: "Missing genre parameter" 
      }, 400);
    }

    console.log(`[Server] 🔍 Fetching years for genre: ${genre}...`);

    // Get from season_rankings
    // Offloaded to Postgres using JSONB Contains!
    const { data, error } = await supabase
      .from('season_rankings')
      .select('year')
      .contains('genres', JSON.stringify([{ name: genre }]))
      .neq('year', 9999);

    if (error) {
      console.error("Error fetching genre years:", error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
    
    const yearsSet = new Set<number>();
    if (data) {
      data.forEach(row => yearsSet.add(row.year));
    }

    // Filter against current year directly
    const years = Array.from(yearsSet)
      .filter((y) => y <= currentYear)
      .sort((a, b) => b - a);

    console.log(`[Server] ✅ Found ${years.length} years for genre ${genre} (merged): ${years.join(', ')}`);

    return c.json({
      success: true,
      years: years,
      source: 'merged'
    });

  } catch (error) {
    console.error("❌ Genre years error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get available seasons for a specific genre and year
app.get("/make-server-c1d1bfd8/genre-seasons", async (c) => {
  try {
    const today = new Date();
    const { season: currentSeasonObj, year: currentYear } = getEpisodeWeekNumber(today);
    const currentSeasonStr = currentSeasonObj.toLowerCase();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: 'Missing Supabase configuration' 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const genre = c.req.query('genre');
    const year = c.req.query('year');

    if (!genre || !year) {
      return c.json({ 
        success: false, 
        error: 'Missing genre or year parameter' 
      }, 400);
    }

    console.log(`[Server] 🔍 Fetching available seasons for genre: ${genre}, year: ${year}`);

    const seasonsSet = new Set<string>();
    const requestedYear = parseInt(year);

    // Get from season_rankings directly via JSON containment without early skip
    const { data: seasonData, error: seasonError } = await supabase
      .from('season_rankings')
      .select('season')
      .eq('year', requestedYear)
      .contains('genres', JSON.stringify([{ name: genre }]))
      .not('season', 'is', null);

    if (seasonError) {
      console.error('❌ Supabase error:', seasonError);
      return c.json({ 
        success: false, 
        error: seasonError.message 
      }, 500);
    }

    if (seasonData) {
      seasonData.forEach(row => {
        if (row.season) seasonsSet.add(row.season.toLowerCase());
      });
    }

    const seasonOrder = ['winter', 'spring', 'summer', 'fall'];
    let seasonsArray = Array.from(seasonsSet);

    if (requestedYear > currentYear) {
      seasonsArray = [];
    } else if (requestedYear === currentYear) {
      const currentIndex = seasonOrder.indexOf(currentSeasonStr);
      seasonsArray = seasonsArray.filter(s => {
        const idx = seasonOrder.indexOf(s.toLowerCase());
        return idx !== -1 && idx <= currentIndex;
      });
    }

    const seasons = seasonsArray.sort((a, b) => seasonOrder.indexOf(a) - seasonOrder.indexOf(b));
    console.log(`[Server] ✅ Found ${seasons.length} seasons (merged): ${seasons.join(', ')}`);

    return c.json({
      success: true,
      seasons: seasons,
      source: 'season_rankings'
    });

  } catch (error) {
    console.error("❌ Genre seasons error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get genre rankings (OPTIMIZED with pagination)
app.get("/make-server-c1d1bfd8/genre-rankings", async (c) => {
  const startTime = Date.now();
  
  try {
    const today = new Date();
    const { season: rawCurrentSeason, year: currentYear } = getEpisodeWeekNumber(today);
    const currentSeasonStr = rawCurrentSeason.toLowerCase();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const genre = c.req.query('genre');
    const year = c.req.query('year');
    const season = c.req.query('season');
    const sortBy = c.req.query('sortBy') || 'score';
    const offset = parseInt(c.req.query('offset') || '0');
    const limit = parseInt(c.req.query('limit') || '100');

    if (!genre || !year) {
      return c.json({ 
        success: false, 
        error: "Missing required parameters: genre and year" 
      }, 400);
    }

    console.log(`[Server] 🔍 Fetching genre rankings for ${genre}, ${year}, ${season || 'all seasons'} (offset: ${offset}, limit: ${limit})...`);

    const requestedYear = parseInt(year);

    if (requestedYear > currentYear) {
      return c.json({ success: true, data: [], count: 0, hasMore: false });
    }

    const seasonOrder = ['winter', 'spring', 'summer', 'fall'];
    const currentSeasonIndex = seasonOrder.indexOf(currentSeasonStr);
    
    // Safety check for specific season logic directly avoiding upcoming calendar events
    if (requestedYear === currentYear && season && season !== 'all') {
      const requestedSeasonIdx = seasonOrder.indexOf(season.toLowerCase());
      if (requestedSeasonIdx > currentSeasonIndex) {
        return c.json({ success: true, data: [], count: 0, hasMore: false });
      }
    }

    let allowedSeasonsCases: string[] = [];
    if (requestedYear === currentYear && (!season || season === 'all')) {
      const allowedSeasons = seasonOrder.slice(0, currentSeasonIndex + 1);
      allowedSeasonsCases = allowedSeasons.flatMap(s => [s, s.charAt(0).toUpperCase() + s.slice(1)]);
    }



    // Get from season_rankings natively accelerated by .contains logic
    const queryStartTime = Date.now();

    let query = supabase
      .from('season_rankings')
      .select('*', { count: 'exact' })
      .eq('year', requestedYear)
      .contains('genres', JSON.stringify([{ name: genre }])); // Offloaded JSON filter natively to Postgres

    if (season && season !== 'all') {
      query = query.ilike('season', season);
    } else if (allowedSeasonsCases.length > 0) {
      query = query.in('season', allowedSeasonsCases);
    }

    // Applying sort
    if (sortBy === 'popularity') {
      query = query.order('members', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('anime_score', { ascending: false, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: allAnimes, error, count: fetchedCount } = await query;
    const queryEndTime = Date.now();
    
    console.log(`[Server] ⏱️  Database JSONB query took ${queryEndTime - queryStartTime}ms`);

    if (error) {
      console.error("Error fetching genre rankings:", error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Server] ✅ Total request time: ${totalTime}ms (via JSONB Contains)`);

    return c.json({
      success: true,
      data: allAnimes || [],
      count: fetchedCount || 0,
      returned: allAnimes?.length || 0,
      offset: offset,
      limit: limit,
      hasMore: fetchedCount ? (offset + (allAnimes?.length || 0)) < fetchedCount : false,
      genre: genre,
      year: requestedYear,
      season: season || 'all',
      sortBy: sortBy,
      source: 'season_rankings',
      performance: {
        totalTime: totalTime,
        queryTime: queryEndTime - queryStartTime,
        retrievedCount: fetchedCount || 0,
        isOptimized: true 
      }
    });

  } catch (error) {
    console.error("❌ Genre rankings error:", error);
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
// SYNC UPCOMING ENDPOINT (MANUAL)
// ============================================
// Sincroniza animes "upcoming" (2026+, 2027+, "Not available")
// Para aparecer na aba "Later" do Most Anticipated
app.post("/make-server-c1d1bfd8/sync-upcoming", async (c) => {
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

    console.log("🚀 Iniciando sync UPCOMING animes...");
    
    const result = await syncUpcoming(supabase);

    return c.json({
      success: result.success,
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      message: `Sync completed: ${result.inserted} animes inserted/updated`
    });

  } catch (error) {
    console.error("❌ Sync UPCOMING error:", error);
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

    const today = new Date();
    const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
    console.log(`🚀 Iniciando enriquecimento de episódios para ${currentSeason} ${currentYear}...`);
    
    const result = await enrichEpisodes(supabase, currentSeason, currentYear);

    return c.json({
      success: result.errors === 0,
      enriched: result.enriched,
      inserted: result.inserted,
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

// ============================================
// RECALCULATE POSITIONS ENDPOINT (MANUAL)
// ============================================
// Recalcula as posições de ranking (position_in_week) de TODAS as weeks
// baseado no episode_score. Use quando as posições estiverem erradas.
app.post("/make-server-c1d1bfd8/recalculate-positions", async (c) => {
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

    const today = new Date();
    const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
    console.log("🔢 Iniciando recálculo de posições...");
    
    await recalculatePositions(supabase, currentSeason, currentYear);

    return c.json({
      success: true,
      message: "Posições recalculadas com sucesso!"
    });

  } catch (error) {
    console.error("❌ Recalculate positions error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// GET version for easy browser testing
app.get("/make-server-c1d1bfd8/recalculate-positions", async (c) => {
  const today = new Date();
  const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
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

    console.log("🔢 Iniciando recálculo de posições...");
    
    await recalculatePositions(supabase, currentSeason, currentYear);

    return c.json({
      success: true,
      message: "Posições recalculadas com sucesso!"
    });

  } catch (error) {
    console.error("❌ Recalculate positions error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// FIX WEEK NUMBERS ENDPOINT (MANUAL)
// ============================================
// Recalcula os week_numbers de TODOS os episódios usando o sistema de seasons
// Baseado na data de aired_at de cada episódio
app.get("/make-server-c1d1bfd8/fix-week-numbers", async (c) => {
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

    console.log("🔧 Iniciando recálculo de week_numbers usando sistema de seasons...");
    
    // Buscar TODOS os episódios que têm data de aired_at
    const { data: episodes, error: fetchError } = await supabase
      .from('weekly_episodes')
      .select('id, anime_id, episode_number, aired_at, anime_title_english')
      .not('aired_at', 'is', null);
    
    if (fetchError) {
      console.error("❌ Erro ao buscar episódios:", fetchError);
      return c.json({
        success: false,
        error: fetchError.message
      }, 500);
    }
    
    if (!episodes || episodes.length === 0) {
      console.log("⚠️ Nenhum episódio com aired_at encontrado");
      return c.json({
        success: true,
        message: "Nenhum episódio para recalcular",
        updated: 0
      });
    }
    
    console.log(`📊 Encontrados ${episodes.length} episódios para recalcular`);
    
    let updated = 0;
    let errors = 0;
    
    // Recalcular week_number para cada episódio
    for (const episode of episodes) {
      try {
        const airedDate = new Date(episode.aired_at);
        
        // Usar função de season para calcular week_number
        const { season, year, weekNumber } = getEpisodeWeekNumber(airedDate);
        
        console.log(`  📅 ${episode.anime_title_english || 'Unknown'} EP${episode.episode_number}: ${season} ${year} Week ${weekNumber}`);
        
        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('weekly_episodes')
          .update({ 
            week_number: weekNumber,
            season: season,
            year: year
          })
          .eq('id', episode.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar episódio ${episode.id}:`, updateError);
          errors++;
        } else {
          updated++;
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar episódio ${episode.id}:`, error);
        errors++;
      }
    }
    
    console.log(`🎉 Recálculo concluído: ${updated} episódios atualizados, ${errors} erros`);
    
    return c.json({
      success: true,
      message: `Week numbers recalculados com sucesso!`,
      total: episodes.length,
      updated,
      errors
    });

  } catch (error) {
    console.error("❌ Fix week numbers error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// SYNC SEASON ENDPOINT (MANUAL)
// ============================================
// Sincroniza animes de uma temporada específica
// Para atualizar a tabela season_rankings

// ============================================
// SAVE SEASON BATCH - Salva animes já buscados
// ============================================
app.post("/make-server-c1d1bfd8/save-season-batch", async (c) => {
  try {
    const { animes, season, year } = await c.req.json();
    
    console.log(`💾 Saving ${animes?.length || 0} animes for ${season} ${year}...`);
    
    if (!animes || !Array.isArray(animes) || animes.length === 0) {
      return c.json({ success: false, error: 'No animes provided' }, 400);
    }
    
    // ✅ CRITICAL FIX: Remove duplicates (Jikan API sometimes returns duplicates)
    const uniqueAnimes = Array.from(
      new Map(animes.map(anime => [anime.anime_id, anime])).values()
    );
    
    if (uniqueAnimes.length < animes.length) {
      console.log(`⚠️ Removed ${animes.length - uniqueAnimes.length} duplicate animes`);
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing anime IDs
    const animeIds = uniqueAnimes.map(a => a.anime_id);
    const { data: existingAnimes } = await supabase
      .from('season_rankings')
      .select('anime_id')
      .eq('season', season)
      .eq('year', year)
      .in('anime_id', animeIds);
    
    const existingIds = new Set(existingAnimes?.map(a => a.anime_id) || []);
    console.log(`📊 Found ${existingIds.size} existing, ${uniqueAnimes.length - existingIds.size} new`);

    // Batch upsert
    const BATCH_SIZE = 100;
    for (let i = 0; i < uniqueAnimes.length; i += BATCH_SIZE) {
      const batch = uniqueAnimes.slice(i, i + BATCH_SIZE);
      console.log(`📦 Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uniqueAnimes.length / BATCH_SIZE)}...`);
      
      const { error } = await supabase
        .from('season_rankings')
        .upsert(batch, {
          onConflict: 'anime_id,season,year',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('❌ Batch upsert error:', error);
        return c.json({ success: false, error: error.message }, 500);
      }
    }

    const inserted = uniqueAnimes.filter(a => !existingIds.has(a.anime_id)).length;
    const updated = uniqueAnimes.filter(a => existingIds.has(a.anime_id)).length;

    console.log(`✅ Save complete: ${inserted} inserted, ${updated} updated`);

    return c.json({
      success: true,
      inserted,
      updated,
      total: animes.length
    });

  } catch (error) {
    console.error("❌ Save batch error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// UPDATE ANIME PICTURES - Update pictures for a specific anime
// ============================================
app.post("/make-server-c1d1bfd8/update-anime-pictures", async (c) => {
  try {
    const { anime_id, season, year, pictures } = await c.req.json();
    
    if (!anime_id || !season || !year || !pictures) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('season_rankings')
      .update({ pictures })
      .eq('anime_id', anime_id)
      .eq('season', season)
      .eq('year', year);
    
    if (error) {
      console.error(`❌ Error updating pictures for anime ${anime_id}:`, error);
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true });

  } catch (error) {
    console.error("❌ Update pictures error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.post("/make-server-c1d1bfd8/sync-season/:season/:year", async (c) => {
  try {
    const season = c.req.param('season');
    const year = parseInt(c.req.param('year'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🚀 Iniciando sync da temporada ${season} ${year}...`);
    
    const result = await syncSeason(supabase, season, year);

    return c.json({
      success: result.success,
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      message: `Sync completed: ${result.inserted} animes inserted/updated`
    });

  } catch (error) {
    console.error("❌ Sync SEASON error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// SYNC SEASON ENDPOINT (MANUAL) - GET VERSION
// ============================================
// Temporary GET endpoint for easy browser testing
app.get("/make-server-c1d1bfd8/sync-season/:season/:year", async (c) => {
  try {
    const season = c.req.param('season');
    const year = parseInt(c.req.param('year'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🚀 Iniciando sync da temporada ${season} ${year}...`);
    
    const result = await syncSeason(supabase, season, year);

    return c.json({
      success: result.success,
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      message: `Sync completed: ${result.inserted} animes inserted/updated`
    });

  } catch (error) {
    console.error("❌ Sync SEASON error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// SYNC PAST SEASONS ENDPOINT (2025 Winter, Spring, Summer)
// ============================================
// GET endpoint for syncing past season data and populating weekly_episodes
app.get("/make-server-c1d1bfd8/sync-past/:season/:year", async (c) => {
  try {
    // Security check
    const key = c.req.query('key');
    if (key !== 'sync2025') {
      return c.json({
        success: false,
        error: 'Invalid or missing security key. Add ?key=sync2025 to the URL'
      }, 401);
    }

    const season = c.req.param('season');
    const year = parseInt(c.req.param('year'));
    
    console.log(`[Sync Past] 🔍 Starting to sync and populate ${season} ${year}...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Sync season rankings from Jikan
    console.log(`[Sync Past] Step 1: Syncing ${season} ${year} season data from Jikan...`);
    const syncResult = await syncSeason(supabase, season, year);
    
    if (!syncResult.success) {
      return c.json({
        success: false,
        error: `Failed to sync season: ${syncResult.errors}`
      }, 500);
    }

    console.log(`[Sync Past] ✅ Step 1 complete: ${syncResult.inserted} animes synced`);

    // Step 2: Enrich episodes with scores and populate weekly_episodes
    console.log(`[Sync Past] Step 2: Enriching episodes and populating weekly_episodes...`);
    const enrichResult = await enrichEpisodes(supabase, season, year);

    console.log(`[Sync Past] ✅ Successfully completed sync for ${season} ${year}`);
    console.log(`[Sync Past] Total Animes: ${syncResult.total}`);
    console.log(`[Sync Past] Enriched Episodes: ${enrichResult.enriched}`);

    return c.json({
      success: true,
      message: `Successfully synced and populated ${season} ${year}`,
      season,
      year,
      totalAnimes: syncResult.total,
      insertedAnimes: syncResult.inserted,
      totalEpisodes: enrichResult.enriched,
      insertedEpisodes: enrichResult.enriched,
      errors: enrichResult.errors
    });

  } catch (error) {
    console.error("[Sync Past] ❌ Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// SEARCH ENDPOINT - Global Search
// ============================================
// Searches across all tables: weekly_episodes, season_rankings, anticipated_animes
// Query matches: anime name, season name, or tags (genres/themes/demographics)
app.get("/make-server-c1d1bfd8/search", async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase().trim() || '';
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam) : 100; // Default 100 results

    if (!query || query.length < 3) {
      return c.json({
        success: true,
        results: [],
        count: 0,
        message: "Query must be at least 3 characters"
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log(`[Search] Query: "${query}", Limit: ${limit}`);

    // ✅ NEW: Detect "Season Year" pattern (e.g., "winter 2026", "spring 2023")
    const seasonYearPattern = /^(winter|spring|summer|fall)\s+(\d{4})$/i;
    const match = query.match(seasonYearPattern);
    
    let filterSeason: string | null = null;
    let filterYear: number | null = null;
    
    if (match) {
      filterSeason = match[1].toLowerCase();
      filterYear = parseInt(match[2]);
      console.log(`[Search] Detected Season + Year filter: ${filterSeason} ${filterYear}`);
    }

    // Helper function to extract tag names from JSONB array
    const extractTags = (jsonbArray: any[]): string[] => {
      if (!Array.isArray(jsonbArray)) return [];
      return jsonbArray.map(item => 
        typeof item === 'string' ? item : (item.name || '')
      ).filter(Boolean);
    };

    // Helper function to check if any tag matches the query
    const tagsMatchQuery = (jsonbArray: any[], query: string): boolean => {
      const tags = extractTags(jsonbArray);
      return tags.some(tag => tag.toLowerCase().includes(query));
    };

    // Helper function to calculate relevance score
    // Higher score = better match
    // Priority: exact title match > title contains > season match > tag match
    const calculateRelevance = (
      title: string,
      titleEnglish: string | null,
      season: string | null,
      genres: any[],
      themes: any[],
      demographics: any[]
    ): number => {
      const titleLower = title?.toLowerCase() || '';
      const titleEnglishLower = titleEnglish?.toLowerCase() || '';
      const seasonLower = season?.toLowerCase() || '';
      
      // Exact match in title (highest priority)
      if (titleLower === query || titleEnglishLower === query) return 1000;
      
      // Title starts with query
      if (titleLower.startsWith(query) || titleEnglishLower.startsWith(query)) return 500;
      
      // Title contains query
      if (titleLower.includes(query) || titleEnglishLower.includes(query)) return 100;
      
      // Season exact match
      if (seasonLower === query) return 50;
      
      // Season contains query
      if (seasonLower.includes(query)) return 30;
      
      // Tag match (lowest priority)
      if (tagsMatchQuery(genres, query) || tagsMatchQuery(themes, query) || tagsMatchQuery(demographics, query)) {
        return 10;
      }
      
      return 0;
    };

    const allResults: any[] = [];

    // ============================================
    // 1. Search in WEEKLY_EPISODES
    // ============================================
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('weekly_episodes')
      .select('anime_id, anime_title, anime_title_english, anime_image_url, week_number, week_start_date, week_end_date, genres, themes, demographics, members, score, type')
      .not('episode_score', 'is', null) // Only episodes with score
      .order('members', { ascending: false, nullsFirst: false })
      .limit(200); // Get more to filter later

    if (!weeklyError && weeklyData) {
      // Filter by relevance
      const filteredWeekly = weeklyData
        .map(ep => ({
          ...ep,
          relevance: calculateRelevance(
            ep.anime_title,
            ep.anime_title_english,
            null, // weekly episodes don't have season field
            ep.genres || [],
            ep.themes || [],
            ep.demographics || []
          )
        }))
        .filter(ep => ep.relevance > 0);

      // Group by anime_id to avoid duplicates (show only latest episode)
      const uniqueAnimes = new Map();
      filteredWeekly.forEach(ep => {
        if (!uniqueAnimes.has(ep.anime_id) || uniqueAnimes.get(ep.anime_id).relevance < ep.relevance) {
          uniqueAnimes.set(ep.anime_id, {
            id: ep.anime_id,
            title: ep.anime_title_english || ep.anime_title,
            imageUrl: ep.anime_image_url,
            season: null, // Will try to infer from dates
            year: null,
            type: ep.type,
            genres: extractTags(ep.genres || []),
            themes: extractTags(ep.themes || []),
            demographics: extractTags(ep.demographics || []),
            members: ep.members,
            score: ep.score,
            source: 'weekly_episodes',
            relevance: ep.relevance
          });
        }
      });

      allResults.push(...Array.from(uniqueAnimes.values()));
      console.log(`[Search] Found ${uniqueAnimes.size} unique animes in weekly_episodes`);
    }

    // ============================================
    // 2. Search in SEASON_RANKINGS
    // ============================================
    
    // ✅ Build query with season+year filter if detected
    let seasonRankingsQuery = supabase
      .from('season_rankings')
      .select('anime_id, title, title_english, image_url, season, year, genres, themes, demographics, members, anime_score, type');

    if (filterSeason && filterYear) {
      // ✅ Exact match for season AND year
      seasonRankingsQuery = seasonRankingsQuery
        .ilike('season', filterSeason)
        .eq('year', filterYear);
      console.log(`[Search] Applying filter: season=${filterSeason}, year=${filterYear}`);
    } else {
      // Normal search - filter by title or season
      seasonRankingsQuery = seasonRankingsQuery
        .or(`title.ilike.%${query}%,title_english.ilike.%${query}%,season.ilike.%${query}%`);
    }

    const { data: seasonData, error: seasonError } = await seasonRankingsQuery
      .order('members', { ascending: false, nullsFirst: false })
      .limit(500); // ✅ INCREASED: From 200 to 500 to catch more results

    if (!seasonError && seasonData) {
      const filteredSeason = seasonData
        .map(anime => ({
          ...anime,
          // ✅ FIXED: If season+year filter is active, give all results high relevance
          relevance: filterSeason && filterYear 
            ? 1000 // High relevance for exact season+year matches
            : calculateRelevance(
                anime.title,
                anime.title_english,
                anime.season,
                anime.genres || [],
                anime.themes || [],
                anime.demographics || []
              )
        }))
        .filter(anime => anime.relevance > 0)
        .map(anime => ({
          id: anime.anime_id,
          title: anime.title_english || anime.title,
          imageUrl: anime.image_url,
          season: anime.season,
          year: anime.year,
          type: anime.type,
          genres: extractTags(anime.genres || []),
          themes: extractTags(anime.themes || []),
          demographics: extractTags(anime.demographics || []),
          members: anime.members,
          score: anime.anime_score, // ✅ FIXED: Changed from anime.score to anime.anime_score
          source: 'season_rankings',
          relevance: anime.relevance
        }));

      allResults.push(...filteredSeason);
      console.log(`[Search] Found ${filteredSeason.length} animes in season_rankings`);
    }

    // ============================================
    // 3. Deduplicate by anime_id (keep highest relevance)
    // ============================================
    const uniqueResults = new Map();
    allResults.forEach(result => {
      if (!uniqueResults.has(result.id) || uniqueResults.get(result.id).relevance < result.relevance) {
        uniqueResults.set(result.id, result);
      }
    });

    // ============================================
    // 4. Sort by relevance DESC, then members DESC
    // ============================================
    const totalUniqueResults = Array.from(uniqueResults.values());
    const sortedResults = totalUniqueResults
      .sort((a, b) => {
        if (b.relevance !== a.relevance) {
          return b.relevance - a.relevance;
        }
        return (b.members || 0) - (a.members || 0);
      })
      .slice(0, limit); // Apply limit

    console.log(`[Search] Total unique results: ${totalUniqueResults.length}, returning: ${sortedResults.length}`);

    return c.json({
      success: true,
      results: sortedResults,
      totalCount: totalUniqueResults.length, // Total before limit
      query: query
    });

  } catch (error) {
    console.error("❌ Search error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// ============================================
// EXPORT RANKS - CSV/XLSX Export
// ============================================
app.post("/make-server-c1d1bfd8/export-ranks", async (c) => {
  try {
    const body = await c.req.json();
    console.log("[Export] 📥 Export request received:", body);

    const { buffer, contentType } = await generateExport(body);

    console.log("[Export] ✅ Export generated successfully");

    // Return the file as a downloadable response
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="export.${body.format}"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("❌ Export error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    }, 500);
  }
});

// ============================================
// GLOBAL ERROR HANDLER - Ensures all errors return JSON
// ============================================
app.onError((err, c) => {
  console.error('❌ Unhandled error:', err);
  return c.json({
    success: false,
    error: err.message || 'Internal server error',
    stack: err.stack
  }, 500);
});

// ============================================
// 404 HANDLER - Return JSON for unknown routes
// ============================================
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    path: c.req.path
  }, 404);
});

Deno.serve(app.fetch);