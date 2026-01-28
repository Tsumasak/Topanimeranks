// ============================================
// Supabase Edge Function: insert-weekly-episodes
// Purpose: INSERT NEW episodes that aired this week
// Runs: Once per day at 6:00 AM UTC
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const BATCH_SIZE = 15; // Process 15 animes per execution to avoid timeout
const MAX_EXECUTION_TIME = 140000; // 140 seconds (leave 10s buffer before 150s timeout)

// ============================================
// SEASON UTILITIES - Calculate week number based on season
// ============================================
type SeasonName = 'winter' | 'spring' | 'summer' | 'fall';

interface SeasonInfo {
  name: SeasonName;
  year: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Get the start and end dates for a specific season and year
 */
function getSeasonDates(season: SeasonName, year: number): { startDate: Date; endDate: Date } {
  let startMonth: number;
  let endMonth: number;
  
  switch (season.toLowerCase()) {
    case 'winter':
      startMonth = 0; // January
      endMonth = 2;   // March
      break;
    case 'spring':
      startMonth = 3; // April
      endMonth = 5;   // June
      break;
    case 'summer':
      startMonth = 6; // July
      endMonth = 8;   // September
      break;
    case 'fall':
      startMonth = 9; // October
      endMonth = 11;  // December
      break;
    default:
      startMonth = 0;
      endMonth = 2;
  }
  
  // Season starts on first day of first month
  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  
  // Season ends on last day of last month
  const endDate = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999));
  
  return { startDate, endDate };
}

/**
 * Determine which season a date falls into
 */
function getSeasonFromDate(date: Date): SeasonInfo {
  const month = date.getUTCMonth(); // 0-11
  const year = date.getUTCFullYear();
  
  let season: SeasonName;
  
  if (month >= 0 && month <= 2) {
    // January - March
    season = 'winter';
  } else if (month >= 3 && month <= 5) {
    // April - June
    season = 'spring';
  } else if (month >= 6 && month <= 8) {
    // July - September
    season = 'summer';
  } else {
    // October - December
    season = 'fall';
  }
  
  const { startDate, endDate } = getSeasonDates(season, year);
  
  return {
    name: season,
    year,
    startDate,
    endDate,
  };
}

/**
 * Calculate which week within a season a date falls into
 * Week 1: From season start to first Sunday (partial week)
 * Week 2+: Monday to Sunday (full weeks)
 */
function getWeekInSeason(date: Date, seasonInfo: SeasonInfo): number {
  const { startDate } = seasonInfo;
  
  // Find the first Sunday of the season
  const firstSunday = new Date(startDate);
  const dayOfWeek = firstSunday.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
  firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);
  
  // Check if date is in Week 1 (season start to first Sunday)
  if (date >= startDate && date <= firstSunday) {
    return 1;
  }
  
  // Week 2+ starts on Monday after first Sunday
  const firstMonday = new Date(firstSunday);
  firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);
  
  // Calculate days from first Monday
  const diffTime = date.getTime() - firstMonday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate week number (2-based, then add 1)
  const weekNumber = Math.floor(diffDays / 7) + 2; // +2 because Week 1 is already used
  
  // Clamp to reasonable range (1-15 weeks per season)
  return Math.max(1, Math.min(15, weekNumber));
}

/**
 * Get complete season information for an episode based on its aired date
 * Returns week number relative to the episode's broadcast season
 */
function getEpisodeWeekNumber(airedDate: Date | string): {
  season: SeasonName;
  year: number;
  weekNumber: number;
} {
  const date = typeof airedDate === 'string' ? new Date(airedDate) : airedDate;
  
  // Get season info
  const seasonInfo = getSeasonFromDate(date);
  
  // Get week within that season
  const weekNumber = getWeekInSeason(date, seasonInfo);
  
  return {
    season: seasonInfo.name,
    year: seasonInfo.year,
    weekNumber,
  };
}

// Helper: Delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Fetch with retry
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Fetching (attempt ${i + 1}/${retries}): ${url}`);
      const response = await fetch(url);
      
      if (response.status === 429) {
        console.log(`⏳ Rate limited, waiting 3 seconds...`);
        await delay(3000);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Fetch error (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) throw error;
      await delay(2000);
    }
  }
}

// ============================================
// INSERT NEW EPISODES FOR A WEEK
// ============================================
async function insertWeeklyEpisodes(supabase: any, weekNumber: number) {
  console.log(`\n📅 ============================================`);
  console.log(`📅 INSERTING NEW EPISODES FOR WEEK ${weekNumber}`);
  console.log(`📅 ============================================\n`);
  
  const startTime = Date.now();
  let itemsCreated = 0;

  try {
    // Fetch current season animes
    const seasonsToCheck = [{ season: 'winter', year: 2026 }];
    
    // Calculate week dates dynamically based on the season
    // Winter 2026 starts January 1, 2026 (Wednesday)
    // Week 1: Jan 1-4 (Wed-Sun, partial week)
    // Week 2+: Monday-Sunday (full weeks)
    
    const seasonStartDate = new Date(Date.UTC(2026, 0, 1)); // January 1, 2026
    
    let startDate: Date;
    let endDate: Date;
    
    if (weekNumber === 1) {
      // Week 1: From season start to first Sunday
      startDate = new Date(seasonStartDate);
      
      // Find the first Sunday
      const firstSunday = new Date(seasonStartDate);
      const dayOfWeek = firstSunday.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
      firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);
      
      endDate = new Date(firstSunday);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      // Week 2+: Monday to Sunday
      // Find first Monday after Week 1
      const firstSunday = new Date(seasonStartDate);
      const dayOfWeek = firstSunday.getUTCDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
      firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);
      
      const firstMonday = new Date(firstSunday);
      firstMonday.setUTCDate(firstSunday.getUTCDate() + 1); // Day after first Sunday
      
      // Calculate start of this week (Monday)
      startDate = new Date(firstMonday);
      startDate.setUTCDate(firstMonday.getUTCDate() + (weekNumber - 2) * 7); // -2 because Week 2 starts at firstMonday
      
      // Calculate end of this week (Sunday)
      endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      endDate.setUTCHours(23, 59, 59, 999);
    }
    
    console.log(`📅 Week ${weekNumber}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const allAnimes: any[] = [];
    
    for (const { season, year } of seasonsToCheck) {
      let currentPage = 1;
      let hasNextPage = true;
      
      console.log(`\n🌐 Fetching ${season} ${year} animes...`);
      
      while (hasNextPage) {
        const seasonUrl = `${JIKAN_BASE_URL}/seasons/${year}/${season}?page=${currentPage}`;
        const seasonData = await fetchWithRetry(seasonUrl);
        
        if (seasonData?.data) {
          console.log(`📄 Page ${currentPage}: Found ${seasonData.data.length} animes`);
          allAnimes.push(...seasonData.data);
          hasNextPage = seasonData.pagination?.has_next_page || false;
          currentPage++;
          
          if (hasNextPage) {
            await delay(RATE_LIMIT_DELAY);
          }
        } else {
          hasNextPage = false;
        }
      }
    }
    
    console.log(`📺 Total animes fetched: ${allAnimes.length}`);

    // Filter by members >= 5000 and airing status
    const airingAnimes = allAnimes.filter((anime: any) => 
      anime.members >= 5000 && 
      (anime.status === 'Currently Airing' || anime.status === 'Finished Airing')
    );
    console.log(`✅ Filtered to ${airingAnimes.length} airing animes (5k+ members)`);

    // GET ALL EXISTING EPISODES FROM DATABASE (to avoid duplicates across all weeks)
    console.log(`\n🔍 Fetching ALL existing episodes from database...`);
    const { data: allExistingEpisodes, error: fetchError } = await supabase
      .from('weekly_episodes')
      .select('anime_id, episode_number, week_number')
      .eq('is_manual', false);

    if (fetchError) {
      console.error(`❌ Error fetching existing episodes:`, fetchError);
    }

    // Create a Set of "anime_id_episode_number" to quickly check if episode exists
    const existingEpisodesSet = new Set<string>();
    allExistingEpisodes?.forEach(ep => {
      existingEpisodesSet.add(`${ep.anime_id}_${ep.episode_number}`);
    });
    console.log(`📊 Found ${existingEpisodesSet.size} existing episodes in database (all weeks)`);

    // Process each anime
    const newEpisodes: any[] = [];
    let processedAnimeCount = 0;
    let timeoutReached = false;
    
    for (const anime of airingAnimes) {
      // ⏱️ TIMEOUT PROTECTION: Stop before 150s limit
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`\n⏱️ TIMEOUT PROTECTION: Stopping at ${processedAnimeCount}/${airingAnimes.length} animes (${elapsedTime}ms elapsed)`);
        console.log(`⚠️ Remaining ${airingAnimes.length - processedAnimeCount} animes will be processed in next run`);
        timeoutReached = true;
        break;
      }
      
      try {
        processedAnimeCount++;
        console.log(`\n[${processedAnimeCount}/${airingAnimes.length}] Processing: ${anime.title} (ID: ${anime.mal_id})`);
        
        await delay(RATE_LIMIT_DELAY);

        // Get anime episodes - FETCH ALL PAGES
        let allEpisodes: any[] = [];
        let episodePage = 1;
        let hasNextEpisodePage = true;
        
        while (hasNextEpisodePage) {
          // ✅ FIXED: Use /episodes for page 1, /episodes?page=N for page 2+
          const episodesUrl = episodePage === 1 
            ? `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes`
            : `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes?page=${episodePage}`;
          
          console.log(`  📄 Fetching episodes page ${episodePage}: ${episodesUrl}`);
          
          try {
            const episodesData = await fetchWithRetry(episodesUrl);
            
            if (!episodesData?.data || episodesData.data.length === 0) {
              hasNextEpisodePage = false;
              break;
            }
            
            allEpisodes.push(...episodesData.data);
            hasNextEpisodePage = episodesData.pagination?.has_next_page || false;
            episodePage++;
            
            if (hasNextEpisodePage) {
              await delay(RATE_LIMIT_DELAY);
            }
          } catch (fetchError: any) {
            console.error(`  ❌ Fetch failed for page ${episodePage}: ${fetchError.message}`);
            hasNextEpisodePage = false;
            break;
          }
        }
        
        if (allEpisodes.length === 0) {
          console.log(`  ⏭️ No episodes found`);
          continue;
        }

        console.log(`  📺 Total episodes: ${allEpisodes.length}`);

        // Find NEW episodes that DON'T exist in database yet
        // We'll insert ALL new episodes, not just those from this week
        for (const ep of allEpisodes) {
          // Check if episode already exists in database (ANY week)
          const episodeKey = `${anime.mal_id}_${ep.mal_id}`;
          if (existingEpisodesSet.has(episodeKey)) {
            console.log(`  ⏭️ SKIP: EP${ep.mal_id} already exists in database`);
            continue;
          }

          // Calculate week_number based on aired date
          // If no aired date, use current week (Week 1 for new season)
          let episodeSeason: string;
          let episodeYear: number;
          let episodeWeek: number;
          
          if (ep.aired) {
            const airedDate = new Date(ep.aired);
            const calculated = getEpisodeWeekNumber(airedDate);
            episodeSeason = calculated.season;
            episodeYear = calculated.year;
            episodeWeek = calculated.weekNumber;
            console.log(`  ✅ NEW: EP${ep.mal_id} "${ep.title}" (Aired: ${ep.aired}, Score: ${ep.score || 'N/A'})`);
            console.log(`  📅 Calculated: ${episodeSeason} ${episodeYear} Week ${episodeWeek}`);
          } else {
            // No aired date - assume current season/week
            episodeSeason = 'winter';
            episodeYear = 2026;
            episodeWeek = weekNumber; // Use the week we're processing
            console.log(`  ✅ NEW: EP${ep.mal_id} "${ep.title}" (Aired: N/A, Score: ${ep.score || 'N/A'})`);
            console.log(`  📅 No aired date - using: ${episodeSeason} ${episodeYear} Week ${episodeWeek}`);
          }

          const episode = {
            anime_id: anime.mal_id,
            anime_title_english: anime.title_english || anime.title,
            anime_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
            from_url: ep.url || anime.url,
            episode_number: ep.mal_id,
            episode_name: ep.title || `Episode ${ep.mal_id}`,
            episode_score: ep.score || null,
            week_number: episodeWeek,
            position_in_week: 0, // Will be calculated by update function
            trend: 'NEW',
            is_manual: false,
            type: anime.type,
            status: anime.status,
            season: episodeSeason,
            year: episodeYear,
            demographic: anime.demographics || [],
            genre: anime.genres || [],
            theme: anime.themes || [],
            aired_at: ep.aired,
          };

          newEpisodes.push(episode);

          // Also save to season_rankings
          const seasonAnime = {
            anime_id: anime.mal_id,
            title: anime.title,
            title_english: anime.title_english,
            image_url: anime.images?.jpg?.large_image_url,
            anime_score: anime.score,
            scored_by: anime.scored_by,
            members: anime.members,
            favorites: anime.favorites,
            popularity: anime.popularity,
            rank: anime.rank,
            type: anime.type,
            status: anime.status,
            rating: anime.rating,
            source: anime.source,
            episodes: anime.episodes,
            aired_from: anime.aired?.from,
            aired_to: anime.aired?.to,
            duration: anime.duration,
            demographics: anime.demographics || [],
            genres: anime.genres || [],
            themes: anime.themes || [],
            studios: anime.studios || [],
            synopsis: anime.synopsis,
            season: episodeSeason, // ✅ FIXED: Use calculated season from aired date
            year: episodeYear, // ✅ FIXED: Use calculated year from aired date
          };

          await supabase
            .from('season_rankings')
            .upsert(seasonAnime, {
              onConflict: 'anime_id,season,year',
              ignoreDuplicates: false,
            });
        }
      } catch (error) {
        console.error(`❌ Error processing anime ${anime.title}:`, error);
      }
    }

    console.log(`\n📊 ============================================`);
    console.log(`📊 Found ${newEpisodes.length} NEW episodes to insert`);
    console.log(`📊 ============================================\n`);

    // INSERT new episodes to database
    if (newEpisodes.length > 0) {
      console.log(`💾 Inserting ${newEpisodes.length} new episodes...`);
      
      for (const episode of newEpisodes) {
        const { error } = await supabase
          .from('weekly_episodes')
          .insert(episode);

        if (error) {
          // Check if it's a duplicate key error (code 23505)
          if (error.code === '23505') {
            console.log(`ℹ️ SKIP: ${episode.anime_title_english} EP${episode.episode_number} - Already exists in database`);
          } else {
            // Real error - log with ❌
            console.error(`❌ Insert error for ${episode.anime_title_english} EP${episode.episode_number}:`, error);
          }
        } else {
          console.log(`✅ Inserted: ${episode.anime_title_english} EP${episode.episode_number}`);
          itemsCreated++;
        }
      }
    } else {
      console.log(`✅ No new episodes to insert for week ${weekNumber}`);
    }

    const duration = Date.now() - startTime;

    // Log sync
    await supabase.from('sync_logs').insert({
      sync_type: 'insert_weekly_episodes',
      status: 'success',
      week_number: weekNumber,
      items_synced: newEpisodes.length,
      items_created: itemsCreated,
      items_updated: 0,
      duration_ms: duration,
    });

    console.log(`\n✅ ============================================`);
    console.log(`✅ Week ${weekNumber} INSERT completed!`);
    console.log(`✅ NEW episodes inserted: ${itemsCreated}`);
    console.log(`✅ Duration: ${duration}ms`);
    console.log(`✅ ============================================`);
    
    return { success: true, itemsCreated, weekNumber, timeoutReached };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error inserting week ${weekNumber}:`, error);

    await supabase.from('sync_logs').insert({
      sync_type: 'insert_weekly_episodes',
      status: 'error',
      week_number: weekNumber,
      error_message: error.message,
      error_details: { stack: error.stack },
      duration_ms: duration,
    });

    throw error;
  }
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    console.log('\n🚀 Insert weekly episodes function invoked');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get week_number from request body (if provided)
    const body = await req.text();
    const { week_number } = body ? JSON.parse(body) : {};

    let weekToProcess: number;
    
    // Auto-detect current week if not provided
    if (week_number) {
      // Support dynamic week values: "current", "current-1", "current-2", or numeric
      const baseDate = new Date(Date.UTC(2026, 0, 6)); // January 6, 2026 (Monday) - Winter 2026
      const today = new Date();
      const diffTime = today.getTime() - baseDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const currentWeek = Math.max(1, Math.min(13, Math.floor(diffDays / 7) + 1));
      
      if (week_number === "current") {
        weekToProcess = currentWeek;
        console.log(`📅 Using current week: ${weekToProcess}`);
      } else if (week_number === "current-1") {
        weekToProcess = Math.max(1, currentWeek - 1);
        console.log(`📅 Using previous week (current-1): ${weekToProcess}`);
      } else if (week_number === "current-2") {
        weekToProcess = Math.max(1, currentWeek - 2);
        console.log(`📅 Using 2 weeks ago (current-2): ${weekToProcess}`);
      } else if (typeof week_number === "number") {
        weekToProcess = week_number;
        console.log(`📅 Using provided numeric week: ${weekToProcess}`);
      } else {
        // Fallback to current week
        weekToProcess = currentWeek;
        console.log(`📅 Invalid week_number format, using current week: ${weekToProcess}`);
      }
    } else {
      // Auto-detect current week based on Winter 2026
      const baseDate = new Date(Date.UTC(2026, 0, 6)); // January 6, 2026 (Monday) - Winter 2026
      const today = new Date();
      const diffTime = today.getTime() - baseDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      weekToProcess = Math.max(1, Math.min(13, Math.floor(diffDays / 7) + 1));
      
      console.log(`📅 Auto-detected current week: ${weekToProcess} (Date: ${today.toISOString().split('T')[0]})`);
    }

    // Process ONLY ONE week per execution
    console.log(`📅 Processing week: ${weekToProcess}`);
    const result = await insertWeeklyEpisodes(supabase, weekToProcess);

    return new Response(
      JSON.stringify({ 
        success: true, 
        weekProcessed: weekToProcess,
        itemsCreated: result.itemsCreated,
        timeoutReached: result.timeoutReached
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});