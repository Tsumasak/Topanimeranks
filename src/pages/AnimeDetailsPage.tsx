import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../utils/supabase/client";
import { AnimeHero } from "../components/anime/AnimeHero";
import { AnimeStats } from "../components/anime/AnimeStats";
import { AnimeSynopsis } from "../components/anime/AnimeSynopsis";
import { AnimeInfo } from "../components/anime/AnimeInfo";
import { AnimeEpisodes } from "../components/anime/AnimeEpisodes";
import { AnimeVideos } from "../components/anime/AnimeVideos";

export default function AnimeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [videos, setVideos] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchAnimeData() {
      if (!id) return;

      console.log(
        `[AnimeDetails] 🔍 Fetching data for anime ID: ${id}`,
      );
      setLoading(true);
      setNotFound(false);

      try {
        const animeId = parseInt(id);
        
        // Declare variables at function scope so they can be accessed later
        let seasonData: any = null;
        let anticipatedData: any = null;
        let firstWeeklyEpisode: any = null;

        // ✅ PRIORITY CHANGED: season_rankings FIRST (has complete data)
        console.log("[AnimeDetails] 📊 Searching in season_rankings (highest priority - complete data)...");
        let { data: seasonResult, error: seasonError } = await supabase
          .from("season_rankings")
          .select("*")
          .eq("anime_id", animeId)
          .order("year", { ascending: false }) // Get most recent season first
          .limit(1);

        if (seasonError) {
          console.error("[AnimeDetails] ❌ Error querying season_rankings:", seasonError);
        }

        // seasonResult is an array, get the first element
        seasonData = seasonResult && seasonResult.length > 0 ? seasonResult[0] : null;

        if (seasonData) {
          console.log("[AnimeDetails] ✅ Found in season_rankings (complete data)");
          console.log("[AnimeDetails] 📊 Data preview:", {
            title: seasonData.title_english || seasonData.title,
            score: seasonData.anime_score,
            season: seasonData.season,
            year: seasonData.year,
            hasImage: !!seasonData.image_url,
            hasSynopsis: !!seasonData.synopsis
          });
          setAnime(seasonData);

          // Set dynamic background
          if (seasonData.image_url) {
            document.documentElement.style.setProperty(
              "--bg-image",
              `url(${seasonData.image_url})`,
            );
          }
        } else {
          // Fallback 1: Check anticipated_animes
          console.log("[AnimeDetails] 📊 Searching in anticipated_animes...");
          let { data: anticipatedResult, error: anticipatedError } = await supabase
            .from("anticipated_animes")
            .select("*")
            .eq("anime_id", animeId)
            .maybeSingle();

          anticipatedData = anticipatedResult;

          if (anticipatedError) {
            console.error("[AnimeDetails] ❌ Error querying anticipated_animes:", anticipatedError);
          }

          if (anticipatedData) {
            console.log("[AnimeDetails] ✅ Found in anticipated_animes");
            console.log("[AnimeDetails] 📊 Score:", anticipatedData.score);
            setAnime(anticipatedData);

            // Set dynamic background
            if (anticipatedData.image_url) {
              document.documentElement.style.setProperty(
                "--bg-image",
                `url(${anticipatedData.image_url})`,
              );
            }
          } else {
            // Fallback 2: Check weekly_episodes (limited data)
            console.log("[AnimeDetails] 📊 Searching in weekly_episodes (limited data)...");
            let { data: weeklyEpisodeData } = await supabase
              .from("weekly_episodes")
              .select("*")
              .eq("anime_id", animeId)
              .order("episode_number", { ascending: false })
              .limit(1);

            firstWeeklyEpisode = weeklyEpisodeData && weeklyEpisodeData.length > 0 ? weeklyEpisodeData[0] : null;

            if (firstWeeklyEpisode) {
              console.log("[AnimeDetails] ⚠️ Found ONLY in weekly_episodes (limited data - missing synopsis, studios, etc)");
              // Transform weekly_episodes structure to match expected format
              setAnime({
                anime_id: firstWeeklyEpisode.anime_id,
                title: firstWeeklyEpisode.anime_title_english || firstWeeklyEpisode.anime_title,
                title_english: firstWeeklyEpisode.anime_title_english || firstWeeklyEpisode.anime_title,
                image_url: firstWeeklyEpisode.anime_image_url || firstWeeklyEpisode.anime_image,
                score: firstWeeklyEpisode.score,
                anime_score: firstWeeklyEpisode.score,
                members: firstWeeklyEpisode.members,
                episodes: firstWeeklyEpisode.episode_number,
                type: firstWeeklyEpisode.type || "TV",
                season: firstWeeklyEpisode.season,
                year: firstWeeklyEpisode.year,
                status: firstWeeklyEpisode.status,
                genres: firstWeeklyEpisode.genre || firstWeeklyEpisode.genres || [],
                themes: firstWeeklyEpisode.theme || firstWeeklyEpisode.themes || [],
                demographics: firstWeeklyEpisode.demographic || firstWeeklyEpisode.demographics || [],
                // ⚠️ These will be N/A because weekly_episodes doesn't have them
                synopsis: null,
                studios: [],
                producers: [],
                licensors: [],
                duration: null,
                rating: null,
                source: null,
              });

              // Set dynamic background
              if (firstWeeklyEpisode.anime_image_url || firstWeeklyEpisode.anime_image) {
                document.documentElement.style.setProperty(
                  "--bg-image",
                  `url(${firstWeeklyEpisode.anime_image_url || firstWeeklyEpisode.anime_image})`,
                );
              }
            } else {
              console.log("[AnimeDetails] ❌ Anime not found in any table");
              // Fallback 3: Try fetching from Jikan API directly (LAST RESORT)
              console.log("[AnimeDetails] 🌐 Attempting to fetch from Jikan API as last resort...");
              try {
                const jikanResponse = await fetch(
                  `https://api.jikan.moe/v4/anime/${animeId}/full`
                );
                
                if (!jikanResponse.ok) {
                  throw new Error(`HTTP ${jikanResponse.status}`);
                }

                const contentType = jikanResponse.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                  throw new Error('Response is not JSON');
                }

                const jikanData = await jikanResponse.json();
                const jikanAnime = jikanData.data;
                  
                console.log("[AnimeDetails] ✅ Found in Jikan API (fallback)");
                  
                // Transform Jikan data to match expected format
                setAnime({
                  anime_id: jikanAnime.mal_id,
                  title: jikanAnime.title,
                  title_english: jikanAnime.title_english || jikanAnime.title,
                  title_japanese: jikanAnime.title_japanese,
                  image_url: jikanAnime.images?.jpg?.large_image_url || jikanAnime.images?.jpg?.image_url,
                  score: jikanAnime.score,
                  anime_score: jikanAnime.score,
                  members: jikanAnime.members,
                  favorites: jikanAnime.favorites,
                  episodes: jikanAnime.episodes,
                  type: jikanAnime.type,
                  status: jikanAnime.status,
                  aired: jikanAnime.aired,
                  season: jikanAnime.season,
                  year: jikanAnime.year,
                  synopsis: jikanAnime.synopsis,
                  demographics: jikanAnime.demographics || [],
                  genres: jikanAnime.genres || [],
                  themes: jikanAnime.themes || [],
                  studios: jikanAnime.studios || [],
                  producers: jikanAnime.producers || [],
                  licensors: jikanAnime.licensors || [],
                  duration: jikanAnime.duration,
                  rating: jikanAnime.rating,
                  source: jikanAnime.source,
                  mal_id: jikanAnime.mal_id,
                });
                  
                // Set dynamic background
                if (jikanAnime.images?.jpg?.large_image_url) {
                  document.documentElement.style.setProperty(
                    "--bg-image",
                    `url(${jikanAnime.images.jpg.large_image_url})`,
                  );
                }
              } catch (jikanError) {
                console.error("[AnimeDetails] ❌ Error fetching from Jikan API:", jikanError);
                setNotFound(true);
                setLoading(false);
                return;
              }
            }
          }
        }

        // Fetch episodes from weekly_episodes table
        console.log("[AnimeDetails] 📺 Fetching episodes...");
        const { data: episodesData } = await supabase
          .from("weekly_episodes")
          .select("*")
          .eq("anime_id", animeId)
          .not("aired_at", "is", null) // Filter out episodes without aired_at
          .order("episode_number", { ascending: true });

        if (episodesData) {
          // Additional client-side filter to remove empty aired_at strings
          const validEpisodes = episodesData.filter((ep: any) => 
            ep.aired_at && ep.aired_at.trim() !== ''
          );
          
          console.log(
            `[AnimeDetails] ✅ Found ${validEpisodes.length} episodes (${episodesData.length - validEpisodes.length} filtered out)`,
          );
          setEpisodes(validEpisodes);

          // Fetch all episodes for each week to calculate ranks
          // Group episodes by season/year/week to handle correctly
          const seasonWeekGroups = new Map<string, { season: string; year: number; weekNum: number }>();
          validEpisodes.forEach((ep: any) => {
            const key = `${ep.season}-${ep.year}-${ep.week_number}`;
            if (!seasonWeekGroups.has(key)) {
              seasonWeekGroups.set(key, {
                season: ep.season,
                year: ep.year,
                weekNum: ep.week_number
              });
            }
          });

          console.log("[AnimeDetails] 📊 Fetching weekly data for season/year/weeks:", Array.from(seasonWeekGroups.values()));
          
          const weeklyDataMap: Record<number, any[]> = {};
          
          for (const { season, year, weekNum } of seasonWeekGroups.values()) {
            // Fetch episodes for this specific season/year/week combination
            const { data: weekEpisodes } = await supabase
              .from("weekly_episodes")
              .select("*")
              .eq("season", season)
              .eq("year", year)
              .eq("week_number", weekNum)
              .not("episode_score", "is", null)
              .order("episode_score", { ascending: false });

            if (weekEpisodes) {
              weeklyDataMap[weekNum] = weekEpisodes;
            }

            // Also fetch previous week for trend calculation (within same season)
            if (weekNum > 1 && !weeklyDataMap[weekNum - 1]) {
              const { data: prevWeekEpisodes } = await supabase
                .from("weekly_episodes")
                .select("*")
                .eq("season", season)
                .eq("year", year)
                .eq("week_number", weekNum - 1)
                .not("episode_score", "is", null)
                .order("episode_score", { ascending: false });

              if (prevWeekEpisodes) {
                weeklyDataMap[weekNum - 1] = prevWeekEpisodes;
              }
            }
          }

          setWeeklyData(weeklyDataMap);
        }

        // Fetch videos from Jikan API for Movie/Special/OVA types
        // Check after anime is set
        let currentAnimeType = anime?.type;
        
        // If anime is not yet set (from state), get it from the data we just fetched
        if (!currentAnimeType) {
          if (anticipatedData) {
            currentAnimeType = (anticipatedData as any).type;
          } else if (seasonData) {
            currentAnimeType = (seasonData as any).type;
          } else if (firstWeeklyEpisode) {
            currentAnimeType = (firstWeeklyEpisode as any).type;
          }
        }
        
        const isMovieType = ['Movie', 'Special', 'OVA'].includes(currentAnimeType || '');
        
        console.log(`[AnimeDetails] 🎬 Anime type: ${currentAnimeType}, isMovieType: ${isMovieType}`);
        
        if (isMovieType) {
          console.log(`[AnimeDetails] 🎥 Fetching videos from Jikan API (${currentAnimeType} type detected)...`);
          try {
            const videosResponse = await fetch(
              `https://api.jikan.moe/v4/anime/${animeId}/videos`
            );
            
            if (videosResponse.ok) {
              // Check if response is actually JSON
              const contentType = videosResponse.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                console.error(`[AnimeDetails] ❌ Videos API returned non-JSON response. Content-Type: ${contentType}`);
                throw new Error('Response is not JSON');
              }
              
              const videosData = await videosResponse.json();
              console.log(`[AnimeDetails] ✅ Videos response:`, videosData);
              console.log(`[AnimeDetails] ✅ Videos data structure:`, videosData.data);
              
              // Check if promo videos exist and log their structure
              if (videosData.data?.promo && videosData.data.promo.length > 0) {
                console.log(`[AnimeDetails] ✅ First promo video:`, videosData.data.promo[0]);
              }
              
              setVideos(videosData.data);
            } else {
              console.error(`[AnimeDetails] ❌ Videos API returned status ${videosResponse.status}`);
            }
          } catch (videoError) {
            console.error("[AnimeDetails] ❌ Error fetching videos from Jikan:", videoError);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "[AnimeDetails] ❌ Error fetching anime:",
          error,
        );
        setNotFound(true);
        setLoading(false);
      }
    }

    fetchAnimeData();
  }, [id]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center">
          <div
            className="text-2xl mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Loading...
          </div>
          <div
            className="text-sm"
            style={{ color: "var(--rating-text)" }}
          >
            Fetching anime details
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !anime) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center">
          <div
            className="text-4xl mb-4"
            style={{ color: "var(--foreground)" }}
          >
            404
          </div>
          <div
            className="text-2xl mb-4"
            style={{ color: "var(--foreground)" }}
          >
            Anime Not Found
          </div>
          <div
            className="text-sm mb-4"
            style={{ color: "var(--rating-text)" }}
          >
            This anime (ID: {id}) is not available in our
            database yet.
          </div>
          <Link
            to="/home"
            style={{ color: "var(--nav-hover)" }}
            className="hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <AnimeHero anime={anime} />

      <div className="container mx-auto px-[24px] py-8">
        <AnimeStats anime={anime} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="space-y-8">
            {anime.synopsis && (
              <AnimeSynopsis synopsis={anime.synopsis} />
            )}
            <div className="lg:sticky lg:top-[106px] lg:self-start">
              <AnimeInfo anime={anime} />
            </div>
          </div>

          <div className="lg:col-span-2">
            {/* Show Videos for Movie/Special/OVA types, Episodes for TV/ONA */}
            {videos ? (
              <AnimeVideos 
                videos={videos} 
                animeTitle={anime.title_english || anime.title}
              />
            ) : (
              <AnimeEpisodes
                episodes={episodes}
                animeId={anime.anime_id}
                weeklyData={weeklyData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}