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
       // Achar animes que AINDA NÃO estão na anime_characters.
       // E no caso de forceSeason/forceYear, achar apenas dessa season.
       console.log(`🔍 Buscando candidatos pendentes...`);
       
       let query = supabase.from('season_rankings').select('anime_id, title, status, season, year');
       
       if (forceSeason && forceYear) {
           console.log(`🎯 Sync manual por Season/Ano: ${forceSeason} ${forceYear}`);
           query = query.eq('season', forceSeason).eq('year', forceYear);
       }
       
       const { data: allAnimes, error: animeErr } = await query;
       if (animeErr) throw animeErr;

       // Achar quais já foram pareados
       const { data: alreadySynced, error: syncErr } = await supabase
         .from('anime_characters')
         .select('anime_id');
       
       if (syncErr) throw syncErr;

       const syncedSet = new Set(alreadySynced.map(a => a.anime_id));

       // Filtrar apenas quem não foi sincronizado ainda
       const pending = allAnimes.filter(a => !syncedSet.has(a.anime_id));
       pendingCount = pending.length;
       
       console.log(`📊 Total na base: ${allAnimes.length} | Já sincronizados: ${syncedSet.size} | Pendentes nesta run: ${pending.length}`);

       if (pending.length === 0) {
         console.log(`🏁 Nenhum anime pendente encontardo. Fila vazia, encerrando magicamente sem gastar recursos.`);
         return new Response(JSON.stringify({ success: true, message: 'All caught up' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
       }

       // PRIORIZAÇÃO
       // 1. Anticipated (Not yet aired)
       // 2. Current season
       // 3. O resto
       pending.sort((a, b) => {
          const aPriority = a.status === 'Not yet aired' ? 1 
                          : (a.season === currentSeasonName && a.year === year) ? 2 
                          : 3;
          const bPriority = b.status === 'Not yet aired' ? 1 
                          : (b.season === currentSeasonName && b.year === year) ? 2 
                          : 3;
          return aPriority - bPriority;
       });

       // Vamos pegar apenas 1 a 3 animes por Run da cron para não quebrar RateLimit (cada anime puxa uma URL)
       candidates = pending.slice(0, 2); 
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

            for (const charData of data.data) {
                const char = charData.character;
                const role = charData.role;

                // INSERIR CHAR BÁSICO (O sync full preencherá o resto e cuidará de manter o update)
                // Se já existir, ignoreDuplicates = true, não mexe no synced_full_at dele
                const charObj = {
                    id: char.mal_id,
                    name: char.name,
                    url: char.url,
                    image_url: char.images?.jpg?.image_url,
                };

                await supabase.from('characters').upsert(charObj, { onConflict: 'id', ignoreDuplicates: true });

                // INSERIR RELAÇÃO
                const relObj = {
                    anime_id: anime.anime_id,
                    character_id: char.mal_id,
                    role: role
                };
                await supabase.from('anime_characters').upsert(relObj, { onConflict: 'anime_id,character_id' });

                // INSERIR VOICE ACTORS SE HOUVER
                if (charData.voice_actors && charData.voice_actors.length > 0) {
                     for (const va of charData.voice_actors) {
                         const lang = va.language;
                         const person = va.person;

                         await supabase.from('voice_actors').upsert({
                             id: person.mal_id,
                             name: person.name,
                             url: person.url,
                             image_url: person.images?.jpg?.image_url
                         }, { onConflict: 'id', ignoreDuplicates: true });

                         await supabase.from('character_voices').upsert({
                             character_id: char.mal_id,
                             voice_actor_id: person.mal_id,
                             language: lang
                         }, { onConflict: 'character_id,voice_actor_id,language', ignoreDuplicates: true });
                     }
                }
                itemsCreated++;
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
