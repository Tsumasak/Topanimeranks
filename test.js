"use strict";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";
const RATE_LIMIT_DELAY = 500;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`\u{1F504} Fetching (attempt ${i + 1}/${retries}): ${url}`);
      const response = await fetch(url);
      console.log(`\u{1F4E1} Response status: ${response.status} ${response.statusText}`);
      if (response.status === 429) {
        console.log(`Rate limited, waiting 3 seconds... (attempt ${i + 1}/${retries})`);
        await delay(3e3);
        continue;
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`\u274C HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
      }
      const data = await response.json();
      console.log(`\u2705 Data received, keys: ${Object.keys(data).join(", ")}`);
      return data;
    } catch (error) {
      console.error(`\u274C Fetch error (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) throw error;
      await delay(2e3);
    }
  }
}
async function fetchAnimePictures(animeId) {
  try {
    console.log(`\u{1F5BC}\uFE0F Fetching pictures for anime ${animeId}...`);
    const picturesUrl = `${JIKAN_BASE_URL}/anime/${animeId}/pictures`;
    const picturesData = await fetchWithRetry(picturesUrl);
    if (picturesData && picturesData.data && Array.isArray(picturesData.data)) {
      console.log(`\u2705 Found ${picturesData.data.length} pictures for anime ${animeId}`);
      return picturesData.data;
    }
    console.log(`\u26A0\uFE0F No pictures found for anime ${animeId}`);
    return [];
  } catch (error) {
    console.error(`\u274C Error fetching pictures for anime ${animeId}:`, error);
    return [];
  }
}
async function syncWeeklyEpisodes(supabase, weekNumber) {
  console.log(`
\u{1F4C5} Syncing week ${weekNumber}...`);
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;
  try {
    const today = /* @__PURE__ */ new Date();
    const month = today.getUTCMonth();
    const year = today.getUTCFullYear();
    let currentSeason;
    let startMonth;
    if (month >= 0 && month <= 2) {
      currentSeason = "winter";
      startMonth = 0;
    } else if (month >= 3 && month <= 5) {
      currentSeason = "spring";
      startMonth = 3;
    } else if (month >= 6 && month <= 8) {
      currentSeason = "summer";
      startMonth = 6;
    } else {
      currentSeason = "fall";
      startMonth = 9;
    }
    const seasonStart = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
    const firstSunday = new Date(seasonStart);
    const dayOfWeek = firstSunday.getUTCDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);
    firstSunday.setUTCHours(23, 59, 59, 999);
    let startDate;
    let endDate;
    if (weekNumber === 1) {
      startDate = seasonStart;
      endDate = firstSunday;
    } else {
      const firstMonday = new Date(firstSunday);
      firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);
      firstMonday.setUTCHours(0, 0, 0, 0);
      startDate = new Date(firstMonday);
      startDate.setUTCDate(firstMonday.getUTCDate() + (weekNumber - 2) * 7);
      endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      endDate.setUTCHours(23, 59, 59, 999);
    }
    console.log(`\u{1F4C5} Week ${weekNumber}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    let currentSeasonName;
    if (month >= 0 && month <= 2) currentSeasonName = "winter";
    else if (month >= 3 && month <= 5) currentSeasonName = "spring";
    else if (month >= 6 && month <= 8) currentSeasonName = "summer";
    else currentSeasonName = "fall";
    const seasonsToCheck = [
      { season: currentSeasonName, year }
    ];
    if (month % 3 === 2) {
      const nextSeasons = { "winter": "spring", "spring": "summer", "summer": "fall", "fall": "winter" };
      const nextSeason = nextSeasons[currentSeasonName];
      const nextYear = nextSeason === "winter" ? year + 1 : year;
      seasonsToCheck.push({ season: nextSeason, year: nextYear });
      console.log(`\u{1F50D} Near season transition, also checking ${nextSeason} ${nextYear}`);
    }
    const allAnimes = [];
    for (const { season, year: year2 } of seasonsToCheck) {
      let currentPage = 1;
      let hasNextPage = true;
      console.log(`
\u{1F310} ============================================`);
      console.log(`\u{1F310} FETCHING ALL PAGES FOR ${season.toUpperCase()} ${year2}`);
      console.log(`\u{1F310} Week: ${weekNumber}`);
      console.log(`\u{1F310} ============================================
`);
      while (hasNextPage && currentPage <= 30) {
        const seasonUrl = `${JIKAN_BASE_URL}/seasons/${year2}/${season}?page=${currentPage}`;
        console.log(`
\u{1F4C4} ============================================`);
        console.log(`\u{1F4C4} PAGE ${currentPage} FETCH STARTING...`);
        console.log(`\u{1F4C4} URL: ${seasonUrl}`);
        console.log(`\u{1F4C4} ============================================`);
        try {
          const seasonData = await fetchWithRetry(seasonUrl);
          console.log(`
\u2705 ============================================`);
          console.log(`\u2705 PAGE ${currentPage} FETCH SUCCESSFUL!`);
          console.log(`\u2705 seasonData exists: ${!!seasonData}`);
          console.log(`\u2705 seasonData.data exists: ${!!seasonData?.data}`);
          console.log(`\u2705 seasonData.data.length: ${seasonData?.data?.length || 0}`);
          console.log(`\u2705 seasonData.pagination: ${JSON.stringify(seasonData?.pagination || {})}`);
          console.log(`\u2705 ============================================
`);
          if (seasonData && seasonData.data) {
            console.log(`\u{1F4FA} Page ${currentPage}: Found ${seasonData.data.length} animes in ${season} ${year2}`);
            allAnimes.push(...seasonData.data);
            hasNextPage = seasonData.pagination?.has_next_page || false;
            currentPage++;
            console.log(`
\u{1F4CA} ============================================`);
            console.log(`\u{1F4CA} PAGINATION STATUS AFTER PAGE ${currentPage - 1}`);
            console.log(`\u{1F4CA} Total animes accumulated: ${allAnimes.length}`);
            console.log(`\u{1F4CA} Has next page: ${hasNextPage}`);
            console.log(`\u{1F4CA} Next page will be: ${hasNextPage ? currentPage : "NONE (stopping)"}`);
            console.log(`\u{1F4CA} ============================================
`);
            if (hasNextPage) {
              console.log(`\u23F3 Waiting ${RATE_LIMIT_DELAY}ms before fetching page ${currentPage}...
`);
              await delay(RATE_LIMIT_DELAY);
            } else {
              console.log(`\u{1F3C1} NO MORE PAGES - Pagination complete!
`);
            }
          } else {
            console.log(`
\u26A0\uFE0F ============================================`);
            console.log(`\u26A0\uFE0F PAGE ${currentPage} RETURNED NO DATA!`);
            console.log(`\u26A0\uFE0F seasonData: ${JSON.stringify(seasonData)}`);
            console.log(`\u26A0\uFE0F Setting hasNextPage = false`);
            console.log(`\u26A0\uFE0F ============================================
`);
            hasNextPage = false;
          }
        } catch (error) {
          console.error(`
\u274C ============================================`);
          console.error(`\u274C ERROR FETCHING PAGE ${currentPage}!`);
          console.error(`\u274C Week: ${weekNumber}`);
          console.error(`\u274C URL: ${seasonUrl}`);
          console.error(`\u274C Error:`, error);
          console.error(`\u274C Error message: ${error.message}`);
          console.error(`\u274C Error stack: ${error.stack}`);
          console.error(`\u274C Setting hasNextPage = false - STOPPING PAGINATION`);
          console.error(`\u274C ============================================
`);
          hasNextPage = false;
        }
      }
      console.log(`
\u{1F3C1} ============================================`);
      console.log(`\u{1F3C1} PAGINATION COMPLETE FOR ${season.toUpperCase()} ${year2}`);
      console.log(`\u{1F3C1} Week: ${weekNumber}`);
      console.log(`\u{1F3C1} Total pages fetched: ${currentPage - 1}`);
      console.log(`\u{1F3C1} Total animes collected: ${allAnimes.length}`);
      console.log(`\u{1F3C1} ============================================
`);
    }
    console.log(`\u{1F4FA} Total animes from all seasons: ${allAnimes.length}`);
    const HARDCODED_ANIME_IDS = [62405, 59062, 60378];
    console.log(`\\n\u2B50 Checking ${HARDCODED_ANIME_IDS.length} hardcoded exception animes...`);
    for (const animeId of HARDCODED_ANIME_IDS) {
      const alreadyExists = allAnimes.some((a) => a.mal_id === animeId);
      if (alreadyExists) {
        console.log(`\u2705 Anime ${animeId} already in season list`);
        continue;
      }
      console.log(`\u{1F504} Fetching hardcoded anime ${animeId} directly from API...`);
      try {
        const animeUrl = `${JIKAN_BASE_URL}/anime/${animeId}`;
        const animeData = await fetchWithRetry(animeUrl);
        if (animeData && animeData.data) {
          console.log(`\u2705 Added hardcoded anime: ${animeData.data.title} (ID: ${animeId})`);
          console.log(`   Status: ${animeData.data.status}`);
          console.log(`   Members: ${animeData.data.members}`);
          allAnimes.push(animeData.data);
        } else {
          console.error(`\u274C Failed to fetch anime ${animeId}`);
        }
        await delay(RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(`\u274C Error fetching hardcoded anime ${animeId}:`, error);
      }
    }
    console.log(`\u{1F4FA} Total animes after hardcoded additions: ${allAnimes.length}`);
    const airingAnimes = allAnimes.filter((anime) => anime.members >= 5e3).filter(
      (anime) => anime.status === "Currently Airing" || anime.status === "Finished Airing"
    );
    console.log(`\u2705 After filter (5k+ members, airing/finished): ${airingAnimes.length} animes`);
    console.log(`
\u{1F50D} Fetching existing episodes from database for week ${weekNumber}...`);
    const { data: existingEpisodes, error: existingFetchError } = await supabase.from("weekly_episodes").select("anime_id, episode_number, week_number").eq("week_number", weekNumber).eq("is_manual", false);
    if (existingFetchError) {
      console.error(`\u274C Error fetching existing episodes:`, existingFetchError);
    }
    const existingAnimeIds = new Set(existingEpisodes?.map((ep) => ep.anime_id) || []);
    console.log(`\u{1F4CA} Found ${existingAnimeIds.size} existing episodes in database for week ${weekNumber}`);
    console.log(`
\u{1F50D} Fetching ALL existing episodes from database (all weeks)...`);
    const { data: allExistingEpisodes, error: allExistingFetchError } = await supabase.from("weekly_episodes").select("anime_id, episode_number, week_number, aired_at").eq("is_manual", false);
    if (allExistingFetchError) {
      console.error(`\u274C Error fetching all existing episodes:`, allExistingFetchError);
    }
    const allEpisodesMap = /* @__PURE__ */ new Map();
    allExistingEpisodes?.forEach((ep) => {
      const key = `${ep.anime_id}_${ep.episode_number}`;
      allEpisodesMap.set(key, { week_number: ep.week_number, aired_at: ep.aired_at });
    });
    console.log(`\u{1F4CA} Found ${allEpisodesMap.size} total episodes across all weeks in database`);
    const episodes = [];
    const processedEpisodeKeys = /* @__PURE__ */ new Set();
    const animesToSaveInSeasonRankings = /* @__PURE__ */ new Map();
    console.log(`
\u{1F504} Starting to process ${airingAnimes.length} airing animes for week ${weekNumber}...`);
    console.log(`\u{1F4C5} Week dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    let processedAnimeCount = 0;
    for (const anime of airingAnimes) {
      try {
        processedAnimeCount++;
        console.log(`
\u{1F4CC} ============================================`);
        console.log(`\u{1F4CC} ANIME PROGRESS: [${processedAnimeCount}/${airingAnimes.length}]`);
        console.log(`\u{1F4CC} Starting: ${anime.title} (ID: ${anime.mal_id})`);
        console.log(`\u{1F4CC} ============================================`);
        await delay(RATE_LIMIT_DELAY);
        console.log(`
\u{1F50D} Processing: ${anime.title} (ID: ${anime.mal_id}, Members: ${anime.members})`);
        let allEpisodes = [];
        let episodePage = 1;
        let hasNextEpisodePage = true;
        while (hasNextEpisodePage) {
          const episodesUrl = episodePage === 1 ? `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes` : `${JIKAN_BASE_URL}/anime/${anime.mal_id}/episodes?page=${episodePage}`;
          console.log(`  \u{1F4C4} Fetching episodes page ${episodePage}: ${episodesUrl}`);
          const episodesData = await fetchWithRetry(episodesUrl);
          if (!episodesData || !episodesData.data || episodesData.data.length === 0) {
            console.log(`  \u23ED\uFE0F No episodes found on page ${episodePage} for ${anime.title}`);
            hasNextEpisodePage = false;
            break;
          }
          console.log(`  \u{1F4FA} Page ${episodePage}: Found ${episodesData.data.length} episodes`);
          allEpisodes.push(...episodesData.data);
          hasNextEpisodePage = episodesData.pagination?.has_next_page || false;
          episodePage++;
          if (hasNextEpisodePage) {
            await delay(RATE_LIMIT_DELAY);
          }
        }
        if (allEpisodes.length === 0) {
          console.log(`\u23ED\uFE0F No episodes found for ${anime.title}`);
          continue;
        }
        console.log(`  \u{1F4FA} Total episodes fetched: ${allEpisodes.length} for ${anime.title}`);
        const maxEpsToLog = anime.mal_id === 62405 ? allEpisodes.length : 5;
        allEpisodes.forEach((ep, idx) => {
          if (idx < maxEpsToLog) {
            console.log(`    EP${ep.mal_id}: ${ep.title || "Untitled"} - Aired: ${ep.aired || "No date"} - Score: ${ep.score || "N/A"}`);
          }
        });
        const weekEpisodes = [];
        const existingEpsForAnime = existingEpisodes?.filter((ep) => ep.anime_id === anime.mal_id) || [];
        for (const existingEp of existingEpsForAnime) {
          const apiEpisode = allEpisodes.find((ep) => ep.mal_id === existingEp.episode_number);
          if (apiEpisode) {
            console.log(`  \u{1F504} UPDATING existing episode: EP${apiEpisode.mal_id} (Score: ${apiEpisode.score || "N/A"})`);
            weekEpisodes.push(apiEpisode);
          }
        }
        const newEpisodes = allEpisodes.filter((ep) => {
          if (!ep.aired) {
            if (anime.mal_id === 62405) {
              console.log(`  \u{1F50D} DEBUG 62405: EP${ep.mal_id} has no aired date`);
            }
            return false;
          }
          const airedDate = new Date(ep.aired);
          const isInWeek = airedDate >= startDate && airedDate <= endDate;
          if (anime.mal_id === 62405) {
            console.log(`  \u{1F50D} DEBUG 62405: EP${ep.mal_id} aired ${ep.aired} | airedDate: ${airedDate.toISOString()} | isInWeek: ${isInWeek}`);
            console.log(`     startDate: ${startDate.toISOString()} | endDate: ${endDate.toISOString()}`);
          }
          const alreadyAdded = weekEpisodes.some((we) => we.mal_id === ep.mal_id);
          if (isInWeek && !alreadyAdded) {
            console.log(`  \u2705 NEW MATCH! EP${ep.mal_id} aired on ${ep.aired} (within week range)`);
            return true;
          }
          return false;
        });
        weekEpisodes.push(...newEpisodes);
        if (weekEpisodes.length === 0) {
          console.log(`  \u23ED\uFE0F No episodes aired in week ${weekNumber} range for ${anime.title} and no existing episodes to update`);
          continue;
        }
        console.log(`  \u{1F4CB} Processing ${weekEpisodes.length} episode(s) for ${anime.title} in week ${weekNumber}`);
        for (const weekEpisode of weekEpisodes) {
          const episodeKey = `${anime.mal_id}_${weekEpisode.mal_id}`;
          if (processedEpisodeKeys.has(episodeKey)) {
            console.log(`  \u23ED\uFE0F Already processed ${anime.title} EP${weekEpisode.mal_id}, skipping duplicate`);
            continue;
          }
          processedEpisodeKeys.add(episodeKey);
          console.log(`  \u2705 Adding episode: ${anime.title} EP${weekEpisode.mal_id} "${weekEpisode.title}" (Aired: ${weekEpisode.aired}, Score: ${weekEpisode.score || "N/A"})`);
          const episode = {
            anime_id: anime.mal_id,
            anime_title_english: anime.title_english || anime.title,
            anime_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
            from_url: weekEpisode.url || anime.url,
            forum_url: weekEpisode.forum_url || null,
            episode_number: weekEpisode.mal_id,
            episode_name: weekEpisode.title || `Episode ${weekEpisode.mal_id}`,
            episode_score: weekEpisode.score || null,
            week_number: weekNumber,
            position_in_week: 0,
            // Will be set later
            is_manual: false,
            type: anime.type,
            status: anime.status,
            demographic: anime.demographics || [],
            genre: anime.genres || [],
            theme: anime.themes || [],
            aired_at: weekEpisode.aired
          };
          episodes.push(episode);
          animesToSaveInSeasonRankings.set(anime.mal_id, anime);
        }
      } catch (error) {
        console.error(`\u274C Error processing anime ${anime.title} (ID: ${anime.mal_id}):`, error);
      }
    }
    console.log(`
\u{1F4CA} ============================================`);
    console.log(`\u{1F4CA} Week ${weekNumber} Processing Summary:`);
    console.log(`\u{1F4CA} Total airing animes checked: ${airingAnimes.length}`);
    console.log(`\u{1F4CA} Episodes found for this week: ${episodes.length}`);
    console.log(`\u{1F4CA} ============================================`);
    if (episodes.length > 0) {
      console.log(`
\u{1F41B} DEBUG: All ${episodes.length} episodes BEFORE sorting:`);
      episodes.forEach((ep, idx) => {
        console.log(`  ${idx + 1}. ${ep.anime_title_english} EP${ep.episode_number} (Score: ${ep.episode_score || "N/A"}, Aired: ${ep.aired_at})`);
      });
    }
    episodes.sort((a, b) => {
      const scoreA = a.episode_score !== null ? a.episode_score : -1;
      const scoreB = b.episode_score !== null ? b.episode_score : -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.members || 0) - (a.members || 0);
    });
    if (episodes.length > 0) {
      console.log(`
\u{1F41B} DEBUG: All ${episodes.length} episodes AFTER sorting:`);
      episodes.forEach((ep, idx) => {
        console.log(`  ${idx + 1}. ${ep.anime_title_english} EP${ep.episode_number} (Score: ${ep.episode_score || "N/A"})`);
      });
    }
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      const currentPosition = i + 1;
      episode.position_in_week = currentPosition;
      if (weekNumber > 1) {
        const previousWeek = weekNumber - 1;
        const { data: prevEpisode } = await supabase.from("weekly_episodes").select("position_in_week").eq("anime_id", episode.anime_id).eq("week_number", previousWeek).single();
        if (prevEpisode) {
          const positionChange = prevEpisode.position_in_week - currentPosition;
          if (positionChange > 0) {
            episode.trend = `+${positionChange}`;
          } else if (positionChange < 0) {
            episode.trend = `${positionChange}`;
          } else {
            episode.trend = "=";
          }
        } else {
          episode.trend = "NEW";
        }
      } else {
        episode.trend = "NEW";
      }
    }
    console.log(`
\u{1F4E6} Processed ${episodes.length} episodes for week ${weekNumber}`);
    console.log(`\u{1F4CB} Sample episode data:`, JSON.stringify(episodes[0], null, 2));
    console.log(`
\u{1F4BE} Starting database upsert for ${episodes.length} episodes...`);
    for (const episode of episodes) {
      const { data: existing, error: checkError } = await supabase.from("weekly_episodes").select("id").eq("anime_id", episode.anime_id).eq("episode_number", episode.episode_number).eq("week_number", episode.week_number).maybeSingle();
      const isUpdate = existing !== null && !checkError;
      console.log(`  ${isUpdate ? "\u{1F504} UPDATING" : "\u2795 CREATING"} ${episode.anime_title_english} (anime_id: ${episode.anime_id}, ep: ${episode.episode_number}, week: ${episode.week_number})`);
      const { data, error } = await supabase.from("weekly_episodes").upsert(episode, {
        onConflict: "anime_id,episode_number,season,year",
        // ✅ FIX: Adicionado season,year para prevenir duplicatas
        ignoreDuplicates: false
      }).select();
      if (error) {
        console.error(`  \u274C Upsert error for ${episode.anime_title_english}:`, JSON.stringify(error));
        continue;
      }
      console.log(`  \u2705 ${isUpdate ? "Updated" : "Created"}: ${episode.anime_title_english}`);
      if (data && data.length > 0) {
        if (isUpdate) {
          itemsUpdated++;
        } else {
          itemsCreated++;
        }
      }
    }
    console.log(`
\u{1F504} Recalculating positions for week ${weekNumber}...`);
    const { data: allWeekEpisodes, error: fetchError } = await supabase.from("weekly_episodes").select("*").eq("week_number", weekNumber);
    if (fetchError) {
      console.error(`\u274C Error fetching episodes for recalculation:`, fetchError);
    } else if (allWeekEpisodes) {
      const sorted = allWeekEpisodes.sort((a, b) => {
        const scoreA = a.episode_score !== null ? a.episode_score : -1;
        const scoreB = b.episode_score !== null ? b.episode_score : -1;
        return scoreB - scoreA;
      });
      for (let i = 0; i < sorted.length; i++) {
        const episode = sorted[i];
        const newPosition = i + 1;
        const oldPosition = episode.position_in_week;
        if (newPosition !== oldPosition) {
          let newTrend = episode.trend;
          if (weekNumber > 1) {
            const { data: prevEpisode } = await supabase.from("weekly_episodes").select("position_in_week").eq("anime_id", episode.anime_id).eq("week_number", weekNumber - 1).single();
            if (prevEpisode) {
              const positionChange = prevEpisode.position_in_week - newPosition;
              if (positionChange > 0) {
                newTrend = `+${positionChange}`;
              } else if (positionChange < 0) {
                newTrend = `${positionChange}`;
              } else {
                newTrend = "=";
              }
            }
          }
          const { error: updateError } = await supabase.from("weekly_episodes").update({
            position_in_week: newPosition,
            trend: newTrend
          }).eq("id", episode.id);
          if (updateError) {
            console.error(`\u274C Error updating position for ${episode.anime_title_english}:`, updateError);
          } else {
            console.log(`\u{1F4CA} Reranked ${episode.anime_title_english}: #${oldPosition} \u2192 #${newPosition}`);
          }
        }
      }
      console.log(`\u2705 Position recalculation complete for week ${weekNumber}`);
    }
    console.log(`
\u{1F4BE} Upserting ${animesToSaveInSeasonRankings.size} animes to season_rankings...`);
    for (const [animeId, anime] of animesToSaveInSeasonRankings) {
      const pictures = await fetchAnimePictures(anime.mal_id);
      await delay(RATE_LIMIT_DELAY);
      const seasonAnime = {
        anime_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        image_url: anime.images?.jpg?.large_image_url,
        anime_score: anime.score,
        // Using 'anime_score' to match database schema
        scored_by: anime.scored_by,
        members: anime.members,
        favorites: anime.favorites,
        popularity: anime.popularity,
        rank: anime.rank,
        type: anime.type,
        status: anime.status,
        rating: anime.rating,
        source: anime.source,
        episodes: anime.episodes,
        aired_from: anime.aired?.from,
        aired_to: anime.aired?.to,
        duration: anime.duration,
        demographics: anime.demographics || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        studios: anime.studios || [],
        synopsis: anime.synopsis,
        pictures,
        // 🖼️ Add pictures array
        season: anime.season ? anime.season.toLowerCase() : currentSeasonName,
        // ✅ Use calculated current season as fallback
        year: anime.year || year
        // ✅ Use current year as fallback
      };
      const { data: upsertData, error } = await supabase.from("season_rankings").upsert(seasonAnime, {
        onConflict: "anime_id,season,year",
        ignoreDuplicates: false
      }).select();
      if (error) {
        console.error("Upsert error:", error);
        continue;
      }
      if (upsertData && upsertData.length > 0) {
        const existing = await supabase.from("season_rankings").select("created_at, updated_at").eq("id", upsertData[0].id).single();
        if (existing.data.created_at === existing.data.updated_at) {
          itemsCreated++;
        } else {
          itemsUpdated++;
        }
      }
      await delay(RATE_LIMIT_DELAY);
    }
    const duration = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      sync_type: "weekly_episodes",
      status: "success",
      week_number: weekNumber,
      items_synced: episodes.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration
    });
    console.log(`
\u2705 ============================================`);
    console.log(`\u2705 Week ${weekNumber} sync completed!`);
    console.log(`\u2705 Total episodes in list: ${episodes.length}`);
    console.log(`\u2705 NEW episodes created: ${itemsCreated}`);
    console.log(`\u2705 Existing episodes updated: ${itemsUpdated}`);
    console.log(`\u2705 Duration: ${duration}ms`);
    console.log(`\u2705 ============================================`);
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\u274C Error syncing week ${weekNumber}:`, error);
    await supabase.from("sync_logs").insert({
      sync_type: "weekly_episodes",
      status: "error",
      week_number: weekNumber,
      error_message: error.message,
      error_details: { stack: error.stack },
      duration_ms: duration
    });
    throw error;
  }
}
async function syncSeasonRankings(supabase, season, year) {
  console.log(`
\u{1F338} Syncing ${season} ${year} rankings...`);
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;
  try {
    let allAnimes = [];
    let currentPage = 1;
    let hasNextPage = true;
    console.log(`\u{1F310} Fetching all pages for ${season} ${year}...`);
    while (hasNextPage && currentPage <= 15) {
      const url = `${JIKAN_BASE_URL}/seasons/${year}/${season}?page=${currentPage}`;
      console.log(`\u{1F4C4} Fetching page ${currentPage}: ${url}`);
      const data = await fetchWithRetry(url);
      if (!data || !data.data) {
        throw new Error(`No season data received for page ${currentPage}`);
      }
      allAnimes = allAnimes.concat(data.data);
      hasNextPage = data.pagination?.has_next_page || false;
      currentPage++;
      console.log(`\u{1F4C4} Page ${currentPage - 1}: Added ${data.data.length} animes. Total so far: ${allAnimes.length}`);
      if (hasNextPage) {
        await delay(RATE_LIMIT_DELAY);
      }
    }
    console.log(`\u{1F4FA} Total animes fetched: ${allAnimes.length}`);
    const animes = allAnimes.filter((anime) => anime.members >= 5e3).sort((a, b) => {
      const membersA = a.members || 0;
      const membersB = b.members || 0;
      if (membersB !== membersA) return membersB - membersA;
      return (b.score || 0) - (a.score || 0);
    });
    console.log(`\u2705 After filtering (5k+ members): ${animes.length} animes for ${season} ${year}`);
    if (animes.length > 0) {
      const firstAnime = animes[0];
      console.log(`\u{1F50D} DEBUG - First anime structure:`, {
        mal_id: firstAnime.mal_id,
        title: firstAnime.title,
        has_images: !!firstAnime.images,
        has_jpg: !!firstAnime.images?.jpg,
        large_image_url: firstAnime.images?.jpg?.large_image_url,
        image_url_full: firstAnime.images?.jpg?.image_url
      });
    }
    const uniqueAnimes = Array.from(
      new Map(animes.map((anime) => [anime.mal_id, anime])).values()
    );
    if (uniqueAnimes.length < animes.length) {
      console.log(`\u26A0\uFE0F Removed ${animes.length - uniqueAnimes.length} duplicate animes`);
    }
    const animeIds = uniqueAnimes.map((a) => a.mal_id);
    const { data: existingAnimes } = await supabase.from("season_rankings").select("anime_id").eq("season", season).eq("year", year).in("anime_id", animeIds);
    const existingIds = new Set(existingAnimes?.map((a) => a.anime_id) || []);
    console.log(`\u{1F4CA} Found ${existingIds.size} existing animes, ${animes.length - existingIds.size} new animes`);
    const seasonAnimes = uniqueAnimes.map((anime) => ({
      anime_id: anime.mal_id,
      title: anime.title,
      title_english: anime.title_english,
      image_url: anime.images?.jpg?.large_image_url,
      anime_score: anime.score,
      scored_by: anime.scored_by,
      members: anime.members,
      favorites: anime.favorites,
      popularity: anime.popularity,
      rank: anime.rank,
      type: anime.type,
      status: anime.status,
      rating: anime.rating,
      source: anime.source,
      episodes: anime.episodes,
      aired_from: anime.aired?.from,
      aired_to: anime.aired?.to,
      duration: anime.duration,
      demographics: anime.demographics || [],
      genres: anime.genres || [],
      themes: anime.themes || [],
      studios: anime.studios || [],
      synopsis: anime.synopsis,
      season,
      year,
      pictures: []
      // ✅ Will be populated later
    }));
    const BATCH_SIZE = 100;
    for (let i = 0; i < seasonAnimes.length; i += BATCH_SIZE) {
      const batch = seasonAnimes.slice(i, i + BATCH_SIZE);
      console.log(`\u{1F4E6} Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(seasonAnimes.length / BATCH_SIZE)} (${batch.length} animes)...`);
      const { error } = await supabase.from("season_rankings").upsert(batch, {
        onConflict: "anime_id,season,year",
        ignoreDuplicates: false
      });
      if (error) {
        console.error("\u274C Batch upsert error:", error);
      }
    }
    itemsCreated = uniqueAnimes.filter((a) => !existingIds.has(a.mal_id)).length;
    itemsUpdated = uniqueAnimes.filter((a) => existingIds.has(a.mal_id)).length;
    console.log(`\u2705 Batch upsert complete: ${itemsCreated} created, ${itemsUpdated} updated`);
    const { data: sampleRecords } = await supabase.from("season_rankings").select("anime_id, title, image_url").eq("season", season).eq("year", year).limit(3);
    if (sampleRecords) {
      console.log(`\u{1F50D} DEBUG - Sample records after upsert:`, sampleRecords.map((r) => ({
        anime_id: r.anime_id,
        title: r.title,
        has_image_url: !!r.image_url,
        image_url_preview: r.image_url?.substring(0, 50) + "..."
      })));
    }
    console.log(`
\u{1F5BC}\uFE0F Fetching pictures for ${uniqueAnimes.length} animes...`);
    let picturesFetched = 0;
    let picturesSkipped = 0;
    const PICTURES_BATCH_SIZE = 3;
    for (let i = 0; i < uniqueAnimes.length; i += PICTURES_BATCH_SIZE) {
      const batch = uniqueAnimes.slice(i, i + PICTURES_BATCH_SIZE);
      const promises = batch.map(async (anime) => {
        try {
          const picturesUrl = `${JIKAN_BASE_URL}/anime/${anime.mal_id}/pictures`;
          const picturesData = await fetchWithRetry(picturesUrl);
          if (picturesData && picturesData.data && Array.isArray(picturesData.data)) {
            const pictures = picturesData.data.map((p) => ({
              jpg: p.jpg,
              webp: p.webp
            }));
            if (pictures.length === 0) {
              console.warn(`\u26A0\uFE0F Anime ${anime.mal_id} has empty pictures array`);
              return { success: false, anime_id: anime.mal_id, error: "Empty pictures" };
            }
            const { error } = await supabase.from("season_rankings").update({ pictures }).eq("anime_id", anime.mal_id).eq("season", season).eq("year", year);
            if (!error) {
              console.log(`\u2705 Pictures saved for ${anime.mal_id}: ${pictures.length} images`);
              return { success: true, anime_id: anime.mal_id };
            } else {
              console.error(`\u274C Error updating pictures for ${anime.mal_id}:`, error);
              return { success: false, anime_id: anime.mal_id, error: error.message };
            }
          }
          console.warn(`\u26A0\uFE0F No pictures data for ${anime.mal_id}`);
          return { success: false, anime_id: anime.mal_id, error: "No pictures data" };
        } catch (error) {
          console.error(`\u26A0\uFE0F Failed to fetch pictures for ${anime.mal_id}:`, error);
          return { success: false, anime_id: anime.mal_id, error: error instanceof Error ? error.message : "Unknown error" };
        }
      });
      const results = await Promise.all(promises);
      picturesFetched += results.filter((r) => r.success).length;
      picturesSkipped += results.filter((r) => !r.success).length;
      if ((i + PICTURES_BATCH_SIZE) % 15 === 0) {
        console.log(`\u{1F4F8} Progress: ${Math.min(i + PICTURES_BATCH_SIZE, uniqueAnimes.length)}/${uniqueAnimes.length} animes (${picturesFetched} with pictures)`);
      }
      if (i + PICTURES_BATCH_SIZE < uniqueAnimes.length) {
        await delay(1e3);
      }
    }
    console.log(`\u2705 Pictures sync complete: ${picturesFetched} animes updated, ${picturesSkipped} skipped`);
    const duration = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      sync_type: "season_rankings",
      status: "success",
      season,
      year,
      items_synced: uniqueAnimes.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration
    });
    console.log(`\u2705 ${season} ${year} synced: ${itemsCreated} created, ${itemsUpdated} updated (${duration}ms)`);
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\u274C Error syncing ${season} ${year}:`, error);
    await supabase.from("sync_logs").insert({
      sync_type: "season_rankings",
      status: "error",
      season,
      year,
      error_message: error.message,
      error_details: { stack: error.stack },
      duration_ms: duration
    });
    throw error;
  }
}
async function syncUpcomingAnimes(supabase) {
  console.log(`
\u{1F52E} Syncing upcoming animes for "Later" tab...`);
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;
  try {
    let allAnimes = [];
    let currentPage = 1;
    let hasNextPage = true;
    while (hasNextPage) {
      const url = `${JIKAN_BASE_URL}/seasons/upcoming?page=${currentPage}`;
      console.log(`\u{1F310} Fetching upcoming page ${currentPage}: ${url}`);
      const data = await fetchWithRetry(url);
      if (!data || !data.data) {
        throw new Error(`No upcoming data received. Response: ${JSON.stringify(data)}`);
      }
      allAnimes = allAnimes.concat(data.data);
      hasNextPage = data.pagination?.has_next_page || false;
      currentPage++;
      console.log(`\u{1F4C4} Page ${currentPage - 1}: Added ${data.data.length} animes. Total so far: ${allAnimes.length}`);
      if (hasNextPage) {
        await delay(RATE_LIMIT_DELAY);
      }
    }
    console.log(`\u{1F4FA} Found ${allAnimes.length} total upcoming animes`);
    const filtered = allAnimes.filter((anime) => anime.status === "Not yet aired").filter((anime) => anime.members >= 2e4);
    console.log(`\u2705 Filtered to ${filtered.length} animes (Not yet aired + 20k+ members)`);
    filtered.sort((a, b) => {
      const membersA = a.members || 0;
      const membersB = b.members || 0;
      if (membersB !== membersA) return membersB - membersA;
      return (b.score || 0) - (a.score || 0);
    });
    for (const anime of filtered) {
      const seasonData = {
        anime_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        image_url: anime.images?.jpg?.large_image_url,
        anime_score: anime.score,
        // Using 'anime_score' to match database schema
        scored_by: anime.scored_by,
        members: anime.members,
        favorites: anime.favorites,
        popularity: anime.popularity,
        rank: anime.rank,
        type: anime.type,
        status: anime.status,
        rating: anime.rating,
        source: anime.source,
        episodes: anime.episodes,
        aired_from: anime.aired?.from,
        aired_to: anime.aired?.to,
        duration: anime.duration,
        demographics: anime.demographics || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        studios: anime.studios || [],
        synopsis: anime.synopsis,
        season: anime.season || "upcoming",
        // Use 'upcoming' if season is null
        year: anime.year || 9999
        // Use 9999 for unknown year to put at end
      };
      const { data: upsertData, error } = await supabase.from("season_rankings").upsert(seasonData, {
        onConflict: "anime_id,season,year",
        ignoreDuplicates: false
      }).select();
      if (error) {
        console.error("Upsert error:", error);
        continue;
      }
      if (upsertData && upsertData.length > 0) {
        const existing = await supabase.from("season_rankings").select("created_at, updated_at").eq("id", upsertData[0].id).single();
        if (existing.data.created_at === existing.data.updated_at) {
          itemsCreated++;
        } else {
          itemsUpdated++;
        }
      }
      await delay(RATE_LIMIT_DELAY);
    }
    const duration = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      sync_type: "upcoming",
      status: "success",
      items_synced: filtered.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration
    });
    console.log(`\u2705 Upcoming animes synced: ${itemsCreated} created, ${itemsUpdated} updated (${duration}ms)`);
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\u274C Error syncing upcoming animes:`, error);
    await supabase.from("sync_logs").insert({
      sync_type: "upcoming",
      status: "error",
      error_message: error.message,
      error_details: { stack: error.stack },
      duration_ms: duration
    });
    throw error;
  }
}
async function syncAnticipatedAnimes(supabase) {
  console.log(`
\u2B50 Syncing most anticipated animes...`);
  const startTime = Date.now();
  let itemsCreated = 0;
  let itemsUpdated = 0;
  try {
    const currentYear = (/* @__PURE__ */ new Date()).getUTCFullYear();
    const seasons = [
      { season: "winter", year: currentYear },
      { season: "spring", year: currentYear },
      { season: "summer", year: currentYear },
      { season: "fall", year: currentYear },
      { season: "winter", year: currentYear + 1 }
    ];
    const allAnimes = [];
    const processedAnimeIds = /* @__PURE__ */ new Set();
    for (const { season, year } of seasons) {
      console.log(`
\u23F3 Fetching ALL pages for ${season} ${year} to find anticipated animes...`);
      let seasonPage = 1;
      let seasonHasNext = true;
      while (seasonHasNext && seasonPage <= 5) {
        const url = `${JIKAN_BASE_URL}/seasons/${year}/${season}?page=${seasonPage}`;
        const data = await fetchWithRetry(url);
        if (!data || !data.data || data.data.length === 0) {
          break;
        }
        const filtered = data.data.filter((anime) => anime.status === "Not yet aired").filter((anime) => anime.members >= 1e4).filter((anime) => {
          if (processedAnimeIds.has(anime.mal_id)) {
            return false;
          }
          return true;
        });
        console.log(`\u{1F4FA} ${season} ${year} (Page ${seasonPage}): Found ${filtered.length} NEW anticipated animes`);
        filtered.forEach((anime) => processedAnimeIds.add(anime.mal_id));
        allAnimes.push(...filtered);
        seasonHasNext = data.pagination?.has_next_page || false;
        seasonPage++;
        if (seasonHasNext) {
          await delay(RATE_LIMIT_DELAY);
        }
      }
    }
    console.log(`
\u{1F52E} Fetching /seasons/upcoming for Later tab...`);
    let upcomingPage = 1;
    let hasNextPage = true;
    while (hasNextPage) {
      const upcomingUrl = `${JIKAN_BASE_URL}/seasons/upcoming?page=${upcomingPage}`;
      console.log(`\u{1F4C4} Fetching upcoming page ${upcomingPage}: ${upcomingUrl}`);
      const upcomingData = await fetchWithRetry(upcomingUrl);
      if (!upcomingData || !upcomingData.data) {
        console.log(`\u26A0\uFE0F  No data on page ${upcomingPage}, stopping`);
        break;
      }
      const filteredUpcoming = upcomingData.data.filter((anime) => anime.status === "Not yet aired").filter((anime) => anime.members >= 1e4).filter((anime) => {
        if (processedAnimeIds.has(anime.mal_id)) {
          console.log(`\u23ED\uFE0F  Skipping ${anime.title} (ID: ${anime.mal_id}) - already in 2026 seasons`);
          return false;
        }
        return true;
      });
      console.log(`\u{1F4FA} Upcoming page ${upcomingPage}: Found ${filteredUpcoming.length} NEW animes (${upcomingData.data.length} total before dedup)`);
      filteredUpcoming.forEach((anime) => processedAnimeIds.add(anime.mal_id));
      allAnimes.push(...filteredUpcoming);
      hasNextPage = upcomingData.pagination?.has_next_page || false;
      upcomingPage++;
      if (hasNextPage) {
        await delay(RATE_LIMIT_DELAY);
      }
    }
    allAnimes.sort((a, b) => (b.members || 0) - (a.members || 0));
    console.log(`
\u{1F4CA} Total unique animes: ${allAnimes.length}`);
    console.log(`\u{1F4CA} Processed anime IDs: ${processedAnimeIds.size}`);
    console.log(`
\u{1F4BE} Starting upsert for ${allAnimes.length} animes...`);
    for (let i = 0; i < allAnimes.length; i++) {
      const anime = allAnimes[i];
      let imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "";
      if (!imageUrl || imageUrl.trim() === "") {
        console.warn(`\u26A0\uFE0F  Anime ${anime.title} (ID: ${anime.mal_id}) has no image, fetching full details...`);
        try {
          const detailsUrl = `${JIKAN_BASE_URL}/anime/${anime.mal_id}`;
          const detailsData = await fetchWithRetry(detailsUrl);
          if (detailsData?.data?.images?.jpg?.large_image_url) {
            imageUrl = detailsData.data.images.jpg.large_image_url;
            console.log(`\u2705 Found image from full details: ${imageUrl}`);
          } else if (detailsData?.data?.images?.jpg?.image_url) {
            imageUrl = detailsData.data.images.jpg.image_url;
            console.log(`\u2705 Found image from full details: ${imageUrl}`);
          }
          await delay(RATE_LIMIT_DELAY);
        } catch (error2) {
          console.error(`\u274C Error fetching full details for ${anime.title}:`, error2);
        }
      }
      if (!imageUrl || imageUrl.trim() === "") {
        console.warn(`\u26A0\uFE0F  SKIPPING anime ${anime.title} (ID: ${anime.mal_id}) - no image URL available even after fetching full details`);
        continue;
      }
      const seasonAnimeToSave = {
        anime_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        image_url: imageUrl,
        anime_score: anime.score,
        scored_by: anime.scored_by,
        members: anime.members,
        favorites: anime.favorites,
        type: anime.type,
        status: anime.status,
        rating: anime.rating,
        source: anime.source,
        episodes: anime.episodes,
        aired_from: anime.aired?.from,
        season: anime.season ? anime.season.toLowerCase() : "upcoming",
        year: anime.year || 9999,
        synopsis: anime.synopsis,
        demographics: anime.demographics || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        studios: anime.studios || []
      };
      const { data: existing } = await supabase.from("season_rankings").select("id").eq("anime_id", anime.mal_id).eq("season", seasonAnimeToSave.season).eq("year", seasonAnimeToSave.year).maybeSingle();
      const isUpdate = !!existing;
      const { data: upsertData, error } = await supabase.from("season_rankings").upsert(seasonAnimeToSave, {
        onConflict: "anime_id,season,year",
        ignoreDuplicates: false
      }).select();
      if (error) {
        console.error("Upsert error:", error);
        continue;
      }
      if (upsertData && upsertData.length > 0) {
        if (isUpdate) {
          itemsUpdated++;
          console.log(`\u{1F504} #${i + 1} Updated: ${anime.title} (${anime.season} ${anime.year}, Members: ${anime.members})`);
        } else {
          itemsCreated++;
          console.log(`\u2705 #${i + 1} Created: ${anime.title} (${anime.season} ${anime.year}, Members: ${anime.members})`);
        }
      }
    }
    const duration = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      sync_type: "anticipated",
      status: "success",
      items_synced: allAnimes.length,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      duration_ms: duration
    });
    console.log(`\u2705 Anticipated animes synced: ${itemsCreated} created, ${itemsUpdated} updated (${duration}ms)`);
    return { success: true, itemsCreated, itemsUpdated };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\u274C Error syncing anticipated animes:`, error);
    await supabase.from("sync_logs").insert({
      sync_type: "anticipated",
      status: "error",
      error_message: error.message,
      error_details: { stack: error.stack },
      duration_ms: duration
    });
    throw error;
  }
}
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
        }
      });
    }
    console.log("\n\u{1F680} Sync anime data function invoked");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.text();
    console.log("\u{1F4E6} Raw body received:", body);
    const { sync_type, week_number, season, year } = body ? JSON.parse(body) : {};
    console.log("\u{1F4CB} Parsed sync_type:", sync_type);
    let result;
    switch (sync_type) {
      case "weekly_episodes": {
        let currentWeek = week_number;
        if (!currentWeek) {
          const today = /* @__PURE__ */ new Date();
          const month = today.getUTCMonth();
          const year2 = today.getUTCFullYear();
          let startMonth = 0;
          if (month >= 3 && month <= 5) startMonth = 3;
          else if (month >= 6 && month <= 8) startMonth = 6;
          else if (month >= 9) startMonth = 9;
          const seasonStart = new Date(Date.UTC(year2, startMonth, 1, 0, 0, 0, 0));
          const firstSunday = new Date(seasonStart);
          const dayOfWeek = firstSunday.getUTCDay();
          const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
          firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);
          firstSunday.setUTCHours(23, 59, 59, 999);
          if (today >= seasonStart && today <= firstSunday) {
            currentWeek = 1;
          } else {
            const firstMonday = new Date(firstSunday);
            firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);
            firstMonday.setUTCHours(0, 0, 0, 0);
            const diffTime = today.getTime() - firstMonday.getTime();
            const diffDays = Math.floor(diffTime / (1e3 * 60 * 60 * 24));
            currentWeek = Math.floor(diffDays / 7) + 2;
          }
          currentWeek = Math.max(1, Math.min(15, currentWeek));
          console.log(`\u{1F4C5} Auto-detected current week: ${currentWeek} (based on date: ${today.toISOString().split("T")[0]})`);
        }
        const weeksToSync = [];
        for (let i = Math.max(1, currentWeek - 2); i <= currentWeek; i++) {
          weeksToSync.push(i);
        }
        console.log(`\u{1F4C5} Syncing weeks: ${weeksToSync.join(", ")}`);
        const results = [];
        for (const week of weeksToSync) {
          console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
          console.log(`\u{1F4C5} Starting sync for week ${week}...`);
          console.log(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
          const weekResult = await syncWeeklyEpisodes(supabase, week);
          results.push({ week, ...weekResult });
          if (week !== weeksToSync[weeksToSync.length - 1]) {
            await delay(2e3);
          }
        }
        result = {
          success: true,
          weeks_synced: weeksToSync,
          results
        };
        break;
      }
      case "season_rankings": {
        const todayForSeason = /* @__PURE__ */ new Date();
        const currentMonth = todayForSeason.getUTCMonth();
        const currentYearForSeason = todayForSeason.getUTCFullYear();
        let detectedSeason = "winter";
        if (currentMonth >= 3 && currentMonth <= 5) detectedSeason = "spring";
        else if (currentMonth >= 6 && currentMonth <= 8) detectedSeason = "summer";
        else if (currentMonth >= 9) detectedSeason = "fall";
        const seasonToSync = season || detectedSeason;
        const yearToSync = year || currentYearForSeason;
        const syncResult = await syncSeasonRankings(supabase, seasonToSync, yearToSync);
        result = {
          ...syncResult,
          total: syncResult.itemsCreated + syncResult.itemsUpdated,
          inserted: syncResult.itemsCreated,
          updated: syncResult.itemsUpdated,
          skipped: 0,
          deleted: 0,
          errors: 0
        };
        break;
      }
      case "anticipated":
        result = await syncAnticipatedAnimes(supabase);
        break;
      case "upcoming":
        result = await syncUpcomingAnimes(supabase);
        break;
      default:
        throw new Error(`Unknown sync_type: ${sync_type}`);
    }
    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});
