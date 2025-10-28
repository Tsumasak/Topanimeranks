# 🔧 FIX: Erro Migration 010

## ❌ ERRO

```
ERROR:  42P13: cannot change return type of existing function
HINT:  Use DROP FUNCTION sync_all_weeks() first.
```

---

## ✅ SOLUÇÃO (2 PASSOS)

### **PASSO 1: Limpar Funções Antigas**

Cole no **Supabase SQL Editor**:

```sql
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

SELECT '✅ Funções antigas removidas com sucesso!' as status;
```

---

### **PASSO 2: Executar Migration 010 Atualizada**

Agora cole o arquivo completo atualizado:

**`/supabase/migrations/20241027000010_sync_functions.sql`**

Ele já foi atualizado e inclui os DROP automáticos.

---

## 🎯 POR QUE ISSO ACONTECEU?

Você executou a migration 010 antes, mas a função foi criada com um tipo de retorno diferente. O PostgreSQL não permite mudar o tipo de retorno de uma função existente, precisa deletar primeiro.

**Agora a migration atualizada já faz isso automaticamente!** ✅

---

## ✅ PRÓXIMO PASSO

Depois de executar os 2 passos acima:

```sql
-- Configurar settings (se ainda não fez)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://SEU-ID.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'SUA-KEY';
SELECT pg_reload_conf();

-- Sincronizar dados
SELECT * FROM sync_everything();
```

---

## 🆘 AINDA COM ERRO?

Verifique se:
- ✅ Executou o PASSO 1 (DROP das funções)
- ✅ Executou o PASSO 2 (Migration 010 completa)
- ✅ Não pulou nenhuma linha do SQL

Se ainda tiver problemas, execute:

```sql
-- Ver todas as funções criadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE 'sync%'
ORDER BY routine_name;

-- Limpar TUDO relacionado a sync
DROP FUNCTION IF EXISTS sync_week CASCADE;
DROP FUNCTION IF EXISTS sync_all_weeks CASCADE;
DROP FUNCTION IF EXISTS sync_season CASCADE;
DROP FUNCTION IF EXISTS sync_anticipated CASCADE;
DROP FUNCTION IF EXISTS sync_everything CASCADE;
DROP FUNCTION IF EXISTS sync_status CASCADE;

-- Executar Migration 010 novamente
```

---

**Problema resolvido!** 🚀
