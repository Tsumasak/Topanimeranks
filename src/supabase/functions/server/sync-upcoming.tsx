// ============================================
// SYNC UPCOMING - MANUAL/ON-DEMAND
// ============================================
// Busca animes UPCOMING (sem season específica) do Jikan API
// Inclui animes com "2026 to ?", "2027 to ?", "Not available"
// Popula a tabela season_rankings para aparecer na aba "Later"
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function syncUpcoming(supabase: any) {
  console.log("🚀 Iniciando sync UPCOMING animes...");
  
  try {
    let totalAnimes = 0;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let page = 1;
    let hasNextPage = true;
    
    // Buscar animes UPCOMING com paginação
    while (hasNextPage && page <= 10) { // Limitar a 10 páginas (250 animes)
      console.log(`📊 Buscando página ${page} de animes UPCOMING...`);
      
      const upcomingUrl = `https://api.jikan.moe/v4/seasons/upcoming?page=${page}&limit=25`;
      
      await sleep(333); // Rate limit Jikan: 3 req/sec
      const upcomingResponse = await fetch(upcomingUrl);
      
      if (!upcomingResponse.ok) {
        console.error(`❌ Erro ao buscar página ${page}: ${upcomingResponse.status}`);
        
        if (upcomingResponse.status === 429) {
          console.log("⏳ Rate limit atingido, aguardando 5 segundos...");
          await sleep(5000);
          continue; // Tentar novamente
        }
        
        break;
      }
      
      const upcomingData = await upcomingResponse.json();
      const animes: JikanAnime[] = upcomingData.data || [];
      
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
          const titleEnglish = anime.title_english || anime.title;
          console.log(`🔍 Processando: ${titleEnglish}`);
          
          // Preparar dados para inserção
          const animeData = {
            anime_id: anime.mal_id,
            title: anime.title,
            title_english: anime.title_english || anime.title,
            image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
            score: anime.score,
            scored_by: anime.scored_by,
            members: anime.members,
            favorites: anime.favorites,
            popularity: anime.popularity,
            rank: anime.rank,
            type: anime.type || 'TV',
            status: anime.status || 'Not yet aired',
            rating: anime.rating,
            source: anime.source,
            episodes: anime.episodes,
            aired_from: anime.aired?.from ? new Date(anime.aired.from).toISOString() : null,
            aired_to: anime.aired?.to ? new Date(anime.aired.to).toISOString() : null,
            duration: anime.duration,
            demographics: anime.demographics?.map(d => ({ name: d.name })) || [],
            genres: anime.genres?.map(g => ({ name: g.name })) || [],
            themes: anime.themes?.map(t => ({ name: t.name })) || [],
            studios: anime.studios?.map(s => ({ name: s.name })) || [],
            synopsis: anime.synopsis || '',
            season: anime.season || null, // Pode ser null para "2026 to ?", "2027 to ?", etc.
            year: anime.year || null, // Pode ser null para "Not available"
            updated_at: new Date().toISOString(),
          };
          
          // Verificar se já existe antes de inserir
          const { data: existingAnime } = await supabase
            .from('season_rankings')
            .select('id')
            .eq('anime_id', anime.mal_id)
            .maybeSingle();
          
          let upsertError;
          
          if (existingAnime) {
            // Atualizar anime existente
            const { error } = await supabase
              .from('season_rankings')
              .update(animeData)
              .eq('anime_id', anime.mal_id);
            upsertError = error;
          } else {
            // Inserir novo anime
            const { error } = await supabase
              .from('season_rankings')
              .insert(animeData);
            upsertError = error;
          }
          
          if (upsertError) {
            console.error(`❌ Erro ao upsert anime ${anime.mal_id}:`, upsertError);
            errors++;
            continue;
          }
          
          inserted++;
          console.log(`✅ Anime ${titleEnglish} salvo com sucesso`);
          
        } catch (error) {
          console.error(`❌ Erro ao processar anime ${anime.mal_id}:`, error);
          errors++;
        }
      }
      
      // Verificar se há próxima página
      hasNextPage = upcomingData.pagination?.has_next_page || false;
      page++;
      
      // Delay entre páginas
      await sleep(1000);
    }
    
    console.log(`\n📊 RESUMO DO SYNC UPCOMING:`);
    console.log(`   Total encontrados: ${totalAnimes}`);
    console.log(`   ✅ Inseridos/atualizados: ${inserted}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    
    return {
      success: true,
      total: totalAnimes,
      inserted,
      updated,
      skipped,
      errors,
    };
    
  } catch (error) {
    console.error("❌ Erro geral no sync UPCOMING:", error);
    throw error;
  }
}
