-- ============================================
-- RESET WEEKLY EPISODES TABLE
-- ============================================
-- Recria a tabela do zero com estrutura correta
-- baseada nas APIs do Jikan
-- ============================================

-- Drop table antiga (vai limpar tudo)
DROP TABLE IF EXISTS weekly_episodes CASCADE;

-- Recriar tabela do zero
CREATE TABLE weekly_episodes (
  -- ID único
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação do anime (do /anime/{id})
  anime_id INTEGER NOT NULL,
  anime_title_english TEXT,
  anime_image_url TEXT,
  from_url TEXT,
  
  -- Identificação do episódio (do /anime/{id}/episodes)
  episode_number INTEGER NOT NULL,
  episode_name TEXT,
  episode_score NUMERIC(4, 2),
  
  -- Tracking de semana
  week_number INTEGER NOT NULL,
  position_in_week INTEGER,
  
  -- Flag manual
  is_manual BOOLEAN DEFAULT false,
  
  -- Categorias do anime
  type TEXT,
  status TEXT,
  demographic JSONB DEFAULT '[]'::jsonb,
  genre JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: mesmo anime + episódio não pode aparecer 2x na mesma week
  CONSTRAINT unique_anime_episode_week UNIQUE (anime_id, episode_number, week_number)
);

-- Índices para performance
CREATE INDEX idx_weekly_episodes_week ON weekly_episodes(week_number);
CREATE INDEX idx_weekly_episodes_anime ON weekly_episodes(anime_id);
CREATE INDEX idx_weekly_episodes_score ON weekly_episodes(episode_score DESC NULLS LAST);
CREATE INDEX idx_weekly_episodes_position ON weekly_episodes(position_in_week);

-- RLS (mesmas regras)
ALTER TABLE weekly_episodes ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Allow public read access to weekly_episodes"
  ON weekly_episodes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
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
-- FUNÇÃO: INSERT EPISODE MANUAL
-- ============================================
CREATE OR REPLACE FUNCTION insert_episode(
  p_anime_id INTEGER,
  p_episode_number INTEGER,
  p_week_number INTEGER,
  p_position INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insere ou atualiza episódio
  INSERT INTO weekly_episodes (
    anime_id,
    episode_number,
    week_number,
    position_in_week,
    is_manual
  ) VALUES (
    p_anime_id,
    p_episode_number,
    p_week_number,
    p_position,
    true
  )
  ON CONFLICT (anime_id, episode_number, week_number) 
  DO UPDATE SET
    position_in_week = EXCLUDED.position_in_week,
    updated_at = NOW();
  
  RAISE NOTICE 'Episódio inserido: Anime % - EP % - Week %', p_anime_id, p_episode_number, p_week_number;
END;
$$;

COMMENT ON FUNCTION insert_episode IS 'Insere um episódio manualmente (só ID, resto vem do enrich)';

-- ============================================
-- FUNÇÃO: ENRICH EPISODES (Buscar dados da API)
-- ============================================
CREATE OR REPLACE FUNCTION enrich_episodes()
RETURNS TABLE(
  total_enriched INTEGER,
  total_errors INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_enriched INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  RAISE NOTICE 'Use a Edge Function para enriquecer os dados!';
  RAISE NOTICE 'POST /make-server-c1d1bfd8/enrich-episodes';
  
  total_enriched := 0;
  total_errors := 0;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION enrich_episodes IS 'Placeholder - use Edge Function para enriquecer';

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela weekly_episodes resetada!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 ESTRUTURA:';
  RAISE NOTICE '   - anime_id, episode_number, week_number (obrigatórios)';
  RAISE NOTICE '   - Outros campos serão preenchidos via enrich';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Inserir IDs manualmente ou via função';
  RAISE NOTICE '   2. Rodar enrich para buscar dados da API';
  RAISE NOTICE '';
  RAISE NOTICE '💡 EXEMPLO:';
  RAISE NOTICE '   SELECT insert_episode(60098, 1, 1, 1);';
END $$;
