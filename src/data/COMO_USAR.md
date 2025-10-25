# Como Adicionar Episódios Manuais

## 📝 Resumo Rápido

Adicione episódios que ainda não estão no Jikan API editando o arquivo `/data/manual-episodes.ts`

## 🚀 Passo a Passo

### 1. Encontre o ID do Anime no MyAnimeList

1. Acesse [MyAnimeList](https://myanimelist.net)
2. Busque pelo anime
3. Copie o ID da URL:
   - Exemplo: `https://myanimelist.net/anime/61930/Tsuma_Shougakusei_ni_Naru`
   - O ID é: **61930**

### 2. Edite o Arquivo de Episódios Manuais

Abra `/data/manual-episodes.ts` e adicione seu episódio:

```typescript
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  {
    animeId: 61930,                      // ID do anime no MAL
    episodeNumber: 3,                     // Número do episódio
    episodeTitle: "The World's Best",     // Título do episódio
    weekNumber: 3,                        // Semana (1-13)
    score: 4.59                           // Score do episódio
  }
  // Adicione mais episódios aqui...
];
```

### 3. Campos Obrigatórios

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `animeId` | ID do anime no MAL | `61930` |
| `episodeNumber` | Número do episódio | `3` |
| `episodeTitle` | Título do episódio | `"The World's Best"` |
| `weekNumber` | Semana (1-13, sendo Week 1 = 29 Set 2025) | `3` |
| `score` | Score do episódio | `4.59` |

### 4. Campos Opcionais

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `aired` | Data de exibição (YYYY-MM-DD) | `"2025-10-15"` |

Se não informar `aired`, será usada a data de início da semana (segunda-feira).

## ✅ O Que Acontece Automaticamente

1. ✅ **Imagem do anime** - Busca automaticamente pelo ID
2. ✅ **Gêneros e Tags** - Busca automaticamente
3. ✅ **Demografia** - Busca automaticamente (Shounen, Seinen, etc)
4. ✅ **Tipo** - TV, ONA, Movie, etc
5. ✅ **Badge "MANUAL"** - Aparece automaticamente no card
6. ✅ **Substituição pela API** - Quando o episódio estiver no Jikan, substitui automaticamente

## 🔄 Substituição Automática

Quando a API Jikan retornar o mesmo episódio (mesmo anime + mesmo número), o episódio manual será **automaticamente substituído** pela versão da API.

Isso garante que os dados manuais sejam temporários.

## 💡 Exemplo Completo

```typescript
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  // Episódio 3 - Tsuma, Shougakusei ni Naru
  {
    animeId: 61930,
    episodeNumber: 3,
    episodeTitle: "The World's Best",
    weekNumber: 3,
    score: 4.59
  },
  
  // Episódio 1 - Outro anime (com data customizada)
  {
    animeId: 54857,
    episodeNumber: 1,
    episodeTitle: "The Beginning",
    weekNumber: 1,
    score: 4.85,
    aired: "2025-09-29"  // Data customizada (opcional)
  }
];
```

## 🗑️ Limpando Cache

Se você adicionar episódios manuais e não ver as mudanças:

1. Abra o DevTools do navegador (F12)
2. Vá em **Application → Local Storage**
3. Limpe o cache da semana específica
4. Ou aumente o `CACHE_VERSION` em `/services/jikan.ts`

## 📊 Calendário de Semanas Fall 2025

| Semana | Início (Segunda) | Fim (Domingo) |
|--------|------------------|---------------|
| Week 1 | 29 Set 2025 | 05 Out 2025 |
| Week 2 | 06 Out 2025 | 12 Out 2025 |
| Week 3 | 13 Out 2025 | 19 Out 2025 |
| Week 4 | 20 Out 2025 | 26 Out 2025 |
| Week 5 | 27 Out 2025 | 02 Nov 2025 |
| Week 6 | 03 Nov 2025 | 09 Nov 2025 |
| Week 7 | 10 Nov 2025 | 16 Nov 2025 |
| Week 8 | 17 Nov 2025 | 23 Nov 2025 |
| Week 9 | 24 Nov 2025 | 30 Nov 2025 |
| Week 10 | 01 Dez 2025 | 07 Dez 2025 |
| Week 11 | 08 Dez 2025 | 14 Dez 2025 |
| Week 12 | 15 Dez 2025 | 21 Dez 2025 |
| Week 13 | 22 Dez 2025 | 28 Dez 2025 |

## ⚠️ Regras Importantes

1. ✅ **Apenas animes com 20.000+ membros** aparecem no ranking
2. ✅ **Apenas 1 episódio por anime** é mostrado (o de maior score)
3. ✅ **Episódios manuais competem com os da API** - quem tiver maior score ganha
4. ✅ **API sempre substitui manual** quando encontra o mesmo episódio

## 🎨 Visual

Episódios manuais terão um badge azul **"MANUAL"** no canto superior direito do card, próximo às tags de tipo e demografia.
