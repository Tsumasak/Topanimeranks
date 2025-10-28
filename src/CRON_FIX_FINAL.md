# 🔧 FIX FINAL: Configurar Cron Jobs Corretamente

## 🎯 Solução: Usar tabela de configuração

Em vez de usar variáveis do PostgreSQL (que podem não ter permissão), vamos criar uma **tabela de configuração** para armazenar a URL e a chave do Supabase.

---

## 📋 PASSO A PASSO (Execute no SQL Editor do Supabase)

### Passo 1️⃣: Criar tabela de configuração

Copie e execute todo este SQL:

```sql
-- Create config table
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for cron)
DROP POLICY IF EXISTS "Allow public read access to app_config" ON app_config;
CREATE POLICY "Allow public read access to app_config"
  ON app_config FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access to app_config" ON app_config;
CREATE POLICY "Allow service role full access to app_config"
  ON app_config
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create helper function to get config
CREATE OR REPLACE FUNCTION get_config(config_key TEXT)
RETURNS TEXT AS $$
  SELECT value FROM app_config WHERE key = config_key;
$$ LANGUAGE SQL STABLE;

-- Insert placeholder values (YOU NEED TO UPDATE THESE!)
INSERT INTO app_config (key, value)
VALUES
  ('supabase_url', 'https://YOUR-PROJECT-ID.supabase.co'),
  ('supabase_anon_key', 'YOUR-ANON-KEY-HERE')
ON CONFLICT (key) DO NOTHING;
```

### Passo 2️⃣: **IMPORTANTE** - Atualizar com suas credenciais reais

Execute este SQL **SUBSTITUINDO** pelos seus valores:

```sql
-- ⚠️ SUBSTITUA com seus valores reais!

UPDATE app_config
SET value = 'https://SEU-PROJECT-ID.supabase.co'
WHERE key = 'supabase_url';

UPDATE app_config
SET value = 'SUA-ANON-KEY-AQUI'
WHERE key = 'supabase_anon_key';
```

**Onde encontrar esses valores:**

- **Project ID**: Na URL do seu painel Supabase
- **Anon Key**: Vá em **Settings** → **API** → copie a **anon/public key**

### Passo 3️⃣: Recriar os cron jobs com a nova configuração

Execute este SQL completo:

```sql
-- First, remove old cron jobs
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated-animes');

-- Schedule: Sync Weekly Episodes (every 10 minutes)
SELECT cron.schedule(
  'sync-weekly-episodes',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
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
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
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
      url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      ),
      body := jsonb_build_object(
        'sync_type', 'anticipated'
      )
    ) AS request_id;
  $$
);
```

### Passo 4️⃣: Verificar se está funcionando

Aguarde ~10 minutos e execute:

```sql
-- Ver histórico de execução
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

**Status esperado:** `succeeded` ✅

Se ainda aparecer `failed`, execute:

```sql
-- Ver o erro detalhado
SELECT
  jobid,
  status,
  return_message,
  start_time
FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 5;
```

---

## ✅ Como verificar se a configuração está correta

Execute este SQL para ver os valores salvos:

```sql
SELECT * FROM app_config;
```

Você deve ver:

| key               | value                           |
| ----------------- | ------------------------------- |
| supabase_url      | https://seu-projeto.supabase.co |
| supabase_anon_key | eyJhbGciOiJ... (sua chave)      |

---

## 🚨 IMPORTANTE: Segurança

⚠️ A **Anon Key** é pública e pode ser exposta. Ela é segura porque:

- É protegida por RLS (Row Level Security)
- Só permite operações que você configurou nas policies
- NÃO exponha a **Service Role Key** no app_config!

---

## 🎯 Resumo

1. ✅ Criar tabela `app_config`
2. ✅ Atualizar com URL e Anon Key reais
3. ✅ Recriar cron jobs
4. ✅ Aguardar 10 minutos e verificar

---

## 🐛 Troubleshooting

**Erro: "relation app_config does not exist"**
→ Execute o Passo 1 novamente

**Erro: "schema net does not exist"**
→ Execute: `CREATE EXTENSION IF NOT EXISTS pg_net;`

**Cron não executa**
→ Verifique se as extensões estão habilitadas:

```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

---

**Pronto! Agora o cron vai funcionar! 🚀**