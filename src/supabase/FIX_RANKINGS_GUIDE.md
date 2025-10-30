# 🔧 Guia de Correção dos Rankings

## Problema Identificado

Os episódios semanais estavam sendo atualizados com novos scores pelos cron jobs, mas as **posições no ranking** não estavam sendo recalculadas, causando ordem incorreta no frontend.

### Exemplo do Problema:
```
Week 3:
#5 - Score 4.42 ❌ (deveria ser #3)
#6 - Score 4.39 ❌ (deveria ser #4)  
#7 - Score 4.44 ❌ (deveria ser #1 - MAIOR SCORE!)
```

---

## ✅ Soluções Implementadas

### 1. **Edge Function Atualizada** (`/supabase/functions/sync-anime-data/index.ts`)

**O que foi adicionado:**
- Após fazer upsert de todos os episódios, a função agora:
  1. Busca TODOS os episódios da semana do banco
  2. Reordena por `episode_score` (descending)
  3. Recalcula `position_in_week` baseado na nova ordem
  4. Recalcula `trend` comparando com a semana anterior
  5. Atualiza apenas episódios cuja posição mudou

**Quando roda:**
- Automaticamente a cada hora quando o cron job sincroniza episódios semanais
- Garante que novos scores sempre resultam em posições corretas

### 2. **Server Query Otimizado** (`/supabase/functions/server/index.tsx`)

**O que foi mudado:**
```typescript
// ANTES:
.order('position_in_week', { ascending: true })

// DEPOIS:
.order('episode_score', { ascending: false })      // ← Primary sort
.order('position_in_week', { ascending: true })    // ← Fallback
```

**Benefício:**
- Mesmo se `position_in_week` estiver incorreto, o frontend sempre mostrará episódios ordenados por score
- Funciona como "double safety net"

---

## 🔨 Corrigir Dados Existentes

### Opção 1: Script SQL Automático (RECOMENDADO)

1. Abra o **Supabase SQL Editor**
2. Cole o conteúdo de `/supabase/RECALCULATE_POSITIONS.sql`
3. Execute o script
4. Verifique os resultados com a query de verificação no final

**O script fará:**
- ✅ Recalcular `position_in_week` para TODAS as semanas
- ✅ Recalcular `trend` baseado nas novas posições
- ✅ Mostrar resumo de mudanças antes de aplicar
- ✅ Verificar a correção na Week 3 como exemplo

### Opção 2: Forçar Re-sync via Cron

1. Aguarde o próximo cron job rodar (a cada hora)
2. A edge function atualizada automaticamente corrigirá as posições
3. **Desvantagem:** Só corrige uma semana por vez (a que estiver sendo sincronizada)

### Opção 3: Trigger Manual da Edge Function

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/sync-anime-data' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"syncType": "weekly_episodes"}'
```

---

## 📊 Verificar se está funcionando

### Query de Verificação Rápida:

```sql
-- Ver episódios da Week 3 ordenados corretamente
SELECT 
  position_in_week as "#",
  anime_title_english,
  episode_number as "EP",
  episode_score as "Score",
  trend
FROM weekly_episodes
WHERE week_number = 3
  AND episode_score IS NOT NULL
ORDER BY episode_score DESC  -- Ordem CORRETA
LIMIT 10;
```

**Resultado esperado:**
- Episódios com scores MAIORES devem ter posições MENORES (#1, #2, #3...)
- Exemplo: Score 4.44 deve ser #1, não #7

### Verificar Trends:

```sql
-- Ver distribuição de trends por semana
SELECT 
  week_number,
  COUNT(*) as total,
  COUNT(CASE WHEN trend = 'NEW' THEN 1 END) as new,
  COUNT(CASE WHEN trend LIKE '+%' THEN 1 END) as up,
  COUNT(CASE WHEN trend LIKE '-%' THEN 1 END) as down,
  COUNT(CASE WHEN trend = '=' THEN 1 END) as same
FROM weekly_episodes
WHERE episode_score IS NOT NULL
GROUP BY week_number
ORDER BY week_number;
```

---

## 🎯 Próximos Passos Recomendados

1. **Execute o SQL de recalculação AGORA** para corrigir dados históricos
2. **Deploy a edge function atualizada** (já está no código)
3. **Aguarde próximo cron job** e verifique que não há regressões
4. **Monitore logs** do cron job para ver mensagens "📊 Reranked..."

---

## 🐛 Debugging

### Ver logs do último sync:

```sql
SELECT 
  sync_type,
  status,
  week_number,
  items_synced,
  items_created,
  items_updated,
  duration_ms,
  created_at
FROM sync_logs
WHERE sync_type = 'weekly_episodes'
ORDER BY created_at DESC
LIMIT 5;
```

### Ver episódios com posições suspeitas:

```sql
-- Episódios onde posição não bate com score
WITH ranked AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY week_number ORDER BY episode_score DESC) as expected_position
  FROM weekly_episodes
  WHERE episode_score IS NOT NULL
)
SELECT 
  week_number,
  anime_title_english,
  position_in_week as current_rank,
  expected_position as should_be_rank,
  episode_score,
  (position_in_week - expected_position) as rank_difference
FROM ranked
WHERE position_in_week != expected_position
ORDER BY week_number, ABS(position_in_week - expected_position) DESC;
```

---

## ✨ Resultado Final

Após as correções:
- ✅ Rankings sempre refletem os scores reais
- ✅ Trends são calculados baseados nas posições corretas
- ✅ Cron jobs mantêm tudo atualizado automaticamente
- ✅ Frontend mostra ordem correta mesmo em casos edge

**Ordem correta da Week 3:**
```
#1 - Score 4.44 ✅ (A Mangaka's Weirdly Wonderful Workplace)
#2 - Score 4.42 ✅ (A Wild Last Boss Appeared!)
#3 - Score 4.39 ✅ (Ranma ½)
...
```
