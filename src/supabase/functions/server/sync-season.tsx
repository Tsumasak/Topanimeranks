// ============================================
// SYNC SEASON - MANUAL/ON-DEMAND
// ============================================
// Busca animes de uma season específica do Jikan API
// Exemplo: /seasons/fall/2025, /seasons/winter/2026
// Popula a tabela season_rankings
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

export async function syncSeason(supabase: any, season: string, year: number) {
  console.log(`🚀 Iniciando sync SEASON ${season} ${year}...`);
  
  try {
    let totalAnimes = 0;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
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
            title_japanese: anime.title_japanese || null,
            image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
            anime_score: anime.score, // ✅ ONLY anime_score exists in season_rankings
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
            demographics: anime.demographics || [],
            genres: anime.genres || [],
            themes: anime.themes || [],
            studios: anime.studios || [],
            synopsis: anime.synopsis || '',
            season: season,
            year: year,
            updated_at: new Date().toISOString(),
          };
          
          // Verificar se já existe antes de inserir
          const { data: existingAnime } = await supabase
            .from('season_rankings')
            .select('id')
            .eq('anime_id', anime.mal_id)
            .eq('season', season)
            .eq('year', year)
            .maybeSingle();
          
          let upsertError;
          
          if (existingAnime) {
            // Atualizar anime existente
            const { error } = await supabase
              .from('season_rankings')
              .update(animeData)
              .eq('anime_id', anime.mal_id)
              .eq('season', season)
              .eq('year', year);
            upsertError = error;
            updated++;
          } else {
            // Inserir novo anime
            const { error } = await supabase
              .from('season_rankings')
              .insert(animeData);
            upsertError = error;
            inserted++;
          }
          
          if (upsertError) {
            console.error(`❌ Erro ao upsert anime ${anime.mal_id}:`, upsertError);
            errors++;
            continue;
          }
          
          console.log(`✅ Anime ${titleEnglish} salvo com sucesso`);
          
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
    
    console.log(`\n📊 RESUMO DO SYNC ${season.toUpperCase()} ${year}:`);
    console.log(`   Total encontrados: ${totalAnimes}`);
    console.log(`   ✅ Inseridos: ${inserted}`);
    console.log(`   🔄 Atualizados: ${updated}`);
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
    console.error(`❌ Erro geral no sync ${season} ${year}:`, error);
    throw error;
  }
}