# ⚡ SETUP RÁPIDO - 2 Minutos

## 🎯 PROBLEMA
O site mostra "Database Not Populated" porque o banco de dados está vazio.

## ✅ SOLUÇÃO (3 passos simples)

### 1️⃣ Abra o Supabase SQL Editor

Clique aqui: https://supabase.com/dashboard/project/kgiuycrbdctbbuvtlyro/sql/new

### 2️⃣ Cole este comando SQL:

```sql
SELECT sync_all_weeks();
```

### 3️⃣ Clique em "RUN" (ou pressione Ctrl+Enter)

**PRONTO!** 🎉

---

## ⏱️ Aguarde 2-5 minutos

O Supabase vai:
- ✅ Buscar episódios da semana 1
- ✅ Buscar episódios da semana 2
- ✅ Buscar episódios da semana 3
- ✅ Buscar episódios da semana 4
- ✅ Buscar episódios da semana 5

---

## 🔍 Como verificar se funcionou?

### Execute este SQL:
```sql
SELECT COUNT(*) FROM weekly_episodes;
```

**Resultado esperado:** Deve retornar um número > 0 (ex: 120 episódios)

---

## 🕐 SYNC AUTOMÁTICO (Opcional)

Se quiser que atualize automaticamente a cada 10 minutos:

```sql
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar cron job
SELECT cron.schedule(
  'sync-weekly-episodes',
  '*/10 * * * *',
  $$SELECT trigger_manual_sync('weekly_episodes', 1)$$
);
```

---

## 📋 Comandos Úteis

### Ver logs de sync:
```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
```

### Ver episódios por semana:
```sql
SELECT 
  week_number,
  COUNT(*) as total
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

### Sync apenas uma semana específica:
```sql
SELECT trigger_manual_sync('weekly_episodes', 1);  -- Week 1
SELECT trigger_manual_sync('weekly_episodes', 2);  -- Week 2
-- etc...
```

---

## ❓ FAQ

**Q: Deu erro "function sync_all_weeks() does not exist"**

**A:** As migrations não foram aplicadas. Execute primeiro:

```sql
-- Ver arquivo: /supabase/migrations/20241027000006_add_week_sync_function.sql
-- Cole todo o conteúdo desse arquivo no SQL Editor e execute
```

**Q: Não retornou nada / Ficou em branco**

**A:** Normal! Significa que está rodando em background. Aguarde 2-5 minutos e verifique:

```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

**Q: Erro 429 (Rate Limit)**

**A:** A Jikan API tem limite de requisições. Aguarde 2-3 minutos e tente novamente.

---

## 🚨 IMPORTANTE

- ⚠️ **NÃO** use a interface de sync do site (`/sync`) - ela é menos confiável
- ✅ **SEMPRE** use o método SQL direto no Supabase
- ✅ Tudo fica centralizado no Supabase
- ✅ Sem depender do frontend

---

**Documentação completa:** `/SUPABASE_SYNC_SETUP.md`
