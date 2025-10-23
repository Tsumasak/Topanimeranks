# Integração com API Jikan V4

Este projeto está integrado com a **API Jikan V4** (MyAnimeList API) para buscar dados reais de animes e episódios.

## Funcionalidades Implementadas

### 📺 Top Anime Ranks (Top Episodes)

- **Fonte de Dados**: Episódios de animes da Season Fall 2025
- **Organização**: Por semanas (Week 1: 29 Set - 05 Out, Week 2: 06 Out - 12 Out, etc.)
- **Ordenação**: Por score do episódio (1.00 - 5.00, maiores primeiro)
- **Links**: Cards levam para a página de episódios do anime no MAL, com paginação automática
  - Animes com ≤100 episódios: `/anime/{id}/episode`
  - Animes com >100 episódios: `/anime/{id}/episode?offset={calculated}`
  - Exemplo: One Piece EP 1150 vai para `/anime/21/episode?offset=1100`
- **Dados exibidos**:
  - Nome do anime
  - Número e título do episódio
  - Score do episódio (⭐ rating)
  - Tipo, demographics, genres, themes
  - Posição anterior (seta de mudança)

### ⭐ Most Anticipated Animes

- **Fonte de Dados**: Animes upcoming da API
- **Organização**: Por seasons (Fall 2025, Winter 2026, Spring 2026, Later)
- **Ordenação**: Por popularidade (número de membros no MAL)
- **Links**: Cards levam para a página principal do anime no MAL
  - Formato: `https://myanimelist.net/anime/{id}/{title-slug}`
  - Exemplo: `https://myanimelist.net/anime/21/One_Piece`
- **Dados exibidos**:
  - Nome do anime
  - Score (se disponível)
  - Número de membros
  - Synopsis
  - Tipo, demographics, genres, themes, studios

## Sistema de Cache

### Funcionamento
- **Duração**: 24 horas
- **Armazenamento**: localStorage do navegador
- **Limpeza automática**: Cache expira após 24h
- **Limpeza manual**: Opção no menu mobile (botão "Clear Cache")

### Benefícios
- Reduz chamadas à API
- Melhora performance
- Respeita rate limits
- Dados persistem entre sessões

## Rate Limiting

A API Jikan tem limite de **3 requisições por segundo**. O sistema implementa:

- **RateLimiter**: Fila de requisições com delay de 350ms entre cada
- **Processamento sequencial**: Evita sobrecarga da API
- **Retry automático**: Em caso de falhas temporárias

## Loading States

### Skeleton Loading
- Cards de loading enquanto dados são carregados
- Mantém layout consistente
- Experiência visual suave

### Error Handling
- Mensagens de erro amigáveis
- Botão de retry
- Logs detalhados no console

## Estrutura de Arquivos

```
/services
  ├── jikan.ts          # Serviço principal da API
  └── cache.ts          # Gerenciamento de cache

/types
  └── anime.ts          # TypeScript types

/components
  ├── AnimeCardSkeleton.tsx    # Loading states
  ├── WeekControl.tsx          # Página Top Episodes
  └── SeasonControl.tsx        # Página Most Anticipated
```

## Endpoints Utilizados

### Jikan API V4
- `GET /seasons/{year}/{season}` - Animes de uma season específica
- `GET /seasons/upcoming` - Animes futuros
- `GET /anime/{id}/episodes` - Episódios de um anime (primeira página)
- `GET /anime/{id}/episodes?page={n}` - Episódios com paginação
- `GET /anime/{id}` - Detalhes de um anime

### Paginação de Episódios
- A API retorna episódios em páginas de 100
- Para animes com muitos episódios (ex: One Piece), o sistema busca:
  1. Primeira página (episódios 1-100)
  2. Última página (episódios mais recentes)
- Isso otimiza chamadas e foca nos episódios atuais da temporada

## Limitações

1. **Dados de episódios limitados**: Apenas episódios com score são exibidos
2. **Top 20 animes**: Para evitar excesso de requisições, limitamos a 20 animes por season
3. **API externa**: Dependente da disponibilidade da API Jikan/MyAnimeList
4. **Rate limiting**: Carregamento pode ser lento em primeira visita (sem cache)

## Como Limpar o Cache

### Mobile
1. Abrir menu hamburger
2. Clicar em "Clear Cache"
3. Recarregar a página

### Manualmente (DevTools)
1. Abrir DevTools (F12)
2. Application > Local Storage
3. Deletar keys que começam com `jikan_` ou `anime_`

## Notas Técnicas

- Todas as datas estão em UTC
- Scores de episódios variam de 1.00 a 5.00
- Scores de animes variam de 0 a 10
- Imagens vêm em formato WebP (fallback para JPG)
- Cache usa timestamp Unix para validação
