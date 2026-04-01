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

// ============================================
// SEASON UTILITIES
// ============================================
type SeasonName = 'winter' | 'spring' | 'summer' | 'fall';

interface SeasonInfo {
  name: SeasonName;
  year: number;
  startDate: Date;
  endDate: Date;
}

function getSeasonDates(season: SeasonName, year: number): { startDate: Date; endDate: Date } {
  let startMonth: number;
  let endMonth: number;

  switch (season.toLowerCase()) {
    case 'winter': startMonth = 0; endMonth = 2; break;
    case 'spring': startMonth = 3; endMonth = 5; break;
    case 'summer': startMonth = 6; endMonth = 8; break;
    case 'fall': startMonth = 9; endMonth = 11; break;
    default: startMonth = 0; endMonth = 2;
  }

  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999));
  return { startDate, endDate };
}

function getSeasonFromDate(date: Date): SeasonInfo {
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  let season: SeasonName;

  if (month >= 0 && month <= 2) season = 'winter';
  else if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else season = 'fall';

  const { startDate, endDate } = getSeasonDates(season, year);
  return { name: season, year, startDate, endDate };
}

function getWeekInSeason(date: Date, seasonInfo: SeasonInfo): number {
  const { startDate } = seasonInfo;
  const firstSunday = new Date(startDate);
  const dayOfWeek = firstSunday.getUTCDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
  firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);

  if (date >= startDate && date <= firstSunday) return 1;

  const firstMonday = new Date(firstSunday);
  firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);
  const diffTime = date.getTime() - firstMonday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(15, Math.floor(diffDays / 7) + 2));
}

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
async function updateWeeklyEpisodes(supabase: any, weekNumber: number, seasonInfo: SeasonInfo) {
  console.log(`\n🔄 ============================================`);
  console.log(`🔄 UPDATING SCORES FOR WEEK ${weekNumber} (${seasonInfo.name.toUpperCase()} ${seasonInfo.year})`);
  console.log(`🔄 ============================================\n`);

  const startTime = Date.now();
  let itemsUpdated = 0;

  try {
    // Fetch ALL episodes from database for this week and seasons
    // During transition months, we might have episodes from two different seasons in the same week
    const currentMonth = new Date().getUTCMonth();
    const seasonsToQuery = [seasonInfo.name as string];
    
    // If we are in the last month of a season, also query the next season
    if (currentMonth % 3 === 2) {
      const nextSeasons: Record<string, string> = { 'winter': 'spring', 'spring': 'summer', 'summer': 'fall', 'fall': 'winter' };
      seasonsToQuery.push(nextSeasons[seasonInfo.name]);
    }

    console.log(`🔍 Fetching episodes from database for week ${weekNumber} (Seasons: ${seasonsToQuery.join(', ')})...`);
    const { data: dbEpisodes, error: fetchError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .in('season', seasonsToQuery)
      .eq('year', seasonInfo.year)
      .eq('is_manual', false);

    if (fetchError) {
      throw new Error(`Error fetching episodes: ${fetchError.message}`);
    }

    if (!dbEpisodes || dbEpisodes.length === 0) {
      console.log(`✅ No episodes found for week ${weekNumber}`);
      return { success: true, itemsUpdated: 0, weekNumber };
    }

    console.log(`📊 Found ${dbEpisodes.length} episodes to update`);

    // Group episodes by anime_id
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
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`\n⏱️ TIMEOUT PROTECTION: Stopping at ${processedAnimeCount}/${episodesByAnime.size} animes`);
        timeoutReached = true;
        break;
      }

      try {
        processedAnimeCount++;
        console.log(`[${processedAnimeCount}/${episodesByAnime.size}] Updating anime ${animeId}...`);

        await delay(RATE_LIMIT_DELAY);

        let allApiEpisodes: any[] = [];
        let episodePage = 1;
        let hasNextPage = true;

        while (hasNextPage) {
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

          if (hasNextPage) await delay(RATE_LIMIT_DELAY);
        }

        if (allApiEpisodes.length === 0) continue;

        for (const dbEpisode of episodes) {
          const apiEpisode = allApiEpisodes.find(ep => ep.mal_id === dbEpisode.episode_number);
          if (!apiEpisode) continue;

          const newScore = apiEpisode.score || null;
          const oldScore = dbEpisode.episode_score;
          const newForumUrl = apiEpisode.forum_url || null;
          const oldForumUrl = dbEpisode.forum_url || null;

          if (newScore !== oldScore || newForumUrl !== oldForumUrl) {
            const { error: updateError } = await supabase
              .from('weekly_episodes')
              .update({
                episode_score: newScore,
                forum_url: newForumUrl,
              })
              .eq('id', dbEpisode.id);

            if (!updateError) {
              if (newScore !== oldScore) console.log(`  ✅ Updated EP${dbEpisode.episode_number}: score ${oldScore} → ${newScore}`);
              if (newForumUrl !== oldForumUrl) console.log(`  ✅ Updated EP${dbEpisode.episode_number}: forum_url updated`);
              itemsUpdated++;
            }
          } else {
            console.log(`  ⏭️ EP${dbEpisode.episode_number}: No change`);
          }
        }
      } catch (error) {
        console.error(`❌ Error updating anime ${animeId}:`, error);
      }
    }

    // RECALCULATE POSITIONS AND TRENDS
    console.log(`\n🔄 Recalculating positions and trends...`);

    const seasonsToQueryRerank = [seasonInfo.name as string];
    if (currentMonth % 3 === 2) {
      const nextSeasons: Record<string, string> = { 'winter': 'spring', 'spring': 'summer', 'summer': 'fall', 'fall': 'winter' };
      seasonsToQueryRerank.push(nextSeasons[seasonInfo.name]);
    }

    const { data: updatedEpisodes, error: refetchError } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .in('season', seasonsToQueryRerank)
      .eq('year', seasonInfo.year);

    if (!refetchError && updatedEpisodes) {
      const sorted = updatedEpisodes.sort((a, b) => {
        const scoreA = a.episode_score !== null ? a.episode_score : -1;
        const scoreB = b.episode_score !== null ? b.episode_score : -1;
        return scoreB - scoreA;
      });

      for (let i = 0; i < sorted.length; i++) {
        const episode = sorted[i];
        const newPosition = i + 1;
        const oldPosition = episode.position_in_week;
        let newTrend = episode.trend;

        if (weekNumber > 1) {
          const { data: prevEpisode } = await supabase
            .from('weekly_episodes')
            .select('position_in_week')
            .eq('anime_id', episode.anime_id)
            .eq('episode_number', episode.episode_number)
            .eq('season', seasonInfo.name)
            .eq('year', seasonInfo.year)
            .eq('week_number', weekNumber - 1)
            .maybeSingle();

          if (prevEpisode) {
            const positionChange = prevEpisode.position_in_week - newPosition;
            if (positionChange > 0) newTrend = `+${positionChange}`;
            else if (positionChange < 0) newTrend = `${positionChange}`;
            else newTrend = '=';
          } else {
            newTrend = 'NEW';
          }
        } else {
          newTrend = 'NEW';
        }

        if (newPosition !== oldPosition || newTrend !== episode.trend) {
          await supabase
            .from('weekly_episodes')
            .update({ position_in_week: newPosition, trend: newTrend })
            .eq('id', episode.id);
          console.log(`📊 ${episode.anime_title_english} EP${episode.episode_number}: #${oldPosition} → #${newPosition} (${newTrend})`);
        }
      }
    }

    const duration = Date.now() - startTime;
    await supabase.from('sync_logs').insert({
      sync_type: 'update_weekly_episodes',
      status: 'success',
      week_number: weekNumber,
      items_synced: dbEpisodes.length,
      items_updated: itemsUpdated,
      duration_ms: duration,
      error_details: { season: seasonInfo.name, year: seasonInfo.year }
    });

    console.log(`\n✅ UPDATE completed! Items checked: ${dbEpisodes.length}, Updated: ${itemsUpdated}`);
    return { success: true, itemsUpdated, weekNumber };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error updating episodes:`, error);
    await supabase.from('sync_logs').insert({
      sync_type: 'update_weekly_episodes',
      status: 'error',
      week_number: weekNumber,
      error_message: error.message,
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

    const body = await req.text();
    const { week_number } = body ? JSON.parse(body) : {};

    const today = new Date();
    const currentSeasonInfo = getSeasonFromDate(today);
    const autoWeek = getWeekInSeason(today, currentSeasonInfo);

    let weekToProcess: number;
    let seasonToProcess = currentSeasonInfo;

    if (week_number) {
      if (week_number === "current") weekToProcess = autoWeek;
      else if (week_number === "current-1") weekToProcess = Math.max(1, autoWeek - 1);
      else if (week_number === "current-2") weekToProcess = Math.max(1, autoWeek - 2);
      else if (typeof week_number === "number") weekToProcess = week_number;
      else weekToProcess = autoWeek;
    } else {
      weekToProcess = autoWeek;
    }

    console.log(`📅 Updating: ${seasonToProcess.name.toUpperCase()} ${seasonToProcess.year} Week ${weekToProcess}`);
    const result = await updateWeeklyEpisodes(supabase, weekToProcess, seasonToProcess);

    return new Response(
      JSON.stringify({
        success: true,
        week_updated: weekToProcess,
        season: seasonToProcess.name,
        year: seasonToProcess.year,
        itemsUpdated: result.itemsUpdated
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});