# 🔧 Troubleshooting: Rankings Incorretos

## 🚨 Sintomas do Problema

Se você está vendo rankings estranhos como:

```
EP 4 - Score 4.30 - Rank #234 - Trend ▼211
EP 3 - Score 4.31 - Rank #227 - Trend ▼205  
EP 2 - Score 4.13 - Rank #329 - Trend ▼319
EP 1 - Score 4.03 - Rank #10  - Trend NEW
```

**Sinais de alerta:**
- ❌ Rankings muito altos (#200+)
- ❌ Trend indicators absurdos (▼211, ▼319)
- ❌ Episódios com scores melhores têm ranks piores
- ❌ EP1 com rank melhor que episódios posteriores

## 🔍 Causa Raiz

A função `update-weekly-episodes` estava calculando rankings baseado APENAS em `week_number`, **sem filtrar por `season` e `year`**.

### Exemplo do Problema:

```sql
-- ❌ QUERY INCORRETA (mistura temporadas):
SELECT * FROM weekly_episodes
WHERE week_number = 4;
-- Retorna: Week 4 de Winter 2026 + Week 4 de Fall 2025 + Week 4 de Summer 2025
-- Total: 300+ episódios! Por isso ranks de #200+

-- ✅ QUERY CORRETA (separa por temporada):
SELECT * FROM weekly_episodes
WHERE week_number = 4
  AND season = 'winter'
  AND year = 2026;
-- Retorna: Apenas Week 4 de Winter 2026
-- Total: ~20-30 episódios (correto!)
```

## ✅ Solução Implementada

### 1. **Correção na Edge Function** ✅

**Arquivo:** `/supabase/functions/update-weekly-episodes/index.ts`

**Mudanças:**

```typescript
// ANTES (linha 172-175) ❌:
const { data: updatedEpisodes } = await supabase
  .from('weekly_episodes')
  .select('*')
  .eq('week_number', weekNumber);  // ❌ Sem filtro de season/year!

// DEPOIS ✅:
const { data: updatedEpisodes } = await supabase
  .from('weekly_episodes')
  .select('*')
  .eq('week_number', weekNumber)
  .eq('season', 'winter')         // ✅ Filtra por season
  .eq('year', 2026);               // ✅ Filtra por year
```

**Também na busca de trend anterior (linha 196-203):**

```typescript
// ANTES ❌:
const { data: prevEpisode } = await supabase
  .from('weekly_episodes')
  .select('position_in_week')
  .eq('anime_id', episode.anime_id)
  .eq('episode_number', episode.episode_number)
  .eq('week_number', weekNumber - 1);  // ❌ Sem filtro!

// DEPOIS ✅:
const { data: prevEpisode } = await supabase
  .from('weekly_episodes')
  .select('position_in_week')
  .eq('anime_id', episode.anime_id)
  .eq('episode_number', episode.episode_number)
  .eq('season', 'winter')              // ✅ Filtro adicionado
  .eq('year', 2026)                     // ✅ Filtro adicionado
  .eq('week_number', weekNumber - 1);
```

### 2. **Script SQL de Correção** ✅

**Arquivo:** `/supabase/FIX_RANKINGS_BY_SEASON_YEAR.sql`

Este script recalcula TODOS os rankings existentes no banco:

- ✅ Agrupa por `season + year + week_number`
- ✅ Recalcula `position_in_week` corretamente
- ✅ Recalcula `trend` dentro da mesma temporada
- ✅ Mostra logs detalhados das correções
- ✅ Exibe resumo por temporada

## 🚀 Como Aplicar a Correção

### Passo 1: Aplicar o SQL de Correção

Execute no Supabase SQL Editor:

```bash
# No dashboard do Supabase:
1. Vá para SQL Editor
2. Abra o arquivo: /supabase/FIX_RANKINGS_BY_SEASON_YEAR.sql
3. Execute o script completo
4. Verifique os logs de correção
```

**Saída esperada:**
```
🔄 Starting rankings recalculation by season/year/week...
📅 Processing: winter 2026
  📊 Week 1: Recalculating positions...
  ✅ Week 1: Updated 25 episodes
  📊 Week 2: Recalculating positions...
  ✅ Week 2: Updated 28 episodes
  ...
✅ Completed: winter 2026
🎉 Rankings recalculation completed successfully!
```

### Passo 2: Redeploy da Edge Function

```bash
# Se você fez alterações na função:
supabase functions deploy update-weekly-episodes

# Teste manualmente:
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/update-weekly-episodes \
  -H "Authorization: Bearer [ANON_KEY]"
```

### Passo 3: Verificar os Resultados

Execute no SQL Editor:

```sql
-- Verificar rankings da Week 4 (Winter 2026)
SELECT 
  position_in_week as rank,
  trend,
  anime_title_english,
  episode_number,
  episode_score,
  season,
  year
FROM weekly_episodes
WHERE season = 'winter'
  AND year = 2026
  AND week_number = 4
  AND position_in_week <= 20
ORDER BY position_in_week;
```

**Resultado esperado:**
```
rank | trend | anime_title_english   | episode | score | season | year
-----|-------|----------------------|---------|-------|--------|------
1    | +2    | Frieren              | 4       | 4.85  | winter | 2026
2    | -1    | Dandadan             | 4       | 4.78  | winter | 2026
3    | NEW   | Solo Leveling        | 4       | 4.72  | winter | 2026
...
```

## 🔍 Verificações de Saúde

### Query 1: Verificar se ainda existem ranks muito altos

```sql
SELECT 
  season,
  year,
  week_number,
  MAX(position_in_week) as worst_rank,
  COUNT(*) as total_episodes
FROM weekly_episodes
GROUP BY season, year, week_number
HAVING MAX(position_in_week) > 100  -- ❌ Não deveria existir!
ORDER BY worst_rank DESC;
```

**Resultado esperado:** `(0 rows)` - Nenhum resultado!

### Query 2: Verificar trends absurdos

```sql
SELECT 
  season,
  year,
  week_number,
  anime_title_english,
  episode_number,
  trend,
  position_in_week
FROM weekly_episodes
WHERE trend ~ '^[+-][0-9]{3,}'  -- Trends com 3+ dígitos (ex: ▼211)
ORDER BY season, year, week_number;
```

**Resultado esperado:** `(0 rows)` - Nenhum resultado!

### Query 3: Verificar consistência de scores vs ranks

```sql
-- Listar top 10 de uma semana específica
SELECT 
  position_in_week,
  episode_score,
  anime_title_english,
  episode_number
FROM weekly_episodes
WHERE season = 'winter'
  AND year = 2026
  AND week_number = 4
ORDER BY position_in_week
LIMIT 10;
```

**Resultado esperado:** 
- ✅ `position_in_week` começa em 1
- ✅ `episode_score` em ordem decrescente
- ✅ Sem "saltos" estranhos nos ranks

## 📊 Prevenção Futura

### ✅ Checklist para Novas Functions:

Ao criar/modificar functions que lidam com rankings:

- [ ] Sempre filtrar por `season`, `year` E `week_number` juntos
- [ ] Testar com dados de múltiplas temporadas
- [ ] Verificar se trends são calculados dentro da mesma temporada
- [ ] Adicionar logs detalhados de cada etapa
- [ ] Validar resultados antes de commit

### ✅ Exemplo de Query Segura:

```typescript
// ✅ SEMPRE use todos os 3 filtros:
const { data } = await supabase
  .from('weekly_episodes')
  .select('*')
  .eq('season', season)         // ✅
  .eq('year', year)              // ✅
  .eq('week_number', weekNum)    // ✅
  .order('episode_score', { ascending: false });
```

## 🆘 Se o Problema Persistir

1. **Verifique se a function foi deployada:**
   ```bash
   supabase functions list
   ```

2. **Verifique os logs da function:**
   ```bash
   supabase functions logs update-weekly-episodes
   ```

3. **Execute o SQL de correção novamente:**
   - Pode ser executado múltiplas vezes sem problemas
   - É idempotente e seguro

4. **Force um recalcuamento manual:**
   ```bash
   # Trigger manualmente a function
   curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/update-weekly-episodes \
     -H "Authorization: Bearer [ANON_KEY]"
   ```

## 📝 Notas Importantes

- ⚠️ Este problema afetava APENAS o cálculo de `position_in_week` e `trend`
- ✅ Os `episode_score` não foram afetados (vêm direto do MAL/Jikan)
- ✅ Os dados de `season`, `year`, `week_number` estavam corretos
- ✅ O problema era puramente na lógica de ranking

## ✅ Resolução Final

Após aplicar a correção:
- ✅ Rankings agora estão na faixa esperada (#1-#30 por semana)
- ✅ Trends são realistas (geralmente -5 a +5)
- ✅ Episódios com scores maiores têm ranks melhores
- ✅ Cada temporada tem seu próprio ranking isolado
