# 🎯 SETUP COMPLETO - Sync Automático no Supabase

## ⚠️ PROBLEMA ANTERIOR
Estávamos tentando fazer sync através do frontend, o que é desnecessário e complicado.

## ✅ SOLUÇÃO CORRETA
Fazer TUDO diretamente no Supabase via SQL - simples, direto e automático.

---

## 📋 PASSO A PASSO

### 1️⃣ Abra o Supabase Dashboard
```
https://supabase.com/dashboard/project/kgiuycrbdctbbuvtlyro
```

### 2️⃣ Vá em **SQL Editor** (menu lateral esquerdo)

### 3️⃣ Cole este SQL e execute:

```sql
-- ============================================
-- SYNC MANUAL - Todas as 5 Weeks de Uma Vez
-- ============================================

SELECT sync_all_weeks();
```

**ISSO É TUDO!** 🎉

O Supabase vai:
- ✅ Chamar a Edge Function `sync-anime-data` para cada semana (1-5)
- ✅ Buscar episódios da Jikan API
- ✅ Salvar no banco de dados `weekly_episodes`
- ✅ Adicionar delays entre as semanas para respeitar rate limits
- ✅ Logar tudo na tabela `sync_logs`

---

## 🕐 SYNC AUTOMÁTICO (Opcional)

Se quiser que rode **automaticamente a cada 10 minutos**, execute este SQL:

```sql
-- ============================================
-- CRON JOB - Sync Automático a Cada 10 Minutos
-- ============================================

-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar cron job para weekly episodes (roda a cada 10 minutos)
SELECT cron.schedule(
  'sync-weekly-episodes',
  '*/10 * * * *',
  $$SELECT trigger_manual_sync('weekly_episodes', 1)$$
);

-- Criar cron job para season rankings (roda todo dia às 2:00 AM)
SELECT cron.schedule(
  'sync-season-rankings',
  '0 2 * * *',
  $$SELECT trigger_manual_sync('season_rankings')$$
);

-- Criar cron job para most anticipated (roda todo dia às 3:00 AM)
SELECT cron.schedule(
  'sync-anticipated',
  '0 3 * * *',
  $$SELECT trigger_manual_sync('anticipated')$$
);
```

---

## 🔍 VERIFICAR STATUS

### Ver logs de sync:
```sql
SELECT 
  sync_type,
  week_number,
  status,
  items_synced,
  items_created,
  items_updated,
  error_message,
  created_at
FROM sync_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Contar episódios por semana:
```sql
SELECT 
  week_number,
  COUNT(*) as total_episodes
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

### Ver últimos episódios sincronizados:
```sql
SELECT 
  week_number,
  anime_title,
  episode_number,
  aired_at,
  members,
  created_at
FROM weekly_episodes
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🛑 PARAR CRON JOBS

Se quiser desabilitar os cron jobs automáticos:

```sql
-- Desabilitar cron jobs
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated');
```

---

## 🐛 TROUBLESHOOTING

### Problema: Nada acontece ao executar `sync_all_weeks()`

**Possíveis causas:**

1. **Edge Function não deployada**
   - Vá em: `Functions > sync-anime-data`
   - Verifique se está deployed

2. **Variáveis de ambiente faltando**
   - Vá em: `Settings > API`
   - Copie: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
   - Vá em: `Functions > sync-anime-data > Settings`
   - Adicione as variáveis

3. **Permissões da Edge Function**
   - Verifique se a função tem acesso ao banco de dados

---

## ❓ FAQ

### Q: Preciso rodar o sync manualmente toda vez?
**A:** Não! Configure os cron jobs e ele roda automaticamente.

### Q: Quanto tempo leva o sync?
**A:** Cerca de 2-5 minutos para todas as 5 weeks (depende da Jikan API).

### Q: Posso ver o progresso em tempo real?
**A:** Sim! Vá em `Functions > sync-anime-data > Logs` para ver os logs em tempo real.

### Q: O que fazer se der rate limit (429)?
**A:** A Edge Function já tem retry automático. Se persistir, aguarde 1-2 minutos e tente novamente.

---

## 🎯 COMANDOS ÚTEIS

### Sync apenas uma semana específica:
```sql
SELECT trigger_manual_sync('weekly_episodes', 1);  -- Week 1
SELECT trigger_manual_sync('weekly_episodes', 2);  -- Week 2
SELECT trigger_manual_sync('weekly_episodes', 3);  -- Week 3
SELECT trigger_manual_sync('weekly_episodes', 4);  -- Week 4
SELECT trigger_manual_sync('weekly_episodes', 5);  -- Week 5
```

### Sync season rankings:
```sql
SELECT trigger_manual_sync('season_rankings');
```

### Sync most anticipated:
```sql
SELECT trigger_manual_sync('anticipated');
```

### Limpar dados antigos (cuidado!):
```sql
-- Deletar episódios de uma semana específica
DELETE FROM weekly_episodes WHERE week_number = 1;

-- Deletar todos os episódios (cuidado!)
DELETE FROM weekly_episodes;

-- Deletar logs antigos (> 7 dias)
DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '7 days';
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Execute `SELECT sync_all_weeks();` no SQL Editor
2. ✅ Aguarde 2-5 minutos
3. ✅ Verifique os logs: `SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;`
4. ✅ Verifique os episódios: `SELECT COUNT(*) FROM weekly_episodes;`
5. ✅ Configure cron jobs se quiser sync automático
6. ✅ Remova a interface de sync do frontend (não é mais necessária)

---

## 📝 NOTAS IMPORTANTES

- ⚠️ A Jikan API tem rate limit de 1 req/sec - a Edge Function já respeita isso
- ⚠️ Se fizer muitos syncs manuais seguidos, pode levar rate limit
- ⚠️ Os cron jobs já têm delays configurados
- ⚠️ Sempre verifique os logs em `sync_logs` para debug

---

**SIMPLES ASSIM!** 🎉

Tudo centralizado no Supabase, sem complicações no frontend.
