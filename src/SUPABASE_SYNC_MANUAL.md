# 🚀 SINCRONIZAÇÃO VIA SUPABASE - GUIA COMPLETO

**Todas as sincronizações são feitas diretamente no Supabase SQL Editor.**  
Sem páginas web, sem interfaces, só SQL. 💪

---

## 📋 PRÉ-REQUISITOS

Antes de usar as funções, você precisa configurar as settings uma única vez:

### **PASSO 1: Configurar Settings (Execute UMA VEZ)**

```sql
-- Configure o URL do Supabase
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://SEU-PROJECT-ID.supabase.co';

-- Configure a chave anon
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'SUA-ANON-KEY';

-- Recarregar configurações
SELECT pg_reload_conf();
```

**Como encontrar seus valores:**
1. **Project ID:** No URL do dashboard (https://app.supabase.com/project/**SEU-ID**)
2. **Anon Key:** Settings → API → Project API keys → `anon` `public`

---

## 🎯 FUNÇÕES DISPONÍVEIS

### **1. SYNC UMA WEEK ESPECÍFICA**

```sql
-- Sync Week 1
SELECT sync_week(1);

-- Sync Week 5 (atual)
SELECT sync_week(5);

-- Sync Week 13
SELECT sync_week(13);
```

**Retorna:**
```json
{
  "success": true,
  "items_synced": 25,
  "week_number": 1
}
```

---

### **2. SYNC TODAS AS WEEKS (1-13)**

```sql
SELECT * FROM sync_all_weeks();
```

**Retorna:**
```
week_number | status  | items
------------|---------|-------
     1      | success |  25
     2      | success |  23
     3      | success |  27
     ...    | ...     | ...
    13      | success |  20
```

⏱️ **Tempo estimado:** ~5-8 minutos (rate limit de 2s entre requests)

---

### **3. SYNC UMA SEASON**

```sql
-- Sync Fall 2024
SELECT sync_season('fall', 2024);

-- Sync Winter 2025
SELECT sync_season('winter', 2025);

-- Sync Spring 2025
SELECT sync_season('spring', 2025);
```

**Valores válidos:**
- Season: `'winter'`, `'spring'`, `'summer'`, `'fall'`
- Year: `2024`, `2025`, etc.

---

### **4. SYNC MOST ANTICIPATED**

```sql
SELECT sync_anticipated();
```

**Retorna:**
```json
{
  "success": true,
  "items_synced": 150
}
```

---

### **5. SYNC TUDO DE UMA VEZ** 🚀

```sql
SELECT * FROM sync_everything();
```

**Retorna:**
```
step                     | status  | items | duration_seconds
-------------------------|---------|-------|------------------
Weekly Episodes (1-13)   | success |  325  |       28.5
Fall 2024 Season         | success |  120  |        5.2
Winter 2025 Season       | success |  95   |        4.8
Most Anticipated         | success |  150  |        6.1
```

⏱️ **Tempo estimado:** ~10-15 minutos

⚠️ **ATENÇÃO:** Esta função sincroniza TUDO. Use apenas quando:
- Setup inicial do banco
- Resync completo necessário
- Banco foi limpo

---

### **6. VERIFICAR STATUS**

```sql
SELECT * FROM sync_status();
```

**Retorna:**
```
category             | total_items | last_sync           | needs_sync
---------------------|-------------|---------------------|------------
Weekly Episodes      |     325     | 2024-10-27 14:30:00 | false
Season Rankings      |     215     | 2024-10-27 14:35:00 | false
Last Sync Activity   |      45     | 2024-10-27 14:40:00 | false
```

**Interpretação:**
- `needs_sync = true` → Dados desatualizados, fazer sync
- `needs_sync = false` → Dados OK

---

## 📊 QUERIES ÚTEIS

### **Ver últimos syncs realizados**

```sql
SELECT 
  sync_type,
  status,
  items_synced,
  duration_ms,
  created_at
FROM sync_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

### **Ver quantos episódios por week**

```sql
SELECT 
  week_number,
  COUNT(*) as episodes,
  COUNT(DISTINCT anime_id) as unique_animes
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

---

### **Ver quantos animes por season**

```sql
SELECT 
  season,
  year,
  COUNT(*) as total_animes
FROM season_rankings
GROUP BY season, year
ORDER BY year DESC, season;
```

---

### **Limpar dados (USE COM CUIDADO!)**

```sql
-- Limpar weekly episodes
DELETE FROM weekly_episodes;

-- Limpar season rankings
DELETE FROM season_rankings;

-- Limpar logs
DELETE FROM sync_logs;

-- Limpar TUDO
TRUNCATE weekly_episodes, season_rankings, sync_logs CASCADE;
```

---

## 🔄 ROTINA RECOMENDADA

### **Setup Inicial (primeira vez):**

```sql
-- 1. Configurar settings (uma vez)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-id.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'sua-key';
SELECT pg_reload_conf();

-- 2. Sync tudo
SELECT * FROM sync_everything();

-- 3. Verificar status
SELECT * FROM sync_status();
```

---

### **Atualização Semanal:**

```sql
-- Sync apenas a week atual (ex: Week 5)
SELECT sync_week(5);

-- Verificar
SELECT * FROM weekly_episodes WHERE week_number = 5 ORDER BY position_in_week LIMIT 10;
```

---

### **Atualização Mensal:**

```sql
-- Sync todas weeks
SELECT * FROM sync_all_weeks();

-- Sync season atual
SELECT sync_season('fall', 2024);

-- Verificar status
SELECT * FROM sync_status();
```

---

## ⚡ AUTOMAÇÃO COM CRON JOBS

Se quiser automatizar, use pg_cron:

```sql
-- Sync week atual toda segunda-feira às 6h
SELECT cron.schedule(
  'sync-current-week',
  '0 6 * * 1',
  $$SELECT sync_week(5);$$  -- Atualizar número da week atual
);

-- Sync season todo domingo às 3h
SELECT cron.schedule(
  'sync-season',
  '0 3 * * 0',
  $$SELECT sync_season('fall', 2024);$$
);

-- Ver cron jobs ativos
SELECT * FROM cron.job;

-- Deletar cron job
SELECT cron.unschedule('sync-current-week');
```

---

## 🆘 TROUBLESHOOTING

### **Erro: "function http does not exist"**

**Solução:** Habilitar extensão HTTP:

```sql
CREATE EXTENSION IF NOT EXISTS http;
```

---

### **Erro: "unrecognized configuration parameter"**

**Solução:** Configurar settings novamente:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'sua-url';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'sua-key';
SELECT pg_reload_conf();
```

---

### **Erro: "rate limit exceeded"**

**Solução:** Jikan API tem rate limit. Aguarde 1-2 minutos e tente novamente.

---

### **Sync retorna NULL ou vazio**

**Causas possíveis:**
1. Edge function não está deployada
2. Settings não configuradas
3. Rate limit da API

**Verificar:**
```sql
-- Ver se settings estão configuradas
SHOW app.settings.supabase_url;
SHOW app.settings.supabase_anon_key;

-- Ver logs de erro
SELECT * FROM sync_logs WHERE status = 'error' ORDER BY created_at DESC LIMIT 5;
```

---

## 📈 MONITORAMENTO

### **Dashboard rápido:**

```sql
-- Status geral
SELECT * FROM sync_status();

-- Últimos syncs
SELECT sync_type, status, items_synced, created_at 
FROM sync_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Episódios por week
SELECT week_number, COUNT(*) as total
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;

-- Top 5 episódios da week atual
SELECT anime_title, episode_number, episode_score, position_in_week
FROM weekly_episodes
WHERE week_number = 5
ORDER BY position_in_week
LIMIT 5;
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Depois de sincronizar, verifique:

- [ ] `SELECT * FROM sync_status();` mostra dados recentes
- [ ] `SELECT COUNT(*) FROM weekly_episodes;` retorna ~300+
- [ ] `SELECT COUNT(*) FROM season_rankings;` retorna ~200+
- [ ] `SELECT * FROM sync_logs WHERE status = 'error';` está vazio
- [ ] Site funciona sem erros de "no data"

---

## 🎯 COMANDOS RÁPIDOS (COPIAR E COLAR)

```sql
-- ===== SETUP INICIAL =====
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://SEU-ID.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'SUA-KEY';
SELECT pg_reload_conf();
SELECT * FROM sync_everything();

-- ===== SYNC RÁPIDO =====
SELECT sync_week(5);                    -- Week atual
SELECT sync_season('fall', 2024);       -- Season atual
SELECT sync_anticipated();              -- Anticipated

-- ===== VERIFICAR =====
SELECT * FROM sync_status();            -- Status geral
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5; -- Últimos logs

-- ===== LIMPAR (CUIDADO!) =====
TRUNCATE weekly_episodes, season_rankings, sync_logs CASCADE;
```

---

## 📚 REFERÊNCIAS

- **Migrations:** `/supabase/migrations/20241027000010_sync_functions.sql`
- **Edge Function:** `/supabase/functions/sync-anime-data/index.ts`
- **Logs:** Tabela `sync_logs`

---

**Criado em:** 27 de Outubro de 2024  
**Versão:** 2.0 - SQL Sync Functions  
**Próxima atualização:** Quando necessário 🚀
