# 📋 PASSO A PASSO COMPLETO - SETUP DO ZERO

## ⚡ RESUMO EXECUTIVO

1. ✅ Aplicar migrations no Supabase (2 minutos)
2. ✅ Configurar sync settings (30 segundos)
3. ✅ Sincronizar dados (10-15 minutos)
4. ✅ Validar (1 minuto)

**Total:** ~15-20 minutos

---

## 🚀 PASSO 1: APLICAR MIGRATIONS

Abra o **Supabase SQL Editor** e execute em ordem:

### **Migration 008: Rename Score Fields**

```sql
ALTER TABLE weekly_episodes RENAME COLUMN score TO episode_score;
ALTER TABLE season_rankings RENAME COLUMN score TO anime_score;

COMMENT ON COLUMN weekly_episodes.episode_score IS 'Score of the specific episode';
COMMENT ON COLUMN season_rankings.anime_score IS 'Overall score of the anime';
```

---

### **Migration 009: Create Indexes**

```sql
-- Clean up
DROP INDEX IF EXISTS idx_weekly_episodes_score;
DROP INDEX IF EXISTS idx_season_rankings_score;

-- Weekly episodes indexes
CREATE INDEX IF NOT EXISTS idx_episode_score ON weekly_episodes(episode_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_week_position ON weekly_episodes(week_number, position_in_week);
CREATE INDEX IF NOT EXISTS idx_anime_weeks ON weekly_episodes(anime_id, week_number);
CREATE INDEX IF NOT EXISTS idx_week_score ON weekly_episodes(week_number, episode_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_week_ranking ON weekly_episodes(week_number, position_in_week, episode_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend ON weekly_episodes(trend) WHERE trend IS NOT NULL;

-- Season rankings indexes
CREATE INDEX IF NOT EXISTS idx_anime_score ON season_rankings(anime_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_season_year_score ON season_rankings(season, year, anime_score DESC NULLS LAST);

-- Optimize
ANALYZE weekly_episodes;
ANALYZE season_rankings;
```

---

### **Migration 010: Sync Functions**

**⚠️ SE DER ERRO "cannot change return type", execute PRIMEIRO:**

```sql
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();
```

**Agora cole todo o conteúdo do arquivo:**

`/supabase/migrations/20241027000010_sync_functions.sql`

Ou copie aqui:

```sql
-- Habilitar extensão HTTP (necessária)
CREATE EXTENSION IF NOT EXISTS http;

-- [Cole o resto do arquivo 20241027000010_sync_functions.sql aqui]
```

**Arquivo completo:** `/supabase/migrations/20241027000010_sync_functions.sql`

**Se tiver problemas:** Ver `/ERRO_MIGRATION_010.md`

---

## 🚀 PASSO 2: CONFIGURAR SYNC SETTINGS

```sql
-- Substitua pelos seus valores reais
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://SEU-PROJECT-ID.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'SUA-ANON-KEY';
SELECT pg_reload_conf();
```

**Como encontrar:**
1. Project ID: No URL do dashboard
2. Anon Key: Settings → API → Project API keys → `anon`

---

## 🚀 PASSO 3: SINCRONIZAR DADOS

### **Opção A: Sync Tudo de Uma Vez (Recomendado)**

```sql
SELECT * FROM sync_everything();
```

⏱️ **Aguarde 10-15 minutos.** Vai sincronizar:
- Weeks 1-13 (todas)
- Fall 2024 Season
- Winter 2025 Season
- Most Anticipated Animes

---

### **Opção B: Sync Manual (Uma por vez)**

```sql
-- 1. Sync todas weeks
SELECT * FROM sync_all_weeks();  -- ~5-8 minutos

-- 2. Sync Fall 2024
SELECT sync_season('fall', 2024);

-- 3. Sync Winter 2025
SELECT sync_season('winter', 2025);

-- 4. Sync Most Anticipated
SELECT sync_anticipated();
```

---

## 🚀 PASSO 4: VALIDAR

```sql
-- 1. Ver status geral
SELECT * FROM sync_status();

-- Deve retornar algo como:
-- Weekly Episodes    | 325  | 2024-10-27 14:30 | false
-- Season Rankings    | 215  | 2024-10-27 14:35 | false
-- Last Sync Activity |  45  | 2024-10-27 14:40 | false
```

```sql
-- 2. Ver top 5 episódios da week 5
SELECT 
  position_in_week,
  anime_title,
  episode_number,
  episode_score,
  trend
FROM weekly_episodes
WHERE week_number = 5
ORDER BY position_in_week
LIMIT 5;

-- Deve retornar 5 linhas
```

```sql
-- 3. Ver top 5 animes Fall 2024
SELECT 
  title,
  anime_score,
  members
FROM season_rankings
WHERE season = 'fall' AND year = 2024
ORDER BY anime_score DESC
LIMIT 5;

-- Deve retornar 5 linhas
```

```sql
-- 4. Verificar logs de erro
SELECT * FROM sync_logs WHERE status = 'error' ORDER BY created_at DESC LIMIT 5;

-- Deve retornar 0 linhas (vazio)
```

---

## ✅ CHECKLIST FINAL

- [ ] Migration 008 executada (colunas renomeadas)
- [ ] Migration 009 executada (indexes criados)
- [ ] Migration 010 executada (funções de sync criadas)
- [ ] Settings configuradas (URL + Anon Key)
- [ ] Dados sincronizados (sync_everything executado)
- [ ] Validação OK (todas queries retornam dados)
- [ ] Nenhum erro nos logs
- [ ] Site funciona sem erros

---

## 🔄 MANUTENÇÃO REGULAR

### **Atualização Semanal (toda segunda-feira):**

```sql
-- Sync apenas a week atual
SELECT sync_week(5);  -- Ajustar número da week conforme necessário
```

---

### **Atualização Mensal:**

```sql
-- Resync tudo
SELECT * FROM sync_all_weeks();
SELECT sync_season('fall', 2024);
SELECT sync_anticipated();
```

---

### **Verificar Status:**

```sql
SELECT * FROM sync_status();
```

Se `needs_sync = true`, execute o sync correspondente.

---

## 🆘 TROUBLESHOOTING

### **Erro: "column score does not exist"**
✅ **Solução:** Migration 008 já foi aplicada. Continue para Migration 009.

---

### **Erro: "cannot change return type of existing function"**
✅ **Solução:** Execute:
```sql
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();
```
Depois execute a Migration 010 novamente.

**Ver guia completo:** `/ERRO_MIGRATION_010.md`

---

### **Erro: "function http does not exist"**
✅ **Solução:** Execute `CREATE EXTENSION IF NOT EXISTS http;`

---

### **Erro: "unrecognized configuration parameter"**
✅ **Solução:** Reconfigurar settings:
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'sua-url';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'sua-key';
SELECT pg_reload_conf();
```

---

### **Sync retorna NULL ou erro**
✅ **Causas possíveis:**
- Edge function não deployada
- Settings incorretas
- Rate limit da Jikan API

✅ **Verificar:**
```sql
SHOW app.settings.supabase_url;
SHOW app.settings.supabase_anon_key;
```

---

### **Rate limit exceeded**
✅ **Solução:** Aguarde 1-2 minutos e tente novamente.

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **`/SYNC_RAPIDO.md`** - Comandos rápidos (3 minutos)
- **`/SUPABASE_SYNC_MANUAL.md`** - Guia completo de sync
- **`/QUERIES_SQL_PRONTAS.sql`** - Queries úteis prontas
- **`/CHECKLIST_SUPABASE.md`** - Checklist detalhado

---

## 🎉 PRÓXIMOS PASSOS

Após completar o setup:

1. ✅ Testar o site (deve funcionar perfeitamente)
2. ✅ Configurar cron jobs (opcional, para auto-sync)
3. ✅ Monitorar logs periodicamente
4. ✅ Atualizar weeks conforme necessário

---

**Setup completo!** 🚀  
**Tempo total:** ~15-20 minutos  
**Próxima ação:** Testar o site e verificar se tudo funciona!
