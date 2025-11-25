// ============================================
// Supabase Edge Function: insert-weekly-episodes
// Purpose: INSERT NEW episodes that aired this week
// Runs: Once per day at 6:00 AM UTC
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

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
    // Calculate week dates - Week 1 starts on September 29, 2025 (Monday)
    const baseDate = new Date(Date.UTC(2025, 8, 29));
    const startDate = new Date(baseDate);
    startDate.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);
    
    console.log(`📅 Week ${weekNumber}: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch current season animes
    const seasonsToCheck = [{ season: 'fall', year: 2025 }];
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

    // HARDCODED EXCEPTIONS
    const HARDCODED_ANIME_IDS = [62405, 59062, 60378];
    
    for (const animeId of HARDCODED_ANIME_IDS) {
      if (!allAnimes.some((a: any) => a.mal_id === animeId)) {
        console.log(`⭐ Fetching hardcoded anime ${animeId}...`);
        const animeUrl = `${JIKAN_BASE_URL}/anime/${animeId}`;
        const animeData = await fetchWithRetry(animeUrl);
        
        if (animeData?.data) {
          console.log(`✅ Added: ${animeData.data.title}`);
          allAnimes.push(animeData.data);
        }
        
        await delay(RATE_LIMIT_DELAY);
      }
    }

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
    
    for (const anime of airingAnimes) {
      try {
        processedAnimeCount++;
        console.log(`\n[${processedAnimeCount}/${airingAnimes.length}] Processing: ${anime.title} (ID: ${anime.mal_id})`);
        
        await delay(RATE_LIMIT_DELAY);

        // Get anime episodes - FETCH ALL PAGES
        let allEpisodes: any[] = [];
        let episodePage = 1;
        let hasNextEpisodePage = true;
        
        while (hasNextEpisodePage) {
          const episodesUrl = `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes?page=${episodePage}`;
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
        }
        
        if (allEpisodes.length === 0) {
          console.log(`  ⏭️ No episodes found`);
          continue;
        }

        console.log(`  📺 Total episodes: ${allEpisodes.length}`);

        // Find episodes that aired THIS WEEK and DON'T exist in database yet
        for (const ep of allEpisodes) {
          if (!ep.aired) continue;

          const airedDate = new Date(ep.aired);
          const isInWeek = airedDate >= startDate && airedDate <= endDate;
          
          if (!isInWeek) continue;

          // Check if episode already exists in database (ANY week)
          const episodeKey = `${anime.mal_id}_${ep.mal_id}`;
          if (existingEpisodesSet.has(episodeKey)) {
            console.log(`  ⏭️ SKIP: EP${ep.mal_id} already exists in database`);
            continue;
          }

          // NEW EPISODE! Add to list
          console.log(`  ✅ NEW: EP${ep.mal_id} "${ep.title}" (Aired: ${ep.aired}, Score: ${ep.score || 'N/A'})`);

          const episode = {
            anime_id: anime.mal_id,
            anime_title_english: anime.title_english || anime.title,
            anime_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
            from_url: ep.url || anime.url,
            episode_number: ep.mal_id,
            episode_name: ep.title || `Episode ${ep.mal_id}`,
            episode_score: ep.score || null,
            week_number: weekNumber,
            position_in_week: 0, // Will be calculated by update function
            trend: 'NEW',
            is_manual: false,
            type: anime.type,
            status: anime.status,
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
            season: 'fall',
            year: 2025,
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
          console.error(`❌ Insert error for ${episode.anime_title_english} EP${episode.episode_number}:`, error);
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
    
    return { success: true, itemsCreated, weekNumber };
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

    let currentWeek = week_number;
    
    // Auto-detect current week if not provided
    if (!currentWeek) {
      const baseDate = new Date(Date.UTC(2025, 8, 29)); // September 29, 2025
      const today = new Date();
      const diffTime = today.getTime() - baseDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      currentWeek = Math.max(1, Math.min(13, Math.floor(diffDays / 7) + 1));
      
      console.log(`📅 Auto-detected current week: ${currentWeek} (Date: ${today.toISOString().split('T')[0]})`);
    } else {
      console.log(`📅 Using provided week number: ${currentWeek}`);
    }

    const result = await insertWeeklyEpisodes(supabase, currentWeek);

    return new Response(
      JSON.stringify({ success: true, ...result }),
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