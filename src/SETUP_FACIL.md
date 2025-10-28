# ⚡ SETUP FÁCIL - 3 PASSOS

## 🎯 SOLUÇÃO PARA: "permission denied to set parameter"

No Supabase hospedado, você não pode usar `ALTER DATABASE`. Vamos usar a **tabela `app_config`** que já existe! ✅

---

## 📝 PASSO A PASSO

### **PASSO 1: Limpar e Configurar**

Cole no **Supabase SQL Editor**:

```sql
-- Limpar funções antigas
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

-- Habilitar HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- Configurar credenciais (SUBSTITUA COM SEUS VALORES!)
UPDATE app_config SET value = 'https://SEU-ID.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'SUA-ANON-KEY' WHERE key = 'supabase_anon_key';

-- Verificar
SELECT * FROM app_config;
```

---

### **PASSO 2: Criar Funções**

Cole o conteúdo completo do arquivo:

**`/supabase/migrations/20241027000010_sync_functions_v2.sql`**

Este arquivo já:
- ✅ Remove funções antigas automaticamente
- ✅ Lê configurações da tabela `app_config` (não usa `ALTER DATABASE`)
- ✅ Tem proteção contra erros

---

### **PASSO 3: Sincronizar**

```sql
-- Sincronizar TUDO
SELECT * FROM sync_everything();

-- Vai levar alguns minutos... aguarde!
-- Rate limit de 2 segundos entre cada request
```

---

## 🔍 ONDE ENCONTRAR SUAS CREDENCIAIS

### **Project URL**
1. Vá em **Settings** → **API**
2. Copie **Project URL**: `https://xxxxx.supabase.co`

### **Anon Key**
1. Vá em **Settings** → **API**
2. Em **Project API keys**, copie **anon** **public**
3. Começa com `eyJ...`

---

## ✅ VERIFICAR SE FUNCIONOU

```sql
-- Ver status
SELECT * FROM sync_status();

-- Ver dados sincronizados
SELECT COUNT(*) as total_episodes FROM weekly_episodes;
SELECT COUNT(*) as total_seasons FROM season_rankings;

-- Ver logs
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

---

## 🆘 AINDA COM ERRO?

### **Erro: "Configurações não encontradas"**

Você não executou o UPDATE da app_config. Execute:

```sql
UPDATE app_config SET value = 'https://SEU-ID.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'SUA-ANON-KEY' WHERE key = 'supabase_anon_key';
```

---

### **Erro: "relation app_config does not exist"**

Você não executou a Migration 003. Execute:

```sql
-- Cole o conteúdo de:
-- /supabase/migrations/20241027000003_config_table.sql
```

---

### **Erro: "extension http does not exist"**

```sql
CREATE EXTENSION IF NOT EXISTS http;
```

---

## 📁 ARQUIVOS DE AJUDA

- **`/CONFIGURAR_E_SINCRONIZAR.sql`** - Script completo pronto para copiar
- **`/supabase/migrations/20241027000010_sync_functions_v2.sql`** - Funções SQL atualizadas
- **`/ERRO_MIGRATION_010.md`** - Se tiver outros erros

---

## 🎯 RESUMO

1. ✅ Executar SQL do PASSO 1 (configurar app_config)
2. ✅ Colar Migration 010 V2 (criar funções)
3. ✅ Executar `SELECT * FROM sync_everything();`

**Pronto!** 🚀
