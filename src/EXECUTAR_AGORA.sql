-- ============================================
-- EXECUTAR AGORA - SISTEMA AUTOMÁTICO
-- ============================================
-- Este é o ÚNICO arquivo SQL que você precisa executar
-- ============================================

-- ============================================
-- PASSO 1: Criar/Resetar Tabela
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

-- Trigger para updated_at
CREATE TRIGGER update_weekly_episodes_updated_at
  BEFORE UPDATE ON weekly_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PRONTO!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ TABELA CRIADA COM SUCESSO! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 ESTRUTURA DA TABELA:';
  RAISE NOTICE '   ✓ anime_id, anime_title_english, anime_image_url, from_url';
  RAISE NOTICE '   ✓ episode_number, episode_name, episode_score (1.00-5.00)';
  RAISE NOTICE '   ✓ week_number, position_in_week, is_manual';
  RAISE NOTICE '   ✓ type, status, demographic, genre, theme';
  RAISE NOTICE '   ✓ aired_at, created_at, updated_at';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PRÓXIMO PASSO:';
  RAISE NOTICE '';
  RAISE NOTICE '   Use npx supabase functions deploy para fazer deploy das functions';
  RAISE NOTICE '   Depois chame: POST /make-server-c1d1bfd8/sync-fall-2025';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 O QUE VAI ACONTECER:';
  RAISE NOTICE '   1. Busca animes Fall 2025 do Jikan API';
  RAISE NOTICE '   2. Filtra apenas com 5000+ membros';
  RAISE NOTICE '   3. Busca episódios de cada anime';
  RAISE NOTICE '   4. Busca RATING individual (1-5) de cada episódio';
  RAISE NOTICE '   5. Organiza por semanas (baseado em aired_at)';
  RAISE NOTICE '   6. Calcula posição por score';
  RAISE NOTICE '   7. Preenche TUDO automaticamente!';
  RAISE NOTICE '';
  RAISE NOTICE '⏱️  TEMPO: ~10-15 minutos (muitas requests para buscar rating)';
  RAISE NOTICE '';
END $$;
