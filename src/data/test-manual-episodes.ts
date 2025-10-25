/**
 * Script de Teste para Verificar Episódios Manuais
 * 
 * Execute este script no console do navegador para verificar se os episódios
 * manuais estão configurados corretamente.
 */

import { MANUAL_EPISODES } from './manual-episodes';

export function testManualEpisodes() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE EPISÓDIOS MANUAIS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (MANUAL_EPISODES.length === 0) {
    console.log('❌ ERRO: Nenhum episódio manual configurado!');
    console.log('   → Verifique /data/manual-episodes.ts\n');
    return;
  }
  
  console.log(`✅ Total de episódios manuais: ${MANUAL_EPISODES.length}\n`);
  
  // Agrupar por semana
  const byWeek = MANUAL_EPISODES.reduce((acc, ep) => {
    if (!acc[ep.weekNumber]) {
      acc[ep.weekNumber] = [];
    }
    acc[ep.weekNumber].push(ep);
    return acc;
  }, {} as Record<number, typeof MANUAL_EPISODES>);
  
  // Mostrar episódios por semana
  Object.keys(byWeek).sort().forEach(weekNum => {
    const episodes = byWeek[Number(weekNum)];
    console.log(`📅 WEEK ${weekNum} - ${episodes.length} episódio(s)`);
    console.log('─────────────────────────────────────────────────────');
    
    episodes.forEach((ep, idx) => {
      console.log(`\n  ${idx + 1}. Anime ID: ${ep.animeId}`);
      console.log(`     Episódio: ${ep.episodeNumber}`);
      console.log(`     Título: "${ep.episodeTitle}"`);
      console.log(`     Score: ${ep.score}`);
      console.log(`     Data: ${ep.aired || 'Auto (início da semana)'}`);
      
      // Verificações
      const warnings = [];
      
      if (ep.animeId <= 0) {
        warnings.push('⚠️ animeId inválido (deve ser > 0)');
      }
      
      if (ep.episodeNumber <= 0) {
        warnings.push('⚠️ episodeNumber inválido (deve ser > 0)');
      }
      
      if (ep.weekNumber < 1 || ep.weekNumber > 13) {
        warnings.push('⚠️ weekNumber fora do range (deve ser 1-13)');
      }
      
      if (ep.score < 0 || ep.score > 10) {
        warnings.push('⚠️ score fora do range (deve ser 0-10)');
      }
      
      if (!ep.episodeTitle || ep.episodeTitle.trim() === '') {
        warnings.push('⚠️ episodeTitle vazio');
      }
      
      if (warnings.length > 0) {
        console.log('\n     ⚠️ AVISOS:');
        warnings.forEach(w => console.log(`        ${w}`));
      } else {
        console.log('     ✅ Configuração OK');
      }
    });
    
    console.log('\n');
  });
  
  // Verificar duplicatas
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 VERIFICAÇÃO DE DUPLICATAS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const duplicates = new Map<string, typeof MANUAL_EPISODES>();
  
  MANUAL_EPISODES.forEach(ep => {
    const key = `${ep.animeId}-${ep.episodeNumber}-${ep.weekNumber}`;
    if (!duplicates.has(key)) {
      duplicates.set(key, []);
    }
    duplicates.get(key)!.push(ep);
  });
  
  let hasDuplicates = false;
  duplicates.forEach((episodes, key) => {
    if (episodes.length > 1) {
      hasDuplicates = true;
      const [animeId, epNum, week] = key.split('-');
      console.log(`⚠️ DUPLICATA ENCONTRADA:`);
      console.log(`   Anime ${animeId}, EP${epNum}, Week ${week}`);
      console.log(`   → ${episodes.length} entradas duplicadas`);
      console.log('');
    }
  });
  
  if (!hasDuplicates) {
    console.log('✅ Nenhuma duplicata encontrada\n');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 RESUMO');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Total de episódios: ${MANUAL_EPISODES.length}`);
  console.log(`Semanas com episódios: ${Object.keys(byWeek).join(', ')}`);
  console.log(`\n✅ Teste concluído!\n`);
  
  return {
    total: MANUAL_EPISODES.length,
    byWeek,
    episodes: MANUAL_EPISODES,
    hasDuplicates
  };
}

// Auto-executar se importado no console
if (typeof window !== 'undefined') {
  (window as any).testManualEpisodes = testManualEpisodes;
  console.log('💡 TIP: Execute testManualEpisodes() no console para testar os episódios manuais');
}
