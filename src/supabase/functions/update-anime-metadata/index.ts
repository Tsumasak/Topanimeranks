// ============================================
// Supabase Edge Function: update-anime-metadata
// Purpose: Periodically updates general anime data (members, score, rating, etc.)
// Runs: Every 1-2 hours via pg_cron
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests (Jikan limit is 3/sec)
const BATCH_SIZE = 60; // Max animes to update per execution (60s execution time)
const MAX_EXECUTION_TIME = 140000; // 140s to be safe

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      if (i === retries - 1) return null; // Return null instead of throwing to continue loop
      await delay(2000);
    }
  }
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    console.log('\n🚀 Update Anime Metadata function invoked');
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get 60 most outdated animes from season_rankings
    console.log(`🔍 Fetching ${BATCH_SIZE} oldest updated animes from season_rankings...`);
    
    // We order by updated_at ascending (oldest first)
    // We only update if they haven't been updated in at least 1 day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: animesToUpdate, error: fetchError } = await supabase
      .from('season_rankings')
      .select('id, anime_id, title, updated_at, season, year')
      .lt('updated_at', oneDayAgo) // only out of date entries
      .order('updated_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Error fetching oldest animes: ${fetchError.message}`);
    }

    if (!animesToUpdate || animesToUpdate.length === 0) {
      console.log('✅ No stale animes found. All animes are up to date!');
      return new Response(
        JSON.stringify({ success: true, message: 'All animes are up to date', itemsUpdated: 0 }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log(`📊 Found ${animesToUpdate.length} stale animes. Oldest updated_at: ${animesToUpdate[0].updated_at}`);

    let itemsUpdated = 0;
    const errorIds: number[] = [];
    let timeoutReached = false;

    for (let i = 0; i < animesToUpdate.length; i++) {
      const dbAnime = animesToUpdate[i];
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`\n⏱️ TIMEOUT PROTECTION: Stopping at ${i}/${animesToUpdate.length} animes`);
        timeoutReached = true;
        break;
      }

      console.log(`\n[${i + 1}/${animesToUpdate.length}] Updating: ${dbAnime.title} (ID: ${dbAnime.anime_id})`);
      
      const animeUrl = `${JIKAN_BASE_URL}/anime/${dbAnime.anime_id}`;
      const animeData = await fetchWithRetry(animeUrl);

      if (!animeData || !animeData.data) {
        console.error(`⚠️ Could not fetch data for anime ${dbAnime.anime_id}`);
        errorIds.push(dbAnime.anime_id);
        
        // Touch the updated_at so we don't get stuck on it if it's a dead MAL id
        await supabase
          .from('season_rankings')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', dbAnime.id);
          
        await delay(RATE_LIMIT_DELAY);
        continue;
      }

      const apiData = animeData.data;

      // Format image URL
      const imageUrl = apiData.images?.jpg?.large_image_url || apiData.images?.jpg?.image_url || dbAnime.image_url;

      // Extract season and year properly, falling back to what's in DB if null in API
      // Special Fix: ONAs and Movies usually have season/year as null. We calculate it from aired.from if it exists.
      let finalSeason = apiData.season ? apiData.season.toLowerCase() : null;
      let finalYear = apiData.year || null;

      if ((!finalSeason || !finalYear) && apiData.aired?.from) {
        const airedDate = new Date(apiData.aired.from);
        const month = airedDate.getMonth(); // 0-11
        if (month >= 0 && month <= 2) finalSeason = 'winter';
        else if (month >= 3 && month <= 5) finalSeason = 'spring';
        else if (month >= 6 && month <= 8) finalSeason = 'summer';
        else finalSeason = 'fall';
        
        finalYear = airedDate.getFullYear();
      }

      // Fallback definitively to what we had in DB if still absolutely nothing
      const seasonValue = finalSeason || dbAnime.season;
      const yearValue = finalYear || dbAnime.year;

      // Map to proper keys
      const updatePayload = {
        anime_score: apiData.score,
        scored_by: apiData.scored_by,
        members: apiData.members,
        favorites: apiData.favorites,
        popularity: apiData.popularity,
        rank: apiData.rank,
        status: apiData.status,
        episodes: apiData.episodes,
        rating: apiData.rating,
        image_url: imageUrl,
        season: seasonValue,
        year: yearValue,
        title_english: apiData.title_english || dbAnime.title_english,
        aired_from: apiData.aired?.from,
        aired_to: apiData.aired?.to,
        duration: apiData.duration,
        synopsis: apiData.synopsis || dbAnime.synopsis,
        // Also touch updated_at
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('season_rankings')
        .update(updatePayload)
        .eq('id', dbAnime.id);

      if (updateError) {
        console.error(`❌ Failed to update ${dbAnime.anime_id} in DB:`, updateError);
        errorIds.push(dbAnime.anime_id);
      } else {
        console.log(`✅ Updated ${dbAnime.title} (Score: ${apiData.score}, Members: ${apiData.members})`);
        itemsUpdated++;
      }

      await delay(RATE_LIMIT_DELAY);
    }
    
    // Check if same anime exists in anticipated_animes to keep things consistent
    if (itemsUpdated > 0) {
      console.log("\n🔄 Updating anticipated_animes out-of-sync records if any...");
      try {
        const ids = animesToUpdate.map(a => a.anime_id);
        
        for (let i = 0; i < animesToUpdate.length; i++) {
          const dbAnime = animesToUpdate[i];
          if (errorIds.includes(dbAnime.anime_id)) continue;
          
          await supabase
            .rpc('update_anticipated_from_season_rankings', { 
               p_anime_id: dbAnime.anime_id
            }).catch(() => null);
        }
      } catch (e) {
        console.error("Non-critical error syncing anticipated_animes:", e);
      }
    }

    const duration = Date.now() - startTime;
    
    await supabase.from('sync_logs').insert({
      sync_type: 'update_anime_metadata',
      status: 'success',
      items_synced: animesToUpdate.length,
      items_updated: itemsUpdated,
      duration_ms: duration,
      error_details: { 
        timeoutReached, 
        errorCount: errorIds.length,
        errorIds: errorIds 
      }
    });

    console.log(`\n✅ UPDATE METADATA COMPLETED in ${duration}ms!`);
    console.log(`✅ Processed: ${animesToUpdate.length}, Updated: ${itemsUpdated}, Errors: ${errorIds.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: animesToUpdate.length, 
        updated: itemsUpdated, 
        errors: errorIds.length,
        timeoutReached
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
