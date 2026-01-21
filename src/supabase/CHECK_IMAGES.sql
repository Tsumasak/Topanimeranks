-- ============================================
-- CHECK IMAGES IN DATABASE
-- ============================================
-- Verifica se as imagens estão sendo salvas corretamente
-- nas tabelas season_rankings e weekly_episodes
-- ============================================

-- 1. Check season_rankings images
SELECT 
  '=== SEASON RANKINGS ===' as section,
  NULL as anime_id,
  NULL as title,
  NULL as image_url,
  NULL as season,
  NULL as year
UNION ALL
SELECT 
  NULL as section,
  anime_id,
  title_english || ' (' || title || ')' as title,
  CASE 
    WHEN image_url IS NULL THEN '❌ NULL'
    WHEN image_url = '' THEN '❌ EMPTY STRING'
    WHEN image_url LIKE 'https://cdn.myanimelist.net/%' THEN '✅ ' || LEFT(image_url, 60) || '...'
    ELSE '⚠️ ' || LEFT(image_url, 60) || '...'
  END as image_url,
  season,
  year::TEXT
FROM season_rankings
WHERE season = 'winter' AND year = 2026
ORDER BY anime_id
LIMIT 10;

-- 2. Count images by status in season_rankings
SELECT 
  season,
  year,
  COUNT(*) as total_animes,
  SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END) as has_image,
  SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) as null_image,
  SUM(CASE WHEN image_url = '' THEN 1 ELSE 0 END) as empty_image,
  ROUND(100.0 * SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END) / COUNT(*), 2) || '%' as image_coverage
FROM season_rankings
GROUP BY season, year
ORDER BY year DESC, 
  CASE season
    WHEN 'winter' THEN 1
    WHEN 'spring' THEN 2
    WHEN 'summer' THEN 3
    WHEN 'fall' THEN 4
  END DESC;

-- 3. Check weekly_episodes images
SELECT 
  '=== WEEKLY EPISODES ===' as info,
  NULL::INTEGER as anime_id,
  NULL as title,
  NULL as image_status,
  NULL as season,
  NULL::INTEGER as year
UNION ALL
SELECT 
  NULL as info,
  anime_id,
  anime_title_english,
  CASE 
    WHEN anime_image_url IS NULL THEN '❌ NULL'
    WHEN anime_image_url = '' THEN '❌ EMPTY'
    ELSE '✅ HAS IMAGE'
  END as image_status,
  season,
  year
FROM weekly_episodes
WHERE season = 'winter' AND year = 2026
ORDER BY anime_id
LIMIT 10;

-- 4. Count images by status in weekly_episodes
SELECT 
  season,
  year,
  COUNT(*) as total_episodes,
  SUM(CASE WHEN anime_image_url IS NOT NULL AND anime_image_url != '' THEN 1 ELSE 0 END) as has_image,
  SUM(CASE WHEN anime_image_url IS NULL THEN 1 ELSE 0 END) as null_image,
  SUM(CASE WHEN anime_image_url = '' THEN 1 ELSE 0 END) as empty_image,
  ROUND(100.0 * SUM(CASE WHEN anime_image_url IS NOT NULL AND anime_image_url != '' THEN 1 ELSE 0 END) / COUNT(*), 2) || '%' as image_coverage
FROM weekly_episodes
GROUP BY season, year
ORDER BY year DESC,
  CASE season
    WHEN 'winter' THEN 1
    WHEN 'spring' THEN 2
    WHEN 'summer' THEN 3
    WHEN 'fall' THEN 4
  END DESC;

-- 5. Show specific examples where images are missing
SELECT 
  '=== MISSING IMAGES EXAMPLES ===' as section,
  NULL::INTEGER as anime_id,
  NULL as title,
  NULL as table_name
UNION ALL
SELECT 
  NULL as section,
  anime_id,
  title_english || ' (' || title || ')' as title,
  'season_rankings' as table_name
FROM season_rankings
WHERE (image_url IS NULL OR image_url = '')
  AND season = 'winter' 
  AND year = 2026
LIMIT 5;

-- 6. Verify if API structure changed - check a known anime
SELECT 
  '=== SAMPLE ANIME (Frieren - ID 52991) ===' as info,
  anime_id,
  title,
  title_english,
  image_url,
  season,
  year
FROM season_rankings
WHERE anime_id = 52991
LIMIT 1;
