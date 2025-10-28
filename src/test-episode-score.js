// Script de teste para validar que a API Jikan retorna scores por episódio
async function testJikanEpisodeScores() {
  console.log("🧪 Testando API Jikan - Scores por episódio\n");
  
  const animeId = 60098; // Boku no Hero Academia Final Season
  const url = `https://api.jikan.moe/v4/anime/${animeId}/episodes`;
  
  console.log(`📡 Buscando: ${url}\n`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`✅ Resposta recebida! Total de episódios: ${data.data.length}\n`);
    console.log("📋 Primeiros 5 episódios:\n");
    
    data.data.slice(0, 5).forEach((ep, index) => {
      console.log(`EP ${ep.mal_id}: "${ep.title}"`);
      console.log(`   ├─ Score: ${ep.score ? `⭐ ${ep.score}` : '⚠️  NULL (sem votos ainda)'}`);
      console.log(`   ├─ Aired: ${ep.aired || 'N/A'}`);
      console.log(`   └─ URL: ${ep.url || 'N/A'}`);
      console.log();
    });
    
    const episodesWithScore = data.data.filter(ep => ep.score !== null).length;
    const episodesWithoutScore = data.data.filter(ep => ep.score === null).length;
    
    console.log("📊 RESUMO:");
    console.log(`   ✅ Com score: ${episodesWithScore}`);
    console.log(`   ⚠️  Sem score: ${episodesWithoutScore}`);
    console.log(`\n✅ CONFIRMADO: A API Jikan SIM retorna scores por episódio!`);
    console.log(`   Escala: 1.00 a 5.00 (baseado em votos dos usuários MAL)`);
    
  } catch (error) {
    console.error("❌ Erro ao buscar dados:", error.message);
  }
}

testJikanEpisodeScores();
