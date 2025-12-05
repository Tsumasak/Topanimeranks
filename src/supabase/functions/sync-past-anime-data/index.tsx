// ============================================
// EDGE FUNCTION: SYNC PAST ANIME DATA
// ============================================
// Sincroniza animes de TEMPORADAS PASSADAS com TODOS os episódios
// Calcula week_number baseado na data de airing do episódio
// Salva episódios em weekly_episodes
// 
// Seasons:
// - Winter → 1 January
// - Spring → 1 April
// - Summer → 1 July
// - Fall → 1 October
// 
// Uso: POST /sync-past-anime-data com body:
// { "season": "winter", "year": 2025 }
// ============================================

import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

interface JikanAnime {
  mal_id: number;
  url: string;
  images: { 
    jpg: { 
      image_url: string;
      large_image_url: string;
    } 
  };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string;
  source: string;
  episodes: number | null;
  status: string;
  airing: boolean;
  aired: {
    from: string | null;
    to: string | null;
  };
  duration: string;
  rating: string;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number;
  members: number;
  favorites: number;
  synopsis: string;
  season: string | null;
  year: number | null;
  demographics: Array<{ mal_id: number; type: string; name: string; url: string }>;
  genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
  themes: Array<{ mal_id: number; type: string; name: string; url: string }>;
  studios: Array<{ mal_id: number; type: string; name: string; url: string }>;
}

interface JikanEpisode {
  mal_id: number;
  url: string;
  title: string;
  title_japanese: string | null;
  title_romanji: string | null;
  aired: string | null;
  score: number | null;
  filler: boolean;
  recap: boolean;
  forum_url: string | null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Calculate week_number based on episode airing date
function calculateWeekNumber(season: string, year: number, episodeAiredDate: string | null): number {
  if (!episodeAiredDate) {
    return 1; // Default to week 1 if no date
  }

  // Determine season start date
  const seasonStartDates: Record<string, string> = {
    winter: `${year}-01-01`,
    spring: `${year}-04-01`,
    summer: `${year}-07-01`,
    fall: `${year}-10-01`,
  };

  const seasonStartDate = seasonStartDates[season.toLowerCase()];
  if (!seasonStartDate) {
    console.warn(`⚠️ Unknown season: ${season}, defaulting to week 1`);
    return 1;
  }

  const startDate = new Date(seasonStartDate);
  const airedDate = new Date(episodeAiredDate);

  // Calculate difference in days
  const diffTime = airedDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate week number (1-indexed)
  const weekNumber = Math.floor(diffDays / 7) + 1;

  // Ensure week number is at least 1
  return Math.max(1, weekNumber);
}

// Helper: Calculate week_start_date and week_end_date based on week_number
function calculateWeekDates(season: string, year: number, weekNumber: number): { week_start_date: string; week_end_date: string } {
  const seasonStartDates: Record<string, string> = {
    winter: `${year}-01-01`,
    spring: `${year}-04-01`,
    summer: `${year}-07-01`,
    fall: `${year}-10-01`,
  };

  const seasonStartDate = seasonStartDates[season.toLowerCase()] || `${year}-01-01`;
  const startDate = new Date(seasonStartDate);

  // Week 1 starts on season start date
  // Week N starts on (N-1) * 7 days after season start
  const weekStartDate = new Date(startDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

  return {
    week_start_date: weekStartDate.toISOString().split('T')[0],
    week_end_date: weekEndDate.toISOString().split('T')[0],
  };
}

async function syncPastSeasons(supabase: any, season: string, year: number) {
  console.log(`🚀 Iniciando sync PAST SEASON: ${season} ${year}...`);
  
  try {
    let totalAnimes = 0;
    let totalEpisodes = 0;
    let insertedEpisodes = 0;
    let updatedEpisodes = 0;
    let skippedEpisodes = 0;
    let errors = 0;
    let page = 1;
    let hasNextPage = true;
    
    // Buscar animes da season com paginação
    while (hasNextPage && page <= 10) { // Limitar a 10 páginas (250 animes)
      console.log(`📊 Buscando página ${page} de ${season} ${year}...`);
      
      const seasonUrl = `https://api.jikan.moe/v4/seasons/${year}/${season}?page=${page}&limit=25`;
      
      await sleep(333); // Rate limit Jikan: 3 req/sec
      const seasonResponse = await fetch(seasonUrl);
      
      if (!seasonResponse.ok) {
        console.error(`❌ Erro ao buscar página ${page}: ${seasonResponse.status}`);
        
        if (seasonResponse.status === 429) {
          console.log("⏳ Rate limit atingido, aguardando 5 segundos...");
          await sleep(5000);
          continue; // Tentar novamente
        }
        
        break;
      }
      
      const contentType = seasonResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`❌ Resposta não é JSON para página ${page}`);
        errors++;
        break;
      }

      const seasonData = await seasonResponse.json();
      const animes: JikanAnime[] = seasonData.data || [];
      
      console.log(`✅ Encontrados ${animes.length} animes na página ${page}`);
      
      if (animes.length === 0) {
        hasNextPage = false;
        break;
      }
      
      // Filtrar apenas animes com 5000+ membros e tipo TV/ONA
      const popularAnimes = animes.filter(anime => 
        anime.members >= 5000 && 
        (anime.type === 'TV' || anime.type === 'ONA')
      );
      console.log(`📊 ${popularAnimes.length} animes TV/ONA com 5000+ membros`);
      
      totalAnimes += popularAnimes.length;
      
      // Processar cada anime e buscar seus episódios
      for (const anime of popularAnimes) {
        try {
          const titleEnglish = anime.title_english || anime.title;
          console.log(`🔍 Processando: ${titleEnglish} (${anime.mal_id})`);
          
          // Buscar episódios do anime
          await sleep(333); // Rate limit
          const episodesUrl = `https://api.jikan.moe/v4/anime/${anime.mal_id}/episodes`;
          const episodesResponse = await fetch(episodesUrl);
          
          if (!episodesResponse.ok) {
            console.error(`❌ Erro ao buscar episódios de ${titleEnglish}: ${episodesResponse.status}`);
            if (episodesResponse.status === 429) {
              console.log("⏳ Rate limit atingido, aguardando 5 segundos...");
              await sleep(5000);
            }
            errors++;
            continue;
          }
          
          const episodesData = await episodesResponse.json();
          const episodes: JikanEpisode[] = episodesData.data || [];
          
          console.log(`📺 Encontrados ${episodes.length} episódios de ${titleEnglish}`);
          totalEpisodes += episodes.length;
          
          // Processar cada episódio
          for (const episode of episodes) {
            try {
              // Calcular week_number baseado na data de airing
              const weekNumber = calculateWeekNumber(season, year, episode.aired);
              const { week_start_date, week_end_date } = calculateWeekDates(season, year, weekNumber);
              
              console.log(`   📅 Episódio ${episode.mal_id}: aired ${episode.aired || 'N/A'} → week ${weekNumber} (${week_start_date} - ${week_end_date})`);
              
              // Preparar dados do episódio
              const episodeData = {
                episode_mal_id: episode.mal_id,
                anime_id: anime.mal_id,
                anime_title: anime.title,
                anime_title_english: anime.title_english || anime.title,
                anime_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
                episode_number: episode.mal_id, // MAL episode ID
                episode_title: episode.title || `Episode ${episode.mal_id}`,
                episode_aired: episode.aired ? new Date(episode.aired).toISOString() : null,
                episode_score: episode.score,
                week_number: weekNumber,
                week_start_date: week_start_date,
                week_end_date: week_end_date,
                position_in_week: 0, // Will be calculated later if needed
                members: anime.members,
                score: anime.score,
                type: anime.type,
                genres: anime.genres || [],
                themes: anime.themes || [],
                demographics: anime.demographics || [],
                studios: anime.studios || [],
                synopsis: anime.synopsis || '',
                updated_at: new Date().toISOString(),
              };
              
              // Verificar se episódio já existe
              const { data: existingEpisode } = await supabase
                .from('weekly_episodes')
                .select('id')
                .eq('episode_mal_id', episode.mal_id)
                .eq('anime_id', anime.mal_id)
                .maybeSingle();
              
              let upsertError;
              
              if (existingEpisode) {
                // Atualizar episódio existente
                const { error } = await supabase
                  .from('weekly_episodes')
                  .update(episodeData)
                  .eq('episode_mal_id', episode.mal_id)
                  .eq('anime_id', anime.mal_id);
                upsertError = error;
                updatedEpisodes++;
              } else {
                // Inserir novo episódio
                const { error } = await supabase
                  .from('weekly_episodes')
                  .insert(episodeData);
                upsertError = error;
                insertedEpisodes++;
              }
              
              if (upsertError) {
                console.error(`❌ Erro ao upsert episódio ${episode.mal_id}:`, upsertError);
                errors++;
                continue;
              }
              
              console.log(`   ✅ Episódio ${episode.mal_id} salvo com sucesso`);
              
            } catch (error) {
              console.error(`❌ Erro ao processar episódio ${episode.mal_id}:`, error);
              errors++;
            }
          }
          
          console.log(`✅ Anime ${titleEnglish} completo - ${episodes.length} episódios processados`);
          
        } catch (error) {
          console.error(`❌ Erro ao processar anime ${anime.mal_id}:`, error);
          errors++;
        }
      }
      
      // Verificar se há próxima página
      hasNextPage = seasonData.pagination?.has_next_page || false;
      page++;
      
      // Delay entre páginas
      await sleep(1000);
    }
    
    console.log(`\n📊 RESUMO DO SYNC PAST SEASON ${season.toUpperCase()} ${year}:`);
    console.log(`   Animes processados: ${totalAnimes}`);
    console.log(`   Episódios encontrados: ${totalEpisodes}`);
    console.log(`   ✅ Episódios inseridos: ${insertedEpisodes}`);
    console.log(`   🔄 Episódios atualizados: ${updatedEpisodes}`);
    console.log(`   ⏭️  Episódios pulados: ${skippedEpisodes}`);
    console.log(`   ❌ Erros: ${errors}`);
    
    return {
      success: true,
      totalAnimes,
      totalEpisodes,
      insertedEpisodes,
      updatedEpisodes,
      skippedEpisodes,
      errors,
    };
    
  } catch (error) {
    console.error(`❌ Erro geral no sync past season ${season} ${year}:`, error);
    throw error;
  }
}

// ============================================
// MAIN ENDPOINT
// ============================================
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { season, year } = body;
    
    if (!season || !year) {
      return c.json({
        success: false,
        error: "Missing required parameters: season and year"
      }, 400);
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🚀 Iniciando sync de temporada passada: ${season} ${year}...`);
    
    const result = await syncPastSeasons(supabase, season, year);

    return c.json({
      success: result.success,
      totalAnimes: result.totalAnimes,
      totalEpisodes: result.totalEpisodes,
      insertedEpisodes: result.insertedEpisodes,
      updatedEpisodes: result.updatedEpisodes,
      skippedEpisodes: result.skippedEpisodes,
      errors: result.errors,
      message: `Sync completed: ${result.totalAnimes} animes, ${result.insertedEpisodes} episodes inserted`
    });

  } catch (error) {
    console.error("❌ Sync PAST SEASONS error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// GET endpoint for easy browser testing
app.get("/:season/:year", async (c) => {
  try {
    const season = c.req.param('season');
    const year = parseInt(c.req.param('year'));
    
    if (!season || !year || isNaN(year)) {
      return c.json({
        success: false,
        error: "Invalid season or year parameter"
      }, 400);
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🚀 Iniciando sync de temporada passada: ${season} ${year}...`);
    
    const result = await syncPastSeasons(supabase, season, year);

    return c.json({
      success: result.success,
      totalAnimes: result.totalAnimes,
      totalEpisodes: result.totalEpisodes,
      insertedEpisodes: result.insertedEpisodes,
      updatedEpisodes: result.updatedEpisodes,
      skippedEpisodes: result.skippedEpisodes,
      errors: result.errors,
      message: `Sync completed: ${result.totalAnimes} animes, ${result.insertedEpisodes} episodes inserted`
    });

  } catch (error) {
    console.error("❌ Sync PAST SEASONS error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

Deno.serve(app.fetch);
