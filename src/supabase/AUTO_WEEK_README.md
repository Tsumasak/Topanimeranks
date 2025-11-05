# 🚀 Sistema de Detecção Automática de Weeks

## ✨ O que mudou?

Antes, você precisava atualizar manualmente a constante `CURRENT_WEEK_NUMBER` no código toda semana.

**AGORA**: O sistema detecta automaticamente qual week deve aparecer baseado nos dados reais do banco! 🎉

## 🎯 Como funciona?

### Regras de Visibilidade

Uma week aparece no controller E na home APENAS se:
- ✅ Tiver **5 ou mais episódios** 
- ✅ Esses episódios tiverem **score** (não podem ser N/A)

### Exemplo Prático

```
Week 6: 12 episódios com score ✅ → APARECE no controller e na home
Week 7: 4 episódios com score ❌ → NÃO APARECE (ainda)

[Alguns animes lançam episódios durante a semana]

Week 7: 5 episódios com score ✅ → AUTOMATICAMENTE APARECE! 🎉
```

## 📋 Como testar?

### 1. Via SQL (Supabase SQL Editor)

Abra `/supabase/TEST_AUTO_WEEK.sql` e execute as queries.

**Query rápida para ver status:**
```sql
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score,
  CASE 
    WHEN COUNT(*) FILTER (WHERE episode_score IS NOT NULL) >= 5 THEN '✅ VISIBLE'
    ELSE '❌ HIDDEN'
  END as status
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

### 2. Via API (Browser ou Postman)

```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Resposta esperada:**
```json
{
  "success": true,
  "weeks": [1, 2, 3, 4, 5, 6],
  "latestWeek": 6,
  "weekCounts": [
    { "week": 1, "count": 45 },
    { "week": 2, "count": 42 },
    ...
    { "week": 6, "count": 12 }
  ]
}
```

### 3. Via Frontend

1. Abra a **HomePage** → Deve mostrar a latest week automaticamente
2. Vá para **Weekly Anime Episodes** → Controller deve mostrar apenas weeks com 5+ episódios
3. Abra o **Console do navegador** → Veja os logs de detecção

## 📊 Logs para Monitoramento

### Server Logs (Supabase Edge Functions)

```
[Server] 📊 Weeks with scored episodes: Week 1: 45 episodes, Week 2: 42 episodes, ...
[Server] ✅ Available weeks (5+ episodes with score): 1, 2, 3, 4, 5, 6
[Server] 🎯 Latest week with 5+ scored episodes: Week 6
```

### Frontend Logs (Browser Console)

**WeekControl:**
```
[WeekControl] 🔍 Starting to load available weeks (5+ scored episodes filter)...
[WeekControl] ✅ Received 6 weeks with 5+ scored episodes: ['week1', 'week2', ...]
[WeekControl] 🎯 Latest week detected: Week 6
[WeekControl] 📌 Defaulting to Week 6 (latest with 5+ scored episodes)
```

**HomePage:**
```
[HomePage] 🎯 Using latest week: Week 6 (auto-detected)
[HomePage] ✅ Loaded 3 episodes from Week 6
```

## 🔄 Sync de Episódios

Os episódios são sincronizados automaticamente:
- ⏰ **A cada hora** via cron job
- 📅 **Detecta automaticamente** qual é a week atual
- ➕ **Adiciona novos animes** que lançam durante a semana
- 🔄 **Atualiza scores** de episódios existentes

Ver documentação completa: `/supabase/WEEKLY_SYNC_DEBUG.md`

## ⚙️ Configuração

### Constante de Fallback

Arquivo: `/config/weeks.ts`

```typescript
// Usada APENAS como fallback se o servidor falhar
export const CURRENT_WEEK_NUMBER = 5;
```

**⚠️ IMPORTANTE:** 
- Esta constante NÃO controla mais qual week aparece
- É apenas um fallback de segurança
- O sistema usa detecção automática

### Endpoint

Arquivo: `/supabase/functions/server/index.tsx`

```typescript
app.get("/make-server-c1d1bfd8/available-weeks", ...)
```

Este endpoint:
- Busca todos os episódios do banco
- Filtra apenas episódios COM SCORE
- Conta episódios por week
- Retorna weeks com 5+ episódios
- Define a "latest week"

## 🚀 Deploy

Após modificar a lógica:

```bash
# 1. Deploy da Edge Function
supabase functions deploy server

# 2. Pronto! ✅
```

**Não precisa:**
- ❌ Migrations SQL
- ❌ Deploy frontend
- ❌ Atualizar constantes manualmente
- ❌ Reiniciar nada

## 🐛 Troubleshooting

### Week 7 não aparece mesmo tendo episódios

**Possíveis causas:**

1. **Menos de 5 episódios com score**
   ```sql
   SELECT COUNT(*) FILTER (WHERE episode_score IS NOT NULL)
   FROM weekly_episodes
   WHERE week_number = 7;
   ```
   - Se retornar < 5, precisa adicionar mais episódios

2. **Episódios sem score (N/A)**
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as with_score,
     COUNT(*) FILTER (WHERE episode_score IS NULL) as without_score
   FROM weekly_episodes
   WHERE week_number = 7;
   ```
   - Episódios N/A não contam para o limite de 5

3. **Cache do navegador**
   - Ctrl+Shift+R (hard refresh)
   - Limpar cache do navegador

4. **Edge Function não foi deployada**
   ```bash
   supabase functions deploy server
   ```

### HomePage mostra week errada

**Verificar:**

1. **Endpoint retornando corretamente**
   - Abrir DevTools → Network
   - Procurar chamada para `/available-weeks`
   - Ver a `latestWeek` no response

2. **Logs do console**
   ```
   [HomePage] 🎯 Using latest week: Week X (auto-detected)
   ```

3. **Fallback sendo usado**
   ```
   [HomePage] ⚠️ Could not detect latest week, falling back to Week 1
   ```
   - Se aparecer isso, há problema na API

### Controller mostra weeks erradas

**Verificar:**

1. **Quais weeks o servidor está retornando**
   ```
   [WeekControl] ✅ Received X weeks with 5+ scored episodes: [...]
   ```

2. **Week counts no response**
   - Deve ter `weekCounts` mostrando contagem real

3. **Se todas as weeks aparecem**
   - Significa que a filtragem não está funcionando
   - Verificar se o deploy foi feito

## 📚 Documentação Relacionada

- **Detecção Automática**: `/supabase/AUTO_WEEK_DETECTION.md`
- **Sync de Episódios**: `/supabase/WEEKLY_SYNC_DEBUG.md`
- **Testes SQL**: `/supabase/TEST_AUTO_WEEK.sql`
- **Controller Pattern**: `/guidelines/CONTROLLER_PATTERN.md`

## ✅ Checklist de Funcionamento

- [ ] Edge Function deployada
- [ ] SQL query retorna weeks corretas
- [ ] Endpoint `/available-weeks` retorna `latestWeek`
- [ ] HomePage mostra a latest week
- [ ] Controller mostra apenas weeks com 5+ episódios
- [ ] Logs aparecem corretamente no console
- [ ] Week 7 aparece automaticamente quando atingir 5+ episódios

## 🎉 Benefícios

✅ **Zero manutenção**: Novas weeks aparecem automaticamente
✅ **Baseado em dados reais**: Não depende de configuração manual
✅ **Seguro**: Apenas weeks com dados suficientes aparecem
✅ **Logs detalhados**: Fácil debug e monitoramento
✅ **Sem deploy**: Mudanças acontecem sem precisar fazer deploy do frontend
