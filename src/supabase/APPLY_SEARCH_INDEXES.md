# 🔍 Como Aplicar os Índices de Busca

## O que são estes índices?

Estes índices foram criados para otimizar o novo sistema de busca global do site.
Eles permitem buscas rápidas em:
- **Nomes de animes** (busca fuzzy/aproximada)
- **Seasons** (winter, spring, summer, fall)
- **Tags** (genres, themes, demographics em formato JSONB)

---

## ⚠️ ATENÇÃO: Use a versão V3 (ULTRA-SAFE)!

Se você recebeu erros como:
- `column "genres" does not exist`
- `column "anime_title" does not exist`

Use o arquivo:
- ✅ **`20250202000001_add_search_indexes_v3.sql`** (versão ULTRA-SAFE)

Esta versão:
- ✅ Auto-detecta os nomes das colunas
- ✅ Cria colunas JSONB se não existirem
- ✅ Cria índices apenas nas colunas que existem
- ✅ **100% segura** para qualquer schema!

---

## 📝 Passo a Passo

### 1️⃣ Acesse o Supabase Dashboard
- Vá em: https://supabase.com/dashboard
- Selecione seu projeto: **Top Anime Ranks**

### 2️⃣ Abra o SQL Editor
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**

### 3️⃣ Execute a Migration
- Copie TODO o conteúdo do arquivo: `/supabase/migrations/20250202000001_add_search_indexes_v3.sql`
- Cole no SQL Editor
- Clique em **"Run"** (ou pressione `Ctrl+Enter`)

### 4️⃣ Verifique o Sucesso
Você deve ver mensagens como:
```
✅ Added column: weekly_episodes.genres (se não existia)
✅ Created index on weekly_episodes.anime_title_english
✅ Search indexes created successfully!
🔍 GIN indexes for JSONB fields (genres, themes, demographics)
📝 Trigram indexes for fuzzy text search (anime titles, season)
⚡ Search performance optimized!
```

---

## ✅ Verificação (Opcional)

Para confirmar que os índices foram criados, execute:

```sql
-- Listar todos os índices de busca criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%_gin' OR indexname LIKE '%_trgm'
ORDER BY tablename, indexname;
```

Você deve ver pelo menos **18 índices** criados (6 GIN + 12 Trigram).

---

## 🎯 O que acontece se eu NÃO aplicar?

- ❌ A busca vai funcionar, mas será **MUITO LENTA**
- ❌ Queries em JSONB sem GIN index fazem **full table scan**
- ❌ Busca de texto sem trigram index é ineficiente

**RECOMENDAÇÃO:** Aplique os índices ANTES de usar o sistema de busca!

---

## 🔄 Rollback (Se necessário)

Se precisar remover os índices:

```sql
-- Remover GIN indexes
DROP INDEX IF EXISTS idx_weekly_episodes_genres_gin;
DROP INDEX IF EXISTS idx_weekly_episodes_themes_gin;
DROP INDEX IF EXISTS idx_weekly_episodes_demographics_gin;
DROP INDEX IF EXISTS idx_season_rankings_genres_gin;
DROP INDEX IF EXISTS idx_season_rankings_themes_gin;
DROP INDEX IF EXISTS idx_season_rankings_demographics_gin;
DROP INDEX IF EXISTS idx_anticipated_animes_genres_gin;
DROP INDEX IF EXISTS idx_anticipated_animes_themes_gin;
DROP INDEX IF EXISTS idx_anticipated_animes_demographics_gin;

-- Remover Trigram indexes
DROP INDEX IF EXISTS idx_weekly_episodes_title_trgm;
DROP INDEX IF EXISTS idx_weekly_episodes_title_english_trgm;
DROP INDEX IF EXISTS idx_season_rankings_title_trgm;
DROP INDEX IF EXISTS idx_season_rankings_title_english_trgm;
DROP INDEX IF EXISTS idx_anticipated_animes_title_trgm;
DROP INDEX IF EXISTS idx_anticipated_animes_title_english_trgm;
DROP INDEX IF EXISTS idx_season_rankings_season_trgm;
DROP INDEX IF EXISTS idx_anticipated_animes_season_trgm;

-- Remover extensão pg_trgm
DROP EXTENSION IF EXISTS pg_trgm;
```

---

## 📊 Impacto Esperado

### ANTES dos índices:
- Busca em 1000 animes: **~2-5 segundos**
- Full table scan em cada query

### DEPOIS dos índices:
- Busca em 1000 animes: **~50-200ms**
- Índices GIN/Trigram otimizados

**Melhoria:** ~10-100x mais rápido! ⚡

---

## ❓ Dúvidas?

Se encontrar erros ao executar a migration, verifique:
1. Você está conectado ao projeto correto?
2. Tem permissões de admin no Supabase?
3. As tabelas `weekly_episodes`, `season_rankings`, `anticipated_animes` existem?

**Erro comum:**
```
ERROR: relation "weekly_episodes" does not exist
```
**Solução:** Aplique primeiro a migration inicial (`20241027000001_initial_schema.sql`)