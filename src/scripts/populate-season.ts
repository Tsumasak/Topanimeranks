/**
 * POPULATE SEASON - Script Local
 * 
 * Como usar:
 * 1. Instale o Deno: https://deno.land/
 * 2. Execute: deno run --allow-net --allow-env scripts/populate-season.ts
 * 3. O script vai pedir a season e year
 * 
 * Ou passe diretamente:
 * deno run --allow-net --allow-env scripts/populate-season.ts spring 2025
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

// ============================================
// CONFIGURAÇÃO
// ============================================
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'SUA_URL_AQUI';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'SUA_KEY_AQUI';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL === 'SUA_URL_AQUI') {
  console.error('❌ Configure as variáveis de ambiente:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// JIKAN API HELPERS
// ============================================
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJikan(endpoint: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${JIKAN_BASE_URL}${endpoint}`);
      
      if (response.status === 429) {
        console.log('⏳ Rate limited, waiting 5 seconds...');
        await delay(5000);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      await delay(RATE_LIMIT_DELAY); // Respect rate limit
      return data;
    } catch (error) {
      console.error(`❌ Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await delay(2000);
    }
  }
}

// ============================================
// SYNC SEASON FUNCTION
// ============================================
async function syncSeason(season: string, year: number) {
  console.log(`\n🔍 Fetching ${season} ${year} animes from Jikan API...`);
  
  const seasonData = await fetchJikan(`/seasons/${year}/${season}`);
  const animes = seasonData.data || [];
  
  console.log(`📦 Found ${animes.length} animes`);
  
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const anime of animes) {
    // Filter: only 5000+ members
    if (!anime.members || anime.members < 5000) {
      skipped++;
      continue;
    }
    
    const animeData = {
      anime_id: anime.mal_id,
      title: anime.title,
      title_english: anime.title_english,
      title_japanese: anime.title_japanese,
      image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      type: anime.type,
      episodes: anime.episodes,
      status: anime.status,
      season: season,
      year: year,
      anime_score: anime.score,
      scored_by: anime.scored_by,
      members: anime.members,
      favorites: anime.favorites,
      synopsis: anime.synopsis,
      genres: anime.genres || [],
      themes: anime.themes || [],
      demographics: anime.demographics || [],
      studios: anime.studios || [],
      producers: anime.producers || [],
      aired_from: anime.aired?.from,
      aired_to: anime.aired?.to,
      broadcast_day: anime.broadcast?.day,
      broadcast_time: anime.broadcast?.time,
      source: anime.source,
      rating: anime.rating,
      rank: anime.rank,
      popularity: anime.popularity,
      last_synced: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('season_rankings')
      .upsert(animeData, { onConflict: 'anime_id,season,year' });
    
    if (error) {
      console.error(`❌ Error inserting ${anime.title}:`, error);
    } else {
      inserted++;
      console.log(`✅ ${inserted}/${animes.length - skipped}: ${anime.title}`);
    }
  }
  
  console.log(`\n✅ Sync completed!`);
  console.log(`   Inserted/Updated: ${inserted}`);
  console.log(`   Skipped (< 5000 members): ${skipped}`);
  
  return { inserted, skipped };
}

// ============================================
// ENRICH EPISODES FUNCTION
// ============================================
async function enrichEpisodes(season: string, year: number) {
  console.log(`\n🎯 Enriching episodes with scores...`);
  
  // Get all animes from season_rankings for this season
  const { data: seasonAnimes, error: seasonError } = await supabase
    .from('season_rankings')
    .select('anime_id, anime_score, title')
    .eq('season', season)
    .eq('year', year);
  
  if (seasonError || !seasonAnimes) {
    console.error('❌ Error fetching season animes:', seasonError);
    return;
  }
  
  console.log(`📊 Found ${seasonAnimes.length} animes in season_rankings`);
  
  // Create a map of anime_id -> score
  const scoreMap = new Map<number, number>();
  seasonAnimes.forEach(anime => {
    if (anime.anime_score) {
      scoreMap.set(anime.anime_id, anime.anime_score);
    }
  });
  
  console.log(`📈 ${scoreMap.size} animes have scores`);
  
  // Get all episodes for this season
  const { data: episodes, error: episodesError } = await supabase
    .from('weekly_episodes')
    .select('id, anime_id, anime_title, episode_score, season, year')
    .eq('season', season)
    .eq('year', year);
  
  if (episodesError || !episodes) {
    console.error('❌ Error fetching episodes:', episodesError);
    return;
  }
  
  console.log(`📺 Found ${episodes.length} episodes to enrich`);
  
  let enriched = 0;
  let notFound = 0;
  
  for (const episode of episodes) {
    const score = scoreMap.get(episode.anime_id);
    
    if (score && score !== episode.episode_score) {
      const { error } = await supabase
        .from('weekly_episodes')
        .update({ episode_score: score, score: score })
        .eq('id', episode.id);
      
      if (error) {
        console.error(`❌ Error updating episode ${episode.id}:`, error);
      } else {
        enriched++;
        console.log(`✅ ${enriched}: ${episode.anime_title} → Score: ${score}`);
      }
    } else if (!score) {
      notFound++;
    }
  }
  
  console.log(`\n✅ Enrichment completed!`);
  console.log(`   Enriched: ${enriched}`);
  console.log(`   Not found: ${notFound}`);
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('🚀 POPULATE SEASON - Local Script\n');
  
  // Get season and year from arguments or prompt
  let season = Deno.args[0];
  let year = Deno.args[1] ? parseInt(Deno.args[1]) : null;
  
  if (!season) {
    console.log('Usage: deno run --allow-net --allow-env scripts/populate-season.ts <season> <year>');
    console.log('Example: deno run --allow-net --allow-env scripts/populate-season.ts spring 2025');
    console.log('\nAvailable seasons: winter, spring, summer, fall');
    Deno.exit(1);
  }
  
  if (!year) {
    console.error('❌ Year is required');
    Deno.exit(1);
  }
  
  season = season.toLowerCase();
  
  if (!['winter', 'spring', 'summer', 'fall'].includes(season)) {
    console.error('❌ Invalid season. Use: winter, spring, summer, or fall');
    Deno.exit(1);
  }
  
  console.log(`📅 Season: ${season} ${year}\n`);
  
  try {
    // Step 1: Sync season data
    await syncSeason(season, year);
    
    // Step 2: Enrich episodes
    await enrichEpisodes(season, year);
    
    console.log('\n🎉 All done!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    Deno.exit(1);
  }
}

main();
