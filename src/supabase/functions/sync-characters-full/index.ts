import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1500; // 1.5s delay to strictly avoid rate limit (3 req/sec)

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🌸 Sincronizador de Personagens (Full) Iniciado...`);

    // Busca fila: pendentes (null) ou mais velhos que 30 dias. Limitamos a 10 personagens por run.
    // 10 personagens = 20 chamadas na API (full + pictures). 20 * 1.5s = 30s running (Safe in Vercel/Supabase).
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: queue, error: queueErr } = await supabase
      .from('characters')
      .select('id, name')
      .or(`synced_full_at.is.null,synced_full_at.lt.${thirtyDaysAgo.toISOString()}`)
      .order('synced_full_at', { ascending: true, nullsFirst: true })
      .limit(10);

    if (queueErr) throw queueErr;

    if (!queue || queue.length === 0) {
      console.log(`🏁 Fila de personagens vazia. Nada a atualizar.`);
      return new Response(JSON.stringify({ success: true, message: 'Fila vazia' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Encontrados ${queue.length} personagens na fila.`);

    let processedCount = 0;

    for (const char of queue) {
      console.log(`🔄 Buscando FULL data para Personagem ${char.id} (${char.name})...`);

      try {
        // Chamada 1: /full
        const fullUrl = `${JIKAN_BASE_URL}/characters/${char.id}/full`;
        const fullRes = await fetch(fullUrl);
        await delay(RATE_LIMIT_DELAY); 

        if (!fullRes.ok) throw new Error(`HTTP /full ${fullRes.status}`);
        const fullDataObj = await fullRes.json();
        const fullData = fullDataObj.data;

        // Chamada 2: /pictures
        const pixUrl = `${JIKAN_BASE_URL}/characters/${char.id}/pictures`;
        const pixRes = await fetch(pixUrl);
        await delay(RATE_LIMIT_DELAY);
        
        let allPictures = [];
        if (pixRes.ok) {
           const pixDataObj = await pixRes.json();
           allPictures = pixDataObj.data || [];
        }

        // Montando objeto de update
        const updateObj = {
          about: fullData.about,
          name_kanji: fullData.name_kanji,
          favorites: fullData.favorites,
          nicknames: fullData.nicknames || [],
          images: fullData.images || {},
          all_pictures: allPictures,
          animeography: fullData.anime || [],
          mangaography: fullData.manga || [],
          synced_full_at: new Date().toISOString()
        };

        // Note: the /anime/{id}/characters cron already populated voice actors!
        // But if we want to ensure voices are grabbed from /full too (if missed),
        // we could do it here. Currently skipped to save time and DB space since the anime scan is thorough.
        
        const { error: updErr } = await supabase
          .from('characters')
          .update(updateObj)
          .eq('id', char.id);
          
        if (updErr) throw updErr;

        console.log(`✅ Personagem ${char.id} atualizado com sucesso!`);
        processedCount++;

      } catch (err) {
        console.error(`❌ Erro no personagem ${char.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
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
