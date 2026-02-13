// ============================================
// Supabase Edge Function: update-weekly-episodes
// Purpose: UPDATE scores and positions for existing episodes
// Runs: Every 1 hour
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_EXECUTION_TIME = 140000; // 140 seconds (leave 10s buffer before 150s timeout)

// Helper: Delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Fetch with retry
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Fetching (attempt ${i + 1}/${retries}): ${url}`);
      const response = await fetch(url);

      if (response.status === 429) {
        console.log(`⏳ Rate limited, waiting 3 seconds...`);
        await delay(3000);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Fetch error (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) throw error;
      await delay(2000);
    }
  }
}

// ============================================
// UPDATE EPISODES FOR A WEEK
// ============================================
async function updateWeeklyEpisodes(supabase: any, weekNumber: number) {
  console.log(`\n🔄 ============================================`);
  console.log(`🔄 UPDATING SCORES FOR WEEK ${weekNumber}`);
  console.log(`🔄 ============================================\n`);

  const startTime = Date.now();
  let itemsUpdated = 0;

  try {
    // Fetch ALL episodes from database for this week
    console.log(`🔍 Fetching episodes from database for week ${weekNumber}...`);
    const { data: dbEpisodes, error: fetchError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('season', 'winter')
      .eq('year', 2026)
      .eq('is_manual', false); // Only update auto-synced episodes

    if (fetchError) {
      throw new Error(`Error fetching episodes: ${fetchError.message}`);
    }

    if (!dbEpisodes || dbEpisodes.length === 0) {
      console.log(`✅ No episodes found for week ${weekNumber}`);
      return { success: true, itemsUpdated: 0, weekNumber };
    }

    console.log(`📊 Found ${dbEpisodes.length} episodes to update`);

    // Group episodes by anime_id to minimize API calls
    const episodesByAnime = new Map<number, any[]>();
    dbEpisodes.forEach(ep => {
      if (!episodesByAnime.has(ep.anime_id)) {
        episodesByAnime.set(ep.anime_id, []);
      }
      episodesByAnime.get(ep.anime_id)!.push(ep);
    });

    console.log(`📺 Grouped into ${episodesByAnime.size} unique animes\n`);

    // Update each anime's episodes
    let processedAnimeCount = 0;
    let timeoutReached = false;

    for (const [animeId, episodes] of episodesByAnime) {
      // ⏱️ TIMEOUT PROTECTION: Stop before 150s limit
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`\n⏱️ TIMEOUT PROTECTION: Stopping at ${processedAnimeCount}/${episodesByAnime.size} animes (${elapsedTime}ms elapsed)`);
        console.log(`⚠️ Remaining ${episodesByAnime.size - processedAnimeCount} animes will be updated in next run`);
        timeoutReached = true;
        break;
      }

      try {
        processedAnimeCount++;
        console.log(`[${processedAnimeCount}/${episodesByAnime.size}] Updating anime ${animeId} (${episodes.length} episodes)...`);

        await delay(RATE_LIMIT_DELAY);

        // Fetch ALL episode pages from API
        let allApiEpisodes: any[] = [];
        let episodePage = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          // ✅ FIXED: Use /episodes for page 1, /episodes?page=N for page 2+
          const episodesUrl = episodePage === 1
            ? `${JIKAN_BASE_URL}/anime/${animeId}/episodes`
            : `${JIKAN_BASE_URL}/anime/${animeId}/episodes?page=${episodePage}`;

          console.log(`  📄 Fetching episodes page ${episodePage}: ${episodesUrl}`);
          const episodesData = await fetchWithRetry(episodesUrl);

          if (!episodesData?.data || episodesData.data.length === 0) {
            hasNextPage = false;
            break;
          }

          allApiEpisodes.push(...episodesData.data);
          hasNextPage = episodesData.pagination?.has_next_page || false;
          episodePage++;

          if (hasNextPage) {
            await delay(RATE_LIMIT_DELAY);
          }
        }

        if (allApiEpisodes.length === 0) {
          console.log(`  ⚠️ No episodes found in API for anime ${animeId}`);
          continue;
        }

        // Update each episode's score
        for (const dbEpisode of episodes) {
          const apiEpisode = allApiEpisodes.find(ep => ep.mal_id === dbEpisode.episode_number);

          if (!apiEpisode) {
            console.log(`  ⚠️ Episode ${dbEpisode.episode_number} not found in API`);
            continue;
          }

          const newScore = apiEpisode.score || null;
          const oldScore = dbEpisode.episode_score;
          const newForumUrl = apiEpisode.forum_url || null;
          const oldForumUrl = dbEpisode.forum_url || null;

          // Update if score or forum_url changed
          if (newScore !== oldScore || newForumUrl !== oldForumUrl) {
            const { error: updateError } = await supabase
              .from('weekly_episodes')
              .update({
                episode_score: newScore,
                forum_url: newForumUrl,
              })
              .eq('id', dbEpisode.id);

            if (updateError) {
              console.error(`  ❌ Error updating episode ${dbEpisode.episode_number}:`, updateError);
            } else {
              if (newScore !== oldScore) {
                console.log(`  ✅ Updated EP${dbEpisode.episode_number}: score ${oldScore} → ${newScore}`);
              }
              if (newForumUrl !== oldForumUrl) {
                console.log(`  ✅ Updated EP${dbEpisode.episode_number}: forum_url updated`);
              }
              itemsUpdated++;
            }
          } else {
            console.log(`  ⏭️ EP${dbEpisode.episode_number}: Score unchanged (${newScore})`);
          }
        }
      } catch (error) {
        console.error(`❌ Error updating anime ${animeId}:`, error);
      }
    }

    // RECALCULATE POSITIONS AND TRENDS
    console.log(`\n🔄 Recalculating positions and trends for week ${weekNumber}...`);

    // Fetch updated episodes - ✅ FIXED: Filter by season and year too!
    const { data: updatedEpisodes, error: refetchError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('season', 'winter')
      .eq('year', 2026);

    if (refetchError) {
      console.error(`❌ Error refetching episodes:`, refetchError);
    } else if (updatedEpisodes) {
      // Sort by score (descending), nulls at end
      const sorted = updatedEpisodes.sort((a, b) => {
        const scoreA = a.episode_score !== null ? a.episode_score : -1;
        const scoreB = b.episode_score !== null ? b.episode_score : -1;
        return scoreB - scoreA;
      });

      // Update positions
      for (let i = 0; i < sorted.length; i++) {
        const episode = sorted[i];
        const newPosition = i + 1;
        const oldPosition = episode.position_in_week;

        // Calculate trend
        let newTrend = episode.trend;
        if (weekNumber > 1) {
          // ✅ FIXED: Filter by season and year when looking for previous episode
          const { data: prevEpisode } = await supabase
            .from('weekly_episodes')
            .select('position_in_week')
            .eq('anime_id', episode.anime_id)
            .eq('episode_number', episode.episode_number)
            .eq('season', 'winter')
            .eq('year', 2026)
            .eq('week_number', weekNumber - 1)
            .maybeSingle();

          if (prevEpisode) {
            const positionChange = prevEpisode.position_in_week - newPosition;
            if (positionChange > 0) {
              newTrend = `+${positionChange}`;
            } else if (positionChange < 0) {
              newTrend = `${positionChange}`;
            } else {
              newTrend = '=';
            }
          } else {
            newTrend = 'NEW';
          }
        } else {
          newTrend = 'NEW';
        }

        // Only update if position or trend changed
        if (newPosition !== oldPosition || newTrend !== episode.trend) {
          const { error: posError } = await supabase
            .from('weekly_episodes')
            .update({
              position_in_week: newPosition,
              trend: newTrend
            })
            .eq('id', episode.id);

          if (!posError) {
            console.log(`📊 ${episode.anime_title_english} EP${episode.episode_number}: #${oldPosition} → #${newPosition} (${newTrend})`);
          }
        }
      }

      console.log(`✅ Position recalculation complete`);
    }

    const duration = Date.now() - startTime;

    // Log sync
    await supabase.from('sync_logs').insert({
      sync_type: 'update_weekly_episodes',
      status: 'success',
      week_number: weekNumber,
      items_synced: dbEpisodes.length,
      items_created: 0,
      items_updated: itemsUpdated,
      duration_ms: duration,
    });

    console.log(`\n✅ ============================================`);
    console.log(`✅ Week ${weekNumber} UPDATE completed!`);
    console.log(`✅ Episodes checked: ${dbEpisodes.length}`);
    console.log(`✅ Scores updated: ${itemsUpdated}`);
    console.log(`✅ Duration: ${duration}ms`);
    console.log(`✅ ============================================`);

    return { success: true, itemsUpdated, weekNumber };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error updating week ${weekNumber}:`, error);

    await supabase.from('sync_logs').insert({
      sync_type: 'update_weekly_episodes',
      status: 'error',
      week_number: weekNumber,
      error_message: error.message,
      error_details: { stack: error.stack },
      duration_ms: duration,
    });

    throw error;
  }
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    console.log('\n🚀 Update weekly episodes function invoked');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get week_number from request body (if provided)
    const body = await req.text();
    const { week_number } = body ? JSON.parse(body) : {};

    let weekToProcess: number;

    // Auto-detect current week if not provided
    if (week_number) {
      // Support dynamic week values: "current", "current-1", "current-2", or numeric
      // Winter 2026 starts January 1, 2026 (Wednesday)
      // Week 1: Jan 1-4 (Wed-Sun, partial week)
      // Week 2+: Monday-Sunday (full weeks)
      const seasonStartDate = new Date(Date.UTC(2026, 0, 1)); // January 1, 2026
      const today = new Date();

      // Find the first Sunday of the season
      const firstSunday = new Date(seasonStartDate);
      const dayOfWeek = firstSunday.getUTCDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
      firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);

      let currentWeek: number;

      // Check if today is in Week 1
      if (today >= seasonStartDate && today <= firstSunday) {
        currentWeek = 1;
      } else {
        // Week 2+ starts on Monday after first Sunday
        const firstMonday = new Date(firstSunday);
        firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);

        const diffTime = today.getTime() - firstMonday.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        currentWeek = Math.floor(diffDays / 7) + 2; // +2 because Week 1 is already used
        currentWeek = Math.max(1, Math.min(13, currentWeek));
      }

      if (week_number === "current") {
        weekToProcess = currentWeek;
        console.log(`📅 Using current week: ${weekToProcess}`);
      } else if (week_number === "current-1") {
        weekToProcess = Math.max(1, currentWeek - 1);
        console.log(`📅 Using previous week (current-1): ${weekToProcess}`);
      } else if (week_number === "current-2") {
        weekToProcess = Math.max(1, currentWeek - 2);
        console.log(`📅 Using 2 weeks ago (current-2): ${weekToProcess}`);
      } else if (typeof week_number === "number") {
        weekToProcess = week_number;
        console.log(`📅 Using provided numeric week: ${weekToProcess}`);
      } else {
        // Fallback to current week
        weekToProcess = currentWeek;
        console.log(`📅 Invalid week_number format, using current week: ${weekToProcess}`);
      }
    } else {
      // Auto-detect current week based on Winter 2026
      // Winter 2026 starts January 1, 2026 (Wednesday)
      // Week 1: Jan 1-4 (Wed-Sun, partial week)
      // Week 2+: Monday-Sunday (full weeks)
      const seasonStartDate = new Date(Date.UTC(2026, 0, 1)); // January 1, 2026
      const today = new Date();

      // Find the first Sunday of the season
      const firstSunday = new Date(seasonStartDate);
      const dayOfWeek = firstSunday.getUTCDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
      firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);

      let currentWeek: number;

      // Check if today is in Week 1
      if (today >= seasonStartDate && today <= firstSunday) {
        currentWeek = 1;
      } else {
        // Week 2+ starts on Monday after first Sunday
        const firstMonday = new Date(firstSunday);
        firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);

        const diffTime = today.getTime() - firstMonday.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        currentWeek = Math.floor(diffDays / 7) + 2; // +2 because Week 1 is already used
        currentWeek = Math.max(1, Math.min(13, currentWeek));
      }

      weekToProcess = currentWeek;
      console.log(`📅 Auto-detected current week: ${weekToProcess} (Date: ${today.toISOString().split('T')[0]})`);
    }

    // Process ONLY ONE week per execution
    console.log(`📅 Updating week: ${weekToProcess}`);

    const result = await updateWeeklyEpisodes(supabase, weekToProcess);

    return new Response(
      JSON.stringify({
        success: true,
        week_updated: weekToProcess,
        itemsUpdated: result.itemsUpdated
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});