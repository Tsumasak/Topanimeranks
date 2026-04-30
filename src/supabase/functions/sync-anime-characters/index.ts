import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between Jikan calls

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Identify single forced sync by anime_id or force by season/year (from admin panel)
    let body = {};
    try {
      if (req.body) body = await req.json();
    } catch (e) {
      // no body
    }

    const forcedAnimeId = body.anime_id;
    const forceSeason = body.season;
    const forceYear = body.year;

    // Detect current season
    const today = new Date();
    const month = today.getUTCMonth(); 
    const year = today.getUTCFullYear();
    let currentSeasonName = 'fall';
    if (month >= 0 && month <= 2) currentSeasonName = 'winter';
    else if (month >= 3 && month <= 5) currentSeasonName = 'spring';
    else if (month >= 6 && month <= 8) currentSeasonName = 'summer';

    console.log(`🌸 Sincronizador de Personagens Iniciado: Season Atual ${currentSeasonName} ${year}`);

    // If a specific anime ID is passed, we check just that one.
    // Otherwise we find candidates.
    let candidates = [];
    let pendingCount = 0;

    if (forcedAnimeId) {
       console.log(`🎯 Sync manual via UUID acionado para anime ${forcedAnimeId}`);
       candidates.push({ anime_id: forcedAnimeId, title: 'Manual Forced Anime' });
    } else {
       // Em vez de puxar mil animes e contar manualmente via javascript quebrando limites,
       // Vamos consultar a inteligência do RPC que varre todo o banco nativamente e encontra o que falta.
       let rpcParams: any = { p_limit: 2 }; // Background mode pega 2 por run pra n estourar
       
       if (forceSeason && forceYear) {
           console.log(`🎯 Sync manual por Season/Ano: ${forceSeason} ${forceYear}`);
           rpcParams = { p_season: forceSeason, p_year: forceYear, p_limit: 10 }; // Painel admin puxa de 10 em 10
       } else {
           console.log(`🔍 Buscando candidatos pendentes em todo o histórico de animes...`);
       }
       
       const { data: pending, error: rpcErr } = await supabase.rpc('get_pending_character_syncs', rpcParams);
       if (rpcErr) throw rpcErr;
       
       pendingCount = pending.length; // Aqui reflete se a fila da query inteira esvaziou os 2 ou 10? 
       // Obs: Para o FrontEnd continuar com a contagem real de pendentes ao invés de apenas os '10' devolvidos,
       // vamos buscar a contagem total de pendentes reais
       
       const { data: totalPendingData, error: totalErr } = await supabase.rpc('get_pending_character_syncs', { 
           p_season: rpcParams.p_season, 
           p_year: rpcParams.p_year, 
           p_limit: 10000 
       });
       if (totalErr) throw totalErr;
       pendingCount = totalPendingData.length;
       
       console.log(`📊 Total de Pendentes encontrados pelo Radar: ${pendingCount}`);

       if (pendingCount === 0) {
         console.log(`🏁 Nenhum anime pendente encontrado. Fila vazia, encerrando magicamente sem gastar recursos.`);
         return new Response(JSON.stringify({ success: true, message: 'All caught up' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
       }

       candidates = pending;
    }

    let itemsCreated = 0;

    for (const anime of candidates) {
        console.log(`🔄 Buscando lista de personagens para Anime ${anime.anime_id} (${anime.title})...`);
        const charactersUrl = `${JIKAN_BASE_URL}/anime/${anime.anime_id}/characters`;
        
        try {
            const response = await fetch(charactersUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (!data || !data.data || data.data.length === 0) {
                console.log(`⚠️ Nenhum personagem retornado para ${anime.anime_id} (Marcando com Dummy ID -1 para evitar loop)`);
                // Insert dummy character -1
                await supabase.from('characters').upsert({ id: -1, name: 'Sem Personagens Listados' }, { onConflict: 'id', ignoreDuplicates: true });
                // Link dummy char to this anime
                await supabase.from('anime_characters').upsert({ anime_id: anime.anime_id, character_id: -1, role: 'None' }, { onConflict: 'anime_id,character_id' });
                
                itemsCreated++;
                continue;
            }

            console.log(`✅ ${data.data.length} persongens encontrados para ${anime.anime_id}`);

                let successCount = 0;
                for (const charData of data.data) {
                    const char = charData.character;
                    const role = charData.role;

                    const charObj = {
                        id: char.mal_id,
                        name: char.name,
                        url: char.url,
                        image_url: char.images?.jpg?.image_url,
                    };

                    const { error: charErr } = await supabase.from('characters').upsert(charObj, { onConflict: 'id', ignoreDuplicates: true });
                    if (charErr) { console.error(`❌ DB ERRO em characters (${char.mal_id}):`, charErr); continue; }

                    const relObj = {
                        anime_id: anime.anime_id,
                        character_id: char.mal_id,
                        role: role
                    };
                    const { error: relErr } = await supabase.from('anime_characters').upsert(relObj, { onConflict: 'anime_id,character_id' });
                    if (relErr) { console.error(`❌ DB ERRO em anime_characters (${anime.anime_id} - ${char.mal_id}):`, relErr); continue; }

                    if (charData.voice_actors && charData.voice_actors.length > 0) {
                         for (const va of charData.voice_actors) {
                             const lang = va.language;
                             const person = va.person;

                             const { error: vaErr } = await supabase.from('voice_actors').upsert({
                                 id: person.mal_id,
                                 name: person.name,
                                 url: person.url,
                                 image_url: person.images?.jpg?.image_url
                             }, { onConflict: 'id', ignoreDuplicates: true });
                             if (vaErr) console.error(`❌ ERRO VA (${person.mal_id}):`, vaErr);

                             const { error: cvErr } = await supabase.from('character_voices').upsert({
                                 character_id: char.mal_id,
                                 voice_actor_id: person.mal_id,
                                 language: lang
                             }, { onConflict: 'character_id,voice_actor_id,language', ignoreDuplicates: true });
                             if (cvErr) console.error(`❌ ERRO CV (${char.mal_id} - ${person.mal_id}):`, cvErr);
                         }
                    }
                    successCount++;
                    itemsCreated++;
                }
                
                // Se nenhum personagem for salvo com sucesso por algum motivo db, marca ele como dummy para pular!
                if (successCount === 0 && data.data.length > 0) {
                    console.log(`⚠️ Nenhum personagem salvo com sucesso no banco para o anime ${anime.anime_id}. Salvando DUMMY (-1) para contornar.`);
                    await supabase.from('characters').upsert({ id: -1, name: 'Erro/Não salvos' }, { onConflict: 'id', ignoreDuplicates: true });
                    await supabase.from('anime_characters').upsert({ anime_id: anime.anime_id, character_id: -1, role: 'None' }, { onConflict: 'anime_id,character_id' });
                }
            console.log(`💾 Anime ${anime.anime_id} pareado. Relacionamentos criados.`);
        } catch (charFetchErr) {
            console.error(`❌ Erro no fetch personagens de ${anime.anime_id}:`, charFetchErr);
        }

        await delay(RATE_LIMIT_DELAY);
    }

    return new Response(JSON.stringify({ success: true, animes_processed: candidates.length, items_created: itemsCreated, pending_count: Math.max(0, pendingCount - candidates.length) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`❌ Fatal Error:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
