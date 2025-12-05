-- ============================================
-- ADD SEASON AND YEAR TO WEEKLY_EPISODES
-- ============================================
-- Adiciona colunas season e year para filtrar por temporada
-- Permite separar animes de diferentes seasons que possam
-- ter week_numbers conflitantes
-- ============================================

-- Adicionar colunas season e year
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_season_year 
ON weekly_episodes(season, year);

CREATE INDEX IF NOT EXISTS idx_weekly_episodes_week_season_year 
ON weekly_episodes(week_number, season, year);

-- Atualizar constraint único para incluir season e year
-- Primeiro, remover constraint antigo
ALTER TABLE weekly_episodes
DROP CONSTRAINT IF EXISTS unique_anime_episode_week;

-- Criar novo constraint único incluindo season e year
ALTER TABLE weekly_episodes
ADD CONSTRAINT unique_anime_episode_week_season 
UNIQUE (anime_id, episode_number, week_number, season, year);

-- Comentários para documentação
COMMENT ON COLUMN weekly_episodes.season IS 'Season do anime: winter, spring, summer, fall';
COMMENT ON COLUMN weekly_episodes.year IS 'Ano da temporada (ex: 2025)';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Colunas season e year adicionadas com sucesso!';
  RAISE NOTICE '✅ Índices criados para performance';
  RAISE NOTICE '✅ Constraint único atualizado';
END $$;
