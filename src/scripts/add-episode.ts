/**
 * Script Helper para Adicionar Episódios Manualmente
 * 
 * COMO USAR:
 * 1. Preencha os dados do episódio na seção "CONFIGURAÇÃO" abaixo
 * 2. Execute este arquivo para gerar o código formatado
 * 3. Copie o código gerado e adicione ao arquivo de semana apropriado
 */

// ============================================
// CONFIGURAÇÃO - PREENCHA AQUI
// ============================================

const NOVO_EPISODIO = {
  // Informações básicas
  id: 7,  // ID único - incremental (próximo número disponível)
  rank: 7, // Posição no ranking (ajuste conforme necessário)
  
  // Informações do anime
  title: "My Hero Academia", // Nome do anime em inglês
  episodeNumber: 25, // Número do episódio
  episodeTitle: "Symbol of Hope", // Título do episódio
  
  // Rating e tipo
  rating: 4.75, // Rating de 1.00 a 5.00
  animeType: "TV", // TV, ONA, Movie, OVA, Special
  
  // Imagem
  imageUrl: "https://cdn.myanimelist.net/images/anime/1928/120625.jpg",
  
  // Categorias
  demographics: ["Shounen"], // Shounen, Seinen, Shoujo, Josei
  genres: ["Action", "Fantasy"], // Gêneros principais
  themes: ["School", "Super Power"], // Temas específicos
};

// Qual semana? (1, 2, 3, ou 4)
const WEEK_NUMBER = 1;

// ============================================
// GERAÇÃO DO CÓDIGO - NÃO EDITE
// ============================================

const generateEpisodeCode = () => {
  const subtitle = `Episode ${NOVO_EPISODIO.episodeNumber} - ${NOVO_EPISODIO.episodeTitle}`;
  
  const demographicsStr = NOVO_EPISODIO.demographics.length > 0 
    ? `["${NOVO_EPISODIO.demographics.join('", "')}"]` 
    : "[]";
  
  const genresStr = NOVO_EPISODIO.genres.length > 0 
    ? `["${NOVO_EPISODIO.genres.join('", "')}"]` 
    : "[]";
  
  const themesStr = NOVO_EPISODIO.themes.length > 0 
    ? `["${NOVO_EPISODIO.themes.join('", "')}"]` 
    : "[]";

  const code = `{
  id: ${NOVO_EPISODIO.id},
  rank: ${NOVO_EPISODIO.rank},
  title: "${NOVO_EPISODIO.title}",
  subtitle: "${subtitle}",
  rating: ${NOVO_EPISODIO.rating},
  imageUrl: "${NOVO_EPISODIO.imageUrl}",
  animeType: "${NOVO_EPISODIO.animeType}",
  demographics: ${demographicsStr},
  genres: ${genresStr},
  themes: ${themesStr}
},`;

  return code;
};

const generateInstructions = () => {
  return `
╔═══════════════════════════════════════════════════════════════╗
║           CÓDIGO GERADO PARA ADICIONAR EPISÓDIO              ║
╚═══════════════════════════════════════════════════════════════╝

📁 Arquivo: /data/week${WEEK_NUMBER}.ts

📋 INSTRUÇÕES:
1. Abra o arquivo /data/week${WEEK_NUMBER}.ts
2. Encontre o array "week${WEEK_NUMBER}Animes"
3. Adicione o código abaixo na posição apropriada (rank ${NOVO_EPISODIO.rank})
4. Certifique-se de que há vírgula no final (já incluída)
5. Salve o arquivo

⚠️  IMPORTANTE:
- Verifique se o ID ${NOVO_EPISODIO.id} não está sendo usado
- Ajuste os ranks de outros episódios se necessário
- Rating deve estar entre 1.00 e 5.00
- Lembre-se de adicionar vírgula no episódio ANTERIOR se este for o novo último

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÓDIGO PARA COPIAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${generateEpisodeCode()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ RESUMO DO EPISÓDIO:
   Anime: ${NOVO_EPISODIO.title}
   Episódio: ${NOVO_EPISODIO.episodeNumber} - ${NOVO_EPISODIO.episodeTitle}
   Rating: ${NOVO_EPISODIO.rating} / 5.00
   Rank: #${NOVO_EPISODIO.rank}
   Tipo: ${NOVO_EPISODIO.animeType}
   Demografia: ${NOVO_EPISODIO.demographics.join(", ")}
   Gêneros: ${NOVO_EPISODIO.genres.join(", ")}
   Temas: ${NOVO_EPISODIO.themes.join(", ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
};

// Executar e mostrar resultado
console.log(generateInstructions());

// Exportar para uso em outros scripts se necessário
export const episodeData = NOVO_EPISODIO;
export const generatedCode = generateEpisodeCode();
