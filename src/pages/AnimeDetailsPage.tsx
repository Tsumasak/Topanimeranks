import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../utils/supabase/client";
import { AnimeHero } from "../components/anime/AnimeHero";
import { AnimeStats } from "../components/anime/AnimeStats";
import { AnimeSynopsis } from "../components/anime/AnimeSynopsis";
import { AnimeInfo } from "../components/anime/AnimeInfo";
import { AnimeEpisodes } from "../components/anime/AnimeEpisodes";

export default function AnimeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
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

        // Priority search: anticipated_animes -> season_rankings -> weekly_episodes
        console.log(
          "[AnimeDetails] 📊 Searching in anticipated_animes...",
        );
        let { data: anticipatedData } = await supabase
          .from("anticipated_animes")
          .select("*")
          .eq("anime_id", animeId)
          .single();

        if (anticipatedData) {
          console.log(
            "[AnimeDetails] ✅ Found in anticipated_animes",
          );
          console.log("[AnimeDetails] 📊 Data:", anticipatedData);
          console.log(
            "[AnimeDetails] 📊 Score:",
            (anticipatedData as any).score,
          );
          setAnime(anticipatedData);

          // Set dynamic background
          if ((anticipatedData as any).image_url) {
            document.documentElement.style.setProperty(
              "--bg-image",
              `url(${(anticipatedData as any).image_url})`,
            );
          }
        } else {
          console.log(
            "[AnimeDetails] 📊 Searching in season_rankings...",
          );
          let { data: seasonData } = await supabase
            .from("season_rankings")
            .select("*")
            .eq("anime_id", animeId)
            .single();

          if (seasonData) {
            console.log(
              "[AnimeDetails] ✅ Found in season_rankings",
            );
            setAnime(seasonData);

            // Set dynamic background
            if ((seasonData as any).image_url) {
              document.documentElement.style.setProperty(
                "--bg-image",
                `url(${(seasonData as any).image_url})`,
              );
            }
          } else {
            console.log(
              "[AnimeDetails] 📊 Searching in weekly_episodes...",
            );
            let { data: weeklyEpisodeData } = await supabase
              .from("weekly_episodes")
              .select("*")
              .eq("anime_id", animeId)
              .order("episode_number", { ascending: false })
              .limit(1)
              .single();

            if (weeklyEpisodeData) {
              console.log(
                "[AnimeDetails] ✅ Found in weekly_episodes",
              );
              // Transform weekly_episodes structure to match expected format
              setAnime({
                anime_id: (weeklyEpisodeData as any).anime_id,
                title: (weeklyEpisodeData as any).anime_title,
                title_english: (weeklyEpisodeData as any).anime_title,
                image_url: (weeklyEpisodeData as any).anime_image,
                score: (weeklyEpisodeData as any).episode_score,
                members: null,
                episodes: (weeklyEpisodeData as any).episode_number,
                type: "TV",
              });

              // Set dynamic background
              if ((weeklyEpisodeData as any).anime_image) {
                document.documentElement.style.setProperty(
                  "--bg-image",
                  `url(${(weeklyEpisodeData as any).anime_image})`,
                );
              }
            } else {
              console.log(
                "[AnimeDetails] ❌ Anime not found in any table",
              );
              // Fallback: Try fetching from Jikan API directly
              console.log("[AnimeDetails] 🌐 Attempting to fetch from Jikan API as fallback...");
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
                  
                console.log("[AnimeDetails] ✅ Found in Jikan API");
                  
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
          .order("episode_number", { ascending: true });

        if (episodesData) {
          console.log(
            `[AnimeDetails] ✅ Found ${episodesData.length} episodes`,
          );
          setEpisodes(episodesData);

          // Fetch all episodes for each week to calculate ranks
          const weeks = [...new Set(episodesData.map((ep: any) => ep.week_number))];
          console.log("[AnimeDetails] 📊 Fetching weekly data for weeks:", weeks);
          
          const weeklyDataMap: Record<number, any[]> = {};
          
          for (const weekNum of weeks) {
            const { data: weekEpisodes } = await supabase
              .from("weekly_episodes")
              .select("*")
              .eq("week_number", weekNum)
              .not("episode_score", "is", null)
              .order("episode_score", { ascending: false });

            if (weekEpisodes) {
              weeklyDataMap[weekNum] = weekEpisodes;
            }

            // Also fetch previous week for trend calculation
            if (weekNum > 1 && !weeklyDataMap[weekNum - 1]) {
              const { data: prevWeekEpisodes } = await supabase
                .from("weekly_episodes")
                .select("*")
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
            <AnimeInfo anime={anime} />
          </div>

          <div className="lg:col-span-2">
            <AnimeEpisodes
              episodes={episodes}
              animeId={anime.anime_id}
              weeklyData={weeklyData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}