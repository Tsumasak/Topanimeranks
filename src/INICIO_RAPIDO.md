# ⚡ INÍCIO RÁPIDO - SYNC EM 5 MINUTOS

## 🎯 SOLUÇÃO DO ERRO "permission denied"

No Supabase hospedado, não podemos usar `ALTER DATABASE`. Vamos usar a **tabela `app_config`**!

---

## 🚀 3 COMANDOS SQL

### **1️⃣ CONFIGURAR**

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

-- Configurar (SUBSTITUA COM SUAS CREDENCIAIS!)
UPDATE app_config SET value = 'https://xxxxx.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'eyJxxx...' WHERE key = 'supabase_anon_key';
```

**Onde encontrar credenciais?**
- Settings → API → Project URL
- Settings → API → Project API keys → anon public

---

### **2️⃣ CRIAR FUNÇÕES**

Cole o arquivo:

**`/supabase/migrations/20241027000010_sync_functions_v2.sql`**

---

### **3️⃣ SINCRONIZAR**

```sql
SELECT * FROM sync_everything();
```

**Aguarde ~10 minutos...** ⏱️

---

## ✅ VERIFICAR

```sql
-- Ver status
SELECT * FROM sync_status();

-- Ver quantos dados foram sincronizados
SELECT 'Weekly Episodes' as tipo, COUNT(*) as total FROM weekly_episodes
UNION ALL
SELECT 'Season Rankings', COUNT(*) FROM season_rankings;

-- Ver últimos logs
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

---

## 📊 RESULTADO ESPERADO

Depois do `sync_everything()` você deve ter:

- ✅ ~150-200 animes em `weekly_episodes` (weeks 1-13)
- ✅ ~100-150 animes em `season_rankings` (Fall 2024 + Winter 2025)
- ✅ Logs de sucesso em `sync_logs`

---

## 🆘 ERROS COMUNS

### **"Configurações não encontradas"**

Você esqueceu de atualizar a `app_config`:

```sql
UPDATE app_config SET value = 'https://SEU-ID.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'SUA-KEY' WHERE key = 'supabase_anon_key';
```

---

### **"relation app_config does not exist"**

Você não executou as migrations anteriores. Execute na ordem:

1. Migration 001 - Schema inicial
2. Migration 003 - Tabela app_config
3. Migration 007 - Campos de episódios
4. Migration 008 - Renomear score
5. Migration 009 - Indexes
6. Migration 010 V2 - Funções de sync

**Atalho:** Use `/CONFIGURAR_E_SINCRONIZAR.sql`

---

### **"extension http does not exist"**

```sql
CREATE EXTENSION IF NOT EXISTS http;
```

---

## 📁 ARQUIVOS ÚTEIS

| Arquivo | Descrição |
|---------|-----------|
| `/SETUP_FACIL.md` | Guia detalhado com screenshots |
| `/CONFIGURAR_E_SINCRONIZAR.sql` | Script completo pronto |
| `/supabase/migrations/20241027000010_sync_functions_v2.sql` | Funções SQL (versão corrigida) |
| `/QUERIES_SQL_PRONTAS.sql` | Queries úteis |

---

## 🎯 RESUMO VISUAL

```
┌─────────────────────────────────────────────┐
│ 1. UPDATE app_config (credenciais)         │
│    ↓                                        │
│ 2. Cole Migration 010 V2 (funções)         │
│    ↓                                        │
│ 3. SELECT * FROM sync_everything();        │
│    ↓                                        │
│ 4. Aguarde ~10 min                         │
│    ↓                                        │
│ 5. ✅ Dados sincronizados!                  │
└─────────────────────────────────────────────┘
```

---

**Pronto!** Agora seu site vai buscar dados do Supabase ao invés do Jikan. 🚀

**Próximo:** Configure o cron job para sync automático (ver `/SUPABASE_SYNC_MANUAL.md`)
