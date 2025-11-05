# 🎯 Auto Week Detection System

## 📋 Overview

O sistema detecta automaticamente qual week deve aparecer no controller e na home baseado nos episódios COM SCORE disponíveis no banco de dados.

## 🔄 Como Funciona

### 1. **Endpoint `/available-weeks`**

Localização: `/supabase/functions/server/index.tsx`

```typescript
GET /make-server-c1d1bfd8/available-weeks
```

**Retorna:**
```json
{
  "success": true,
  "weeks": [1, 2, 3, 4, 5, 6],
  "latestWeek": 6,
  "weekCounts": [
    { "week": 1, "count": 45 },
    { "week": 2, "count": 42 },
    { "week": 3, "count": 38 },
    { "week": 4, "count": 35 },
    { "week": 5, "count": 28 },
    { "week": 6, "count": 12 }
  ]
}
```

**Lógica:**
- Busca TODOS os episódios do banco
- Filtra apenas episódios COM SCORE (`episode_score IS NOT NULL`)
- Conta quantos episódios com score existem por week
- Retorna apenas weeks com **5+ episódios com score**
- Define `latestWeek` como a week mais alta que tem 5+ episódios com score

### 2. **WeekControl Component**

Localização: `/components/WeekControl.tsx`

**Comportamento:**
- Carrega as weeks disponíveis do endpoint `/available-weeks`
- Usa `latestWeek` como a week "atual" (padrão ao abrir a página)
- Exibe apenas weeks que têm 5+ episódios com score no controller
- Marca a `latestWeek` como "current week" para exibir "Airing" ao invés de "Aired"

### 3. **HomePage Component**

Localização: `/pages/HomePage.tsx`

**Comportamento:**
- Detecta automaticamente qual é a `latestWeek` do endpoint
- Exibe os top 3 episódios dessa week
- Atualiza automaticamente quando uma nova week atinge 5+ episódios com score

## 📊 Exemplo Prático

### Cenário 1: Week 7 com apenas 4 episódios com score
```
Week 6: 12 episódios com score ✅ (aparece no controller)
Week 7: 4 episódios com score ❌ (NÃO aparece no controller)
```

**Resultado:**
- Controller mostra até Week 6
- HomePage mostra Week 6
- Week 7 está "oculta" até atingir 5+ episódios

### Cenário 2: Week 7 atinge 5 episódios com score
```
Week 6: 12 episódios com score ✅
Week 7: 5 episódios com score ✅ (agora aparece!)
```

**Resultado:**
- Controller AUTOMATICAMENTE mostra Week 7 ✨
- HomePage AUTOMATICAMENTE atualiza para Week 7 ✨
- Week 7 é marcada como "current week" (exibe "Airing")

## 🎨 Comportamento Visual

### Controller (Desktop)
```
[Week 1] [Week 2] [Week 3] [Week 4] [Week 5] [Week 6] [Week 7]
                                                         ↑
                                                    Current Week
                                                   (fundo amarelo)
```

### Controller (Mobile)
```
[← Prev]  [Week 7 ▼]  [Next →]
            ↑
      Current Week
     (fundo amarelo)
```

### HomePage
```
Weekly Anime Episodes - Week 7
Airing - November 10 - 16, 2025
↑
Auto-detected latest week
```

## 🔧 Configuração

### Constante de Fallback
Arquivo: `/config/weeks.ts`

```typescript
// Usada apenas como fallback se o servidor falhar
export const CURRENT_WEEK_NUMBER = 5;
```

**⚠️ IMPORTANTE:** Esta constante NÃO controla mais qual week aparece na home. Ela é apenas um fallback de segurança.

## 🚀 Deploy

Após modificar a lógica de detecção:

1. **Deploy da Edge Function:**
```bash
supabase functions deploy server
```

2. **Sem necessidade de:**
   - ❌ Migrations SQL
   - ❌ Deploy frontend (Vercel)
   - ❌ Atualizar constantes manualmente

## 📝 Logs para Debug

### Server Logs
```
[Server] 📊 Weeks with scored episodes: Week 1: 45 episodes, Week 2: 42 episodes, ...
[Server] ✅ Available weeks (5+ episodes with score): 1, 2, 3, 4, 5, 6, 7
[Server] 🎯 Latest week with 5+ scored episodes: Week 7
```

### WeekControl Logs
```
[WeekControl] 🔍 Starting to load available weeks (5+ scored episodes filter)...
[WeekControl] ✅ Received 7 weeks with 5+ scored episodes: ['week1', 'week2', ...]
[WeekControl] 🎯 Latest week detected: Week 7
[WeekControl] 📌 Defaulting to Week 7 (latest with 5+ scored episodes)
```

### HomePage Logs
```
[HomePage] 🎯 Using latest week: Week 7 (auto-detected)
[HomePage] ✅ Loaded 3 episodes from Week 7
```

## ✅ Checklist de Funcionamento

Para verificar se está funcionando:

1. **SQL: Ver contagem de episódios por week**
```sql
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score,
  COUNT(*) as total_episodes
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

2. **API: Testar endpoint**
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

3. **Frontend: Abrir o WeekControl**
   - Deve mostrar automaticamente a latest week
   - Controller deve exibir apenas weeks com 5+ episódios

4. **Frontend: Abrir a HomePage**
   - Deve mostrar episódios da latest week
   - Título deve exibir o número correto da week

## 🎯 Benefícios

✅ **Automático**: Novas weeks aparecem sem intervenção manual
✅ **Dinâmico**: Baseado em dados reais do banco
✅ **Seguro**: Apenas weeks com dados suficientes (5+ episódios) aparecem
✅ **Sem Deploy**: Mudanças acontecem automaticamente
✅ **Logs Detalhados**: Fácil debug e monitoramento
