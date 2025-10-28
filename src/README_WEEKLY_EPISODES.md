# 📺 SISTEMA DE EPISÓDIOS SEMANAIS - AUTOMÁTICO

## 🎯 OBJETIVO

Popular automaticamente a tabela `weekly_episodes` com todos os episódios dos animes **Fall 2024** buscados diretamente do Jikan API.

---

## ⚡ INÍCIO RÁPIDO (2 COMANDOS)

### **1. Criar Tabela (SQL)**

```sql
-- Execute no Supabase SQL Editor:
-- Cole o conteúdo de: /EXECUTAR_AGORA.sql
```

### **2. Popular Dados (Edge Function)**

```bash
curl -X POST https://SEU-ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-fall-2024 \
  -H "Authorization: Bearer SUA-ANON-KEY"
```

**Pronto!** Em 5-10 minutos você terá todos os dados populados automaticamente.

---

## 📊 O QUE O SISTEMA FAZ

```
1. Busca animes Fall 2024
   ↓
2. Filtra 5000+ membros
   ↓
3. Busca episódios de cada anime
   ↓
4. Calcula week_number (baseado em aired_at)
   ↓
5. Calcula position_in_week (baseado em score)
   ↓
6. Insere TUDO na tabela
```

---

## 📋 ESTRUTURA DA TABELA

| Coluna | Tipo | Origem | Descrição |
|--------|------|--------|-----------|
| `id` | UUID | Auto | ID único |
| `anime_id` | INTEGER | Jikan | mal_id do anime |
| `anime_title_english` | TEXT | Jikan | Título em inglês |
| `anime_image_url` | TEXT | Jikan | URL da imagem |
| `from_url` | TEXT | Jikan | URL no MAL |
| `episode_number` | INTEGER | Jikan | Número do episódio |
| `episode_name` | TEXT | Jikan | Nome do episódio |
| `episode_score` | NUMERIC | Jikan | Score do episódio |
| `week_number` | INTEGER | Calculado | Semana (1-13) |
| `position_in_week` | INTEGER | Calculado | Posição no ranking |
| `is_manual` | BOOLEAN | Auto | false |
| `type` | TEXT | Jikan | TV, Movie, OVA |
| `status` | TEXT | Jikan | Airing, Finished |
| `demographic` | JSONB | Jikan | ["Shounen"] |
| `genre` | JSONB | Jikan | ["Action", "Fantasy"] |
| `theme` | JSONB | Jikan | ["School"] |
| `aired_at` | TIMESTAMPTZ | Jikan | Data de exibição |
| `created_at` | TIMESTAMPTZ | Auto | Data de criação |
| `updated_at` | TIMESTAMPTZ | Auto | Data de atualização |

---

## 🔍 EXEMPLO DE QUERY

```sql
-- Top 10 episódios da Week 1
SELECT 
  anime_title_english,
  episode_number,
  episode_name,
  episode_score,
  position_in_week
FROM weekly_episodes
WHERE week_number = 1
ORDER BY position_in_week
LIMIT 10;
```

**Resultado:**

| anime_title_english | episode_number | episode_name | episode_score | position_in_week |
|---------------------|----------------|--------------|---------------|------------------|
| Bleach: TYBW Part 3 | 16 | The Fundamental Virulence | 8.89 | 1 |
| Dandadan | 1 | That's How Love Starts | 8.92 | 2 |
| My Hero Academia S7 | 1 | Full Power!! | 8.45 | 3 |

---

## 📚 DOCUMENTAÇÃO

- **`/SYNC_AUTOMATICO.md`** - Guia completo
- **`/EXECUTAR_AGORA.sql`** - Script SQL pronto
- **`/supabase/functions/server/sync-fall-2024.tsx`** - Código da função

---

## 🔄 RE-SINCRONIZAR

Para atualizar com novos episódios:

```sql
-- Limpar tabela
TRUNCATE weekly_episodes;
```

```bash
# Rodar sync novamente
curl -X POST https://SEU-ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-fall-2024 \
  -H "Authorization: Bearer SUA-ANON-KEY"
```

---

## ✅ VERIFICAR STATUS

```sql
-- Total de episódios
SELECT COUNT(*) FROM weekly_episodes;

-- Episódios por semana
SELECT week_number, COUNT(*) as total
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;

-- Animes únicos
SELECT COUNT(DISTINCT anime_id) FROM weekly_episodes;
```

---

## 🎉 PRONTO PARA USAR!

Execute `/EXECUTAR_AGORA.sql` e depois chame o endpoint `/sync-fall-2024`. Tudo será populado automaticamente! 🚀
