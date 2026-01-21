-- ============================================
-- TESTE DE PICTURES - ANIME 59978
-- ============================================
-- Script para testar o sistema de pictures com o anime 59978
-- Insere os dados de pictures conforme o exemplo fornecido
-- ============================================

-- Primeiro, verificar se o anime 59978 existe
SELECT anime_id, title_english, season, year, 
       CASE 
         WHEN pictures IS NULL THEN 'NULL'
         WHEN jsonb_array_length(pictures) = 0 THEN 'Empty array'
         ELSE 'Has ' || jsonb_array_length(pictures) || ' pictures'
       END as pictures_status
FROM season_rankings
WHERE anime_id = 59978;

-- Se o anime existe, atualizar com as pictures de teste
-- (Use os dados do endpoint /pictures fornecido)
UPDATE season_rankings
SET pictures = '[
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1522/145800.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1522/145800.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800l.webp"
    }
  },
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1750/145801.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1750/145801t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1750/145801l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1750/145801.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1750/145801t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1750/145801l.webp"
    }
  },
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1463/146324.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1463/146324t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1463/146324l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1463/146324.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1463/146324t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1463/146324l.webp"
    }
  },
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1089/148301.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1089/148301t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1089/148301l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1089/148301.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1089/148301t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1089/148301l.webp"
    }
  },
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1064/152251.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1064/152251t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1064/152251l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1064/152251.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1064/152251t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1064/152251l.webp"
    }
  },
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1921/154528.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1921/154528t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1921/154528l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1921/154528.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1921/154528t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1921/154528l.webp"
    }
  },
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1521/154608.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1521/154608t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1521/154608l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1521/154608.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1521/154608t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1521/154608l.webp"
    }
  }
]'::jsonb
WHERE anime_id = 59978;

-- Verificar se a atualização foi bem-sucedida
SELECT anime_id, title_english, 
       jsonb_array_length(pictures) as picture_count,
       pictures->0->'jpg'->>'image_url' as first_picture_url
FROM season_rankings
WHERE anime_id = 59978;

-- Ver todas as pictures URLs
SELECT anime_id, title_english,
       jsonb_array_elements(pictures)->'jpg'->>'image_url' as picture_url
FROM season_rankings
WHERE anime_id = 59978;

-- ============================================
-- INSTRUÇÕES DE USO:
-- ============================================
-- 1. Copie todo este script
-- 2. Cole no SQL Editor do Supabase Dashboard
-- 3. Execute o script completo
-- 4. Acesse a página do anime: /anime/59978
-- 5. Clique na imagem do poster
-- 6. O lightbox deve abrir com 7 imagens no carrossel
-- ============================================
