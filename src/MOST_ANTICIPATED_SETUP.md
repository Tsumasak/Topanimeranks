# Most Anticipated Anime - Sistema Completo

## Visão Geral

O sistema de Most Anticipated Anime busca e exibe animes mais aguardados das próximas temporadas, com dados sincronizados automaticamente do Jikan API para o Supabase.

## Temporadas Configuradas

### 1. **Fall 2025** (Atual)
- **Status**: Atualmente em exibição
- **Filtro**: Animes com 20.000+ membros no MAL
- **Ordenação**: Por score e membros
- **Cron Job**: `sync-season-rankings` (Fall 2025)

### 2. **Winter 2026** 
- **Período**: Janeiro - Março 2026
- **Exibição**: HomePage (seção Most Anticipated)
- **Filtro**: Animes com 20.000+ membros no MAL
- **Cron Job**: `sync-winter-2026`

### 3. **Spring 2026**
- **Período**: Abril - Junho 2026
- **Exibição**: MostAnticipatedPage (aba Spring 2026)
- **Filtro**: Animes com 20.000+ membros no MAL
- **Cron Job**: `sync-spring-2026`

### 4. **Later** (Summer 2026+)
- **Período**: Julho 2026 em diante
- **Exibição**: MostAnticipatedPage (aba Later)
- **Filtro**: Todos os animes de Summer 2026+ que não estão nas outras abas
- **Cron Job**: `sync-summer-2026`

## Estrutura do Sistema

### Frontend

#### HomePage (`/pages/HomePage.tsx`)
- **Seção**: "Most Anticipated Animes - Winter 2026"
- **Cards**: Top 3 animes do Winter 2026
- **Dados**: Busca via `SupabaseService.getSeasonRankings('winter', 2026)`

#### MostAnticipatedPage (`/pages/MostAnticipatedPage.tsx`)
- **Componente**: `SeasonControl`
- **Abas**: Fall 2025, Winter 2026, Spring 2026, Later

#### SeasonControl (`/components/SeasonControl.tsx`)
- **Função**: Controla a navegação entre temporadas
- **Transformação**: Converte `JikanAnimeData` → `AnticipatedAnime`
- **Aba Later**: Usa `SupabaseService.getLaterAnimes()` para buscar animes de Summer 2026+

### Backend

#### Supabase Service (`/services/supabase.ts`)

**Funções principais:**

1. `getSeasonRankings(season, year)` - Busca animes de uma temporada específica
2. `getLaterAnimes()` - Busca todos os animes de Summer 2026 em diante
3. `getAnticipatedAnimes()` - Função legada (ainda presente mas não utilizada)

#### Edge Function (`/supabase/functions/sync-anime-data/index.ts`)

**Função**: `syncSeasonRankings(supabase, season, year)`

- Busca animes do Jikan API: `/seasons/{year}/{season}`
- Filtro: `members >= 20000`
- Ordenação: Por score (desc) e membros (desc)
- Armazena na tabela `season_rankings`

### Database

#### Tabela: `season_rankings`

```sql
CREATE TABLE season_rankings (
  id BIGSERIAL PRIMARY KEY,
  anime_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  title_english TEXT,
  image_url TEXT,
  score NUMERIC,
  scored_by INTEGER,
  members INTEGER,
  favorites INTEGER,
  popularity INTEGER,
  rank INTEGER,
  type TEXT,
  status TEXT,
  rating TEXT,
  source TEXT,
  episodes INTEGER,
  aired_from TEXT,
  aired_to TEXT,
  duration TEXT,
  demographics JSONB DEFAULT '[]',
  genres JSONB DEFAULT '[]',
  themes JSONB DEFAULT '[]',
  studios JSONB DEFAULT '[]',
  synopsis TEXT,
  season TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anime_id, season, year)
);
```

### Cron Jobs

Todos os jobs rodam a cada 10 minutos:

1. **sync-season-rankings** - Fall 2025
2. **sync-winter-2026** - Winter 2026
3. **sync-spring-2026** - Spring 2026
4. **sync-summer-2026** - Summer 2026 (para aba "Later")

## Configuração das Temporadas

### config/seasons.ts

```typescript
export const SEASONS_DATA: SeasonData[] = [
  {
    id: 'fall2025',
    label: 'Fall 2025',
    title: 'Fall 2025',
    period: 'October - December 2025',
    year: 2025,
  },
  {
    id: 'winter2026',
    label: 'Winter 2026',
    title: 'Winter 2026',
    period: 'January - March 2026',
    year: 2026,
  },
  {
    id: 'spring2026',
    label: 'Spring 2026',
    title: 'Spring 2026',
    period: 'April - June 2026',
    year: 2026,
  },
  {
    id: 'later',
    label: 'Later',
    title: 'Later',
    period: 'Summer 2026 and Beyond',
    year: 2026,
  },
];
```

## Fluxo de Dados

1. **Sync (Backend)**
   ```
   Cron Job → Edge Function → Jikan API → Database (season_rankings)
   ```

2. **Display (Frontend)**
   ```
   Component → SupabaseService → Database → Transform → UI
   ```

## Lógica da Aba "Later"

A aba "Later" mostra todos os animes de Summer 2026 em diante que ainda não foram exibidos:

```typescript
// Query SQL (simplificado)
SELECT * FROM season_rankings
WHERE (year = 2026 OR year > 2026)
  AND season NOT IN ('fall', 'winter', 'spring')
ORDER BY members DESC, score DESC
```

Isso garante que:
- Animes de Summer 2026, Fall 2026, Winter 2027, etc. apareçam
- Não haja duplicação com as temporadas anteriores

## Manutenção

### Adicionar Nova Temporada

1. Atualizar `config/seasons.ts` com a nova temporada
2. Criar novo cron job em `/supabase/migrations/`
3. Atualizar `parseSeasonId()` no `SeasonControl.tsx` se necessário

### Ajustar Filtro de Membros

Editar linha 263 em `/supabase/functions/sync-anime-data/index.ts`:

```typescript
.filter((anime: any) => anime.members >= 20000) // Alterar valor aqui
```

### Verificar Status do Sync

```typescript
import { SupabaseService } from './services/supabase';

const status = await SupabaseService.getSyncStatus();
console.log(status);
```

## Troubleshooting

### Animes não aparecem na HomePage
- Verificar se o cron `sync-winter-2026` está rodando
- Verificar se há dados na tabela: `SELECT * FROM season_rankings WHERE season='winter' AND year=2026`

### Aba "Later" vazia
- Verificar se o cron `sync-summer-2026` está rodando
- Verificar query em `getLaterAnimes()` no `supabase.ts`

### Erro de transformação de dados
- Verificar console para logs de "Invalid anime data"
- Garantir que todos os campos obrigatórios (`id`, `title`, `imageUrl`, `members`) estão presentes

## Próximos Passos

- [ ] Adicionar Fall 2026 quando chegar a hora
- [ ] Implementar cache de imagens
- [ ] Adicionar filtros por gênero/demografia
- [ ] Implementar busca por título
