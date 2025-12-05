// ============================================
// TRIGGER PAST SYNC - SEM AUTORIZAÇÃO
// ============================================
// Esta function pode ser chamada SEM header de autorização
// Ela dispara o sync de todas as temporadas de 2025
// 
// Deploy: supabase functions deploy trigger-past-sync --no-verify-jwt
// Uso: GET https://<project>.supabase.co/functions/v1/trigger-past-sync?key=sync2025
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const SEASONS = [
  { season: 'winter', year: 2025 },
  { season: 'spring', year: 2025 },
  { season: 'summer', year: 2025 },
  { season: 'fall', year: 2025 },
];

Deno.serve(async (req) => {
  // Verificar security key
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  
  if (key !== 'sync2025') {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing or invalid security key. Add ?key=sync2025 to the URL"
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing Supabase credentials" 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("🚀 Iniciando sync de TODAS as temporadas de 2025...");

    const results = [];

    // Chamar a function sync-past-anime-data para cada season
    for (const { season, year } of SEASONS) {
      console.log(`\n📅 Disparando sync para ${season} ${year}...`);
      
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/sync-past-anime-data/${season}/${year}?key=sync2025`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
          }
        );

        const result = await response.json();
        results.push({
          season,
          year,
          success: result.success,
          totalAnimes: result.totalAnimes,
          insertedEpisodes: result.insertedEpisodes,
        });

        console.log(`✅ ${season} ${year} completo: ${result.totalAnimes} animes, ${result.insertedEpisodes} episódios`);
        
      } catch (error) {
        console.error(`❌ Erro em ${season} ${year}:`, error);
        results.push({
          season,
          year,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log("\n🎉 Sync de todas as temporadas concluído!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sync de todas as temporadas de 2025 iniciado",
        results,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("❌ Erro geral:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
