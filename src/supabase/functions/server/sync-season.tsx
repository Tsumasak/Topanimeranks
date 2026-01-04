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

// Helper function to validate if aired_from date matches the requested season
function validateSeasonMatch(airedFrom: string | null, requestedSeason: string, requestedYear: number): boolean {
  if (!airedFrom) return false; // No date = can't validate
  
  const airedDate = new Date(airedFrom);
  const month = airedDate.getUTCMonth() + 1; // 1-12
  const year = airedDate.getUTCFullYear();
  
  // Check year match first
  if (year !== requestedYear) return false;
  
  // Map month to season
  let actualSeason = '';
  if (month >= 1 && month <= 3) actualSeason = 'winter';
  else if (month >= 4 && month <= 6) actualSeason = 'spring';
  else if (month >= 7 && month <= 9) actualSeason = 'summer';
  else if (month >= 10 && month <= 12) actualSeason = 'fall';
  
  return actualSeason === requestedSeason.toLowerCase();
}

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
    
    // ✅ STEP 1: Coletar TODOS os MAL IDs válidos do Jikan API
    const validMalIds = new Set<number>();
    
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
          
          // ✅ VALIDAÇÃO CRÍTICA: Verificar se a data aired_from corresponde à season solicitada
          // Isso previne animes de outras seasons serem salvos na season errada
          if (anime.status === 'Not yet aired' && anime.aired?.from) {
            const isValidSeason = validateSeasonMatch(anime.aired.from, season, year);
            if (!isValidSeason) {
              const airedDate = new Date(anime.aired.from);
              const month = airedDate.getUTCMonth() + 1;
              const actualYear = airedDate.getUTCFullYear();
              console.log(`⚠️  PULANDO ${titleEnglish}: aired_from=${anime.aired.from} (month=${month}, year=${actualYear}) não corresponde a ${season} ${year}`);
              skipped++;
              continue;
            }
          }
          
          // ✅ Adicionar MAL ID à lista de IDs válidos
          validMalIds.add(anime.mal_id);
          
          // Preparar dados para inserção
          const animeData = {
            anime_id: anime.mal_id,
            title: anime.title,
            title_english: anime.title_english || anime.title,
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
    
    // ✅ STEP 2: DELETAR animes que NÃO estão mais no Jikan API
    console.log(`\n🗑️  PASSO 2: Deletando animes obsoletos de ${season} ${year}...`);
    console.log(`   MAL IDs válidos encontrados no Jikan: ${validMalIds.size}`);
    
    let deleted = 0; // Declare outside to use in return
    
    // Buscar TODOS os animes da season_rankings para essa season
    const { data: existingAnimes, error: fetchError } = await supabase
      .from('season_rankings')
      .select('anime_id, title_english')
      .eq('season', season)
      .eq('year', year);
    
    if (fetchError) {
      console.error(`❌ Erro ao buscar animes existentes:`, fetchError);
    } else {
      console.log(`   Animes na tabela season_rankings: ${existingAnimes?.length || 0}`);
      
      // Identificar animes que NÃO estão no Jikan (obsoletos)
      const animesToDelete = existingAnimes?.filter(anime => !validMalIds.has(anime.anime_id)) || [];
      
      console.log(`   Animes a deletar (NÃO estão no Jikan): ${animesToDelete.length}`);
      
      // Deletar cada anime obsoleto
      for (const anime of animesToDelete) {
        console.log(`   🗑️  Deletando: ${anime.title_english} (MAL ID: ${anime.anime_id})`);
        
        const { error: deleteError } = await supabase
          .from('season_rankings')
          .delete()
          .eq('anime_id', anime.anime_id)
          .eq('season', season)
          .eq('year', year);
        
        if (deleteError) {
          console.error(`   ❌ Erro ao deletar anime ${anime.anime_id}:`, deleteError);
          errors++;
        } else {
          deleted++;
        }
      }
      
      console.log(`   ✅ Total deletado: ${deleted}`);
    }
    
    console.log(`\n📊 RESUMO DO SYNC ${season.toUpperCase()} ${year}:`);
    console.log(`   Total encontrados no Jikan: ${totalAnimes}`);
    console.log(`   ✅ Inseridos: ${inserted}`);
    console.log(`   🔄 Atualizados: ${updated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   🗑️  Deletados: ${deleted}`);
    console.log(`   ❌ Erros: ${errors}`);
    
    return {
      success: true,
      total: totalAnimes,
      inserted,
      updated,
      skipped,
      deleted,
      errors,
    };
    
  } catch (error) {
    console.error(`❌ Erro geral no sync ${season} ${year}:`, error);
    throw error;
  }
}