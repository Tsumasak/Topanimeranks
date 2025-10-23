/**
 * Script para Adicionar Múltiplos Episódios de Uma Vez
 * 
 * COMO USAR:
 * 1. Preencha o array EPISODIOS abaixo com todos os episódios que deseja adicionar
 * 2. Execute este arquivo para gerar o código formatado
 * 3. Copie o código gerado e adicione ao arquivo de semana apropriado
 */

// ============================================
// CONFIGURAÇÃO - PREENCHA AQUI
// ============================================

const WEEK_NUMBER = 1; // Qual semana? (1, 2, 3, ou 4)
const START_ID = 7; // ID inicial (próximo número disponível)
const START_RANK = 7; // Rank inicial

const EPISODIOS = [
  {
    title: "Demon Slayer: Kimetsu no Yaiba",
    episodeNumber: 26,
    episodeTitle: "New Mission",
    rating: 4.88,
    animeType: "TV",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    demographics: ["Shounen"],
    genres: ["Action", "Fantasy"],
    themes: ["Historical"]
  },
  {
    title: "Spy x Family",
    episodeNumber: 12,
    episodeTitle: "Penguin Park",
    rating: 4.75,
    animeType: "TV",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg",
    demographics: ["Shounen"],
    genres: ["Action", "Comedy"],
    themes: ["Childcare"]
  },
  {
    title: "Chainsaw Man",
    episodeNumber: 12,
    episodeTitle: "Katana vs. Chainsaw",
    rating: 4.70,
    animeType: "TV",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg",
    demographics: ["Shounen"],
    genres: ["Action", "Supernatural"],
    themes: ["Gore"]
  },
  // Adicione mais episódios aqui seguindo o mesmo formato
];

// ============================================
// GERAÇÃO DO CÓDIGO - NÃO EDITE
// ============================================

const generateBulkCode = () => {
  let code = '';
  
  EPISODIOS.forEach((ep, index) => {
    const id = START_ID + index;
    const rank = START_RANK + index;
    const subtitle = `Episode ${ep.episodeNumber} - ${ep.episodeTitle}`;
    
    const demographicsStr = ep.demographics.length > 0 
      ? `["${ep.demographics.join('", "')}"]` 
      : "[]";
    
    const genresStr = ep.genres.length > 0 
      ? `["${ep.genres.join('", "')}"]` 
      : "[]";
    
    const themesStr = ep.themes.length > 0 
      ? `["${ep.themes.join('", "')}"]` 
      : "[]";

    code += `  {
    id: ${id},
    rank: ${rank},
    title: "${ep.title}",
    subtitle: "${subtitle}",
    rating: ${ep.rating},
    imageUrl: "${ep.imageUrl}",
    animeType: "${ep.animeType}",
    demographics: ${demographicsStr},
    genres: ${genresStr},
    themes: ${themesStr}
  },\n`;
  });
  
  return code.trim();
};

const generateSummary = () => {
  let summary = '\n📊 RESUMO DOS EPISÓDIOS:\n';
  summary += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  EPISODIOS.forEach((ep, index) => {
    const rank = START_RANK + index;
    summary += `  #${rank} | ${ep.rating} ⭐ | ${ep.title} - Ep ${ep.episodeNumber}\n`;
  });
  
  summary += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  summary += `  Total: ${EPISODIOS.length} episódios\n`;
  summary += `  IDs: ${START_ID} até ${START_ID + EPISODIOS.length - 1}\n`;
  summary += `  Ranks: ${START_RANK} até ${START_RANK + EPISODIOS.length - 1}\n`;
  
  return summary;
};

const generateInstructions = () => {
  return `
╔═══════════════════════════════════════════════════════════════╗
║        CÓDIGO GERADO PARA ${EPISODIOS.length} EPISÓDIOS                          ║
╚═══════════════════════════════════════════════════════════════╝

📁 Arquivo: /data/week${WEEK_NUMBER}.ts

📋 INSTRUÇÕES:
1. Abra o arquivo /data/week${WEEK_NUMBER}.ts
2. Encontre o array "week${WEEK_NUMBER}Animes"
3. Adicione o código abaixo no final do array (ou na posição apropriada)
4. Certifique-se de adicionar vírgula no último episódio ANTERIOR
5. Remova a vírgula do último episódio NOVO se for o final do array
6. Salve o arquivo

⚠️  VERIFICAÇÕES IMPORTANTES:
- [ ] IDs ${START_ID}-${START_ID + EPISODIOS.length - 1} não estão sendo usados
- [ ] Ranks estão em ordem correta (por rating)
- [ ] Ratings estão entre 1.00 e 5.00
- [ ] URLs das imagens são válidas
- [ ] Vírgulas estão corretas

${generateSummary()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÓDIGO PARA COPIAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${generateBulkCode()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Pronto! Copie o código acima e adicione ao arquivo week${WEEK_NUMBER}.ts

💡 DICA: Se precisar reordenar por rating, ordene do maior para o menor:
   - Rank 1 = maior rating
   - Rank 2 = segundo maior rating
   - E assim por diante...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
};

// Executar e mostrar resultado
console.log(generateInstructions());

// Exportar para uso em outros scripts se necessário
export const episodesData = EPISODIOS;
export const generatedCode = generateBulkCode();
export const weekNumber = WEEK_NUMBER;
