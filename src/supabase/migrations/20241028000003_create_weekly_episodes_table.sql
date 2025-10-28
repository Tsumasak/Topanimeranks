-- ============================================
-- CRIAR TABELA WEEKLY_EPISODES
-- ============================================

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

-- Trigger para updated_at (assumindo que a função já existe)
-- Se não existir, será criada pela migration anterior
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

CREATE TRIGGER update_weekly_episodes_updated_at
  BEFORE UPDATE ON weekly_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
