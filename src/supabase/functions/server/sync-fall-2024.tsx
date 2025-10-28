// ============================================
// SYNC FALL 2025 - AUTOMÁTICO
// ============================================
// Busca animes Fall 2025 e seus episódios do Jikan API
// Organiza por semanas e popula a tabela
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
  members: number;
}

interface JikanEpisode {
  mal_id: number;
  title: string;
  filler: boolean;
  recap: boolean;
  forum_url: string;
  aired?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calcular número da semana baseado na data de exibição
function calculateWeekNumber(airedDate: string, seasonStartDate: Date): number {
  const aired = new Date(airedDate);
  const diff = aired.getTime() - seasonStartDate.getTime();
  const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(weekNumber, 13)); // Entre 1 e 13
}

export async function syncFall2025(supabase: any) {
  console.log("🚀 Iniciando sync Fall 2025...");
  
  try {
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
      const seasonResponse = await fetch(seasonUrl);
      
      if (!seasonResponse.ok) {
        console.error(`❌ Erro ao buscar página ${page}: ${seasonResponse.status}`);
        break;
      }
      
      const seasonData = await seasonResponse.json();
      const animes: JikanAnime[] = seasonData.data || [];
      
      console.log(`✅ Encontrados ${animes.length} animes na página ${page}`);
      
      if (animes.length === 0) {
        hasNextPage = false;
        break;
      }
      
      // Filtrar apenas animes com 5000+ membros
      const popularAnimes = animes.filter(anime => anime.members >= 5000);
      console.log(`📊 ${popularAnimes.length} animes com 5000+ membros`);
      
      totalAnimes += popularAnimes.length;
      
      // Processar cada anime
      for (const anime of popularAnimes) {
        try {
          console.log(`🔍 Processando: ${anime.titles.find(t => t.type === 'English')?.title || anime.titles[0].title}`);
          
          // Buscar episódios do anime
          await sleep(333); // Rate limit Jikan: 3 req/sec
          
          const episodesUrl = `https://api.jikan.moe/v4/anime/${anime.mal_id}/episodes`;
          const episodesResponse = await fetch(episodesUrl);
          
          if (!episodesResponse.ok) {
            console.error(`❌ Erro ao buscar episódios de ${anime.mal_id}: ${episodesResponse.status}`);
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
            // Calcular semana baseado na data de exibição
            let weekNumber = 1;
            if (episode.aired) {
              weekNumber = calculateWeekNumber(episode.aired, seasonStartDate);
            } else {
              // Se não tem data, usar o número do episódio como aproximação
              weekNumber = Math.ceil(episode.mal_id / 1);
            }
            
            // Buscar rating individual do episódio (1.00-5.00)
            let episodeRating = null;
            try {
              await sleep(333); // Rate limit
              const episodeDetailUrl = `https://api.jikan.moe/v4/anime/${anime.mal_id}/episodes/${episode.mal_id}`;
              const episodeDetailResponse = await fetch(episodeDetailUrl);
              
              if (episodeDetailResponse.ok) {
                const episodeDetail = await episodeDetailResponse.json();
                // O rating do episódio vem como um número de 1-5
                episodeRating = episodeDetail.data?.score || null;
              }
            } catch (error) {
              console.log(`⚠️ Não foi possível buscar rating do episódio ${episode.mal_id}`);
            }
            
            const episodeData = {
              ...animeData,
              episode_number: episode.mal_id,
              episode_name: episode.title || `Episode ${episode.mal_id}`,
              episode_score: episodeRating,
              week_number: weekNumber,
              aired_at: episode.aired || null,
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
              console.error(`❌ Erro ao inserir episódio ${episode.mal_id}:`, upsertError.message);
              errors++;
            } else {
              totalEpisodes++;
            }
          }
          
          console.log(`✅ ${anime.mal_id} processado com sucesso`);
          
        } catch (error) {
          console.error(`❌ Erro ao processar anime ${anime.mal_id}:`, error);
          errors++;
        }
        
        await sleep(333); // Rate limit
      }
      
      // Verificar se há próxima página
      hasNextPage = seasonData.pagination?.has_next_page || false;
      page++;
      
      await sleep(1000); // Pausa entre páginas
    }
    
    // Calcular posições dentro de cada semana baseado em score
    console.log("📊 Calculando posições por semana...");
    
    for (let week = 1; week <= 13; week++) {
      const { data: weekEpisodes, error: fetchError } = await supabase
        .from('weekly_episodes')
        .select('*')
        .eq('week_number', week)
        .order('episode_score', { ascending: false, nullsFirst: false });
      
      if (!fetchError && weekEpisodes && weekEpisodes.length > 0) {
        for (let i = 0; i < weekEpisodes.length; i++) {
          await supabase
            .from('weekly_episodes')
            .update({ position_in_week: i + 1 })
            .eq('id', weekEpisodes[i].id);
        }
        console.log(`✅ Week ${week}: ${weekEpisodes.length} episódios ranqueados`);
      }
    }
    
    console.log("🎉 Sync concluído!");
    console.log(`📊 Estatísticas:`);
    console.log(`   - Animes processados: ${totalAnimes}`);
    console.log(`   - Episódios inseridos: ${totalEpisodes}`);
    console.log(`   - Erros: ${errors}`);
    
    // Log no banco
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'weekly_episodes',
        status: 'success',
        items_synced: totalEpisodes,
        items_created: totalEpisodes,
        error_message: errors > 0 ? `${errors} erros durante o sync` : null
      });
    
    return {
      success: true,
      animes: totalAnimes,
      episodes: totalEpisodes,
      errors,
      message: `Sync concluído: ${totalEpisodes} episódios de ${totalAnimes} animes`
    };
    
  } catch (error) {
    console.error("❌ Erro geral no sync:", error);
    
    // Log de erro no banco
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'weekly_episodes',
        status: 'error',
        error_message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    
    return {
      success: false,
      animes: 0,
      episodes: 0,
      errors: 1,
      message: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}
