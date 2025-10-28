# ⚡ SYNC RÁPIDO - 3 MINUTOS

## 🎯 PRIMEIRA VEZ (Setup)

### **1. Configure (copie e cole, substituindo os valores):**

```sql
-- Limpar funções antigas (se existirem)
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

-- Habilitar HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- Configurar credenciais na tabela app_config
-- ⚠️ SUBSTITUA com suas credenciais!
UPDATE app_config SET value = 'https://SEU-PROJECT-ID.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'SUA-ANON-KEY-AQUI' WHERE key = 'supabase_anon_key';

-- Verificar configuração
SELECT * FROM app_config;
```

**Onde encontrar:**
- **Project URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → Project API keys → `anon` public

---

### **2. Criar funções de sincronização:**

Cole o arquivo completo:

**`/supabase/migrations/20241027000010_sync_functions_v2.sql`**

---

### **3. Sincronize tudo:**

```sql
SELECT * FROM sync_everything();
```

⏱️ Aguarde ~10-15 minutos. Vai sincronizar:
- ✅ Weeks 1-13 (weekly episodes)
- ✅ Fall 2024 (season rankings)
- ✅ Winter 2025 (season rankings)
- ✅ Most Anticipated

---

### **4. Verifique:**

```sql
SELECT * FROM sync_status();
```

Deve mostrar centenas de items em cada categoria.

---

## 🔄 ATUALIZAÇÕES SEMANAIS

```sql
-- Sync apenas a week atual (ex: Week 5)
SELECT sync_week(5);

-- Sync todas as weeks (1-13)
SELECT * FROM sync_all_weeks();

-- Sync uma season específica
SELECT sync_season('winter', 2025);

-- Sync most anticipated
SELECT sync_anticipated();
```

---

## 📊 VER DADOS

```sql
-- Top 10 episódios da week 5
SELECT anime_title, episode_number, episode_score, trend
FROM weekly_episodes
WHERE week_number = 5
ORDER BY position_in_week
LIMIT 10;

-- Top 10 animes Fall 2024
SELECT title, anime_score, members
FROM season_rankings
WHERE season = 'fall' AND year = 2024
ORDER BY anime_score DESC
LIMIT 10;

-- Ver logs de sincronização
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🆘 ERRO?

### **Erro: "permission denied to set parameter"**

✅ **Solução:** Use a tabela `app_config` (não use `ALTER DATABASE`)

```sql
UPDATE app_config SET value = 'https://SEU-ID.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'SUA-KEY' WHERE key = 'supabase_anon_key';
```

**Ver guia completo:** `/SETUP_FACIL.md`

---

### **Erro: "cannot change return type of existing function"**

```sql
-- Limpar funções antigas
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

-- Depois execute a Migration 010 V2 novamente
```

**Ver:** `/ERRO_MIGRATION_010.md`

---

### **Erro: "Configurações não encontradas"**

Você esqueceu de atualizar a `app_config`:

```sql
UPDATE app_config SET value = 'https://SEU-ID.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'SUA-ANON-KEY' WHERE key = 'supabase_anon_key';

-- Verificar
SELECT * FROM app_config;
```

---

### **Outros erros:**

```sql
-- Ver erros nos logs
SELECT * FROM sync_logs WHERE status = 'error' ORDER BY created_at DESC LIMIT 5;

-- Resync tudo (se necessário)
TRUNCATE weekly_episodes, season_rankings CASCADE;
SELECT * FROM sync_everything();
```

---

## 📁 ARQUIVOS ÚTEIS

- **`/SETUP_FACIL.md`** - Setup completo passo a passo
- **`/CONFIGURAR_E_SINCRONIZAR.sql`** - Script completo pronto
- **`/INICIO_RAPIDO.md`** - Guia visual rápido
- **`/SUPABASE_SYNC_MANUAL.md`** - Documentação completa

---

**🎯 RESUMO:**
1. UPDATE app_config (credenciais)
2. Cole Migration 010 V2
3. SELECT * FROM sync_everything();
4. ✅ Pronto!
