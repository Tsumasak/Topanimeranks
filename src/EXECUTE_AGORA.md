# 🚀 EXECUTE AGORA - COPY & PASTE

## 📝 COMANDO 1: Configurar

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

SELECT '✅ Preparação concluída!' as status;
```

---

## 📝 COMANDO 2: Suas Credenciais

**⚠️ IMPORTANTE: Substitua os valores abaixo!**

```sql
-- SUBSTITUA com sua URL (Settings → API → Project URL)
UPDATE app_config 
SET value = 'https://SEU-PROJECT-ID.supabase.co' 
WHERE key = 'supabase_url';

-- SUBSTITUA com sua key (Settings → API → anon public)
UPDATE app_config 
SET value = 'SUA-ANON-KEY-AQUI-eyJ...' 
WHERE key = 'supabase_anon_key';

-- Verificar (vai mostrar suas credenciais)
SELECT 
  key, 
  CASE 
    WHEN key = 'supabase_anon_key' THEN LEFT(value, 20) || '...'
    ELSE value 
  END as preview
FROM app_config;
```

**Se aparecer "COLE-" ou "AQUI" no preview, você esqueceu de substituir!**

---

## 📝 COMANDO 3: Criar Funções

**Cole TODO o conteúdo do arquivo:**

```
/supabase/migrations/20241027000010_sync_functions_v2.sql
```

**Como fazer:**
1. Abra o arquivo no editor
2. Selecione tudo (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor
5. Execute

---

## 📝 COMANDO 4: Sincronizar

```sql
-- Sincronizar TUDO
SELECT * FROM sync_everything();
```

**⏱️ AGUARDE ~10-15 MINUTOS**

Vai sincronizar:
- ✅ Weeks 1-13 (episódios semanais)
- ✅ Fall 2024 (season rankings)
- ✅ Winter 2025 (season rankings)  
- ✅ Most Anticipated

---

## ✅ VERIFICAR

```sql
-- Ver status
SELECT * FROM sync_status();

-- Ver dados
SELECT 
  'Weekly Episodes' as tipo,
  COUNT(*) as total
FROM weekly_episodes
UNION ALL
SELECT 
  'Season Rankings',
  COUNT(*)
FROM season_rankings;

-- Ver logs
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

**Resultado esperado:**
- 150-200 weekly episodes ✅
- 100-150 season rankings ✅
- Logs com status "success" ✅

---

## 🎯 RESUMO VISUAL

```
1. DROP FUNCTION (limpar)
   ↓
2. UPDATE app_config (credenciais)
   ↓
3. Cole Migration 010 V2 (funções)
   ↓
4. SELECT sync_everything() (sincronizar)
   ↓
5. Aguarde ~10 min
   ↓
6. ✅ PRONTO!
```

---

## 🆘 ERROS?

### **"Configurações não encontradas"**
Execute o COMANDO 2 novamente com suas credenciais corretas.

### **"relation app_config does not exist"**
Execute Migration 003 primeiro:
```sql
-- Cole: /supabase/migrations/20241027000003_config_table.sql
```

### **"extension http does not exist"**
```sql
CREATE EXTENSION IF NOT EXISTS http;
```

### **Outros erros**
Ver: `/SETUP_FACIL.md`

---

## 📁 ONDE ENCONTRAR CREDENCIAIS

1. Abra seu projeto no Supabase
2. Vá em **Settings** (⚙️)
3. Clique em **API**
4. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJ...`

---

## 🎉 PRONTO!

Depois que sincronizar:
- ✅ Site vai buscar dados do Supabase
- ✅ Navegação super rápida
- ✅ Sem rate limit do Jikan
- ✅ Dados atualizados automaticamente

---

**Guia completo:** `/SETUP_FACIL.md`

**Comandos úteis:** `/QUERIES_SQL_PRONTAS.sql`

**Troubleshooting:** `/SOLUCAO_PERMISSION_DENIED.md`
