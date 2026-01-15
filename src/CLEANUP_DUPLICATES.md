# SQL para Limpar Duplicatas na Tabela weekly_episodes

Este documento contém os comandos SQL para remover episódios duplicados do banco de dados.

## Problema Identificado

Episódios estavam sendo duplicados porque a verificação de existência não incluía `season` e `year` na query, apenas `anime_id` e `episode_number`.

## Correção Aplicada

O arquivo `/supabase/functions/server/enrich.tsx` foi corrigido para incluir `season` e `year` na verificação:

```tsx
// Verificação corrigida
const { data: existingEpisode } = await supabase
  .from('weekly_episodes')
  .select('id')
  .eq('anime_id', seasonAnime.anime_id)
  .eq('episode_number', episode.mal_id)
  .eq('season', epSeason)      // ✅ ADICIONADO
  .eq('year', epYear)          // ✅ ADICIONADO
  .maybeSingle();
```

## Comandos SQL para Limpeza

Execute os comandos abaixo **no Supabase SQL Editor** na seguinte ordem:

### PASSO 1: Verificar Duplicatas (Execute Primeiro)

```sql
SELECT 
  anime_id,
  episode_number,
  season,
  year,
  COUNT(*) as total_duplicates
FROM weekly_episodes
GROUP BY anime_id, episode_number, season, year
HAVING COUNT(*) > 1
ORDER BY total_duplicates DESC;
```

### PASSO 2: Deletar Duplicatas

Este comando mantém apenas o registro mais recente (maior `created_at`) para cada combinação de `anime_id`, `episode_number`, `season` e `year`:

```sql
DELETE FROM weekly_episodes
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY anime_id, episode_number, season, year 
        ORDER BY created_at DESC
      ) as row_num
    FROM weekly_episodes
  ) as ranked
  WHERE row_num > 1
);
```

### PASSO 3: Verificar Novamente

Este comando deve retornar **0 linhas** se a limpeza foi bem-sucedida:

```sql
SELECT 
  anime_id,
  episode_number,
  season,
  year,
  COUNT(*) as total_duplicates
FROM weekly_episodes
GROUP BY anime_id, episode_number, season, year
HAVING COUNT(*) > 1
ORDER BY total_duplicates DESC;
```

### PASSO 4 (OPCIONAL): Criar Índice Único

**ATENÇÃO:** Só execute este comando depois de confirmar que não há mais duplicatas!

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_episodes_unique 
ON weekly_episodes(anime_id, episode_number, season, year);
```

Este índice previne duplicatas futuras, fazendo com que o banco de dados rejeite inserções duplicadas automaticamente.

---

## Queries de Estatísticas (Opcional)

### Total de episódios por season

```sql
SELECT season, year, COUNT(*) as total_episodes
FROM weekly_episodes
GROUP BY season, year
ORDER BY year DESC, 
  CASE season
    WHEN 'winter' THEN 1
    WHEN 'spring' THEN 2
    WHEN 'summer' THEN 3
    WHEN 'fall' THEN 4
  END;
```

### Total de animes únicos

```sql
SELECT COUNT(DISTINCT anime_id) as total_unique_animes
FROM weekly_episodes;
```

### Top 10 animes com mais episódios

```sql
SELECT 
  anime_id,
  anime_title_english,
  COUNT(*) as total_episodes,
  MIN(season) as first_season,
  MAX(season) as last_season,
  MIN(year) as first_year,
  MAX(year) as last_year
FROM weekly_episodes
GROUP BY anime_id, anime_title_english
ORDER BY total_episodes DESC
LIMIT 10;
```

---

## Próximos Passos

1. Execute o PASSO 1 para ver quantas duplicatas existem
2. Execute o PASSO 2 para remover duplicatas
3. Execute o PASSO 3 para confirmar que não há mais duplicatas
4. (Opcional) Execute o PASSO 4 para prevenir duplicatas futuras
5. (Opcional) Execute as queries de estatísticas para validar os dados
