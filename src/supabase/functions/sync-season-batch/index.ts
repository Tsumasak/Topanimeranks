// ============================================
// Supabase Edge Function: sync-season-batch
// Purpose: Sync a specific page range from Jikan API
// Usage: POST with { season, year, startPage, endPage }
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 400; // 400ms between requests = 2.5 req/sec

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
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Fetch error (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) throw error;
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
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    console.log('🚀 sync-season-batch invoked');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { season, year, startPage = 1, endPage = 5 } = await req.json();
    
    console.log(`📋 Syncing ${season} ${year}, pages ${startPage}-${endPage}`);

    if (!season || !year) {
      throw new Error('Missing season or year');
    }

    // Fetch pages
    let allAnimes: any[] = [];
    let currentPage = startPage;
    
    while (currentPage <= endPage) {
      const url = `${JIKAN_BASE_URL}/seasons/${year}/${season}?page=${currentPage}`;
      console.log(`📄 Fetching page ${currentPage}...`);
      
      const data = await fetchWithRetry(url);

      if (!data || !data.data) {
        console.log(`⚠️ No data for page ${currentPage}, stopping`);
        break;
      }

      allAnimes = allAnimes.concat(data.data);
      console.log(`✅ Page ${currentPage}: ${data.data.length} animes. Total: ${allAnimes.length}`);
      
      const hasNextPage = data.pagination?.has_next_page || false;
      if (!hasNextPage) {
        console.log(`🏁 No more pages after ${currentPage}`);
        break;
      }
      
      currentPage++;
      
      if (currentPage <= endPage) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    console.log(`📺 Total fetched: ${allAnimes.length} animes`);

    // Filter by 5k+ members
    const filtered = allAnimes.filter(anime => anime.members >= 5000);
    console.log(`✅ After filtering (5k+ members): ${filtered.length} animes`);

    // Get existing anime IDs
    const animeIds = filtered.map(a => a.mal_id);
    const { data: existingAnimes } = await supabase
      .from('season_rankings')
      .select('anime_id')
      .eq('season', season)
      .eq('year', year)
      .in('anime_id', animeIds);
    
    const existingIds = new Set(existingAnimes?.map(a => a.anime_id) || []);
    console.log(`📊 Found ${existingIds.size} existing, ${filtered.length - existingIds.size} new`);

    // Prepare batch data
    const seasonAnimes = filtered.map(anime => ({
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
    }));

    // Batch upsert
    const BATCH_SIZE = 100;
    for (let i = 0; i < seasonAnimes.length; i += BATCH_SIZE) {
      const batch = seasonAnimes.slice(i, i + BATCH_SIZE);
      console.log(`📦 Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(seasonAnimes.length / BATCH_SIZE)}...`);
      
      const { error } = await supabase
        .from('season_rankings')
        .upsert(batch, {
          onConflict: 'anime_id,season,year',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('❌ Batch upsert error:', error);
      }
    }

    const itemsCreated = filtered.filter(a => !existingIds.has(a.mal_id)).length;
    const itemsUpdated = filtered.filter(a => existingIds.has(a.mal_id)).length;

    console.log(`✅ Sync complete: ${itemsCreated} created, ${itemsUpdated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        total: filtered.length,
        inserted: itemsCreated,
        updated: itemsUpdated,
        pagesProcessed: currentPage - startPage,
        lastPageProcessed: currentPage - 1,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
