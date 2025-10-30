// ============================================
// Supabase Edge Function: sync-anime-data
// Purpose: Fetch data from Jikan API and store in Supabase
// Runs every 1 hour via pg_cron
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
    // Calculate week dates - Week 1 starts on September 29, 2025 (Monday)
    const baseDate = new Date(Date.UTC(2025, 8, 29)); // September 29, 2025
    const startDate = new Date(baseDate);
    startDate.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6); // Sunday
    
    console.log(`📅 Week ${weekNumber}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Fetch Fall 2025 season anime (current airing season)
    const seasonUrl = `${JIKAN_BASE_URL}/seasons/2025/fall`;
    console.log(`🌐 Fetching Fall 2025 season: ${seasonUrl}`);
    const seasonData = await fetchWithRetry(seasonUrl);
    
    if (!seasonData || !seasonData.data) {
      throw new Error(`No season data received. Response: ${JSON.stringify(seasonData)}`);
    }

    const allAnimes = seasonData.data;
    console.log(`📺 Found ${allAnimes.length} Fall 2025 animes`);

    // Filter by members >= 5000 and currently airing
    const airingAnimes = allAnimes.filter((anime: any) => 
      anime.members >= 5000 && 
      anime.status === 'Currently Airing'
    );
    console.log(`✅ After filter (5k+ members, airing): ${airingAnimes.length} animes`);

    // Process episodes for this week
    const episodes: any[] = [];
    const processedAnimeIds = new Set<number>(); // Track to ensure 1 episode per anime
    
    for (const anime of airingAnimes) {
      await delay(RATE_LIMIT_DELAY);

      console.log(`🔍 Processing: ${anime.title} (ID: ${anime.mal_id}, Members: ${anime.members})`);

      // Get anime episodes
      const episodesUrl = `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes`;
      const episodesData = await fetchWithRetry(episodesUrl);
      
      if (!episodesData || !episodesData.data || episodesData.data.length === 0) {
        console.log(`⏭️ No episodes found for ${anime.title}`);
        continue;
      }

      // Find episode that aired in this week
      const weekEpisode = episodesData.data.find((ep: any) => {
        if (!ep.aired) return false;
        const airedDate = new Date(ep.aired);
        return airedDate >= startDate && airedDate <= endDate;
      });

      if (!weekEpisode) {
        console.log(`⏭️ No episode aired in week ${weekNumber} for ${anime.title}`);
        continue;
      }

      // Skip if we already have an episode from this anime for this week
      if (processedAnimeIds.has(anime.mal_id)) {
        console.log(`⏭️ Already processed anime ${anime.title}, skipping duplicate`);
        continue;
      }

      processedAnimeIds.add(anime.mal_id);

      const episodeId = `${anime.mal_id}_${weekEpisode.mal_id}`;
      console.log(`✅ Adding episode: ${anime.title} EP${weekEpisode.mal_id} "${weekEpisode.title}" (Aired: ${weekEpisode.aired}, Score: ${weekEpisode.score || 'N/A'})`);

      const episode = {
        anime_id: anime.mal_id,
        anime_title_english: anime.title_english || anime.title,
        anime_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        from_url: weekEpisode.url || anime.url,
        episode_number: weekEpisode.mal_id,
        episode_name: weekEpisode.title || `Episode ${weekEpisode.mal_id}`,
        episode_score: weekEpisode.score || null,
        week_number: weekNumber,
        position_in_week: 0, // Will be set later
        is_manual: false,
        type: anime.type,
        status: anime.status,
        demographic: anime.demographics || [],
        genre: anime.genres || [],
        theme: anime.themes || [],
        aired_at: weekEpisode.aired,
      };

      episodes.push(episode);
    }

    console.log(`📊 Found ${episodes.length} episodes for week ${weekNumber}`);

    // Sort episodes: First by episode_score (N/A at end), then by members
    episodes.sort((a, b) => {
      const scoreA = a.episode_score !== null ? a.episode_score : -1; // N/A goes to end
      const scoreB = b.episode_score !== null ? b.episode_score : -1;
      
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.members || 0) - (a.members || 0);
    });

    // Add position and calculate trend
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      const currentPosition = i + 1;
      episode.position_in_week = currentPosition;

      // Get position from previous week for trend calculation
      if (weekNumber > 1) {
        const previousWeek = weekNumber - 1;
        const { data: prevEpisode } = await supabase
          .from('weekly_episodes')
          .select('position_in_week')
          .eq('anime_id', episode.anime_id)
          .eq('week_number', previousWeek)
          .single();

        if (prevEpisode) {
          const positionChange = prevEpisode.position_in_week - currentPosition;
          if (positionChange > 0) {
            episode.trend = `+${positionChange}`; // Moved up
          } else if (positionChange < 0) {
            episode.trend = `${positionChange}`; // Moved down
          } else {
            episode.trend = '='; // Same position
          }
        } else {
          episode.trend = 'NEW'; // First appearance
        }
      } else {
        episode.trend = 'NEW'; // Week 1 is always NEW
      }
    }

    console.log(`\n📦 Processed ${episodes.length} episodes for week ${weekNumber}`);
    console.log(`📋 Sample episode data:`, JSON.stringify(episodes[0], null, 2));

    // Upsert to database
    console.log(`\n💾 Starting database upsert for ${episodes.length} episodes...`);
    
    for (const episode of episodes) {
      // Check if episode already exists
      const { data: existing, error: checkError } = await supabase
        .from('weekly_episodes')
        .select('id')
        .eq('anime_id', episode.anime_id)
        .eq('episode_number', episode.episode_number)
        .eq('week_number', episode.week_number)
        .maybeSingle();

      const isUpdate = existing !== null && !checkError;

      const { data, error } = await supabase
        .from('weekly_episodes')
        .upsert(episode, {
          onConflict: 'anime_id,episode_number,week_number',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error(`❌ Upsert error for ${episode.anime_title_english}:`, error);
        continue;
      }
      
      console.log(`✅ Upserted: ${episode.anime_title_english}`);

      if (data && data.length > 0) {
        if (isUpdate) {
          itemsUpdated++;
        } else {
          itemsCreated++;
        }
      }
    }

    // 🔄 RECALCULATE POSITIONS: After all upserts, re-fetch and re-rank episodes
    console.log(`\n🔄 Recalculating positions for week ${weekNumber}...`);
    
    const { data: allWeekEpisodes, error: fetchError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber);

    if (fetchError) {
      console.error(`❌ Error fetching episodes for recalculation:`, fetchError);
    } else if (allWeekEpisodes) {
      // Sort episodes by score (descending), with nulls at the end
      const sorted = allWeekEpisodes.sort((a, b) => {
        const scoreA = a.episode_score !== null ? a.episode_score : -1;
        const scoreB = b.episode_score !== null ? b.episode_score : -1;
        return scoreB - scoreA;
      });

      // Update positions and recalculate trends
      for (let i = 0; i < sorted.length; i++) {
        const episode = sorted[i];
        const newPosition = i + 1;
        const oldPosition = episode.position_in_week;

        // Only update if position changed
        if (newPosition !== oldPosition) {
          // Recalculate trend based on previous week
          let newTrend = episode.trend;
          if (weekNumber > 1) {
            const { data: prevEpisode } = await supabase
              .from('weekly_episodes')
              .select('position_in_week')
              .eq('anime_id', episode.anime_id)
              .eq('week_number', weekNumber - 1)
              .single();

            if (prevEpisode) {
              const positionChange = prevEpisode.position_in_week - newPosition;
              if (positionChange > 0) {
                newTrend = `+${positionChange}`;
              } else if (positionChange < 0) {
                newTrend = `${positionChange}`;
              } else {
                newTrend = '=';
              }
            }
          }

          const { error: updateError } = await supabase
            .from('weekly_episodes')
            .update({ 
              position_in_week: newPosition,
              trend: newTrend
            })
            .eq('id', episode.id);

          if (updateError) {
            console.error(`❌ Error updating position for ${episode.anime_title_english}:`, updateError);
          } else {
            console.log(`📊 Reranked ${episode.anime_title_english}: #${oldPosition} → #${newPosition}`);
          }
        }
      }
      
      console.log(`✅ Position recalculation complete for week ${weekNumber}`);
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
        // Sort by members first (descending), then by score
        const membersA = a.members || 0;
        const membersB = b.members || 0;
        if (membersB !== membersA) return membersB - membersA;
        return (b.score || 0) - (a.score || 0);
      });

    console.log(`Found ${animes.length} animes for ${season} ${year}`);

    for (const anime of animes) {
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
// SYNC UPCOMING ANIMES (for "Later" tab)
// ============================================
async function syncUpcomingAnimes(supabase: any) {
  console.log(`\n🔮 Syncing upcoming animes for "Later" tab...`);
  
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;

  try {
    // Fetch ALL upcoming animes from Jikan
    let allAnimes: any[] = [];
    let currentPage = 1;
    let hasNextPage = true;
    
    while (hasNextPage) {
      const url = `${JIKAN_BASE_URL}/seasons/upcoming?page=${currentPage}`;
      console.log(`🌐 Fetching upcoming page ${currentPage}: ${url}`);
      
      const data = await fetchWithRetry(url);
      
      if (!data || !data.data) {
        throw new Error(`No upcoming data received. Response: ${JSON.stringify(data)}`);
      }

      allAnimes = allAnimes.concat(data.data);
      hasNextPage = data.pagination?.has_next_page || false;
      currentPage++;
      
      console.log(`📄 Page ${currentPage - 1}: Added ${data.data.length} animes. Total so far: ${allAnimes.length}`);
      
      if (hasNextPage) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    console.log(`📺 Found ${allAnimes.length} total upcoming animes`);

    // Filter by status "Not yet aired" AND members >= 20000
    const filtered = allAnimes
      .filter((anime: any) => anime.status === 'Not yet aired')
      .filter((anime: any) => anime.members >= 20000);
    console.log(`✅ Filtered to ${filtered.length} animes (Not yet aired + 20k+ members)`);

    // Sort by members first, then score
    filtered.sort((a: any, b: any) => {
      const membersA = a.members || 0;
      const membersB = b.members || 0;
      if (membersB !== membersA) return membersB - membersA;
      return (b.score || 0) - (a.score || 0);
    });

    for (const anime of filtered) {
      // Use season/year from anime data, or 'upcoming'/null if not available
      const seasonData = {
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
        season: anime.season || 'upcoming', // Use 'upcoming' if season is null
        year: anime.year || 9999, // Use 9999 for unknown year to put at end
      };

      const { data: upsertData, error } = await supabase
        .from('season_rankings')
        .upsert(seasonData, {
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
      sync_type: 'upcoming',
      status: 'success',
      items_synced: filtered.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration,
    });

    console.log(`✅ Upcoming animes synced: ${itemsCreated} created, ${itemsUpdated} updated (${duration}ms)`);
    
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error syncing upcoming animes:`, error);

    await supabase.from('sync_logs').insert({
      sync_type: 'upcoming',
      status: 'error',
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

      case 'upcoming':
        result = await syncUpcomingAnimes(supabase);
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
