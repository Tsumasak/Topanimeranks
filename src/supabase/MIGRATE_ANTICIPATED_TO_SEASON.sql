-- ========================================================
-- SCRIPT DE MIGRAÇÂO: Unificação de Antecipados e Temporadas
-- ========================================================

-- Passo 1: Inserir animes que existem em `anticipated_animes` mas não em `season_rankings`
INSERT INTO season_rankings (
  anime_id, title, title_english, image_url, anime_score, scored_by, members, favorites,
  type, status, rating, source, episodes, aired_from, synopsis, 
  demographics, genres, themes, studios, season, year, created_at, updated_at
)
SELECT 
  a.anime_id, a.title, a.title_english, a.image_url, a.score, a.scored_by, a.members, a.favorites,
  a.type, a.status, a.rating, a.source, a.episodes, a.aired_from, a.synopsis,
  a.demographics, a.genres, a.themes, a.studios, 
  COALESCE(a.season, 'upcoming'), COALESCE(a.year, 9999), 
  a.created_at, a.updated_at
FROM anticipated_animes a
WHERE NOT EXISTS (
  SELECT 1 FROM season_rankings s WHERE s.anime_id = a.anime_id
);

-- Passo 2: Atualizar registros antigos do `season_rankings` com os dados APENAS se a `anticipated_animes` for mais recente
UPDATE season_rankings s
SET 
  anime_score = a.score,
  members = a.members,
  favorites = a.favorites,
  status = a.status,
  updated_at = a.updated_at
FROM anticipated_animes a
WHERE s.anime_id = a.anime_id
AND a.updated_at > s.updated_at;

-- Passo 3: Renomear a tabela para garantir que não a percamos e tenhamos um backup
ALTER TABLE anticipated_animes RENAME TO anticipated_animes_backup;

-- O RLS e as policies migram com a tabela, mas vamos deixá-la quieta como backup.
