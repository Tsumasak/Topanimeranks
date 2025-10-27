# 🎯 SISTEMA AUTOMÁTICO COMPLETO

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Cron Job Automático** ⏰
- Roda **automaticamente a cada 10 minutos**
- Busca dados do Jikan API
- Salva no Supabase (cache permanente)
- **Você não precisa fazer NADA!**

### 2. **Frontend Modificado** 🚀
- **NUNCA chama Jikan diretamente**
- **SEMPRE lê apenas do Supabase**
- Navegação super rápida (< 1 segundo)
- Zero chamadas lentas ao Jikan

### 3. **Edge Function de Sincronização** 🔄
- Busca dados do Jikan (respeitando rate limits)
- Salva em tabelas do Supabase
- Registra logs de sincronização

---

## 📋 COMO ATIVAR O SISTEMA

### **Passo 1: Rodar as Migrations no Supabase**

1. Vá no **Supabase Dashboard** → **SQL Editor**
2. Crie uma nova query
3. Copie e cole o conteúdo de `/supabase/migrations/20241027000001_initial_schema.sql`
4. Clique em **RUN**
5. Copie e cole o conteúdo de `/supabase/migrations/20241027000002_setup_cron.sql`
6. Clique em **RUN**

### **Passo 2: Fazer Deploy da Edge Function**

```bash
# Instale o Supabase CLI (se ainda não tem)
# Windows (Chocolatey):
choco install supabase

# Ou Windows (Scoop):
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Login no Supabase
supabase login

# Link ao seu projeto
supabase link --project-ref SEU_PROJECT_ID

# Deploy da função de sync
supabase functions deploy sync-anime-data

# Deploy do servidor
supabase functions deploy server
```

### **Passo 3: Fazer o Primeiro Sync (Opcional mas Recomendado)**

Execute o sync manualmente para popular o banco imediatamente:

1. Vá no **Supabase Dashboard** → **SQL Editor**
2. Execute:

```sql
-- Trigger sync manualmente (preenche o banco agora)
SELECT
  net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'weekly_episodes')
  );
```

Ou simplesmente espere 10 minutos e o cron job fará isso automaticamente!

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### **1. Verificar se o Cron Job está configurado:**

```sql
-- Ver jobs agendados
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### **2. Verificar se os dados estão sendo sincronizados:**

```sql
-- Ver logs de sincronização
SELECT * FROM sync_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver quantos episódios foram sincronizados
SELECT COUNT(*) as total_episodes 
FROM weekly_episodes;

-- Ver quantos animes de temporada foram sincronizados
SELECT COUNT(*) as total_animes 
FROM season_rankings;

-- Ver quantos animes antecipados foram sincronizados
SELECT COUNT(*) as total_anticipated 
FROM anticipated_animes;
```

### **3. Verificar no Frontend:**

```bash
npm run dev
```

Abra o site e:
- ✅ Se tiver dados: Carrega INSTANTANEAMENTE
- ⏳ Se não tiver dados: Mostra banner pedindo sync inicial
- 🔄 Após 10 minutos: Dados aparecem automaticamente

---

## 🎛️ CONFIGURAÇÕES DO CRON JOB

### **Alterar Frequência do Sync**

Por padrão, o sync roda **a cada 10 minutos** (`*/10 * * * *`).

Se quiser mudar:

```sql
-- Ver jobs atuais
SELECT * FROM cron.job;

-- Deletar job antigo
SELECT cron.unschedule('sync-weekly-episodes');

-- Criar novo job com frequência diferente
-- Exemplo: A cada 5 minutos
SELECT cron.schedule(
  'sync-weekly-episodes',
  '*/5 * * * *',  -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'weekly_episodes')
  );
  $$
);

-- Exemplo: A cada 1 hora
SELECT cron.schedule(
  'sync-weekly-episodes',
  '0 * * * *',  -- A cada hora no minuto 0
  ...
);

-- Exemplo: A cada 30 minutos
SELECT cron.schedule(
  'sync-weekly-episodes',
  '*/30 * * * *',  -- A cada 30 minutos
  ...
);
```

### **Desabilitar o Cron Job**

```sql
-- Parar todos os syncs
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated-animes');
```

---

## 📊 MONITORAMENTO

### **Dashboard de Sync Status**

O site tem um componente `<SyncStatusBanner />` que mostra:
- ✅ Status da última sincronização
- ⏱️ Quando foi a última atualização
- 🔄 Botão para forçar sync manual
- ❌ Erros (se houver)

### **Ver Logs Detalhados**

```sql
-- Ver últimos syncs com detalhes
SELECT 
  sync_type,
  status,
  items_synced,
  items_created,
  items_updated,
  duration_ms,
  created_at,
  error_message
FROM sync_logs
ORDER BY created_at DESC
LIMIT 20;

-- Ver apenas erros
SELECT * FROM sync_logs
WHERE status = 'error'
ORDER BY created_at DESC;

-- Ver performance (duração média)
SELECT 
  sync_type,
  AVG(duration_ms) as avg_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  COUNT(*) as total_syncs
FROM sync_logs
WHERE status = 'success'
GROUP BY sync_type;
```

---

## 🚨 TROUBLESHOOTING

### **Problema: Cron job não está rodando**

```sql
-- 1. Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Se não estiver, habilite:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Verificar se jobs estão agendados
SELECT * FROM cron.job;

-- Se não houver jobs, rode a migration novamente
```

### **Problema: Edge Function não está funcionando**

```bash
# Verificar se está deployada
supabase functions list

# Fazer deploy novamente
supabase functions deploy sync-anime-data

# Ver logs em tempo real
supabase functions logs sync-anime-data --follow
```

### **Problema: Dados não aparecem no frontend**

```sql
-- Verificar se há dados nas tabelas
SELECT COUNT(*) FROM weekly_episodes;
SELECT COUNT(*) FROM season_rankings;
SELECT COUNT(*) FROM anticipated_animes;

-- Se estiver vazio, trigger sync manualmente
SELECT net.http_post(...); -- Ver Passo 3 acima
```

---

## ✅ CHECKLIST FINAL

- [ ] Migrations rodadas (schema criado)
- [ ] Cron job configurado (pg_cron)
- [ ] Edge Function deployada (`sync-anime-data`)
- [ ] Servidor deployado (`make-server`)
- [ ] Primeiro sync executado (manual ou automático)
- [ ] Dados visíveis nas tabelas do Supabase
- [ ] Site carrega dados instantaneamente

---

## 🎉 RESULTADO FINAL

### **ANTES (com Jikan direto):**
- ⏳ Primeira carga: 10-30 segundos
- 🐌 Navegação: 10-30 segundos por página
- 😤 Experiência: Frustrante

### **AGORA (com Supabase + Cron):**
- ⚡ Primeira carga: < 1 segundo
- 🚀 Navegação: < 1 segundo
- 😍 Experiência: Instantânea!

---

## 📞 PRECISA DE AJUDA?

Se algo não funcionar:

1. **Verifique os logs:** `SELECT * FROM sync_logs ORDER BY created_at DESC;`
2. **Verifique os cron jobs:** `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
3. **Verifique as Edge Functions:** `supabase functions logs sync-anime-data`
4. **Me chame de volta!** 🙋‍♂️
