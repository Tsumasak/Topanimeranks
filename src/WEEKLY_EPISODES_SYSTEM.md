# Sistema de Weekly Anime Episodes

## Visão Geral

Sistema completo de listagem de episódios semanais de anime, com dados salvos automaticamente no Supabase através de cron jobs que fazem sync a cada 10 minutos.

## Especificações Implementadas

### 1. Estrutura de Semanas ✅

- **Week 1**: 29 de setembro - 5 de outubro, 2025
- **Week 2**: 6 de outubro - 12 de outubro, 2025
- **Week 3**: 13 de outubro - 19 de outubro, 2025
- **Week 4**: 20 de outubro - 26 de outubro, 2025
- **Week 5**: 27 de outubro - 2 de novembro, 2025 (atual)

- Semanas começam na segunda-feira e terminam no domingo
- Cálculo dinâmico baseado na data de início (29 de setembro, 2025)

### 2. Regras de Ranking ✅

1. ✅ **Dividido por semanas**: Tabs separadas para cada semana
2. ✅ **1 episódio por anime por semana**: Sistema garante apenas 1 episódio de cada anime em cada semana
3. ✅ **Episódios N/A no final**: Ordenação coloca episódios sem score no final
4. ✅ **Ranking por episode score**: Ordenação primária por score do episódio (não do anime)
5. ✅ **Filtro de 5000+ membros**: Apenas animes com 5.000+ membros no MAL aparecem
6. ✅ **Multiple episodes ao longo das semanas**: Cada anime pode ter episódios em múltiplas semanas

### 3. HomePage - Weekly Episodes Section ✅

- Mostra os top 3 episódios da semana atual (Week 5)
- **Fallback inteligente**: Se Week 5 tiver menos de 3 episódios, mostra Week 4
- Exibe o período da semana dinamicamente (ex: "Airing - October 27 - November 02, 2025")

### 4. TopEpisodesPage ✅

- Sistema de tabs navegável entre semanas
- Infinite scroll para carregar mais episódios
- Indicador de posição change (↑/↓) comparando com semana anterior
- Design responsivo (tabs no desktop, dropdown + arrows no mobile)
- Animações suaves na troca de semanas

## Arquitetura Técnica

### Frontend

**Arquivos principais:**

- `/config/weeks.ts` - Configuração de semanas e cálculo dinâmico
- `/pages/HomePage.tsx` - Seção de Weekly Episodes (top 3)
- `/pages/TopEpisodesPage.tsx` - Listagem completa com tabs
- `/components/WeekControl.tsx` - Controle de navegação entre semanas
- `/services/supabase.ts` - Service para buscar dados do Supabase

### Backend

**Edge Function: sync-anime-data**

Localização: `/supabase/functions/sync-anime-data/index.ts`

**Função `syncWeeklyEpisodes`:**

1. Calcula datas da semana (Monday-Sunday)
2. Busca animes da temporada Fall 2025
3. Filtra por:
   - `members >= 5000`
   - `status === 'Currently Airing'`
4. Para cada anime, busca episódios que aired naquela semana
5. Garante apenas 1 episódio por anime por semana
6. Ordena por:
   - Episode score (descendente, N/A no final)
   - Members (tiebreaker)
7. Salva no Supabase com `position_in_week`

### Database

**Tabela: `weekly_episodes`**

```sql
CREATE TABLE weekly_episodes (
  id UUID PRIMARY KEY,
  anime_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  episode_id TEXT NOT NULL UNIQUE,
  anime_title TEXT NOT NULL,
  anime_image_url TEXT,
  score NUMERIC(4, 2),           -- Episode score
  members INTEGER,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  position_in_week INTEGER,
  -- ... outros campos
  CONSTRAINT unique_episode_week UNIQUE (episode_id, week_number)
);
```

**Indexes:**

- `idx_weekly_episodes_week` - Busca por semana
- `idx_weekly_episodes_score` - Ordenação por score
- `idx_weekly_episodes_aired` - Filtro por data aired

## Sync Automático

### Cron Job (a cada 10 minutos)

```sql
SELECT cron.schedule(
  'sync-weekly-episodes',
  '*/10 * * * *',  -- A cada 10 minutos
  $$
  SELECT net.http_post(
    url := 'https://[project-id].supabase.co/functions/v1/sync-anime-data',
    body := '{"sync_type": "weekly_episodes"}'
  )
  $$
);
```

### Sync Manual (opcional)

```typescript
await SupabaseService.triggerManualSync('weekly_episodes');
```

## API Endpoints

### GET `/make-server-c1d1bfd8/weekly-episodes/:weekNumber`

**Resposta:**

```json
{
  "success": true,
  "data": [
    {
      "episode_id": "123_4",
      "anime_id": 123,
      "anime_title": "Anime Name",
      "episode_number": 4,
      "score": 8.5,
      "members": 50000,
      "week_number": 5,
      "position_in_week": 1
      // ... outros campos
    }
  ],
  "count": 20
}
```

## Fluxo de Dados

```
┌─────────────────┐
│  Jikan API      │  ← Fonte de dados
└────────┬────────┘
         │ (a cada 10 min)
         ↓
┌─────────────────┐
│  Sync Function  │  ← Processa e filtra
│  (Edge Function)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Supabase DB    │  ← Armazena dados
│  (weekly_       │
│   episodes)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Frontend       │  ← Exibe para usuário
│  (React)        │
└─────────────────┘
```

## Casos de Uso

### HomePage

```typescript
// Carrega Week 5, fallback para Week 4 se necessário
const weekData = await SupabaseService.getWeeklyEpisodes(CURRENT_WEEK_NUMBER);
if (weekData.episodes.length < 3) {
  weekData = await SupabaseService.getWeeklyEpisodes(CURRENT_WEEK_NUMBER - 1);
}
```

### TopEpisodesPage

```typescript
// Carrega week específica
const weekData = await SupabaseService.getWeeklyEpisodes(weekNumber);

// Compara com semana anterior para position change
const prevWeekData = await SupabaseService.getWeeklyEpisodes(weekNumber - 1);
const positionChange = calculatePositionChange(episode, rank, prevWeekData.episodes);
```

## Checklist de Funcionalidades

- [x] Sistema de semanas (Monday-Sunday)
- [x] Week 1 inicia em 29 de setembro, 2025
- [x] Apenas 1 episódio por anime por semana
- [x] Ranking por episode score
- [x] N/A no final da listagem
- [x] Filtro de 5000+ members
- [x] HomePage mostra Week 5 (fallback Week 4)
- [x] TopEpisodesPage com tabs navegáveis
- [x] Position change indicator
- [x] Infinite scroll
- [x] Design responsivo
- [x] Auto-sync a cada 10 minutos
- [x] Suporte a múltiplas semanas

## Próximos Passos (Opcional)

1. Adicionar cache no frontend para evitar refetches desnecessários
2. Implementar filtros por gênero/demografia
3. Adicionar busca de episódios
4. Notificações de novos episódios
5. Histórico de position changes ao longo das semanas

## Troubleshooting

### Problema: Sem dados nas semanas

**Solução:**
```sql
-- Verificar última sync
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;

-- Trigger manual sync
SELECT trigger_manual_sync('weekly_episodes');
```

### Problema: Episódios duplicados

**Solução:** O sistema garante apenas 1 episódio por anime via `processedAnimeIds.add(anime.mal_id)` na função de sync.

### Problema: Scores não atualizando

**Solução:** Cron job atualiza automaticamente a cada 10 minutos. Força sync manual se necessário.

## Notas Importantes

- ⚠️ Episode score pode ser `null` (N/A) em episódios recém-lançados
- ⚠️ Members count é do anime, não do episódio específico
- ⚠️ Datas usam UTC timezone para evitar inconsistências
- ⚠️ Semana atual (Week 5) pode ter poucos episódios no início da semana

## Data de Implementação

27 de outubro, 2025 (Segunda-feira - Week 5 Day 1)
