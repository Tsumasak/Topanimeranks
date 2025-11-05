# 🚀 Como Forçar uma Week a Aparecer (Para Testes)

## ⚠️ ATENÇÃO

Este guia é **APENAS PARA TESTES**. Em produção, aguarde o sync automático ou faça sync manual via edge function.

## 📋 Cenário

Você quer que a **Week 7** apareça imediatamente no controller, mas ela tem apenas 4 episódios com score.

## 🎯 Opção 1: Sync Manual via SQL (RECOMENDADO)

```sql
-- Fazer sync manual da Week 7
SELECT net.http_post(
  url := (SELECT value FROM app_config WHERE key = 'supabase_url') || 
         '/functions/v1/sync-anime-data',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
  ),
  body := jsonb_build_object(
    'sync_type', 'weekly_episodes',
    'week_number', 7
  ),
  timeout_milliseconds := 90000
) AS request_id;

-- Aguarde 30-60 segundos e veja o resultado:
SELECT 
  created,
  status_code,
  content::text as response
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;
```

**Logs esperados:**
```
📅 Auto-detected current week: 7
🔄 Starting to process 45 airing animes for week 7...
➕ CREATING Anime Name (anime_id: 12345, ep: 5, week: 7)
✅ NEW episodes created: 5
```

## 🎯 Opção 2: Aguardar Cron Job (AUTOMÁTICO)

O cron roda **a cada hora** no minuto :00.

**Próximo sync:** Ver no Supabase Dashboard → Database → Cron Jobs

```sql
-- Ver quando foi o último sync
SELECT 
  week_number,
  MAX(updated_at) as last_sync,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score
FROM weekly_episodes
WHERE week_number = 7
GROUP BY week_number;
```

## 🧪 Opção 3: Adicionar Episódios Manualmente (APENAS TESTES)

⚠️ **NÃO FAÇA ISSO EM PRODUÇÃO**

```sql
-- Ver quantos episódios Week 7 tem agora
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score
FROM weekly_episodes
WHERE week_number = 7
GROUP BY week_number;

-- Se tem 4 episódios, você precisa adicionar mais 1
-- EXEMPLO: Adicionar episódio fake para teste
INSERT INTO weekly_episodes (
  week_number,
  anime_id,
  anime_title_english,
  episode_number,
  episode_title,
  episode_score,
  aired_at,
  image_url,
  episode_url,
  anime_type,
  demographics,
  genres,
  themes,
  position_in_week,
  week_start_date,
  week_end_date
) VALUES (
  7,                          -- week_number
  99999,                      -- anime_id (fake)
  'Test Anime',               -- anime_title_english
  1,                          -- episode_number
  'Test Episode',             -- episode_title
  8.50,                       -- episode_score (COM SCORE!)
  '2025-11-10',               -- aired_at
  'https://cdn.myanimelist.net/images/anime/default.jpg', -- image_url
  'https://myanimelist.net/anime/99999', -- episode_url
  'TV',                       -- anime_type
  ARRAY['Shounen'],           -- demographics
  ARRAY['Action'],            -- genres
  ARRAY['School'],            -- themes
  999,                        -- position_in_week (será recalculado)
  '2025-11-10',               -- week_start_date
  '2025-11-16'                -- week_end_date
);

-- ⚠️ IMPORTANTE: DELETAR DEPOIS DO TESTE!
-- DELETE FROM weekly_episodes WHERE anime_id = 99999;
```

## ✅ Verificar se Funcionou

### 1. Contar episódios da Week 7

```sql
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score,
  CASE 
    WHEN COUNT(*) FILTER (WHERE episode_score IS NOT NULL) >= 5 THEN '✅ VISIBLE'
    ELSE '❌ HIDDEN'
  END as status
FROM weekly_episodes
WHERE week_number = 7
GROUP BY week_number;
```

**Resultado esperado:**
```
week_number | episodes_with_score | status
------------|---------------------|----------
     7      |         5           | ✅ VISIBLE
```

### 2. Verificar endpoint

```sql
SELECT net.http_get(
  url := (SELECT value FROM app_config WHERE key = 'supabase_url') || 
         '/functions/v1/make-server-c1d1bfd8/available-weeks',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
  )
) AS request_id;

-- Aguarde 2-3 segundos
SELECT 
  content::text 
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;
```

**Resultado esperado:**
```json
{
  "success": true,
  "weeks": [1, 2, 3, 4, 5, 6, 7],
  "latestWeek": 7,
  "weekCounts": [
    ...
    { "week": 7, "count": 5 }
  ]
}
```

### 3. Verificar no Frontend

1. **HomePage** → Ctrl+Shift+R (hard refresh)
   - Deve mostrar "Weekly Anime Episodes - Week 7"

2. **WeekControl** → Abrir página /ranks
   - Controller deve mostrar Week 7
   - Week 7 deve estar marcada como "current week" (fundo amarelo)

3. **Console do navegador**
   ```
   [HomePage] 🎯 Using latest week: Week 7 (auto-detected)
   [WeekControl] 🎯 Latest week detected: Week 7
   ```

## 🔄 Reverter Mudanças de Teste

Se você adicionou episódios fake:

```sql
-- Deletar episódios de teste
DELETE FROM weekly_episodes 
WHERE anime_id = 99999;

-- Recalcular positions
UPDATE weekly_episodes
SET position_in_week = subquery.new_position
FROM (
  SELECT 
    anime_id,
    episode_number,
    week_number,
    ROW_NUMBER() OVER (
      PARTITION BY week_number 
      ORDER BY episode_score DESC NULLS LAST, position_in_week
    ) as new_position
  FROM weekly_episodes
) subquery
WHERE weekly_episodes.anime_id = subquery.anime_id
  AND weekly_episodes.episode_number = subquery.episode_number
  AND weekly_episodes.week_number = subquery.week_number;
```

## 📚 Documentação Relacionada

- **Auto Week Detection**: `/supabase/AUTO_WEEK_DETECTION.md`
- **Weekly Sync Debug**: `/supabase/WEEKLY_SYNC_DEBUG.md`
- **Test Queries**: `/supabase/TEST_AUTO_WEEK.sql`

## 🎯 Resumo

**Produção (RECOMENDADO):**
1. Aguardar cron job (roda a cada hora)
2. OU fazer sync manual via SQL (opção 1)

**Teste (apenas desenvolvimento):**
1. Adicionar episódio fake via SQL (opção 3)
2. Verificar se Week 7 aparece
3. DELETAR o episódio fake depois

**Nunca:**
- ❌ Adicionar episódios fake em produção
- ❌ Modificar `CURRENT_WEEK_NUMBER` no código
- ❌ Fazer hard-coded de weeks
