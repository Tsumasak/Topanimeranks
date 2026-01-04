import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { enrichEpisodes, recalculatePositions } from "./enrich.tsx";
import { syncUpcoming } from "./sync-upcoming.tsx";
import { syncSeason } from "./sync-season.tsx";
import { getEpisodeWeekNumber } from "./season-utils.tsx";

const app = new Hono();

// ============================================
// CURRENT SEASON CONFIGURATION
// ============================================
// Atualizar manualmente quando a temporada mudar
const CURRENT_SEASON = 'winter';
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

// Get available weeks (weeks with at least 5 episodes WITH SCORE)
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

    // Calcular a week atual baseada na data de hoje
    const today = new Date();
    const { season: currentSeason, year: currentYear, weekNumber: currentWeekNumber } = getEpisodeWeekNumber(today);
    
    console.log(`[Server] 📅 Hoje: ${today.toISOString().split('T')[0]} = ${currentSeason} ${currentYear} Week ${currentWeekNumber}`);

    // Buscar APENAS episódios da season/year ATUAL com score
    const { data, error } = await supabase
      .from('weekly_episodes')
      .select('week_number, episode_score, status, season, year, aired_at')
      .eq('season', CURRENT_SEASON)
      .eq('year', CURRENT_YEAR)
      .not('episode_score', 'is', null)
      .lte('week_number', currentWeekNumber) // Apenas weeks até a atual (não mostrar futuras)
      .order('week_number', { ascending: true });

    if (error) {
      console.error("❌ Error fetching available weeks:", error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }

    // Count episodes WITH SCORE per week
    const weekCounts = new Map<number, number>();
    data?.forEach(row => {
      const count = weekCounts.get(row.week_number) || 0;
      weekCounts.set(row.week_number, count + 1);
    });

    // Filter weeks with 5+ episodes WITH SCORE
    const validWeeks = Array.from(weekCounts.entries())
      .filter(([week, count]) => count >= 5)
      .map(([week]) => week)
      .sort((a, b) => a - b);
    
    // Determine the latest week (highest week number with 5+ scored episodes)
    const latestWeek = validWeeks.length > 0 ? Math.max(...validWeeks) : 1;
    
    console.log(`[Server] 📊 Weeks with scored episodes:`, Array.from(weekCounts.entries()).map(([w, c]) => `Week ${w}: ${c} episodes`).join(', '));
    console.log(`[Server] ✅ Available weeks (5+ episodes with score): ${validWeeks.join(', ')}`);
    console.log(`[Server] 🎯 Latest week with 5+ scored episodes: Week ${latestWeek}`);

    return c.json({
      success: true,
      weeks: validWeeks,
      latestWeek: latestWeek,
      currentWeek: currentWeekNumber,
      currentSeason: currentSeason,
      currentYear: currentYear,
      weekCounts: Array.from(weekCounts.entries()).map(([week, count]) => ({ week, count }))
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

    // Fetch weekly episodes with filters
    console.log(`🔍 Fetching weekly episodes for ${CURRENT_SEASON} ${CURRENT_YEAR} Week ${weekNumber}...`);
    
    // Buscar APENAS episódios da season/year ATUAL
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('season', CURRENT_SEASON)
      .eq('year', CURRENT_YEAR)
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

    console.log(`[Server] ${CURRENT_SEASON} ${CURRENT_YEAR} Week ${weekNumber}: ${weeklyData?.length || 0} episodes (sorted by episode_score DESC)`);
    
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
      season: CURRENT_SEASON,
      year: CURRENT_YEAR
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
      currentSeason: CURRENT_SEASON,
      currentYear: CURRENT_YEAR
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

    console.log(`🚀 Iniciando enriquecimento de episódios para ${CURRENT_SEASON} ${CURRENT_YEAR}...`);
    
    const result = await enrichEpisodes(supabase, CURRENT_SEASON, CURRENT_YEAR);

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

    console.log("🔢 Iniciando recálculo de posições...");
    
    await recalculatePositions(supabase, CURRENT_SEASON, CURRENT_YEAR);

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
    
    await recalculatePositions(supabase, CURRENT_SEASON, CURRENT_YEAR);

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
    const { data: seasonData, error: seasonError } = await supabase
      .from('season_rankings')
      .select('anime_id, title, title_english, image_url, season, year, genres, themes, demographics, members, anime_score, type') // ✅ FIXED: Changed 'score' to 'anime_score'
      .order('members', { ascending: false, nullsFirst: false })
      .limit(200);

    if (!seasonError && seasonData) {
      const filteredSeason = seasonData
        .map(anime => ({
          ...anime,
          relevance: calculateRelevance(
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
    // 3. Search in ANTICIPATED_ANIMES
    // ============================================
    const { data: anticipatedData, error: anticipatedError } = await supabase
      .from('anticipated_animes')
      .select('anime_id, title, title_english, image_url, season, year, genres, themes, demographics, members, score, type')
      .order('members', { ascending: false, nullsFirst: false })
      .limit(200);

    if (!anticipatedError && anticipatedData) {
      const filteredAnticipated = anticipatedData
        .map(anime => ({
          ...anime,
          relevance: calculateRelevance(
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
          score: anime.score,
          source: 'anticipated_animes',
          relevance: anime.relevance
        }));

      allResults.push(...filteredAnticipated);
      console.log(`[Search] Found ${filteredAnticipated.length} animes in anticipated_animes`);
    }

    // ============================================
    // 4. Deduplicate by anime_id (keep highest relevance)
    // ============================================
    const uniqueResults = new Map();
    allResults.forEach(result => {
      if (!uniqueResults.has(result.id) || uniqueResults.get(result.id).relevance < result.relevance) {
        uniqueResults.set(result.id, result);
      }
    });

    // ============================================
    // 5. Sort by relevance DESC, then members DESC
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

Deno.serve(app.fetch);