-- ============================================
-- WEEKLY EPISODES - SISTEMA AUTOMÁTICO
-- ============================================
-- Busca animes Fall 2024 e episódios automaticamente
-- ============================================

-- Drop e recriar tabela
DROP TABLE IF EXISTS weekly_episodes CASCADE;

CREATE TABLE weekly_episodes (
  -- ID único
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação do anime
  anime_id INTEGER NOT NULL,
  anime_title_english TEXT,
  anime_image_url TEXT,
  from_url TEXT,
  
  -- Identificação do episódio
  episode_number INTEGER NOT NULL,
  episode_name TEXT,
  episode_score NUMERIC(4, 2),
  
  -- Tracking de semana
  week_number INTEGER NOT NULL,
  position_in_week INTEGER,
  
  -- Flag para identificar origem
  is_manual BOOLEAN DEFAULT false,
  
  -- Categorias do anime
  type TEXT,
  status TEXT,
  demographic JSONB DEFAULT '[]'::jsonb,
  genre JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '[]'::jsonb,
  
  -- Data de exibição do episódio
  aired_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint único
  CONSTRAINT unique_anime_episode_week UNIQUE (anime_id, episode_number, week_number)
);

-- Índices
CREATE INDEX idx_weekly_episodes_week ON weekly_episodes(week_number);
CREATE INDEX idx_weekly_episodes_anime ON weekly_episodes(anime_id);
CREATE INDEX idx_weekly_episodes_score ON weekly_episodes(episode_score DESC NULLS LAST);
CREATE INDEX idx_weekly_episodes_position ON weekly_episodes(position_in_week);
CREATE INDEX idx_weekly_episodes_aired ON weekly_episodes(aired_at DESC NULLS LAST);

-- RLS
ALTER TABLE weekly_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to weekly_episodes"
  ON weekly_episodes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role full access to weekly_episodes"
  ON weekly_episodes
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_weekly_episodes_updated_at
  BEFORE UPDATE ON weekly_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela weekly_episodes criada!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COLUNAS:';
  RAISE NOTICE '   - anime_id, anime_title_english, anime_image_url, from_url';
  RAISE NOTICE '   - episode_number, episode_name, episode_score';
  RAISE NOTICE '   - week_number, position_in_week, is_manual';
  RAISE NOTICE '   - type, status, demographic, genre, theme';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PRÓXIMO PASSO:';
  RAISE NOTICE '   Chame: POST /make-server-c1d1bfd8/sync-fall-2024';
END $$;
