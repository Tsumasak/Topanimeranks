// ============================================
// ENRICH EPISODES - Buscar dados do Jikan API e popular weekly_episodes
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { getEpisodeWeekNumber } from "./season-utils.tsx";

interface JikanAnime {
  mal_id: number;
  titles: Array<{ type: string; title: string }>;
  images: { jpg: { large_image_url: string } };
  url: string;
  type: string;
  status: string;
  aired: {
    from: string | null;
    to: string | null;
  };
  demographics: Array<{ name: string }>;
  genres: Array<{ name: string }>;
  themes: Array<{ name: string }>;
}

interface JikanEpisode {
  mal_id: number;
  title: string;
  score?: number;
  aired?: string;
}

// Rate limit helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function enrichEpisodes(supabase: any, season: string, year: number) {
  console.log(`🔄 Iniciando enriquecimento de episódios para ${season} ${year}...`);
  
  let enriched = 0;
  let inserted = 0;
  let errors = 0;
  
  try {
    // ✅ STEP 1: Buscar TODOS os animes da season_rankings para essa season
    console.log(`📊 Buscando animes de ${season} ${year} da tabela season_rankings...`);
    
    const { data: seasonAnimes, error: fetchError } = await supabase
      .from('season_rankings')
      .select('anime_id, title, title_english, image_url, status')
      .eq('season', season)
      .eq('year', year)
      .order('popularity', { ascending: true }); // Mais populares primeiro
    
    if (fetchError) {
      console.error("❌ Erro ao buscar animes da season_rankings:", fetchError);
      return { enriched: 0, inserted: 0, errors: 1, message: fetchError.message };
    }
    
    if (!seasonAnimes || seasonAnimes.length === 0) {
      console.log("⚠️  Nenhum anime encontrado na season_rankings para essa season!");
      return { enriched: 0, inserted: 0, errors: 0, message: "Nenhum anime encontrado" };
    }
    
    console.log(`✅ Encontrados ${seasonAnimes.length} animes em ${season} ${year}`);
    
    // ✅ STEP 2: Para cada anime, buscar seus episódios e popular weekly_episodes
    for (const seasonAnime of seasonAnimes) {
      try {
        console.log(`\n🔍 Processando anime ${seasonAnime.anime_id}: ${seasonAnime.title_english}...`);
        
        // Buscar dados completos do anime do Jikan
        await sleep(333); // Rate limit: 3 req/sec
        const animeResponse = await fetch(`https://api.jikan.moe/v4/anime/${seasonAnime.anime_id}`);
        
        if (!animeResponse.ok) {
          console.error(`❌ Erro ao buscar anime ${seasonAnime.anime_id}: ${animeResponse.status}`);
          errors++;
          continue;
        }
        
        const contentType = animeResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error(`❌ Resposta não é JSON para anime ${seasonAnime.anime_id}`);
          errors++;
          continue;
        }

        const animeData = await animeResponse.json();
        const anime: JikanAnime = animeData.data;
        
        // Extrair título em inglês
        const englishTitle = anime.titles.find(t => t.type === "English")?.title || 
                           anime.titles.find(t => t.type === "Default")?.title || 
                           "Unknown";
        
        // Buscar dados dos episódios
        await sleep(333); // Rate limit Jikan: 3 req/sec
        
        const episodesResponse = await fetch(`https://api.jikan.moe/v4/anime/${seasonAnime.anime_id}/episodes`);
        
        if (!episodesResponse.ok) {
          console.error(`❌ Erro ao buscar episódios de ${seasonAnime.anime_id}: ${episodesResponse.status}`);
          errors++;
          continue;
        }

        const episodesContentType = episodesResponse.headers.get('content-type');
        if (!episodesContentType || !episodesContentType.includes('application/json')) {
          console.error(`❌ Resposta de episódios não é JSON para anime ${seasonAnime.anime_id}`);
          errors++;
          continue;
        }

        const episodesData = await episodesResponse.json();
        const episodesList: JikanEpisode[] = episodesData.data || [];
        
        console.log(`✅ Encontrados ${episodesList.length} episódios para ${englishTitle}`);
        
        // ✅ STEP 3: Para cada episódio, criar/atualizar na weekly_episodes
        for (const episode of episodesList) {
          try {
            // Pular episódios sem data de exibição
            if (!episode.aired) {
              console.log(`⏭️  Pulando episódio ${episode.mal_id} (${episode.title}) - sem data de aired`);
              continue;
            }
            
            // Calcular week_number baseado na data de exibição
            const { season: epSeason, year: epYear, weekNumber } = getEpisodeWeekNumber(episode.aired);
            
            // Verificar se o episódio pertence à season correta
            if (epSeason !== season || epYear !== year) {
              console.log(`⏭️  Pulando episódio ${episode.mal_id} - pertence a ${epSeason} ${epYear}, não ${season} ${year}`);
              continue;
            }
            
            // Verificar se já existe
            const { data: existingEpisode } = await supabase
              .from('weekly_episodes')
              .select('id')
              .eq('anime_id', seasonAnime.anime_id)
              .eq('episode_number', episode.mal_id)
              .maybeSingle();
            
            const episodeData = {
              episode_id: `${seasonAnime.anime_id}_${episode.mal_id}`,
              anime_id: seasonAnime.anime_id,
              episode_number: episode.mal_id,
              anime_title_english: englishTitle,
              anime_image_url: anime.images.jpg.large_image_url,
              from_url: anime.url,
              episode_name: episode.title || `Episode ${episode.mal_id}`,
              episode_score: episode.score || null,
              type: anime.type,
              status: anime.status,
              aired_at: episode.aired,
              demographic: anime.demographics.map(d => d.name),
              genre: anime.genres.map(g => g.name),
              theme: anime.themes.map(t => t.name),
              week_number: weekNumber,
              season: epSeason,
              year: epYear,
              updated_at: new Date().toISOString(),
            };
            
            if (existingEpisode) {
              // Atualizar episódio existente
              const { error: updateError } = await supabase
                .from('weekly_episodes')
                .update(episodeData)
                .eq('id', existingEpisode.id);
              
              if (updateError) {
                console.error(`❌ Erro ao atualizar episódio ${existingEpisode.id}:`, updateError);
                errors++;
              } else {
                enriched++;
                console.log(`✅ Episódio atualizado: ${englishTitle} EP${episode.mal_id} - Week ${weekNumber}`);
              }
            } else {
              // Inserir novo episódio
              const { error: insertError } = await supabase
                .from('weekly_episodes')
                .insert({
                  ...episodeData,
                  created_at: new Date().toISOString(),
                });
              
              if (insertError) {
                console.error(`❌ Erro ao inserir episódio:`, insertError);
                errors++;
              } else {
                inserted++;
                console.log(`✅ Novo episódio inserido: ${englishTitle} EP${episode.mal_id} - Week ${weekNumber}`);
              }
            }
            
          } catch (error) {
            console.error(`❌ Erro ao processar episódio ${episode.mal_id}:`, error);
            errors++;
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar anime ${seasonAnime.anime_id}:`, error);
        errors++;
      }
    }
    
    console.log(`\n🎉 Enriquecimento concluído:`);
    console.log(`   ✅ Episódios atualizados: ${enriched}`);
    console.log(`   ➕ Episódios inseridos: ${inserted}`);
    console.log(`   ❌ Erros: ${errors}`);
    
    // IMPORTANTE: Recalcular posições após enriquecimento
    console.log(`\n🔢 Recalculando posições de ranking...`);
    await recalculatePositions(supabase, season, year);
    
    return {
      enriched,
      inserted,
      errors,
      message: `${enriched} episódios atualizados e ${inserted} inseridos com sucesso`
    };
    
  } catch (error) {
    console.error("❌ Erro geral no enriquecimento:", error);
    return {
      enriched: 0,
      inserted: 0,
      errors: 1,
      message: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

// ============================================
// RECALCULATE POSITIONS - Calcular position_in_week
// ============================================
// Esta função recalcula as posições de TODAS as weeks da season especificada
// baseado no episode_score (maior score = posição 1)
export async function recalculatePositions(supabase: any, season: string, year: number) {
  console.log(`🔢 Iniciando recálculo de posições para ${season} ${year}...`);
  
  try {
    // 1. Buscar TODAS as weeks da season especificada
    const { data: allEpisodes, error: fetchError } = await supabase
      .from('weekly_episodes')
      .select('id, week_number, episode_score, season, year')
      .eq('season', season)
      .eq('year', year)
      .not('episode_score', 'is', null)
      .order('week_number', { ascending: true })
      .order('episode_score', { ascending: false });
    
    if (fetchError) {
      console.error("❌ Erro ao buscar episódios:", fetchError);
      return;
    }
    
    if (!allEpisodes || allEpisodes.length === 0) {
      console.log("⚠️ Nenhum episódio com score encontrado");
      return;
    }
    
    // 2. Agrupar por week_number
    const weekMap = new Map<number, any[]>();
    allEpisodes.forEach((ep: any) => {
      if (!weekMap.has(ep.week_number)) {
        weekMap.set(ep.week_number, []);
      }
      weekMap.get(ep.week_number)!.push(ep);
    });
    
    console.log(`📊 Encontradas ${weekMap.size} weeks com episódios`);
    
    // 3. Para cada week, recalcular posições
    let updatedCount = 0;
    for (const [weekNumber, episodes] of weekMap.entries()) {
      // Ordenar por episode_score DESC (maior score = posição 1)
      const sortedEpisodes = episodes.sort((a, b) => {
        const scoreA = parseFloat(a.episode_score) || 0;
        const scoreB = parseFloat(b.episode_score) || 0;
        return scoreB - scoreA; // DESC
      });
      
      // Atualizar posições
      for (let i = 0; i < sortedEpisodes.length; i++) {
        const episode = sortedEpisodes[i];
        const newPosition = i + 1; // Posição começa em 1
        
        const { error: updateError } = await supabase
          .from('weekly_episodes')
          .update({ position_in_week: newPosition })
          .eq('id', episode.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar posição do episódio ${episode.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
      
      console.log(`✅ Week ${weekNumber}: ${sortedEpisodes.length} posições recalculadas`);
    }
    
    console.log(`🎉 Recálculo concluído: ${updatedCount} episódios atualizados em ${weekMap.size} weeks`);
    
  } catch (error) {
    console.error("❌ Erro ao recalcular posições:", error);
  }
}
