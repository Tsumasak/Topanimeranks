# 🚀 INSTRUÇÕES: Configuração de Crons no Supabase

## ✅ MUDANÇAS IMPLEMENTADAS

As seguintes Edge Functions foram atualizadas/criadas para suportar processamento e sync dinâmico:
- ✅ `/supabase/functions/insert-weekly-episodes/index.ts`
- ✅ `/supabase/functions/update-weekly-episodes/index.ts`
- ✅ `/supabase/functions/update-anime-metadata/index.ts` (NOVA)

Ambas agora aceitam `week_number` via POST body com os seguintes valores:
- `"current"` - Processa a week atual
- `"current-1"` - Processa a week anterior
- `"current-2"` - Processa 2 weeks atrás
- `1`, `2`, `3`, etc. - Processa week específica (número)
- `undefined` - Auto-detecta week atual (comportamento padrão)

---

## 📋 PASSO A PASSO: O QUE FAZER NO SUPABASE

### **PASSO 1: Deploy das Edge Functions** 🚀

1. Abra o terminal na raiz do projeto
2. Execute os comandos de deploy:

```bash
# Deploy insert-weekly-episodes
supabase functions deploy insert-weekly-episodes

# Deploy update-weekly-episodes
supabase functions deploy update-weekly-episodes

# Deploy update-anime-metadata
supabase functions deploy update-anime-metadata
```

3. Aguarde até ver a mensagem de sucesso:
   ```
   ✅ Deployed Function insert-weekly-episodes
   ✅ Deployed Function update-weekly-episodes
   ✅ Deployed Function update-anime-metadata
   ```

---

### **PASSO 2: Deletar Crons Antigas** 🗑️

Antes de criar as novas crons, você precisa **DELETAR as crons antigas** que processam múltiplas weeks.

#### **Opção A: Via SQL Editor (RECOMENDADO - Mais Rápido)**

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New query"**
5. Cole e execute o SQL abaixo para ver todas as crons existentes:

```sql
-- Ver todas as crons existentes
SELECT jobid, jobname, schedule, command 
FROM cron.job 
ORDER BY jobname;
```

6. Copie os `jobid` das crons que você quer deletar e execute:

```sql
-- Deletar crons antigas (substitua os IDs pelos IDs reais)
SELECT cron.unschedule(1); -- Substitua 1 pelo jobid real
SELECT cron.unschedule(2); -- Substitua 2 pelo jobid real
-- Repita para cada cron antiga que você quer deletar
```

#### **Opção B: Via Dashboard UI**

1. Vá em **Edge Functions > Cron Jobs**
2. Encontre crons como:
   - `insert-weekly-episodes-daily`
   - `insert-weekly-episodes-hourly`
   - `update-weekly-episodes-hourly`
   - `update-weekly-episodes-daily`
3. Clique nos 3 pontinhos (...) > **Delete** em cada uma

**⚠️ IMPORTANTE:** Certifique-se de deletar TODAS as crons antigas relacionadas a insert/update antes de criar as novas!

---

### **PASSO 3: Criar Crons via SQL** 🎯

Agora você vai criar **6 novas crons** (3 para insert, 3 para update) usando SQL.

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **"New query"**
3. Cole e execute o SQL snippet completo abaixo:

```sql
-- ============================================
-- CRIAR TODAS AS 6 CRONS DE UMA VEZ
-- ============================================

-- 📥 CRON 1: Insert Current Week (A cada 3 horas)
SELECT cron.schedule(
    'insert-current-week',
    '0 */3 * * *',
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/insert-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current"}'::jsonb
      ) AS request_id;
    $$
);

-- 📥 CRON 2: Insert Previous Week (Diário - 8:00 AM UTC)
SELECT cron.schedule(
    'insert-previous-week',
    '0 8 * * *',
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/insert-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current-1"}'::jsonb
      ) AS request_id;
    $$
);

-- 📥 CRON 3: Insert 2 Weeks Ago (Domingos - 10:00 AM UTC)
SELECT cron.schedule(
    'insert-2-weeks-ago',
    '0 10 * * 0',
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/insert-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current-2"}'::jsonb
      ) AS request_id;
    $$
);

-- 🔄 CRON 4: Update Current Week (A cada 2 horas)
SELECT cron.schedule(
    'update-current-week',
    '0 */2 * * *',
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/update-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current"}'::jsonb
      ) AS request_id;
    $$
);

-- 🔄 CRON 5: Update Previous Week (A cada 6 horas)
SELECT cron.schedule(
    'update-previous-week',
    '0 */6 * * *',
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/update-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current-1"}'::jsonb
      ) AS request_id;
    $$
);

-- 🔄 CRON 6: Update 2 Weeks Ago (Diário - Meia-noite UTC)
SELECT cron.schedule(
    'update-2-weeks-ago',
    '0 0 * * *',
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/update-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current-2"}'::jsonb
      ) AS request_id;
    $$
);

-- ♻️ CRON 7: Update Anime Metadata (A cada 1 hora)
-- Isso garante que animes antigos e novas pontuações/membros sejam atualizados continuamente
SELECT cron.schedule(
    'update-anime-metadata-hourly',
    '0 * * * *',
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/update-anime-metadata',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        )
      ) AS request_id;
    $$
);
```

4. Clique em **"RUN"** para executar
5. Você deve ver 6 resultados de sucesso (um para cada cron)

---

### **PASSO 4: Verificar Crons Criadas** ✅

Execute este SQL para confirmar que as 6 crons foram criadas:

```sql
-- Ver todas as crons criadas
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    nodename
FROM cron.job 
WHERE jobname IN (
    'insert-current-week',
    'insert-previous-week',
    'insert-2-weeks-ago',
    'update-current-week',
    'update-previous-week',
    'update-2-weeks-ago',
    'update-anime-metadata-hourly'
)
ORDER BY jobname;
```

**Você deve ver 7 linhas com `active = true`:**
- ✅ `insert-current-week`
- ✅ `insert-previous-week`
- ✅ `insert-2-weeks-ago`
- ✅ `update-current-week`
- ✅ `update-previous-week`
- ✅ `update-2-weeks-ago`
- ✅ `update-anime-metadata-hourly`

---

### **PASSO 5: Testar Manualmente (Opcional)** 🧪

Para testar uma cron manualmente via SQL:

```sql
-- Executar insert-current-week manualmente
SELECT
  net.http_post(
    url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/insert-weekly-episodes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
    ),
    body := '{"week_number":"current"}'::jsonb
  ) AS request_id;
```

Ou teste via Dashboard:
1. Vá em **Edge Functions > insert-weekly-episodes**
2. Clique em **"Invoke Function"**
3. No Body, cole: `{"week_number":"current"}`
4. Clique em **"Run"**
5. Veja os logs em **Edge Functions > Logs**

---

## 📊 RESUMO DAS CRONS

| Nome | Function | Schedule (UTC) | Week | Propósito |
|------|----------|---------------|------|-----------|
| `insert-current-week` | `insert-weekly-episodes` | `0 6 * * *` (Diário 6AM) | `current` | Insere episódios da semana atual |
| `insert-previous-week` | `insert-weekly-episodes` | `0 8 * * *` (Diário 8AM) | `current-1` | Pega atrasos da semana passada |
| `insert-2-weeks-ago` | `insert-weekly-episodes` | `0 10 * * 0` (Domingo 10AM) | `current-2` | Pega atrasos de 2 weeks atrás |
| `update-current-week` | `update-weekly-episodes` | `0 */2 * * *` (A cada 2h) | `current` | Atualiza scores da semana atual |
| `update-previous-week` | `update-weekly-episodes` | `0 */6 * * *` (A cada 6h) | `current-1` | Atualiza scores da semana passada |
| `update-2-weeks-ago` | `update-weekly-episodes` | `0 0 * * *` (Diário 0:00) | `current-2` | Atualiza scores de 2 weeks atrás |
| `update-anime-metadata-hourly` | `update-anime-metadata` | `0 * * * *` (A cada 1h) | N/A | Atualiza membros, score, status dos 60 animes mais desatualizados |

**⚠️ NOTA:** Todos os horários são em **UTC**. Ajuste mentalmente para seu fuso horário local!

---

## 🔧 COMANDOS SQL ÚTEIS

### **Ver todas as crons:**
```sql
SELECT jobid, jobname, schedule, active, nodename 
FROM cron.job 
ORDER BY jobname;
```

### **Ver histórico de execuções:**
```sql
SELECT * 
FROM cron.job_run_details 
WHERE jobid IN (
    SELECT jobid FROM cron.job WHERE jobname LIKE '%insert%' OR jobname LIKE '%update%'
)
ORDER BY start_time DESC
LIMIT 20;
```

### **Desabilitar uma cron temporariamente:**
```sql
-- Substitua 'insert-current-week' pelo nome da cron
UPDATE cron.job 
SET active = false 
WHERE jobname = 'insert-current-week';
```

### **Reabilitar uma cron:**
```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'insert-current-week';
```

### **Deletar uma cron específica:**
```sql
-- Primeiro, encontre o jobid
SELECT jobid, jobname FROM cron.job WHERE jobname = 'insert-current-week';

-- Depois, delete usando o jobid
SELECT cron.unschedule(123); -- Substitua 123 pelo jobid real
```

### **Deletar TODAS as crons de uma vez:**
```sql
-- ⚠️ CUIDADO: Isso deleta TODAS as 6 crons!
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname IN (
    'insert-current-week',
    'insert-previous-week',
    'insert-2-weeks-ago',
    'update-current-week',
    'update-previous-week',
    'update-2-weeks-ago',
    'update-anime-metadata-hourly'
);
```

---

## 🎯 BENEFÍCIOS DESSA CONFIGURAÇÃO

✅ **Zero Timeouts:** Cada cron processa apenas 1 week = ~50-80 segundos  
✅ **Pega Atrasos:** Episódios adicionados tardiamente no Jikan são sincronizados  
✅ **Scores Atualizados:** Weeks antigas também recebem updates de scores  
✅ **Flexível:** Fácil adicionar ou remover weeks sem mexer no código  
✅ **Logs Claros:** Cada cron tem seus próprios logs independentes  
✅ **Setup Rápido:** Cria todas as 6 crons com 1 comando SQL  

---

## 🐛 TROUBLESHOOTING

### **Problema: Erro "function cron.schedule does not exist"**
**Solução:** A extensão `pg_cron` não está habilitada. Execute:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### **Problema: Erro "extension http does not exist"**
**Solução:** A extensão `http` não está habilitada. Execute:
```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

### **Problema: Cron não está executando**
**Solução:** Verifique se a cron está ativa:
```sql
SELECT jobname, active FROM cron.job WHERE jobname = 'insert-current-week';
```
Se `active = false`, reative com:
```sql
UPDATE cron.job SET active = true WHERE jobname = 'insert-current-week';
```

### **Problema: Erro "Permission denied for schema cron"**
**Solução:** Você precisa de permissões de `postgres` ou `service_role`. Certifique-se de estar logado com o usuário correto no SQL Editor.

### **Problema: Week errada sendo processada**
**Solução:** 
1. Verifique os logs da Edge Function:
   - Dashboard > Edge Functions > Logs
   - Procure por linhas como: `📅 Using current week: X`
2. Confirme que o body da cron está correto:
```sql
SELECT jobname, command FROM cron.job WHERE jobname = 'insert-current-week';
```

### **Problema: Cron executa mas nada acontece**
**Solução:** Verifique se:
1. ✅ Edge Functions foram deployed (Passo 1)
2. ✅ Tabela `app_config` tem `supabase_url` e `supabase_anon_key` configurados
3. ✅ Edge Function está rodando sem erros (veja logs)

---

## 📝 MANUTENÇÃO FUTURA

### **Adicionar uma nova week (ex: current-3):**
```sql
SELECT cron.schedule(
    'insert-3-weeks-ago',
    '0 12 * * 6', -- Sábados às 12:00 UTC
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/insert-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current-3"}'::jsonb
      ) AS request_id;
    $$
);
```

### **Alterar o horário de uma cron:**
```sql
-- 1. Delete a cron antiga
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'insert-current-week';

-- 2. Recrie com novo horário (ex: 7AM ao invés de 6AM)
SELECT cron.schedule(
    'insert-current-week',
    '0 7 * * *', -- Mudou de 6 para 7
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/insert-weekly-episodes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
        ),
        body := '{"week_number":"current"}'::jsonb
      ) AS request_id;
    $$
);
```

---

## 🕐 REFERÊNCIA: Formato Cron Schedule

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (Domingo = 0 ou 7)
│ │ │ │ │
* * * * *
```

**Exemplos:**
- `0 6 * * *` - Todo dia às 6:00 AM
- `0 */2 * * *` - A cada 2 horas
- `0 0 * * 0` - Todo domingo à meia-noite
- `*/15 * * * *` - A cada 15 minutos
- `0 9 * * 1-5` - Segunda a Sexta às 9:00 AM

---

**✅ Configuração Completa! Suas crons estão prontas para rodar! 🎉**
