// ============================================
// ENRICH EPISODES - Buscar dados do Jikan API
// ============================================

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
}

interface JikanEpisode {
  mal_id: number;
  title: string;
  score?: number;
}

// Rate limit helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function enrichEpisodes(supabase: any) {
  console.log("🔄 Iniciando enriquecimento de episódios...");
  
  let enriched = 0;
  let errors = 0;
  
  try {
    // Buscar episódios que precisam de enriquecimento
    const { data: episodes, error: fetchError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .is('anime_title_english', null)
      .limit(100); // Processar 100 por vez
    
    if (fetchError) {
      console.error("❌ Erro ao buscar episódios:", fetchError);
      return { enriched: 0, errors: 1, message: fetchError.message };
    }
    
    if (!episodes || episodes.length === 0) {
      console.log("✅ Todos os episódios já estão enriquecidos!");
      return { enriched: 0, errors: 0, message: "Nada para enriquecer" };
    }
    
    console.log(`📊 Encontrados ${episodes.length} episódios para enriquecer`);
    
    // Agrupar por anime_id para evitar requisições duplicadas
    const animeIds = [...new Set(episodes.map((ep: any) => ep.anime_id))];
    const animeDataCache: Record<number, any> = {};
    
    // Buscar dados de cada anime
    for (const animeId of animeIds) {
      try {
        console.log(`🔍 Buscando dados do anime ${animeId}...`);
        
        // 1. Buscar dados do anime
        const animeResponse = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        
        if (!animeResponse.ok) {
          console.error(`❌ Erro ao buscar anime ${animeId}: ${animeResponse.status}`);
          errors++;
          await sleep(1000);
          continue;
        }
        
        const animeData = await animeResponse.json();
        const anime: JikanAnime = animeData.data;
        
        // Extrair título em inglês
        const englishTitle = anime.titles.find(t => t.type === "English")?.title || 
                           anime.titles.find(t => t.type === "Default")?.title || 
                           "Unknown";
        
        // 2. Buscar dados dos episódios
        await sleep(333); // Rate limit Jikan: 3 req/sec
        
        const episodesResponse = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
        
        if (!episodesResponse.ok) {
          console.error(`❌ Erro ao buscar episódios do anime ${animeId}: ${episodesResponse.status}`);
          errors++;
          continue;
        }
        
        const episodesData = await episodesResponse.json();
        const episodesList: JikanEpisode[] = episodesData.data || [];
        
        // Criar cache de episódios
        const episodesCache: Record<number, JikanEpisode> = {};
        episodesList.forEach((ep: JikanEpisode) => {
          episodesCache[ep.mal_id] = ep;
        });
        
        // Salvar no cache
        animeDataCache[animeId] = {
          anime_title_english: englishTitle,
          anime_image_url: anime.images.jpg.large_image_url,
          from_url: anime.url,
          type: anime.type,
          status: anime.status,
          demographic: anime.demographics.map(d => d.name),
          genre: anime.genres.map(g => g.name),
          theme: anime.themes.map(t => t.name),
          episodes: episodesCache
        };
        
        console.log(`✅ Dados do anime ${animeId} (${englishTitle}) salvos no cache`);
        
        await sleep(333); // Rate limit
        
      } catch (error) {
        console.error(`❌ Erro ao processar anime ${animeId}:`, error);
        errors++;
      }
    }
    
    // Atualizar episódios com os dados do cache
    for (const episode of episodes) {
      try {
        const animeData = animeDataCache[episode.anime_id];
        
        if (!animeData) {
          console.error(`❌ Sem dados para anime ${episode.anime_id}`);
          errors++;
          continue;
        }
        
        const episodeData = animeData.episodes[episode.episode_number];
        
        // Update no banco
        const { error: updateError } = await supabase
          .from('weekly_episodes')
          .update({
            anime_title_english: animeData.anime_title_english,
            anime_image_url: animeData.anime_image_url,
            from_url: animeData.from_url,
            episode_name: episodeData?.title || `Episode ${episode.episode_number}`,
            episode_score: episodeData?.score || null,
            type: animeData.type,
            status: animeData.status,
            demographic: animeData.demographic,
            genre: animeData.genre,
            theme: animeData.theme,
            updated_at: new Date().toISOString()
          })
          .eq('id', episode.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar episódio ${episode.id}:`, updateError);
          errors++;
        } else {
          enriched++;
          console.log(`✅ Episódio enriquecido: ${animeData.anime_title_english} EP${episode.episode_number}`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao enriquecer episódio:`, error);
        errors++;
      }
    }
    
    console.log(`🎉 Enriquecimento concluído: ${enriched} sucesso, ${errors} erros`);
    
    return {
      enriched,
      errors,
      message: `${enriched} episódios enriquecidos com sucesso`
    };
    
  } catch (error) {
    console.error("❌ Erro geral no enriquecimento:", error);
    return {
      enriched: 0,
      errors: 1,
      message: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}
