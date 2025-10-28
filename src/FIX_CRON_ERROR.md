# 🔧 FIX: Erro "schema net does not exist" no Cron

## ❌ Problema

O cron job está dando erro:
```
"schema \"net\" does not exist"
```

## 🎯 Causa

A extensão `pg_net` não estava sendo habilitada antes de usar `net.http_post()`.

## ✅ Solução

### Passo 1: Limpar cron jobs existentes

No **Supabase Dashboard → SQL Editor**, execute:

```sql
-- Remove os cron jobs antigos
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated-animes');
```

### Passo 2: Habilitar a extensão pg_net

Ainda no **SQL Editor**, execute:

```sql
-- Habilita a extensão pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Passo 3: Recriar os cron jobs

Ainda no **SQL Editor**, copie e execute todo o conteúdo do arquivo:

📁 `/supabase/migrations/20241027000002_setup_cron.sql`

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule: Sync Weekly Episodes (every 10 minutes)
SELECT cron.schedule(
  'sync-weekly-episodes',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'weekly_episodes'
      )
    ) AS request_id;
  $$
);

-- Schedule: Sync Season Rankings (every 10 minutes)
SELECT cron.schedule(
  'sync-season-rankings',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'season_rankings'
      )
    ) AS request_id;
  $$
);

-- Schedule: Sync Anticipated Animes (every 10 minutes)
SELECT cron.schedule(
  'sync-anticipated-animes',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'anticipated'
      )
    ) AS request_id;
  $$
);
```

### Passo 4: Verificar se funcionou

No **SQL Editor**, execute:

```sql
-- Ver os cron jobs criados
SELECT * FROM cron.job;

-- Ver o histórico de execução (aguarde ~10 minutos)
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

## 🎯 Resultado Esperado

Você deve ver 3 jobs criados:
- ✅ `sync-weekly-episodes`
- ✅ `sync-season-rankings`
- ✅ `sync-anticipated-animes`

Cada um executa a cada **10 minutos**.

---

## ⚠️ IMPORTANTE

Antes de criar os cron jobs, você precisa:

1. **Configurar as variáveis** no Supabase:
   - `app.settings.supabase_url`
   - `app.settings.supabase_anon_key`

Execute isto **uma vez** no SQL Editor:

```sql
-- Configurar variáveis para o cron
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'sua-anon-key-aqui';
```

**Substitua:**
- `seu-projeto` → Seu Project ID do Supabase
- `sua-anon-key-aqui` → Sua chave Anon (encontre em Settings → API)

---

## 🚀 Pronto!

Agora o cron deve executar sem erros! 🎉

Aguarde 10 minutos e verifique o histórico:

```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

Se ver status `succeeded` = Funcionou! ✅
