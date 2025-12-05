// ============================================
// MAIN ENDPOINT
// ============================================
// Root endpoint - shows usage
app.get("/", (c) => {
  return c.json({
    message: "Sync Past Anime Data Function",
    usage: {
      POST: "POST / with body: { \"season\": \"winter\", \"year\": 2025 }",
      GET: "GET /winter/2025"
    },
    availableSeasons: ["winter", "spring", "summer", "fall"],
    example: "GET /sync-past-anime-data/winter/2025"
  });
});

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { season, year } = body;
    
    if (!season || !year) {
      return c.json({
        success: false,
        error: "Missing required parameters: season and year"
      }, 400);
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

    console.log(`🚀 Iniciando sync de temporada passada: ${season} ${year}...`);
    
    const result = await syncPastSeasons(supabase, season, year);

    return c.json({
      success: result.success,
      totalAnimes: result.totalAnimes,
      totalEpisodes: result.totalEpisodes,
      insertedEpisodes: result.insertedEpisodes,
      updatedEpisodes: result.updatedEpisodes,
      skippedEpisodes: result.skippedEpisodes,
      errors: result.errors,
      message: `Sync completed: ${result.totalAnimes} animes, ${result.insertedEpisodes} episodes inserted`
    });

  } catch (error) {
    console.error("❌ Sync PAST SEASONS error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// GET endpoint for easy browser testing
app.get("/:season/:year", async (c) => {
  try {
    const season = c.req.param('season');
    const year = parseInt(c.req.param('year'));
    
    if (!season || !year || isNaN(year)) {
      return c.json({
        success: false,
        error: "Invalid season or year parameter"
      }, 400);
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

    console.log(`🚀 Iniciando sync de temporada passada: ${season} ${year}...`);
    
    const result = await syncPastSeasons(supabase, season, year);

    return c.json({
      success: result.success,
      totalAnimes: result.totalAnimes,
      totalEpisodes: result.totalEpisodes,
      insertedEpisodes: result.insertedEpisodes,
      updatedEpisodes: result.updatedEpisodes,
      skippedEpisodes: result.skippedEpisodes,
      errors: result.errors,
      message: `Sync completed: ${result.totalAnimes} animes, ${result.insertedEpisodes} episodes inserted`
    });

  } catch (error) {
    console.error("❌ Sync PAST SEASONS error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

Deno.serve(app.fetch);