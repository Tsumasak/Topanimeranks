// Script para limpar a tabela, fazer deploy e executar o sync corrigido
const projectId = "kgiuycrbdctbbuvtlyro";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnaXV5Y3JiZGN0YmJ1dnRseXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjUwMDgsImV4cCI6MjA3NzEwMTAwOH0.MIjtIbpOXWYanYe1SNj7yG7vk2RYlh2WQgh1sPY10zQ";

async function main() {
  console.log("📦 PASSO 1: Fazendo deploy da função corrigida...");
  console.log("⚠️  Execute manualmente: npx supabase functions deploy sync-fall-2025\n");
  console.log("Pressione ENTER depois de fazer o deploy...");
  
  // Aguardar input do usuário
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });
  
  console.log("\n🚀 PASSO 2: Executando sync Fall 2025 com correções...");
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
      console.log("\n✅ Agora os episódios devem ter:");
      console.log("   • Números corretos (1, 2, 3...)");
      console.log("   • Nomes dos episódios (ex: 'Toshinori Yagi: Rising Origin')");
      console.log("   • Scores de 1.00 a 5.00 (ou NULL se ainda sem rating)");
    } else {
      console.error("\n❌ ERRO NO SYNC:");
      console.error(result.error);
    }
  } catch (error) {
    console.error("\n❌ ERRO AO CHAMAR A FUNÇÃO:");
    console.error(error.message);
  }
  
  process.exit(0);
}

main();
