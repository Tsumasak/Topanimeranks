-- ============================================
-- ADD PICTURES COLUMN TO SEASON_RANKINGS
-- ============================================
-- Adiciona coluna pictures (JSONB array) para armazenar múltiplas imagens do anime
-- Cada picture contém jpg e webp variants (image_url, small_image_url, large_image_url)
-- Exemplo: [{"jpg": {...}, "webp": {...}}, ...]
-- ============================================

ALTER TABLE season_rankings 
ADD COLUMN IF NOT EXISTS pictures JSONB DEFAULT '[]'::jsonb;

-- Adicionar índice para buscas mais rápidas (opcional)
CREATE INDEX IF NOT EXISTS idx_season_rankings_pictures ON season_rankings USING GIN (pictures);

-- Adicionar comentário na coluna
COMMENT ON COLUMN season_rankings.pictures IS 'Array de imagens do anime obtidas do Jikan API /pictures endpoint';
