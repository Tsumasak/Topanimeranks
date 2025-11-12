// ============================================
// Supabase Edge Function: sync-anime-data
// Purpose: Fetch data from Jikan API and store in Supabase
// Runs every 1 hour via pg_cron (staggered: :00, :15, :30)
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
// Jikan API Rate Limits: 3 requests/second, 60 requests/minute
// Using 1 second delay = 1 req/sec to stay well within limits
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
    endDate.setUTCHours(23, 59, 59, 999); // End of Sunday
    
    console.log(`📅 Week ${weekNumber}: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 🆕 Fetch MULTIPLE seasons to catch all airing animes
    // (Some animes may be listed under different seasons)
    const seasonsToCheck = [
      { season: 'fall', year: 2025 },
      { season: 'fall', year: 2024 },
    ];
    
    const allAnimes: any[] = [];
    
    for (const { season, year } of seasonsToCheck) {
      const seasonUrl = `${JIKAN_BASE_URL}/seasons/${year}/${season}`;
      console.log(`🌐 Fetching ${season} ${year} season: ${seasonUrl}`);
      
      try {
        const seasonData = await fetchWithRetry(seasonUrl);
        
        if (seasonData && seasonData.data) {
          console.log(`📺 Found ${seasonData.data.length} animes in ${season} ${year}`);
          allAnimes.push(...seasonData.data);
        }
      } catch (error) {
        console.error(`⚠️  Error fetching ${season} ${year}:`, error);
      }
      
      await delay(RATE_LIMIT_DELAY);
    }
    
    console.log(`📺 Total animes from all seasons: ${allAnimes.length}`);

    // ⭐ HARDCODED EXCEPTIONS: Animes to ALWAYS check, even if not in the season list
    // Add anime IDs here if they're missing from season API but should be synced
    const HARDCODED_ANIME_IDS = [62405, 59062];
    
    console.log(`\\n⭐ Checking ${HARDCODED_ANIME_IDS.length} hardcoded exception animes...`);
    
    for (const animeId of HARDCODED_ANIME_IDS) {
      // Check if already in list
      const alreadyExists = allAnimes.some((a: any) => a.mal_id === animeId);
      
      if (alreadyExists) {
        console.log(`✅ Anime ${animeId} already in season list`);
        continue;
      }
      
      console.log(`🔄 Fetching hardcoded anime ${animeId} directly from API...`);
      
      try {
        const animeUrl = `${JIKAN_BASE_URL}/anime/${animeId}`;
        const animeData = await fetchWithRetry(animeUrl);
        
        if (animeData && animeData.data) {
          console.log(`✅ Added hardcoded anime: ${animeData.data.title} (ID: ${animeId})`);
          console.log(`   Status: ${animeData.data.status}`);
          console.log(`   Members: ${animeData.data.members}`);
          allAnimes.push(animeData.data);
        } else {
          console.error(`❌ Failed to fetch anime ${animeId}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(`❌ Error fetching hardcoded anime ${animeId}:`, error);
      }
    }
    
    console.log(`📺 Total animes after hardcoded additions: ${allAnimes.length}`);

    // Filter by members >= 5000 and airing status (Currently Airing OR Finished Airing)
    // We include Finished Airing because animes that released all episodes in one week
    // (like Tatsuki Fujimoto 17-26) change status immediately but still need to be synced
    const airingAnimes = allAnimes.filter((anime: any) => 
      anime.members >= 5000 && 
      (anime.status === 'Currently Airing' || anime.status === 'Finished Airing')
    );
    console.log(`✅ After filter (5k+ members, airing/finished): ${airingAnimes.length} animes`);

    // 🆕 STEP 1: Get existing episodes from database for this week
    console.log(`\n🔍 Fetching existing episodes from database for week ${weekNumber}...`);
    const { data: existingEpisodes, error: existingFetchError } = await supabase
      .from('weekly_episodes')
      .select('anime_id, episode_number')
      .eq('week_number', weekNumber)
      .eq('is_manual', false); // Only update auto-synced episodes

    if (existingFetchError) {
      console.error(`❌ Error fetching existing episodes:`, existingFetchError);
    }

    const existingAnimeIds = new Set(existingEpisodes?.map(ep => ep.anime_id) || []);
    console.log(`📊 Found ${existingAnimeIds.size} existing episodes in database for week ${weekNumber}`);

    // Process episodes for this week
    const episodes: any[] = [];
    const processedEpisodeKeys = new Set<string>(); // Track anime_id + episode_number to avoid duplicates
    
    console.log(`\n🔄 Starting to process ${airingAnimes.length} airing animes for week ${weekNumber}...`);
    console.log(`📅 Week dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    for (const anime of airingAnimes) {
      await delay(RATE_LIMIT_DELAY);

      console.log(`\n🔍 Processing: ${anime.title} (ID: ${anime.mal_id}, Members: ${anime.members})`);

      // Get anime episodes
      const episodesUrl = `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes`;
      const episodesData = await fetchWithRetry(episodesUrl);
      
      if (!episodesData || !episodesData.data || episodesData.data.length === 0) {
        console.log(`⏭️ No episodes found for ${anime.title}`);
        continue;
      }

      // Find ALL episodes that aired in this week OR exist in database for this week
      console.log(`  📺 Found ${episodesData.data.length} episodes for ${anime.title}`);
      
      // Log all episodes with their aired dates for debugging
      const maxEpsToLog = anime.mal_id === 62405 ? episodesData.data.length : 5; // Log ALL episodes for anime 62405
      episodesData.data.forEach((ep: any, idx: number) => {
        if (idx < maxEpsToLog) {
          console.log(`    EP${ep.mal_id}: ${ep.title || 'Untitled'} - Aired: ${ep.aired || 'No date'} - Score: ${ep.score || 'N/A'}`);
        }
      });
      
      const weekEpisodes: any[] = [];
      
      // 🆕 STEP 1: Find existing episodes in database for this anime in this week
      const existingEpsForAnime = existingEpisodes?.filter(ep => ep.anime_id === anime.mal_id) || [];
      
      for (const existingEp of existingEpsForAnime) {
        // Find this episode in the API data to get updated score
        const apiEpisode = episodesData.data.find((ep: any) => ep.mal_id === existingEp.episode_number);
        if (apiEpisode) {
          console.log(`  🔄 UPDATING existing episode: EP${apiEpisode.mal_id} (Score: ${apiEpisode.score || 'N/A'})`);
          weekEpisodes.push(apiEpisode);
        }
      }
      
      // STEP 2: Find NEW episodes that aired in this week
      const newEpisodes = episodesData.data.filter((ep: any) => {
        if (!ep.aired) {
          if (anime.mal_id === 62405) {
            console.log(`  🔍 DEBUG 62405: EP${ep.mal_id} has no aired date`);
          }
          return false;
        }
        const airedDate = new Date(ep.aired);
        const isInWeek = airedDate >= startDate && airedDate <= endDate;
        
        if (anime.mal_id === 62405) {
          console.log(`  🔍 DEBUG 62405: EP${ep.mal_id} aired ${ep.aired} | airedDate: ${airedDate.toISOString()} | isInWeek: ${isInWeek}`);
          console.log(`     startDate: ${startDate.toISOString()} | endDate: ${endDate.toISOString()}`);
        }
        
        // Check if this episode is already in the weekEpisodes (from existing)
        const alreadyAdded = weekEpisodes.some(we => we.mal_id === ep.mal_id);
        
        if (isInWeek && !alreadyAdded) {
          console.log(`  ✅ NEW MATCH! EP${ep.mal_id} aired on ${ep.aired} (within week range)`);
          return true;
        }
        return false;
      });
      
      weekEpisodes.push(...newEpisodes);

      if (weekEpisodes.length === 0) {
        console.log(`  ⏭️ No episodes aired in week ${weekNumber} range for ${anime.title} and no existing episodes to update`);
        continue;
      }

      console.log(`  📋 Processing ${weekEpisodes.length} episode(s) for ${anime.title} in week ${weekNumber}`);

      // Process each episode found
      for (const weekEpisode of weekEpisodes) {
        const episodeKey = `${anime.mal_id}_${weekEpisode.mal_id}`;
        
        // Skip if we already processed this exact episode
        if (processedEpisodeKeys.has(episodeKey)) {
          console.log(`  ⏭️ Already processed ${anime.title} EP${weekEpisode.mal_id}, skipping duplicate`);
          continue;
        }

        processedEpisodeKeys.add(episodeKey);

        console.log(`  ✅ Adding episode: ${anime.title} EP${weekEpisode.mal_id} "${weekEpisode.title}" (Aired: ${weekEpisode.aired}, Score: ${weekEpisode.score || 'N/A'})`);

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
    }

    console.log(`\n📊 ============================================`);
    console.log(`📊 Week ${weekNumber} Processing Summary:`);
    console.log(`📊 Total airing animes checked: ${airingAnimes.length}`);
    console.log(`📊 Episodes found for this week: ${episodes.length}`);
    console.log(`📊 ============================================`);

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

      console.log(`  ${isUpdate ? '🔄 UPDATING' : '➕ CREATING'} ${episode.anime_title_english} (anime_id: ${episode.anime_id}, ep: ${episode.episode_number}, week: ${episode.week_number})`);

      const { data, error } = await supabase
        .from('weekly_episodes')
        .upsert(episode, {
          onConflict: 'anime_id,episode_number,week_number',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error(`  ❌ Upsert error for ${episode.anime_title_english}:`, JSON.stringify(error));
        continue;
      }
      
      console.log(`  ✅ ${isUpdate ? 'Updated' : 'Created'}: ${episode.anime_title_english}`);

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

    console.log(`\n✅ ============================================`);
    console.log(`✅ Week ${weekNumber} sync completed!`);
    console.log(`✅ Total episodes in list: ${episodes.length}`);
    console.log(`✅ NEW episodes created: ${itemsCreated}`);
    console.log(`✅ Existing episodes updated: ${itemsUpdated}`);
    console.log(`✅ Duration: ${duration}ms`);
    console.log(`✅ ============================================`);
    
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
    // Fetch ALL pages from the API
    let allAnimes: any[] = [];
    let currentPage = 1;
    let hasNextPage = true;
    
    console.log(`🌐 Fetching all pages for ${season} ${year}...`);
    
    while (hasNextPage) {
      const url = `${JIKAN_BASE_URL}/seasons/${year}/${season}?page=${currentPage}`;
      console.log(`📄 Fetching page ${currentPage}: ${url}`);
      
      const data = await fetchWithRetry(url);

      if (!data || !data.data) {
        throw new Error(`No season data received for page ${currentPage}`);
      }

      allAnimes = allAnimes.concat(data.data);
      hasNextPage = data.pagination?.has_next_page || false;
      currentPage++;
      
      console.log(`📄 Page ${currentPage - 1}: Added ${data.data.length} animes. Total so far: ${allAnimes.length}`);
      
      if (hasNextPage) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    console.log(`📺 Total animes fetched: ${allAnimes.length}`);

    const animes = allAnimes
      .filter((anime: any) => anime.members >= 20000)
      .sort((a: any, b: any) => {
        // Sort by members first (descending), then by score
        const membersA = a.members || 0;
        const membersB = b.members || 0;
        if (membersB !== membersA) return membersB - membersA;
        return (b.score || 0) - (a.score || 0);
      });

    console.log(`✅ After filtering (20k+ members): ${animes.length} animes for ${season} ${year}`);

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
        anime_score: anime.score, // ✅ FIXED: Changed from 'score' to 'anime_score'
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
        // Auto-detect current week if not specified
        let currentWeek = week_number;
        
        if (!currentWeek) {
          // Calculate current week based on today's date
          // Week 1 started on September 29, 2025 (Monday)
          const baseDate = new Date(Date.UTC(2025, 8, 29)); // September 29, 2025
          const today = new Date();
          const diffTime = today.getTime() - baseDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          currentWeek = Math.floor(diffDays / 7) + 1;
          
          // Clamp to valid week range (1-13)
          currentWeek = Math.max(1, Math.min(13, currentWeek));
          
          console.log(`📅 Auto-detected current week: ${currentWeek} (based on date: ${today.toISOString().split('T')[0]})`);
        }
        
        // 🆕 Sync current week and previous 2 weeks to keep scores updated
        const weeksToSync = [];
        for (let i = Math.max(1, currentWeek - 2); i <= currentWeek; i++) {
          weeksToSync.push(i);
        }
        
        console.log(`📅 Syncing weeks: ${weeksToSync.join(', ')}`);
        
        const results = [];
        for (const week of weeksToSync) {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📅 Starting sync for week ${week}...`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
          
          const weekResult = await syncWeeklyEpisodes(supabase, week);
          results.push({ week, ...weekResult });
          
          // Small delay between weeks to avoid rate limiting
          if (week !== weeksToSync[weeksToSync.length - 1]) {
            await delay(2000);
          }
        }
        
        result = {
          success: true,
          weeks_synced: weeksToSync,
          results: results
        };
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