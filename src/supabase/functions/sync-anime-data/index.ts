// ============================================
// Supabase Edge Function: sync-anime-data
// Purpose: Fetch data from Jikan API and store in Supabase
// Runs every 10 minutes via pg_cron
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
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (response.status === 429) {
        console.log(`Rate limited, waiting 3 seconds... (attempt ${i + 1}/${retries})`);
        await delay(3000);
        continue;
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      console.log(`✅ Data received, keys: ${Object.keys(data).join(', ')}`);
      return data;
    } catch (error) {
      console.error(`❌ Fetch error (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) throw error;
      await delay(2000);
    }
  }
}

// ============================================
// SYNC WEEKLY EPISODES
// ============================================
async function syncWeeklyEpisodes(supabase: any, weekNumber: number) {
  console.log(`\n📅 Syncing week ${weekNumber}...`);
  
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;

  try {
    // Calculate week dates
    const startDate = new Date('2025-01-06');
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Fetch schedules for the week
    // Note: Jikan v4 schedules endpoint returns all airing anime for the current week
    const scheduleUrl = `${JIKAN_BASE_URL}/schedules`;
    console.log('🌐 Fetching from:', scheduleUrl);
    
    const scheduleData = await fetchWithRetry(scheduleUrl);
    console.log('📦 Schedule response:', JSON.stringify(scheduleData).substring(0, 500));
    
    if (!scheduleData || !scheduleData.data) {
      throw new Error(`No schedule data received. Response: ${JSON.stringify(scheduleData)}`);
    }

    const allAnimes = scheduleData.data;
    console.log(`Found ${allAnimes.length} airing animes`);

    // Filter and process episodes
    const episodes: any[] = [];
    
    for (const anime of allAnimes) {
      await delay(RATE_LIMIT_DELAY);

      // Filter: Only animes with 20k+ members
      if (!anime.members || anime.members < 20000) continue;

      // Get full anime data
      const animeUrl = `${JIKAN_BASE_URL}/anime/${anime.mal_id}/full`;
      const animeData = await fetchWithRetry(animeUrl);
      const fullAnime = animeData.data;

      // Check if anime has episodes in this week
      if (!fullAnime.broadcast || !fullAnime.broadcast.day) continue;

      // Get episode number from broadcast info
      const episodeNumber = fullAnime.episodes || 1;
      const episodeId = `${anime.mal_id}_${episodeNumber}`;

      const episode = {
        anime_id: anime.mal_id,
        episode_number: episodeNumber,
        episode_id: episodeId,
        anime_title: anime.title,
        anime_title_english: anime.title_english,
        anime_image_url: anime.images?.jpg?.large_image_url,
        aired_at: anime.aired?.from,
        duration: anime.duration ? parseInt(anime.duration) : null,
        filler: false,
        recap: false,
        forum_url: anime.url,
        score: anime.score,
        scored_by: anime.scored_by,
        members: anime.members,
        favorites: anime.favorites,
        type: anime.type,
        status: anime.status,
        rating: anime.rating,
        source: anime.source,
        demographics: anime.demographics || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        week_number: weekNumber,
        week_start_date: startDate.toISOString().split('T')[0],
        week_end_date: endDate.toISOString().split('T')[0],
        is_manual: false,
      };

      episodes.push(episode);
    }

    // Sort by score and members
    episodes.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.members || 0) - (a.members || 0);
    });

    // Add position
    episodes.forEach((ep, index) => {
      ep.position_in_week = index + 1;
    });

    console.log(`Processed ${episodes.length} episodes for week ${weekNumber}`);

    // Upsert to database
    for (const episode of episodes) {
      const { data, error } = await supabase
        .from('weekly_episodes')
        .upsert(episode, {
          onConflict: 'episode_id,week_number',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('Upsert error:', error);
        continue;
      }

      if (data && data.length > 0) {
        // Check if it was created or updated
        const existing = await supabase
          .from('weekly_episodes')
          .select('created_at, updated_at')
          .eq('id', data[0].id)
          .single();

        if (existing.data.created_at === existing.data.updated_at) {
          itemsCreated++;
        } else {
          itemsUpdated++;
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log sync
    await supabase.from('sync_logs').insert({
      sync_type: 'weekly_episodes',
      status: 'success',
      week_number: weekNumber,
      items_synced: episodes.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration,
    });

    console.log(`✅ Week ${weekNumber} synced: ${itemsCreated} created, ${itemsUpdated} updated (${duration}ms)`);
    
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error syncing week ${weekNumber}:`, error);

    await supabase.from('sync_logs').insert({
      sync_type: 'weekly_episodes',
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
// SYNC SEASON RANKINGS
// ============================================
async function syncSeasonRankings(supabase: any, season: string, year: number) {
  console.log(`\n🌸 Syncing ${season} ${year} rankings...`);
  
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;

  try {
    const url = `${JIKAN_BASE_URL}/seasons/${year}/${season}`;
    const data = await fetchWithRetry(url);

    if (!data.data) {
      throw new Error('No season data received');
    }

    const animes = data.data
      .filter((anime: any) => anime.members >= 20000)
      .sort((a: any, b: any) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.members || 0) - (a.members || 0);
      });

    console.log(`Found ${animes.length} animes for ${season} ${year}`);

    for (const anime of animes) {
      const seasonAnime = {
        anime_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        image_url: anime.images?.jpg?.large_image_url,
        score: anime.score,
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
        season: season,
        year: year,
      };

      const { data: upsertData, error } = await supabase
        .from('season_rankings')
        .upsert(seasonAnime, {
          onConflict: 'anime_id,season,year',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('Upsert error:', error);
        continue;
      }

      if (upsertData && upsertData.length > 0) {
        const existing = await supabase
          .from('season_rankings')
          .select('created_at, updated_at')
          .eq('id', upsertData[0].id)
          .single();

        if (existing.data.created_at === existing.data.updated_at) {
          itemsCreated++;
        } else {
          itemsUpdated++;
        }
      }

      await delay(RATE_LIMIT_DELAY);
    }

    const duration = Date.now() - startTime;

    await supabase.from('sync_logs').insert({
      sync_type: 'season_rankings',
      status: 'success',
      season: season,
      year: year,
      items_synced: animes.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration,
    });

    console.log(`✅ ${season} ${year} synced: ${itemsCreated} created, ${itemsUpdated} updated (${duration}ms)`);
    
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error syncing ${season} ${year}:`, error);

    await supabase.from('sync_logs').insert({
      sync_type: 'season_rankings',
      status: 'error',
      season: season,
      year: year,
      error_message: error.message,
      error_details: { stack: error.stack },
      duration_ms: duration,
    });

    throw error;
  }
}

// ============================================
// SYNC ANTICIPATED ANIMES
// ============================================
async function syncAnticipatedAnimes(supabase: any) {
  console.log(`\n⭐ Syncing most anticipated animes...`);
  
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;

  try {
    const seasons = [
      { season: 'winter', year: 2025 },
      { season: 'spring', year: 2025 },
    ];

    const allAnimes: any[] = [];

    for (const { season, year } of seasons) {
      const url = `${JIKAN_BASE_URL}/seasons/${year}/${season}`;
      const data = await fetchWithRetry(url);

      if (data.data) {
        const filtered = data.data
          .filter((anime: any) => anime.status === 'Not yet aired')
          .filter((anime: any) => anime.members >= 10000);
        
        allAnimes.push(...filtered);
      }

      await delay(RATE_LIMIT_DELAY);
    }

    // Sort by members
    allAnimes.sort((a, b) => (b.members || 0) - (a.members || 0));
    const topAnimes = allAnimes.slice(0, 50);

    console.log(`Found ${topAnimes.length} anticipated animes`);

    for (let i = 0; i < topAnimes.length; i++) {
      const anime = topAnimes[i];

      const anticipatedAnime = {
        anime_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        image_url: anime.images?.jpg?.large_image_url,
        score: anime.score,
        scored_by: anime.scored_by,
        members: anime.members,
        favorites: anime.favorites,
        type: anime.type,
        status: anime.status,
        rating: anime.rating,
        source: anime.source,
        episodes: anime.episodes,
        aired_from: anime.aired?.from,
        synopsis: anime.synopsis,
        demographics: anime.demographics || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        studios: anime.studios || [],
        position: i + 1,
      };

      const { data: upsertData, error } = await supabase
        .from('anticipated_animes')
        .upsert(anticipatedAnime, {
          onConflict: 'anime_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('Upsert error:', error);
        continue;
      }

      if (upsertData && upsertData.length > 0) {
        const existing = await supabase
          .from('anticipated_animes')
          .select('created_at, updated_at')
          .eq('id', upsertData[0].id)
          .single();

        if (existing.data.created_at === existing.data.updated_at) {
          itemsCreated++;
        } else {
          itemsUpdated++;
        }
      }
    }

    const duration = Date.now() - startTime;

    await supabase.from('sync_logs').insert({
      sync_type: 'anticipated',
      status: 'success',
      items_synced: topAnimes.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration,
    });

    console.log(`✅ Anticipated animes synced: ${itemsCreated} created, ${itemsUpdated} updated (${duration}ms)`);
    
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error syncing anticipated animes:`, error);

    await supabase.from('sync_logs').insert({
      sync_type: 'anticipated',
      status: 'error',
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
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    console.log('\n🚀 Sync anime data function invoked');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const body = await req.text();
    console.log('📦 Raw body received:', body);
    
    const { sync_type, week_number, season, year } = body ? JSON.parse(body) : {};
    console.log('📋 Parsed sync_type:', sync_type);

    let result;

    switch (sync_type) {
      case 'weekly_episodes':
        // Sync current week (default to week 1 if not specified)
        const weekToSync = week_number || 1;
        result = await syncWeeklyEpisodes(supabase, weekToSync);
        break;

      case 'season_rankings':
        // Sync current season (default to winter 2025)
        const seasonToSync = season || 'winter';
        const yearToSync = year || 2025;
        result = await syncSeasonRankings(supabase, seasonToSync, yearToSync);
        break;

      case 'anticipated':
        result = await syncAnticipatedAnimes(supabase);
        break;

      default:
        throw new Error(`Unknown sync_type: ${sync_type}`);
    }

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
