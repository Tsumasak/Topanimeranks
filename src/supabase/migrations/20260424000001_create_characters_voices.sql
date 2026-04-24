-- ============================================
-- Characters & Voice Actors Schema
-- ============================================

-- 1. CHARACTERS TABLE
CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY, -- mal_id
  name TEXT,
  name_kanji TEXT,
  about TEXT,
  url TEXT,
  image_url TEXT,
  favorites INTEGER DEFAULT 0,
  nicknames JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '{}'::jsonb,
  all_pictures JSONB DEFAULT '[]'::jsonb,
  animeography JSONB DEFAULT '[]'::jsonb,
  mangaography JSONB DEFAULT '[]'::jsonb,
  
  -- Sync controlling
  synced_full_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_synced_full_at ON characters(synced_full_at NULLS FIRST);
CREATE INDEX idx_characters_updated_at ON characters(updated_at);

-- 2. VOICE ACTORS TABLE
CREATE TABLE IF NOT EXISTS voice_actors (
  id INTEGER PRIMARY KEY, -- mal_id
  name TEXT,
  url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHARACTER_VOICES RELATION
CREATE TABLE IF NOT EXISTS character_voices (
  character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  voice_actor_id INTEGER REFERENCES voice_actors(id) ON DELETE CASCADE,
  language TEXT,
  
  PRIMARY KEY (character_id, voice_actor_id, language)
);

CREATE INDEX idx_char_voices_char_id ON character_voices(character_id);
CREATE INDEX idx_char_voices_voice_id ON character_voices(voice_actor_id);

-- 4. ANIME_CHARACTERS RELATION
CREATE TABLE IF NOT EXISTS anime_characters (
  anime_id INTEGER NOT NULL, -- references external anime mal_id
  character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT, -- Main, Supporting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (anime_id, character_id)
);

CREATE INDEX idx_anime_chars_anime_id ON anime_characters(anime_id);
CREATE INDEX idx_anime_chars_char_id ON anime_characters(character_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_characters_updated_at') THEN
    CREATE TRIGGER update_characters_updated_at
      BEFORE UPDATE ON characters
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_characters ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the frontend via anon)
CREATE POLICY "Allow public read access to characters" ON characters FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to voice_actors" ON voice_actors FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to character_voices" ON character_voices FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to anime_characters" ON anime_characters FOR SELECT TO anon USING (true);

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Allow service role full access to characters" ON characters TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to voice_actors" ON voice_actors TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to character_voices" ON character_voices TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to anime_characters" ON anime_characters TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Characters & Voices schema created successfully!';
END $$;
