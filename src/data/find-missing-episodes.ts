/**
 * 🔍 SCRIPT DE ANÁLISE: Encontrar Episódios Faltantes
 * 
 * Este script compara os animes da Week 2 com a Week 3 para identificar
 * episódios que provavelmente deveriam estar presentes mas não estão na API.
 * 
 * USO:
 * 1. Abra o console do navegador (F12)
 * 2. Importe este arquivo
 * 3. Execute: await findMissingEpisodes()
 */

import { JikanService } from '../services/jikan';
import { Episode } from '../types/anime';

interface MissingEpisodeSuggestion {
  animeId: number;
  animeTitle: string;
  lastEpisodeNumber: number;
  suggestedEpisodeNumber: number;
  lastScore: number;
  suggestedScore: number;
  reason: string;
}

export async function findMissingEpisodes(): Promise<MissingEpisodeSuggestion[]> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 ANÁLISE: Episódios Faltantes na Week 3');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📥 Carregando dados da Week 2...');
  const week2Data = await JikanService.getWeekData(2, (current, total, msg) => {
    console.log(`  → ${msg} (${current}/${total})`);
  });

  console.log(`✅ Week 2: ${week2Data.episodes.length} episódios carregados\n`);

  console.log('📥 Carregando dados da Week 3...');
  const week3Data = await JikanService.getWeekData(3, (current, total, msg) => {
    console.log(`  → ${msg} (${current}/${total})`);
  });

  console.log(`✅ Week 3: ${week3Data.episodes.length} episódios carregados\n`);

  // Criar mapa de animes por ID
  const week2Map = new Map<number, Episode>();
  week2Data.episodes.forEach(ep => {
    week2Map.set(ep.animeId, ep);
  });

  const week3Map = new Map<number, Episode>();
  week3Data.episodes.forEach(ep => {
    week3Map.set(ep.animeId, ep);
  });

  // Encontrar animes que estavam na Week 2 mas não na Week 3
  const missing: MissingEpisodeSuggestion[] = [];

  week2Map.forEach((week2Episode, animeId) => {
    if (!week3Map.has(animeId)) {
      // Anime estava na Week 2 mas não está na Week 3
      const suggestedEpisodeNumber = week2Episode.episodeNumber + 1;
      
      // Estimar score baseado no anterior (pequena variação de +/- 0.05)
      const scoreVariation = (Math.random() - 0.5) * 0.1; // -0.05 a +0.05
      const suggestedScore = Math.max(
        0,
        Math.min(10, week2Episode.score + scoreVariation)
      );

      missing.push({
        animeId,
        animeTitle: week2Episode.animeTitle,
        lastEpisodeNumber: week2Episode.episodeNumber,
        suggestedEpisodeNumber,
        lastScore: week2Episode.score,
        suggestedScore: parseFloat(suggestedScore.toFixed(2)),
        reason: `Estava na Week 2 com EP${week2Episode.episodeNumber}, provavelmente tem EP${suggestedEpisodeNumber} na Week 3`,
      });
    }
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESULTADOS DA ANÁLISE');
  console.log('═══════════════════════════════════════════════════════\n');

  if (missing.length === 0) {
    console.log('✅ Nenhum episódio faltante detectado!');
    console.log('   Todos os animes da Week 2 continuam na Week 3.\n');
    return [];
  }

  console.log(`⚠️ Encontrados ${missing.length} episódios potencialmente faltantes:\n`);

  // Ordenar por score (mais relevantes primeiro)
  missing.sort((a, b) => b.lastScore - a.lastScore);

  // Mostrar os resultados
  missing.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.animeTitle}`);
    console.log(`   → Anime ID: ${item.animeId}`);
    console.log(`   → Último episódio: EP${item.lastEpisodeNumber} (Score: ${item.lastScore})`);
    console.log(`   → Sugestão: EP${item.suggestedEpisodeNumber} (Score estimado: ${item.suggestedScore})`);
    console.log(`   → Razão: ${item.reason}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('📝 CÓDIGO PARA ADICIONAR AO manual-episodes.ts');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('// 🔽 Copie e cole este código no array MANUAL_EPISODES:');
  console.log('');

  // Gerar código TypeScript para copiar/colar
  const codeSnippets = missing.map(item => {
    return `  {
    animeId: ${item.animeId},
    episodeNumber: ${item.suggestedEpisodeNumber},
    episodeTitle: "Episode ${item.suggestedEpisodeNumber}", // ⚠️ SUBSTITUIR pelo título real
    weekNumber: 3,
    score: ${item.suggestedScore}
  }`;
  });

  console.log(codeSnippets.join(',\n'));
  console.log('');

  console.log('═══════════════════════════════════════════════════════');
  console.log('⚠️ IMPORTANTE: VERIFICAR TÍTULOS DOS EPISÓDIOS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Para obter os títulos reais dos episódios, visite:');
  missing.slice(0, 5).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.animeTitle}:`);
    console.log(`   https://myanimelist.net/anime/${item.animeId}`);
  });

  console.log('\n✅ Análise concluída!\n');

  return missing;
}

// Versão compacta para copiar direto
export async function generateManualEpisodesCode(): Promise<string> {
  const missing = await findMissingEpisodes();
  
  const code = missing.map(item => {
    return `  {
    animeId: ${item.animeId},
    episodeNumber: ${item.suggestedEpisodeNumber},
    episodeTitle: "Episode ${item.suggestedEpisodeNumber}", // ⚠️ SUBSTITUIR
    weekNumber: 3,
    score: ${item.suggestedScore}
  }`;
  }).join(',\n');

  // Copiar para clipboard se possível
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(code);
      console.log('📋 Código copiado para clipboard!');
    } catch (e) {
      console.log('⚠️ Não foi possível copiar automaticamente');
    }
  }

  return code;
}

// Auto-registrar no window para fácil acesso
if (typeof window !== 'undefined') {
  (window as any).findMissingEpisodes = findMissingEpisodes;
  (window as any).generateManualEpisodesCode = generateManualEpisodesCode;
  console.log('💡 TIP: Execute findMissingEpisodes() no console para encontrar episódios faltantes');
}
