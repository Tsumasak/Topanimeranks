// Script temporário para executar o sync Fall 2025
const projectId = "kgiuycrbdctbbuvtlyro";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnaXV5Y3JiZGN0YmJ1dnRseXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjUwMDgsImV4cCI6MjA3NzEwMTAwOH0.MIjtIbpOXWYanYe1SNj7yG7vk2RYlh2WQgh1sPY10zQ";

async function runSync() {
  console.log("🚀 Iniciando sync Fall 2025...");
  console.log("⏱️  Isso pode demorar 10-15 minutos...\n");
  
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/sync-fall-2025`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      console.log("\n✅ SYNC CONCLUÍDO COM SUCESSO!");
      console.log(`📊 Animes sincronizados: ${result.animes}`);
      console.log(`📺 Episódios inseridos: ${result.episodes}`);
      console.log(`❌ Erros: ${result.errors}`);
      console.log(`\n${result.message}`);
    } else {
      console.error("\n❌ ERRO NO SYNC:");
      console.error(result.error);
    }
  } catch (error) {
    console.error("\n❌ ERRO AO CHAMAR A FUNÇÃO:");
    console.error(error.message);
  }
}

runSync();
