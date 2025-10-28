# ✅ CORREÇÕES DOS EPISÓDIOS - GUIA FINAL

## 🐛 Problemas Identificados e Corrigidos

### 1. ✅ Número do Episódio
**Problema**: Edge Function não estava pegando corretamente
**Correção**: Usa `episode.mal_id` que É o número do episódio no endpoint `/anime/{id}/episodes`

### 2. ✅ Nome do Episódio  
**Problema**: 
- Edge Function salvava o nome em `episode_name` ✅
- Mas o `supabase.ts` estava ignorando e usando `Episode ${number}` ❌
**Correção**: Agora mapeia corretamente `row.episode_name`

### 3. ✅ Score dos Episódios
**Problema**: Edge Function não estava capturando o score
**Correção**: O score vem DIRETO no endpoint `/anime/{id}/episodes` como `episode.score` (escala 1-5)

---

## 📋 PASSO A PASSO PARA APLICAR AS CORREÇÕES

### **PASSO 1: Fazer Deploy da Função Corrigida**

```bash
npx supabase functions deploy sync-fall-2025
```

### **PASSO 2: Limpar a Tabela (Opcional - Recomendado)**

Se quiser limpar os dados antigos incorretos, execute no SQL Editor do Supabase:

```sql
DELETE FROM weekly_episodes WHERE is_manual = false;
```

### **PASSO 3: Executar o Sync Corrigido**

```bash
node run-sync.js
```

**OU** use PowerShell:

```powershell
Invoke-RestMethod -Uri "https://kgiuycrbdctbbuvtlyro.supabase.co/functions/v1/sync-fall-2025" -Method POST -Headers @{"Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnaXV5Y3JiZGN0YmJ1dnRseXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjUwMDgsImV4cCI6MjA3NzEwMTAwOH0.MIjtIbpOXWYanYe1SNj7yG7vk2RYlh2WQgh1sPY10zQ"}
```

⏱️ **Tempo estimado**: 10-15 minutos (muitas requisições ao Jikan API)

---

## ✅ Resultado Esperado

Depois do sync, os episódios terão:

✅ **Número correto**: 1, 2, 3, 4... (de `episode.mal_id`)  
✅ **Nome do episódio**: "Título Real do Episódio" (de `episode.title`)  
✅ **Score**: 1.00 a 5.00 (de `episode.score`) - ou NULL se ainda não tiver rating  

---

## 🔍 Verificar se Funcionou

Execute no SQL Editor do Supabase:

```sql
SELECT 
  anime_title_english,
  episode_number,
  episode_name,
  episode_score,
  week_number
FROM weekly_episodes
WHERE week_number = 1
ORDER BY position_in_week
LIMIT 10;
```

**Você deve ver:**
- `episode_number`: 1, 2, 3... (números sequenciais)
- `episode_name`: Nomes reais dos episódios (ex: "Toshinori Yagi: Rising Origin")
- `episode_score`: Valores entre 1.00 e 5.00 (ex: 4.42, 4.64) ou NULL se ainda sem rating

---

## 📝 Arquivos Modificados

1. ✅ `/supabase/functions/sync-fall-2025/index.ts` - Corrigido número e nome do episódio
2. ✅ `/services/supabase.ts` - Corrigido mapeamento dos campos do banco
3. ✅ `/components/WeekControl.tsx` - Melhorado tratamento de scores NULL
4. ✅ `/run-sync.js` - Script para executar o sync facilmente
5. ✅ `/deploy-and-sync.js` - Script com deploy + sync

---

## 🚨 Importante

- **Scores vêm da API Jikan**: Valores de 1.00 a 5.00 baseados nas avaliações dos usuários do MAL
- **NULL é normal**: Episódios recém-lançados podem não ter score ainda (poucos votos)
- **Ranking automático**: Os episódios são ordenados por score dentro de cada semana
