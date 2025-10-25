/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📝 MANUAL EPISODES CONFIGURATION - Sistema de Episódios Manuais
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 🎯 OBJETIVO:
 * Adicionar episódios que ainda não estão disponíveis na API Jikan.
 * Esses episódios serão automaticamente mesclados com os dados da API.
 *
 * 🔄 SUBSTITUIÇÃO AUTOMÁTICA:
 * Quando o mesmo episódio (mesmo animeId + episodeNumber) for encontrado na API,
 * a versão da API substituirá automaticamente a entrada manual.
 *
 * ✨ RECURSOS AUTOMÁTICOS:
 * - Imagem do anime (busca pela API usando animeId)
 * - Gêneros, temas e demografia (busca pela API)
 * - Badge "MANUAL" visual no card
 * - Substituição automática quando disponível na API
 *
 * 📚 DOCUMENTAÇÃO COMPLETA: /data/COMO_USAR.md
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export interface ManualEpisodeConfig {
  animeId: number; // MAL Anime ID (ex: 61930 de https://myanimelist.net/anime/61930)
  episodeNumber: number; // Número do episódio (ex: 1, 2, 3)
  episodeTitle: string; // Título do episódio (ex: "The World's Best")
  weekNumber: number; // Semana (1-13, Week 1 = 29 Set 2025)
  score: number; // Score do episódio (ex: 4.59)
  aired?: string; // OPCIONAL: Data de exibição (YYYY-MM-DD). Se não informado, usa início da semana
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📋 ADICIONE SEUS EPISÓDIOS MANUAIS AQUI
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 💡 EXEMPLO:
 * {
 *   animeId: 61930,                    // ID do MAL
 *   episodeNumber: 3,                   // EP 3
 *   episodeTitle: "The World's Best",   // Título
 *   weekNumber: 3,                      // Week 3
 *   score: 4.59                         // Score
 * }
 *
 * 📅 CALENDÁRIO DE SEMANAS FALL 2025:
 * Week 1:  29 Set - 05 Out 2025
 * Week 2:  06 Out - 12 Out 2025
 * Week 3:  13 Out - 19 Out 2025
 * Week 4:  20 Out - 26 Out 2025
 * Week 5:  27 Out - 02 Nov 2025
 * Week 6:  03 Nov - 09 Nov 2025
 * Week 7:  10 Nov - 16 Nov 2025
 * Week 8:  17 Nov - 23 Nov 2025
 * Week 9:  24 Nov - 30 Nov 2025
 * Week 10: 01 Dez - 07 Dez 2025
 * Week 11: 08 Dez - 14 Dez 2025
 * Week 12: 15 Dez - 21 Dez 2025
 * Week 13: 22 Dez - 28 Dez 2025
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  // ⬇️ ADICIONE EPISÓDIOS AQUI ⬇️

  {
    animeId: 61930,
    episodeNumber: 3,
    episodeTitle: "The World's Best",
    weekNumber: 3,
    score: 4.59,
  },
  {
    animeId: 60564,
    episodeNumber: 3,
    episodeTitle: "Chestnuts Roasting on an Open Fire",
    weekNumber: 3,
    score: 4.41,
  },
  {
    animeId: 54703,
    episodeNumber: 3,
    episodeTitle: "Mizuha",
    weekNumber: 3,
    score: 4.45,
  },
  {
    animeId: 47158,
    episodeNumber: 2,
    episodeTitle:
      "The Cousin I Haven`t Seen in Years Is Cold to Me",
    weekNumber: 2,
    score: 3.97,
  },
  {
    animeId: 47158,
    episodeNumber: 2,
    episodeTitle: "Only I Can Be a Pain to My Uncle`s Daughter",
    weekNumber: 3,
    score: 3.98,
  },

  // Adicione mais episódios acima desta linha...
  // ⬆️ FIM DA LISTA ⬆️
];