"use strict";
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
const CURRENT_SEASON = "spring";
const CURRENT_YEAR = 2026;
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600
  })
);
app.get("/make-server-c1d1bfd8/health", (c) => {
  return c.json({ status: "ok" });
});
app.get("/make-server-c1d1bfd8/migration-status", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials",
        migrationNeeded: true
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: episodesWithDates, error } = await supabase.from("weekly_episodes").select("week_start_date, week_end_date").limit(1);
    if (error) {
      if (error.code === "42703") {
        console.log("[Migration] \u2139\uFE0F Columns do not exist - migration needed");
        return c.json({
          success: true,
          migrationNeeded: true,
          message: "Migration needed: week_start_date and week_end_date columns do not exist",
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
      console.error("[Migration] Unexpected error checking dates:", error);
      return c.json({
        success: false,
        error: error.message,
        migrationNeeded: true
      }, 500);
    }
    const hasDates = episodesWithDates && episodesWithDates.length > 0 && episodesWithDates[0].week_start_date !== null && episodesWithDates[0].week_end_date !== null;
    if (!hasDates) {
      console.log("[Migration] \u2139\uFE0F Columns exist but are empty - migration needed");
      return c.json({
        success: true,
        migrationNeeded: true,
        message: "Migration needed: date columns are empty",
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
    console.log("[Migration] \u2705 Migration already applied");
    return c.json({
      success: true,
      migrationNeeded: false,
      message: "Migration already applied - all good!"
    });
  } catch (error) {
    console.error("\u274C Migration status error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      migrationNeeded: true
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/available-weeks", async (c) => {
  const today = /* @__PURE__ */ new Date();
  const { season: currentSeason, year: currentYear, weekNumber: currentWeekNumber } = getEpisodeWeekNumber(today);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Server] \u274C Missing Supabase credentials");
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`[Server] \u{1F4C5} Hoje: ${today.toISOString().split("T")[0]} = ${currentSeason} ${currentYear} Week ${currentWeekNumber}`);
    const { data, error } = await supabase.from("weekly_episodes").select("week_number, episode_score, status, season, year, aired_at").eq("season", currentSeason).eq("year", currentYear).not("episode_score", "is", null).lte("week_number", currentWeekNumber).order("week_number", { ascending: true });
    if (error) {
      console.error("[Server] \u274C Error fetching available weeks:", error);
      console.log("[Server] \u{1F504} Returning fallback: Week 1 only");
      return c.json({
        success: true,
        weeks: [1],
        latestWeek: 1,
        currentWeek: currentWeekNumber,
        currentSeason,
        currentYear,
        weekCounts: [{ week: 1, count: 0 }],
        isFallback: true,
        fallbackReason: error.message
      });
    }
    const weekCounts = /* @__PURE__ */ new Map();
    data?.forEach((row) => {
      const count = weekCounts.get(row.week_number) || 0;
      weekCounts.set(row.week_number, count + 1);
    });
    const validWeeks = Array.from(weekCounts.entries()).filter(([week, count]) => count >= 3).map(([week]) => week).sort((a, b) => a - b);
    const latestWeek = validWeeks.length > 0 ? Math.max(...validWeeks) : 1;
    console.log(`[Server] \u{1F4CA} Weeks with scored episodes:`, Array.from(weekCounts.entries()).map(([w, c2]) => `Week ${w}: ${c2} episodes`).join(", "));
    console.log(`[Server] \u2705 Available weeks (3+ episodes with score): ${validWeeks.join(", ")}`);
    console.log(`[Server] \u{1F3AF} Latest week with 3+ scored episodes: Week ${latestWeek}`);
    if (validWeeks.length === 0) {
      console.log("[Server] \u26A0\uFE0F No weeks with 3+ scored episodes found");
      console.log("[Server] \u{1F504} Returning fallback: Week 1 only");
      return c.json({
        success: true,
        weeks: [1],
        latestWeek: 1,
        currentWeek: currentWeekNumber,
        currentSeason,
        currentYear,
        weekCounts: Array.from(weekCounts.entries()).map(([week, count]) => ({ week, count })),
        isFallback: true,
        fallbackReason: "No weeks with 3+ scored episodes"
        // ✅ Updated message
      });
    }
    return c.json({
      success: true,
      weeks: validWeeks,
      latestWeek,
      currentWeek: currentWeekNumber,
      currentSeason,
      currentYear,
      weekCounts: Array.from(weekCounts.entries()).map(([week, count]) => ({ week, count })),
      weekCountsRecord: Object.fromEntries(weekCounts.entries())
      // Record format: { "1": 6 }
    });
  } catch (error) {
    console.error("[Server] \u274C Available weeks error:", error);
    console.error("[Server] \u274C Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return c.json({
      success: true,
      weeks: [1],
      latestWeek: 1,
      currentWeek: 1,
      currentSeason,
      currentYear,
      weekCounts: [{ week: 1, count: 0 }],
      isFallback: true,
      fallbackReason: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
app.get("/make-server-c1d1bfd8/weekly-episodes/:weekNumber", async (c) => {
  const today = /* @__PURE__ */ new Date();
  const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
  try {
    const weekNumber = parseInt(c.req.param("weekNumber"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`\u{1F50D} Fetching weekly episodes for ${currentSeason} ${currentYear} Week ${weekNumber}...`);
    const { data: weeklyData, error: weeklyError } = await supabase.from("weekly_episodes").select("*").eq("season", currentSeason).eq("year", currentYear).eq("week_number", weekNumber).not("episode_score", "is", null).order("episode_score", { ascending: false });
    if (weeklyError) {
      console.error("Error fetching weekly episodes:", weeklyError);
      return c.json({
        success: false,
        error: weeklyError.message,
        needsData: true
      }, 200);
    }
    console.log(`[Server] ${currentSeason} ${currentYear} Week ${weekNumber}: ${weeklyData?.length || 0} episodes (sorted by episode_score DESC)`);
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
    console.error("\u274C Weekly episodes error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/debug-anime/:animeId", async (c) => {
  const today = /* @__PURE__ */ new Date();
  const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
  try {
    const animeId = parseInt(c.req.param("animeId"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`\u{1F50D} DEBUG: Fetching ALL episodes for anime ${animeId}...`);
    const { data: allEpisodes, error: allError } = await supabase.from("weekly_episodes").select("*").eq("anime_id", animeId).order("episode_number", { ascending: false });
    if (allError) {
      console.error("Error fetching anime episodes:", allError);
      return c.json({
        success: false,
        error: allError.message
      }, 500);
    }
    console.log(`[DEBUG] Found ${allEpisodes?.length || 0} episodes for anime ${animeId}`);
    allEpisodes?.forEach((ep) => {
      console.log(`[DEBUG] EP${ep.episode_number}: Score=${ep.episode_score}, Week=${ep.week_number}, Season=${ep.season} ${ep.year}, Aired=${ep.aired_at}`);
    });
    return c.json({
      success: true,
      animeId,
      totalEpisodes: allEpisodes?.length || 0,
      episodes: allEpisodes || [],
      currentSeason,
      currentYear
    });
  } catch (error) {
    console.error("\u274C Debug anime error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/season-rankings/:season/:year", async (c) => {
  try {
    const season = c.req.param("season");
    const year = parseInt(c.req.param("year"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`[Server] \u{1F50D} Fetching season rankings for ${season} ${year}...`);
    const { data: animes, error } = await supabase.from("season_rankings").select("*").ilike("season", season).eq("year", year).order("anime_score", { ascending: false, nullsFirst: false }).order("members", { ascending: false, nullsFirst: false });
    if (error) {
      console.error("Error fetching season rankings:", error);
      return c.json({
        success: false,
        error: error.message,
        needsData: true
      }, 200);
    }
    console.log(`[Server] \u2705 Found ${animes?.length || 0} animes for ${season} ${year}`);
    if (animes && animes.length > 0) {
      console.log("[Server] First 3 animes:", animes.slice(0, 3).map((a) => ({
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
    console.error("\u274C Season rankings error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/genre-years", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const genre = c.req.query("genre");
    if (!genre) {
      return c.json({
        success: false,
        error: "Missing genre parameter"
      }, 400);
    }
    console.log(`[Server] \u{1F50D} Fetching years for genre: ${genre}...`);
    const { data: genreData, error: genreError } = await supabase.from("genre_rankings").select("year").eq("genre", genre).neq("year", 9999).order("year", { ascending: false });
    if (!genreError && genreData && genreData.length > 0) {
      const years2 = [...new Set(genreData.map((row) => row.year))].sort((a, b) => b - a);
      console.log(`[Server] \u2705 Found ${years2.length} years for genre ${genre} (from genre_rankings): ${years2.join(", ")}`);
      return c.json({
        success: true,
        years: years2,
        source: "genre_rankings"
      });
    }
    console.log(`[Server] \u26A0\uFE0F genre_rankings table empty or doesn't exist, falling back to season_rankings...`);
    const { data, error } = await supabase.from("season_rankings").select("year").neq("status", "Not yet aired").neq("year", 9999).order("year", { ascending: false });
    if (error) {
      console.error("Error fetching genre years:", error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
    const yearsSet = /* @__PURE__ */ new Set();
    if (data) {
      for (const row of data) {
        const { data: anime, error: animeError } = await supabase.from("season_rankings").select("genres, year").eq("year", row.year).neq("status", "Not yet aired").neq("year", 9999).limit(1e3);
        if (!animeError && anime) {
          for (const a of anime) {
            if (a.genres && Array.isArray(a.genres)) {
              const hasGenre = a.genres.some((g) => g.name === genre);
              if (hasGenre && a.year !== 9999) {
                yearsSet.add(a.year);
              }
            }
          }
        }
      }
    }
    const years = Array.from(yearsSet).sort((a, b) => b - a);
    console.log(`[Server] \u2705 Found ${years.length} years for genre ${genre} (from season_rankings): ${years.join(", ")}`);
    return c.json({
      success: true,
      years,
      source: "season_rankings"
    });
  } catch (error) {
    console.error("\u274C Genre years error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/genre-seasons", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase configuration"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const genre = c.req.query("genre");
    const year = c.req.query("year");
    if (!genre || !year) {
      return c.json({
        success: false,
        error: "Missing genre or year parameter"
      }, 400);
    }
    console.log(`[Server] \u{1F50D} Fetching available seasons for genre: ${genre}, year: ${year}`);
    const seasonsSet = /* @__PURE__ */ new Set();
    const { data: genreData, error: genreError } = await supabase.from("genre_rankings").select("season").eq("genre", genre).eq("year", parseInt(year)).not("season", "is", null);
    if (!genreError && genreData && genreData.length > 0) {
      for (const row of genreData) {
        if (row.season) {
          seasonsSet.add(row.season.toLowerCase());
        }
      }
      const seasons2 = Array.from(seasonsSet).sort();
      console.log(`[Server] \u2705 Found ${seasons2.length} seasons from genre_rankings: ${seasons2.join(", ")}`);
      return c.json({
        success: true,
        seasons: seasons2,
        source: "genre_rankings"
      });
    }
    const { data: seasonData, error: seasonError } = await supabase.from("season_rankings").select("season, genres").eq("year", parseInt(year)).neq("status", "Not yet aired");
    if (seasonError) {
      console.error("\u274C Supabase error:", seasonError);
      return c.json({
        success: false,
        error: seasonError.message
      }, 500);
    }
    if (seasonData) {
      for (const anime of seasonData) {
        if (anime.genres && Array.isArray(anime.genres)) {
          const hasGenre = anime.genres.some((g) => g.name === genre);
          if (hasGenre && anime.season) {
            seasonsSet.add(anime.season.toLowerCase());
          }
        }
      }
    }
    const seasons = Array.from(seasonsSet).sort();
    console.log(`[Server] \u2705 Found ${seasons.length} seasons from season_rankings: ${seasons.join(", ")}`);
    return c.json({
      success: true,
      seasons,
      source: "season_rankings"
    });
  } catch (error) {
    console.error("\u274C Genre seasons error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/genre-rankings", async (c) => {
  const startTime = Date.now();
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const genre = c.req.query("genre");
    const year = c.req.query("year");
    const season = c.req.query("season");
    const sortBy = c.req.query("sortBy") || "score";
    const offset = parseInt(c.req.query("offset") || "0");
    const limit = parseInt(c.req.query("limit") || "100");
    if (!genre || !year) {
      return c.json({
        success: false,
        error: "Missing required parameters: genre and year"
      }, 400);
    }
    console.log(`[Server] \u{1F50D} Fetching genre rankings for ${genre}, ${year}, ${season || "all seasons"} (offset: ${offset}, limit: ${limit})...`);
    let query = supabase.from("genre_rankings").select("*", { count: "exact" }).eq("genre", genre).eq("year", parseInt(year));
    if (season && season !== "all") {
      query = query.ilike("season", season);
    }
    if (sortBy === "popularity") {
      query = query.order("members", { ascending: false, nullsFirst: false });
    } else {
      query = query.order("anime_score", { ascending: false, nullsFirst: false });
    }
    query = query.range(offset, offset + limit - 1);
    const queryStartTime = Date.now();
    const { data: optimizedData, error: optimizedError, count } = await query;
    const queryEndTime = Date.now();
    if (!optimizedError && optimizedData && optimizedData.length > 0) {
      console.log(`[Server] \u23F1\uFE0F  Optimized query took ${queryEndTime - queryStartTime}ms`);
      console.log(`[Server] \u2705 Found ${optimizedData.length} animes (total: ${count}) from genre_rankings`);
      const totalTime2 = Date.now() - startTime;
      console.log(`[Server] \u{1F680} Total request time: ${totalTime2}ms (OPTIMIZED)`);
      const mappedData = optimizedData.map((anime) => ({
        anime_id: anime.anime_id,
        title: anime.title,
        title_english: anime.title_english,
        image_url: anime.image_url,
        type: anime.type,
        anime_score: anime.anime_score,
        members: anime.members,
        demographics: anime.demographics || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        season: anime.season,
        year: anime.year,
        status: anime.status,
        episodes: anime.episodes,
        studios: anime.studios || []
      }));
      return c.json({
        success: true,
        data: mappedData,
        count: count || 0,
        returned: mappedData.length,
        offset,
        limit,
        hasMore: count ? offset + mappedData.length < count : false,
        genre,
        year: year === "all" ? "all" : parseInt(year),
        season: season || "all",
        sortBy,
        source: "genre_rankings",
        performance: {
          totalTime: totalTime2,
          queryTime: queryEndTime - queryStartTime,
          isOptimized: true
        }
      });
    }
    console.log(`[Server] \u26A0\uFE0F genre_rankings table empty or doesn't exist, falling back to season_rankings...`);
    console.log(`[Server] \u{1F4A1} Run POST /populate-genre-rankings to populate the optimized table`);
    let fallbackQuery = supabase.from("season_rankings").select("*").eq("year", parseInt(year)).neq("status", "Not yet aired");
    if (season && season !== "all") {
      fallbackQuery = fallbackQuery.ilike("season", season);
    }
    const fallbackQueryStartTime = Date.now();
    const { data: allAnimes, error } = await fallbackQuery;
    const fallbackQueryEndTime = Date.now();
    console.log(`[Server] \u23F1\uFE0F  Database query took ${fallbackQueryEndTime - fallbackQueryStartTime}ms`);
    console.log(`[Server] \u{1F4CA} Retrieved ${allAnimes?.length || 0} animes from database`);
    if (error) {
      console.error("Error fetching genre rankings:", error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
    const filterStartTime = Date.now();
    const filteredAnimes = allAnimes?.filter((anime) => {
      if (!anime.genres || !Array.isArray(anime.genres)) return false;
      return anime.genres.some((g) => g.name === genre);
    }) || [];
    const filterEndTime = Date.now();
    console.log(`[Server] \u23F1\uFE0F  Genre filtering took ${filterEndTime - filterStartTime}ms`);
    console.log(`[Server] \u{1F3AF} Filtered down to ${filteredAnimes.length} animes with genre ${genre}`);
    const sortStartTime = Date.now();
    filteredAnimes.sort((a, b) => {
      if (sortBy === "popularity") {
        return (b.members || 0) - (a.members || 0);
      } else {
        return (b.anime_score || 0) - (a.anime_score || 0);
      }
    });
    const sortEndTime = Date.now();
    console.log(`[Server] \u23F1\uFE0F  Sorting took ${sortEndTime - sortStartTime}ms`);
    const paginatedAnimes = filteredAnimes.slice(offset, offset + limit);
    const totalTime = Date.now() - startTime;
    console.log(`[Server] \u2705 Total request time: ${totalTime}ms (FALLBACK - consider populating genre_rankings)`);
    return c.json({
      success: true,
      data: paginatedAnimes,
      count: filteredAnimes.length,
      returned: paginatedAnimes.length,
      offset,
      limit,
      hasMore: offset + paginatedAnimes.length < filteredAnimes.length,
      genre,
      year: parseInt(year),
      season: season || "all",
      sortBy,
      source: "season_rankings",
      performance: {
        totalTime,
        queryTime: fallbackQueryEndTime - fallbackQueryStartTime,
        filterTime: filterEndTime - filterStartTime,
        sortTime: sortEndTime - sortStartTime,
        retrievedCount: allAnimes?.length || 0,
        filteredCount: filteredAnimes.length,
        isOptimized: false
      }
    });
  } catch (error) {
    console.error("\u274C Genre rankings error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/anticipated-animes", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: animes, error } = await supabase.from("anticipated_animes").select("*").order("position", { ascending: true });
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
    console.error("\u274C Anticipated animes error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/populate-genre-rankings", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`[Populate] \u{1F680} Starting to populate genre_rankings table...`);
    const { data: allAnimes, error: fetchError } = await supabase.from("season_rankings").select("*").neq("status", "Not yet aired").neq("year", 9999);
    if (fetchError) {
      console.error("[Populate] \u274C Error fetching animes:", fetchError);
      return c.json({ success: false, error: fetchError.message }, 500);
    }
    if (!allAnimes || allAnimes.length === 0) {
      return c.json({
        success: true,
        message: "No animes to populate",
        processed: 0,
        inserted: 0
      });
    }
    console.log(`[Populate] \u{1F4CA} Found ${allAnimes.length} animes to process`);
    const genreRows = [];
    let processedCount = 0;
    for (const anime of allAnimes) {
      if (!anime.genres || !Array.isArray(anime.genres) || anime.genres.length === 0) {
        continue;
      }
      for (const genreObj of anime.genres) {
        const genreName = typeof genreObj === "string" ? genreObj : genreObj.name;
        if (!genreName) continue;
        genreRows.push({
          anime_id: anime.anime_id,
          genre: genreName,
          year: anime.year,
          season: anime.season,
          title: anime.title,
          title_english: anime.title_english,
          image_url: anime.image_url,
          anime_score: anime.anime_score,
          members: anime.members,
          type: anime.type,
          status: anime.status,
          episodes: anime.episodes,
          genres: anime.genres,
          themes: anime.themes,
          demographics: anime.demographics,
          studios: anime.studios,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`[Populate] \u{1F4E6} Processed ${processedCount}/${allAnimes.length} animes...`);
      }
    }
    console.log(`[Populate] \u2705 Created ${genreRows.length} genre rows from ${processedCount} animes`);
    const BATCH_SIZE = 500;
    let insertedCount = 0;
    for (let i = 0; i < genreRows.length; i += BATCH_SIZE) {
      const batch = genreRows.slice(i, i + BATCH_SIZE);
      console.log(`[Populate] \u{1F4BE} Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(genreRows.length / BATCH_SIZE)}...`);
      const { error: upsertError } = await supabase.from("genre_rankings").upsert(batch, {
        onConflict: "anime_id,genre,year,season",
        ignoreDuplicates: false
      });
      if (upsertError) {
        console.error(`[Populate] \u274C Error upserting batch:`, upsertError);
        return c.json({
          success: false,
          error: upsertError.message,
          processedSoFar: insertedCount
        }, 500);
      }
      insertedCount += batch.length;
    }
    console.log(`[Populate] \u{1F389} Successfully populated genre_rankings table!`);
    console.log(`[Populate] \u{1F4CA} Total: ${insertedCount} rows inserted/updated`);
    return c.json({
      success: true,
      message: "Genre rankings table populated successfully",
      processed: processedCount,
      inserted: insertedCount,
      totalRows: genreRows.length
    });
  } catch (error) {
    console.error("[Populate] \u274C Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/populate-genre-rankings", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`[Populate] \u{1F680} Starting to populate genre_rankings table...`);
    const { data: allAnimes, error: fetchError } = await supabase.from("season_rankings").select("*").neq("status", "Not yet aired").neq("year", 9999);
    if (fetchError) {
      console.error("[Populate] \u274C Error fetching animes:", fetchError);
      return c.json({ success: false, error: fetchError.message }, 500);
    }
    if (!allAnimes || allAnimes.length === 0) {
      return c.json({
        success: true,
        message: "No animes to populate",
        processed: 0,
        inserted: 0
      });
    }
    console.log(`[Populate] \u{1F4CA} Found ${allAnimes.length} animes to process`);
    const genreRows = [];
    let processedCount = 0;
    for (const anime of allAnimes) {
      if (!anime.genres || !Array.isArray(anime.genres) || anime.genres.length === 0) {
        continue;
      }
      for (const genreObj of anime.genres) {
        const genreName = typeof genreObj === "string" ? genreObj : genreObj.name;
        if (!genreName) continue;
        genreRows.push({
          anime_id: anime.anime_id,
          genre: genreName,
          year: anime.year,
          season: anime.season,
          title: anime.title,
          title_english: anime.title_english,
          image_url: anime.image_url,
          anime_score: anime.anime_score,
          members: anime.members,
          type: anime.type,
          status: anime.status,
          episodes: anime.episodes,
          genres: anime.genres,
          themes: anime.themes,
          demographics: anime.demographics,
          studios: anime.studios,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`[Populate] \u{1F4E6} Processed ${processedCount}/${allAnimes.length} animes...`);
      }
    }
    console.log(`[Populate] \u2705 Created ${genreRows.length} genre rows from ${processedCount} animes`);
    const BATCH_SIZE = 500;
    let insertedCount = 0;
    for (let i = 0; i < genreRows.length; i += BATCH_SIZE) {
      const batch = genreRows.slice(i, i + BATCH_SIZE);
      console.log(`[Populate] \u{1F4BE} Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(genreRows.length / BATCH_SIZE)}...`);
      const { error: upsertError } = await supabase.from("genre_rankings").upsert(batch, {
        onConflict: "anime_id,genre,year,season",
        ignoreDuplicates: false
      });
      if (upsertError) {
        console.error(`[Populate] \u274C Error upserting batch:`, upsertError);
        return c.json({
          success: false,
          error: upsertError.message,
          processedSoFar: insertedCount
        }, 500);
      }
      insertedCount += batch.length;
    }
    console.log(`[Populate] \u{1F389} Successfully populated genre_rankings table!`);
    console.log(`[Populate] \u{1F4CA} Total: ${insertedCount} rows inserted/updated`);
    return c.json({
      success: true,
      message: "Genre rankings table populated successfully",
      processed: processedCount,
      inserted: insertedCount,
      totalRows: genreRows.length
    });
  } catch (error) {
    console.error("[Populate] \u274C Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/sync-upcoming", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("\u{1F680} Iniciando sync UPCOMING animes...");
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
    console.error("\u274C Sync UPCOMING error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/enrich-episodes", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = /* @__PURE__ */ new Date();
    const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
    console.log(`\u{1F680} Iniciando enriquecimento de epis\xF3dios para ${currentSeason} ${currentYear}...`);
    const result = await enrichEpisodes(supabase, currentSeason, currentYear);
    return c.json({
      success: result.errors === 0,
      enriched: result.enriched,
      inserted: result.inserted,
      errors: result.errors,
      message: result.message
    });
  } catch (error) {
    console.error("\u274C Enrich episodes error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/recalculate-positions", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = /* @__PURE__ */ new Date();
    const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
    console.log("\u{1F522} Iniciando rec\xE1lculo de posi\xE7\xF5es...");
    await recalculatePositions(supabase, currentSeason, currentYear);
    return c.json({
      success: true,
      message: "Posi\xE7\xF5es recalculadas com sucesso!"
    });
  } catch (error) {
    console.error("\u274C Recalculate positions error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/recalculate-positions", async (c) => {
  const today = /* @__PURE__ */ new Date();
  const { season: currentSeason, year: currentYear } = getEpisodeWeekNumber(today);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("\u{1F522} Iniciando rec\xE1lculo de posi\xE7\xF5es...");
    await recalculatePositions(supabase, currentSeason, currentYear);
    return c.json({
      success: true,
      message: "Posi\xE7\xF5es recalculadas com sucesso!"
    });
  } catch (error) {
    console.error("\u274C Recalculate positions error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/fix-week-numbers", async (c) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("\u{1F527} Iniciando rec\xE1lculo de week_numbers usando sistema de seasons...");
    const { data: episodes, error: fetchError } = await supabase.from("weekly_episodes").select("id, anime_id, episode_number, aired_at, anime_title_english").not("aired_at", "is", null);
    if (fetchError) {
      console.error("\u274C Erro ao buscar epis\xF3dios:", fetchError);
      return c.json({
        success: false,
        error: fetchError.message
      }, 500);
    }
    if (!episodes || episodes.length === 0) {
      console.log("\u26A0\uFE0F Nenhum epis\xF3dio com aired_at encontrado");
      return c.json({
        success: true,
        message: "Nenhum epis\xF3dio para recalcular",
        updated: 0
      });
    }
    console.log(`\u{1F4CA} Encontrados ${episodes.length} epis\xF3dios para recalcular`);
    let updated = 0;
    let errors = 0;
    for (const episode of episodes) {
      try {
        const airedDate = new Date(episode.aired_at);
        const { season, year, weekNumber } = getEpisodeWeekNumber(airedDate);
        console.log(`  \u{1F4C5} ${episode.anime_title_english || "Unknown"} EP${episode.episode_number}: ${season} ${year} Week ${weekNumber}`);
        const { error: updateError } = await supabase.from("weekly_episodes").update({
          week_number: weekNumber,
          season,
          year
        }).eq("id", episode.id);
        if (updateError) {
          console.error(`\u274C Erro ao atualizar epis\xF3dio ${episode.id}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      } catch (error) {
        console.error(`\u274C Erro ao processar epis\xF3dio ${episode.id}:`, error);
        errors++;
      }
    }
    console.log(`\u{1F389} Rec\xE1lculo conclu\xEDdo: ${updated} epis\xF3dios atualizados, ${errors} erros`);
    return c.json({
      success: true,
      message: `Week numbers recalculados com sucesso!`,
      total: episodes.length,
      updated,
      errors
    });
  } catch (error) {
    console.error("\u274C Fix week numbers error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/save-season-batch", async (c) => {
  try {
    const { animes, season, year } = await c.req.json();
    console.log(`\u{1F4BE} Saving ${animes?.length || 0} animes for ${season} ${year}...`);
    if (!animes || !Array.isArray(animes) || animes.length === 0) {
      return c.json({ success: false, error: "No animes provided" }, 400);
    }
    const uniqueAnimes = Array.from(
      new Map(animes.map((anime) => [anime.anime_id, anime])).values()
    );
    if (uniqueAnimes.length < animes.length) {
      console.log(`\u26A0\uFE0F Removed ${animes.length - uniqueAnimes.length} duplicate animes`);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const animeIds = uniqueAnimes.map((a) => a.anime_id);
    const { data: existingAnimes } = await supabase.from("season_rankings").select("anime_id").eq("season", season).eq("year", year).in("anime_id", animeIds);
    const existingIds = new Set(existingAnimes?.map((a) => a.anime_id) || []);
    console.log(`\u{1F4CA} Found ${existingIds.size} existing, ${uniqueAnimes.length - existingIds.size} new`);
    const BATCH_SIZE = 100;
    for (let i = 0; i < uniqueAnimes.length; i += BATCH_SIZE) {
      const batch = uniqueAnimes.slice(i, i + BATCH_SIZE);
      console.log(`\u{1F4E6} Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uniqueAnimes.length / BATCH_SIZE)}...`);
      const { error } = await supabase.from("season_rankings").upsert(batch, {
        onConflict: "anime_id,season,year",
        ignoreDuplicates: false
      });
      if (error) {
        console.error("\u274C Batch upsert error:", error);
        return c.json({ success: false, error: error.message }, 500);
      }
    }
    const inserted = uniqueAnimes.filter((a) => !existingIds.has(a.anime_id)).length;
    const updated = uniqueAnimes.filter((a) => existingIds.has(a.anime_id)).length;
    console.log(`\u2705 Save complete: ${inserted} inserted, ${updated} updated`);
    return c.json({
      success: true,
      inserted,
      updated,
      total: animes.length
    });
  } catch (error) {
    console.error("\u274C Save batch error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/update-anime-pictures", async (c) => {
  try {
    const { anime_id, season, year, pictures } = await c.req.json();
    if (!anime_id || !season || !year || !pictures) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await supabase.from("season_rankings").update({ pictures }).eq("anime_id", anime_id).eq("season", season).eq("year", year);
    if (error) {
      console.error(`\u274C Error updating pictures for anime ${anime_id}:`, error);
      return c.json({ success: false, error: error.message }, 500);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("\u274C Update pictures error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/sync-season/:season/:year", async (c) => {
  try {
    const season = c.req.param("season");
    const year = parseInt(c.req.param("year"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`\u{1F680} Iniciando sync da temporada ${season} ${year}...`);
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
    console.error("\u274C Sync SEASON error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/sync-season/:season/:year", async (c) => {
  try {
    const season = c.req.param("season");
    const year = parseInt(c.req.param("year"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`\u{1F680} Iniciando sync da temporada ${season} ${year}...`);
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
    console.error("\u274C Sync SEASON error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/sync-past/:season/:year", async (c) => {
  try {
    const key = c.req.query("key");
    if (key !== "sync2025") {
      return c.json({
        success: false,
        error: "Invalid or missing security key. Add ?key=sync2025 to the URL"
      }, 401);
    }
    const season = c.req.param("season");
    const year = parseInt(c.req.param("year"));
    console.log(`[Sync Past] \u{1F50D} Starting to sync and populate ${season} ${year}...`);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`[Sync Past] Step 1: Syncing ${season} ${year} season data from Jikan...`);
    const syncResult = await syncSeason(supabase, season, year);
    if (!syncResult.success) {
      return c.json({
        success: false,
        error: `Failed to sync season: ${syncResult.errors}`
      }, 500);
    }
    console.log(`[Sync Past] \u2705 Step 1 complete: ${syncResult.inserted} animes synced`);
    console.log(`[Sync Past] Step 2: Enriching episodes and populating weekly_episodes...`);
    const enrichResult = await enrichEpisodes(supabase, season, year);
    console.log(`[Sync Past] \u2705 Successfully completed sync for ${season} ${year}`);
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
    console.error("[Sync Past] \u274C Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.get("/make-server-c1d1bfd8/search", async (c) => {
  try {
    const query = c.req.query("q")?.toLowerCase().trim() || "";
    const limitParam = c.req.query("limit");
    const limit = limitParam ? parseInt(limitParam) : 100;
    if (!query || query.length < 3) {
      return c.json({
        success: true,
        results: [],
        count: 0,
        message: "Query must be at least 3 characters"
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({
        success: false,
        error: "Missing Supabase credentials"
      }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`[Search] Query: "${query}", Limit: ${limit}`);
    const seasonYearPattern = /^(winter|spring|summer|fall)\s+(\d{4})$/i;
    const match = query.match(seasonYearPattern);
    let filterSeason = null;
    let filterYear = null;
    if (match) {
      filterSeason = match[1].toLowerCase();
      filterYear = parseInt(match[2]);
      console.log(`[Search] Detected Season + Year filter: ${filterSeason} ${filterYear}`);
    }
    const extractTags = (jsonbArray) => {
      if (!Array.isArray(jsonbArray)) return [];
      return jsonbArray.map(
        (item) => typeof item === "string" ? item : item.name || ""
      ).filter(Boolean);
    };
    const tagsMatchQuery = (jsonbArray, query2) => {
      const tags = extractTags(jsonbArray);
      return tags.some((tag) => tag.toLowerCase().includes(query2));
    };
    const calculateRelevance = (title, titleEnglish, season, genres, themes, demographics) => {
      const titleLower = title?.toLowerCase() || "";
      const titleEnglishLower = titleEnglish?.toLowerCase() || "";
      const seasonLower = season?.toLowerCase() || "";
      if (titleLower === query || titleEnglishLower === query) return 1e3;
      if (titleLower.startsWith(query) || titleEnglishLower.startsWith(query)) return 500;
      if (titleLower.includes(query) || titleEnglishLower.includes(query)) return 100;
      if (seasonLower === query) return 50;
      if (seasonLower.includes(query)) return 30;
      if (tagsMatchQuery(genres, query) || tagsMatchQuery(themes, query) || tagsMatchQuery(demographics, query)) {
        return 10;
      }
      return 0;
    };
    const allResults = [];
    const { data: weeklyData, error: weeklyError } = await supabase.from("weekly_episodes").select("anime_id, anime_title, anime_title_english, anime_image_url, week_number, week_start_date, week_end_date, genres, themes, demographics, members, score, type").not("episode_score", "is", null).order("members", { ascending: false, nullsFirst: false }).limit(200);
    if (!weeklyError && weeklyData) {
      const filteredWeekly = weeklyData.map((ep) => ({
        ...ep,
        relevance: calculateRelevance(
          ep.anime_title,
          ep.anime_title_english,
          null,
          // weekly episodes don't have season field
          ep.genres || [],
          ep.themes || [],
          ep.demographics || []
        )
      })).filter((ep) => ep.relevance > 0);
      const uniqueAnimes = /* @__PURE__ */ new Map();
      filteredWeekly.forEach((ep) => {
        if (!uniqueAnimes.has(ep.anime_id) || uniqueAnimes.get(ep.anime_id).relevance < ep.relevance) {
          uniqueAnimes.set(ep.anime_id, {
            id: ep.anime_id,
            title: ep.anime_title_english || ep.anime_title,
            imageUrl: ep.anime_image_url,
            season: null,
            // Will try to infer from dates
            year: null,
            type: ep.type,
            genres: extractTags(ep.genres || []),
            themes: extractTags(ep.themes || []),
            demographics: extractTags(ep.demographics || []),
            members: ep.members,
            score: ep.score,
            source: "weekly_episodes",
            relevance: ep.relevance
          });
        }
      });
      allResults.push(...Array.from(uniqueAnimes.values()));
      console.log(`[Search] Found ${uniqueAnimes.size} unique animes in weekly_episodes`);
    }
    let seasonRankingsQuery = supabase.from("season_rankings").select("anime_id, title, title_english, image_url, season, year, genres, themes, demographics, members, anime_score, type");
    if (filterSeason && filterYear) {
      seasonRankingsQuery = seasonRankingsQuery.ilike("season", filterSeason).eq("year", filterYear);
      console.log(`[Search] Applying filter: season=${filterSeason}, year=${filterYear}`);
    } else {
      seasonRankingsQuery = seasonRankingsQuery.or(`title.ilike.%${query}%,title_english.ilike.%${query}%,season.ilike.%${query}%`);
    }
    const { data: seasonData, error: seasonError } = await seasonRankingsQuery.order("members", { ascending: false, nullsFirst: false }).limit(500);
    if (!seasonError && seasonData) {
      const filteredSeason = seasonData.map((anime) => ({
        ...anime,
        // ✅ FIXED: If season+year filter is active, give all results high relevance
        relevance: filterSeason && filterYear ? 1e3 : calculateRelevance(
          anime.title,
          anime.title_english,
          anime.season,
          anime.genres || [],
          anime.themes || [],
          anime.demographics || []
        )
      })).filter((anime) => anime.relevance > 0).map((anime) => ({
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
        score: anime.anime_score,
        // ✅ FIXED: Changed from anime.score to anime.anime_score
        source: "season_rankings",
        relevance: anime.relevance
      }));
      allResults.push(...filteredSeason);
      console.log(`[Search] Found ${filteredSeason.length} animes in season_rankings`);
    }
    const uniqueResults = /* @__PURE__ */ new Map();
    allResults.forEach((result) => {
      if (!uniqueResults.has(result.id) || uniqueResults.get(result.id).relevance < result.relevance) {
        uniqueResults.set(result.id, result);
      }
    });
    const totalUniqueResults = Array.from(uniqueResults.values());
    const sortedResults = totalUniqueResults.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return (b.members || 0) - (a.members || 0);
    }).slice(0, limit);
    console.log(`[Search] Total unique results: ${totalUniqueResults.length}, returning: ${sortedResults.length}`);
    return c.json({
      success: true,
      results: sortedResults,
      totalCount: totalUniqueResults.length,
      // Total before limit
      query
    });
  } catch (error) {
    console.error("\u274C Search error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/make-server-c1d1bfd8/export-ranks", async (c) => {
  try {
    const body = await c.req.json();
    console.log("[Export] \u{1F4E5} Export request received:", body);
    const { buffer, contentType } = await generateExport(body);
    console.log("[Export] \u2705 Export generated successfully");
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="export.${body.format}"`,
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("\u274C Export error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Export failed"
    }, 500);
  }
});
app.onError((err, c) => {
  console.error("\u274C Unhandled error:", err);
  return c.json({
    success: false,
    error: err.message || "Internal server error",
    stack: err.stack
  }, 500);
});
app.notFound((c) => {
  return c.json({
    success: false,
    error: "Not Found",
    path: c.req.path
  }, 404);
});
Deno.serve(app.fetch);
