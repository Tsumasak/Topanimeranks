-- ============================================
-- FIX RANKINGS BY SEASON AND YEAR
-- ============================================
-- Este script corrige os rankings dos episódios que foram calculados
-- erroneamente ao misturar episódios de diferentes season/year na mesma week.
--
-- PROBLEMA IDENTIFICADO:
-- A função update-weekly-episodes estava calculando rankings baseado APENAS
-- em week_number, sem filtrar por season e year. Isso causava:
-- - Rankings de #200+ (misturando múltiplas temporadas)
-- - Trend indicators muito altos (▼211, ▼319, etc)
-- - EP1 com rank melhor que episódios com score maior
--
-- SOLUÇÃO:
-- Recalcular position_in_week e trend para cada combinação de
-- season + year + week_number separadamente.
-- ============================================

DO $$
DECLARE
  season_rec RECORD;
  week_rec RECORD;
  episode_rec RECORD;
  new_position INTEGER;
  prev_position INTEGER;
  new_trend TEXT;
  position_counter INTEGER;
BEGIN
  RAISE NOTICE '🔄 Starting rankings recalculation by season/year/week...';
  
  -- Loop através de cada combinação única de season + year
  -- ✅ FIXED: Include CASE in SELECT for DISTINCT to work with ORDER BY
  FOR season_rec IN 
    SELECT DISTINCT 
      season, 
      year,
      CASE season
        WHEN 'winter' THEN 1
        WHEN 'spring' THEN 2
        WHEN 'summer' THEN 3
        WHEN 'fall' THEN 4
      END as season_order
    FROM weekly_episodes 
    ORDER BY year DESC, season_order DESC
  LOOP
    RAISE NOTICE '📅 Processing: % %', season_rec.season, season_rec.year;
    
    -- Loop através de cada semana desta temporada
    FOR week_rec IN 
      SELECT DISTINCT week_number 
      FROM weekly_episodes 
      WHERE season = season_rec.season 
        AND year = season_rec.year
      ORDER BY week_number
    LOOP
      RAISE NOTICE '  📊 Week %: Recalculating positions...', week_rec.week_number;
      
      position_counter := 0;
      
      -- Loop através dos episódios desta semana, ordenados por score
      FOR episode_rec IN 
        SELECT 
          id,
          anime_id,
          episode_number,
          anime_title_english,
          episode_score,
          position_in_week as old_position
        FROM weekly_episodes
        WHERE season = season_rec.season
          AND year = season_rec.year
          AND week_number = week_rec.week_number
        ORDER BY 
          CASE 
            WHEN episode_score IS NULL THEN -1 
            ELSE episode_score 
          END DESC
      LOOP
        position_counter := position_counter + 1;
        new_position := position_counter;
        
        -- Calculate trend (compare with previous week in SAME season/year)
        IF week_rec.week_number = 1 THEN
          new_trend := 'NEW';
        ELSE
          -- Try to find this same episode in previous week
          SELECT position_in_week INTO prev_position
          FROM weekly_episodes
          WHERE season = season_rec.season
            AND year = season_rec.year
            AND week_number = week_rec.week_number - 1
            AND anime_id = episode_rec.anime_id
            AND episode_number = episode_rec.episode_number
          LIMIT 1;
          
          IF prev_position IS NOT NULL THEN
            -- Calculate position change
            IF prev_position < new_position THEN
              -- Went down in ranking (worse)
              new_trend := '-' || (new_position - prev_position)::TEXT;
            ELSIF prev_position > new_position THEN
              -- Went up in ranking (better)
              new_trend := '+' || (prev_position - new_position)::TEXT;
            ELSE
              -- Same position
              new_trend := '=';
            END IF;
          ELSE
            -- Episode not found in previous week
            new_trend := 'NEW';
          END IF;
        END IF;
        
        -- Update the episode
        UPDATE weekly_episodes
        SET 
          position_in_week = new_position,
          trend = new_trend
        WHERE id = episode_rec.id;
        
        -- Log significant changes
        IF episode_rec.old_position IS NOT NULL 
           AND ABS(episode_rec.old_position - new_position) > 5 THEN
          RAISE NOTICE '    🔧 FIXED: % EP% - Rank #% → #% (%)', 
            episode_rec.anime_title_english,
            episode_rec.episode_number,
            episode_rec.old_position,
            new_position,
            new_trend;
        END IF;
      END LOOP;
      
      RAISE NOTICE '  ✅ Week %: Updated % episodes', week_rec.week_number, position_counter;
    END LOOP;
    
    RAISE NOTICE '✅ Completed: % %', season_rec.season, season_rec.year;
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '🎉 Rankings recalculation completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary by Season/Year:';
  
  -- Show summary
  FOR season_rec IN
    SELECT 
      season,
      year,
      COUNT(*) as total_episodes,
      COUNT(DISTINCT week_number) as total_weeks,
      MIN(position_in_week) as best_rank,
      MAX(position_in_week) as worst_rank
    FROM weekly_episodes
    GROUP BY season, year
    ORDER BY year DESC, 
      CASE season
        WHEN 'winter' THEN 1
        WHEN 'spring' THEN 2
        WHEN 'summer' THEN 3
        WHEN 'fall' THEN 4
      END DESC
  LOOP
    RAISE NOTICE '  % %: % episodes across % weeks (Ranks: #1-#%)',
      season_rec.season,
      season_rec.year,
      season_rec.total_episodes,
      season_rec.total_weeks,
      season_rec.worst_rank;
  END LOOP;
  
END $$;

-- ============================================
-- VERIFICAÇÃO: Mostrar alguns exemplos de rankings corrigidos
-- ============================================
SELECT 
  season,
  year,
  week_number,
  position_in_week,
  trend,
  anime_title_english,
  episode_number,
  episode_name,
  episode_score
FROM weekly_episodes
WHERE season = 'winter'
  AND year = 2026
  AND week_number = 4
  AND position_in_week <= 20
ORDER BY position_in_week
LIMIT 10;