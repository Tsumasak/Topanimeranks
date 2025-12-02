import { createClient } from "npm:@supabase/supabase-js@2";

interface JikanAnime {
  mal_id: number;
  titles: Array<{ type: string; title: string }>;
  images: { jpg: { large_image_url: string } };
  url: string;
  type: string;
  status: string;
  demographics: Array<{ name: string }>;
  genres: Array<{ name: string }>;
  themes: Array<{ name: string }>;
  members: number;
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
  forum_url: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calcular número da semana baseado na data de exibição
function calculateWeekNumber(airedDate: string, seasonStartDate: Date): number {
  const aired = new Date(airedDate);
  const diff = aired.getTime() - seasonStartDate.getTime();
  const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(weekNumber, 13)); // Entre 1 e 13
}

Deno.serve(async (_req) => {
  console.log("🚀 Iniciando sync Fall 2025...");
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Supabase credentials" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Data de início da temporada Fall 2025 (Outubro 2025)
    const seasonStartDate = new Date('2025-10-01');
    
    let totalAnimes = 0;
    let totalEpisodes = 0;
    let errors = 0;
    let page = 1;
    let hasNextPage = true;
    
    // Buscar animes Fall 2025 com paginação
    while (hasNextPage && page <= 5) { // Limitar a 5 páginas (125 animes)
      console.log(`📊 Buscando página ${page} de animes Fall 2025...`);
      
      const seasonUrl = `https://api.jikan.moe/v4/seasons/2025/fall?page=${page}&limit=25`;
      
      try {
        await sleep(1000); // Rate limit
        
        const seasonResponse = await fetch(seasonUrl);
        if (!seasonResponse.ok) {
          console.error(`❌ Error: ${seasonResponse.status} ${seasonResponse.statusText}`);
          errors++;
          break;
        }
        
        const contentType = seasonResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error(`❌ Response is not JSON for page ${page}`);
          errors++;
          break;
        }

        const seasonData = await seasonResponse.json();
        const animes: JikanAnime[] = seasonData.data || [];
        
        if (animes.length === 0) {
          console.log("✅ Sem mais animes para processar");
          hasNextPage = false;
          break;
        }
        
        console.log(`📺 ${animes.length} animes encontrados na página ${page}`);
        
        // Processar cada anime
        for (const anime of animes) {
          // Filtrar: apenas com 5000+ membros
          if (anime.members < 5000) {
            console.log(`⏭️ Pulando ${anime.mal_id} - apenas ${anime.members} membros`);
            continue;
          }
          
          console.log(`🔍 Processando: ${anime.mal_id} (${anime.members} membros)`);
          totalAnimes++;
          
          try {
            await sleep(333); // Rate limit
            
            // Buscar episódios do anime
            const episodesUrl = `https://api.jikan.moe/v4/anime/${anime.mal_id}/episodes`;
            const episodesResponse = await fetch(episodesUrl);
            
            if (!episodesResponse.ok) {
              console.error(`❌ Erro ao buscar episódios de ${anime.mal_id}: ${episodesResponse.status}`);
              errors++;
              continue;
            }
            
            const episodesContentType = episodesResponse.headers.get('content-type');
            if (!episodesContentType || !episodesContentType.includes('application/json')) {
              console.error(`❌ Episodes response is not JSON for anime ${anime.mal_id}`);
              errors++;
              continue;
            }

            const episodesData = await episodesResponse.json();
            const episodes: JikanEpisode[] = episodesData.data || [];
            
            if (episodes.length === 0) {
              console.log(`⚠️ Anime ${anime.mal_id} sem episódios ainda`);
              continue;
            }
            
            console.log(`📺 ${episodes.length} episódios encontrados`);
            
            // Extrair dados do anime
            const englishTitle = anime.titles.find(t => t.type === "English")?.title || 
                               anime.titles.find(t => t.type === "Default")?.title || 
                               anime.titles[0]?.title;
            
            const animeData = {
              anime_id: anime.mal_id,
              anime_title_english: englishTitle,
              anime_image_url: anime.images.jpg.large_image_url,
              from_url: anime.url,
              type: anime.type,
              status: anime.status,
              demographic: anime.demographics.map(d => d.name),
              genre: anime.genres.map(g => g.name),
              theme: anime.themes.map(t => t.name)
            };
            
            // Inserir cada episódio
            for (const episode of episodes) {
              const episodeNumber = episode.mal_id; // mal_id É o número do episódio
              
              // Calcular semana baseado na data de exibição
              let weekNumber = 1;
              if (episode.aired) {
                weekNumber = calculateWeekNumber(episode.aired, seasonStartDate);
              } else {
                // Se não tem data, usar o número do episódio como aproximação
                weekNumber = Math.min(Math.ceil(episodeNumber / 1), 13);
              }
              
              // Score vem DIRETO do endpoint /episodes
              const episodeRating = episode.score || null;
              
              const episodeData = {
                ...animeData,
                episode_number: episodeNumber,
                episode_name: episode.title || `Episode ${episodeNumber}`,
                episode_score: episodeRating,
                week_number: weekNumber,
                aired_at: episode.aired || null,
                from_url: episode.url || anime.url, // URL do episódio específico
                is_manual: false
              };
              
              // Inserir ou atualizar
              const { error: upsertError } = await supabase
                .from('weekly_episodes')
                .upsert(episodeData, {
                  onConflict: 'anime_id,episode_number,week_number',
                  ignoreDuplicates: false
                });
              
              if (upsertError) {
                console.error(`❌ Erro ao inserir episódio ${episodeNumber}:`, upsertError.message);
                errors++;
              } else {
                totalEpisodes++;
                if (episodeNumber <= 3 || episodeRating) {
                  const scoreText = episodeRating ? `★ ${episodeRating}` : 'no score yet';
                  console.log(`   └─ EP${episodeNumber}: "${episode.title}" (${scoreText}, Week ${weekNumber})`);
                }
              }
            }
            
            console.log(`✅ ${anime.mal_id} processado com sucesso`);
            
          } catch (error) {
            console.error(`❌ Erro ao processar anime ${anime.mal_id}:`, error);
            errors++;
          }
        }
        
        // Próxima página
        hasNextPage = seasonData.pagination?.has_next_page || false;
        page++;
        
      } catch (error) {
        console.error(`❌ Erro na página ${page}:`, error);
        errors++;
        break;
      }
    }
    
    // Calcular posições por semana (ordenar por score, NULLs por último)
    console.log("📊 Calculando posições por semana...");
    
    for (let week = 1; week <= 13; week++) {
      // Buscar todos os episódios da semana
      const { data: allEpisodes, error: fetchError } = await supabase
        .from('weekly_episodes')
        .select('anime_id, episode_number, episode_score')
        .eq('week_number', week);
      
      if (fetchError || !allEpisodes) {
        console.error(`❌ Erro ao buscar episódios da semana ${week}`);
        continue;
      }
      
      // Ordenar manualmente: score DESC (NULLs last)
      const sortedEpisodes = allEpisodes.sort((a, b) => {
        // NULL vai pro final
        if (a.episode_score === null && b.episode_score === null) return 0;
        if (a.episode_score === null) return 1;
        if (b.episode_score === null) return -1;
        // Scores válidos: maior primeiro
        return b.episode_score - a.episode_score;
      });
      
      // Atualizar posições
      for (let i = 0; i < sortedEpisodes.length; i++) {
        const ep = sortedEpisodes[i];
        await supabase
          .from('weekly_episodes')
          .update({ position_in_week: i + 1 })
          .eq('anime_id', ep.anime_id)
          .eq('episode_number', ep.episode_number)
          .eq('week_number', week);
      }
      
      console.log(`✅ Semana ${week}: ${sortedEpisodes.length} episódios ranqueados`);
    }
    
    const message = `✅ Sync concluído! ${totalAnimes} animes, ${totalEpisodes} episódios inseridos. ${errors} erros.`;
    console.log(message);
    
    return new Response(
      JSON.stringify({
        success: true,
        animes: totalAnimes,
        episodes: totalEpisodes,
        errors: errors,
        message: message
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("❌ Sync Fall 2025 error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});