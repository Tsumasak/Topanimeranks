// ============================================
// SHARED LOGIC: Insert Weekly Episodes
// Used by both insert-weekly-episodes and server functions
// ============================================

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
export async function insertWeeklyEpisodes(supabase: any, weekNumber: number) {
  console.log(`\n📅 ============================================`);
  console.log(`📅 INSERTING NEW EPISODES FOR WEEK ${weekNumber}`);
  console.log(`📅 ============================================\n`);
  
  const startTime = Date.now();
  let itemsCreated = 0;

  try {
    // Fetch current season animes
    const seasonsToCheck = [{ season: 'winter', year: 2026 }];
    
    // Calculate week dates dynamically based on the season
    // Winter 2026 = January-March 2026, starts on January 6, 2026 (first Monday)
    // Fall 2025 = October-December 2025, starts on September 29, 2025 (first Monday)
    let baseDate: Date;
    if (seasonsToCheck[0].season === 'winter' && seasonsToCheck[0].year === 2026) {
      baseDate = new Date(Date.UTC(2026, 0, 6)); // January 6, 2026 (Monday)
    } else if (seasonsToCheck[0].season === 'fall' && seasonsToCheck[0].year === 2025) {
      baseDate = new Date(Date.UTC(2025, 8, 29)); // September 29, 2025 (Monday)
    } else {
      // Default fallback - use first day of season's first month
      const monthMap = { winter: 0, spring: 3, summer: 6, fall: 9 };
      const month = monthMap[seasonsToCheck[0].season as keyof typeof monthMap];
      baseDate = new Date(Date.UTC(seasonsToCheck[0].year, month, 1));
      // Find first Monday
      const dayOfWeek = baseDate.getUTCDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
      baseDate.setUTCDate(baseDate.getUTCDate() + daysUntilMonday);
    }
    
    const startDate = new Date(baseDate);
    startDate.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);
    
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

    // Fetch episodes for each anime
    console.log(`\n🔍 Fetching episodes for ${airingAnimes.length} animes...`);
    
    let processedAnimeCount = 0;
    
    for (const anime of airingAnimes) {
      processedAnimeCount++;
      
      try {
        console.log(`\n[${processedAnimeCount}/${airingAnimes.length}] 📺 ${anime.title} (ID: ${anime.mal_id})`);
        
        await delay(RATE_LIMIT_DELAY);
        
        const episodesUrl = `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes`;
        const episodesData = await fetchWithRetry(episodesUrl);
        
        if (!episodesData?.data || episodesData.data.length === 0) {
          console.log(`  ⚠️ No episodes found, skipping...`);
          continue;
        }
        
        // Filter episodes that aired in this week
        const weekEpisodes = episodesData.data.filter((ep: any) => {
          if (!ep.aired || !ep.score) return false;
          
          const airedDate = new Date(ep.aired);
          return airedDate >= startDate && airedDate <= endDate;
        });
        
        if (weekEpisodes.length === 0) {
          console.log(`  ℹ️ No episodes aired this week (${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]})`);
          continue;
        }
        
        console.log(`  ✅ Found ${weekEpisodes.length} episodes for Week ${weekNumber}`);
        
        // Check if episodes already exist
        for (const episode of weekEpisodes) {
          const { data: existingEpisode } = await supabase
            .from('weekly_episodes')
            .select('id')
            .eq('anime_id', anime.mal_id)
            .eq('episode_number', episode.mal_id)
            .single();
          
          if (existingEpisode) {
            console.log(`  ⏭️ SKIP: EP${episode.mal_id} "${episode.title}" (already exists)`);
            continue;
          }
          
          // Insert new episode
          const episodeData = {
            anime_id: anime.mal_id,
            anime_title: anime.title,
            anime_title_english: anime.title_english,
            anime_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
            episode_number: episode.mal_id,
            episode_title: episode.title,
            episode_score: episode.score,
            aired_at: episode.aired,
            week_number: weekNumber,
            season: seasonsToCheck[0].season,
            year: seasonsToCheck[0].year,
            position_in_week: null, // Will be calculated later
            
            // Additional anime metadata
            synopsis: anime.synopsis,
            genres: anime.genres || [],
            themes: anime.themes || [],
            demographics: anime.demographics || [],
            studios: anime.studios || [],
            producers: anime.producers || [],
            licensors: anime.licensors || [],
            
            score: anime.score,
            scored_by: anime.scored_by,
            rank: anime.rank,
            popularity: anime.popularity,
            members: anime.members,
            favorites: anime.favorites,
            
            type: anime.type,
            source: anime.source,
            episodes_total: anime.episodes,
            status: anime.status,
            duration: anime.duration,
            rating: anime.rating,
            
            trailer_url: anime.trailer?.url,
            trailer_embed_url: anime.trailer?.embed_url,
            
            is_manual: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('weekly_episodes')
            .insert(episodeData);
          
          if (insertError) {
            console.error(`  ❌ Failed to insert EP${episode.mal_id}: ${insertError.message}`);
          } else {
            console.log(`  ✅ NEW: EP${episode.mal_id} "${episode.title}" (Aired: ${episode.aired?.split('T')[0]}, Score: ${episode.score})`);
            itemsCreated++;
          }
        }
        
      } catch (error: any) {
        console.error(`  ❌ Error processing anime ${anime.mal_id}:`, error.message);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Week ${weekNumber} complete: ${itemsCreated} new episodes inserted in ${Math.round(duration / 1000)}s`);

    // Log to sync_logs table
    await supabase.from('sync_logs').insert({
      sync_type: 'insert_weekly_episodes',
      status: 'success',
      week_number: weekNumber,
      items_processed: airingAnimes.length,
      items_created: itemsCreated,
      duration_ms: duration,
    });

    return { success: true, totalItemsCreated: itemsCreated, weekNumber };

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
