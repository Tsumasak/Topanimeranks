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

        // Priority search: season_rankings -> anticipated_animes -> weekly_episodes
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
          console.log("[AnimeDetails] 📊 Data:", seasonData);
          console.log(
            "[AnimeDetails] 📊 Score:",
            (seasonData as any).score,
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
              "[AnimeDetails] 📊 Searching in weekly_episodes...",
            );
            let { data: weeklyData } = await supabase
              .from("weekly_episodes")
              .select("*")
              .eq("anime_id", animeId)
              .order("episode_number", { ascending: false })
              .limit(1)
              .single();

            if (weeklyData) {
              console.log(
                "[AnimeDetails] ✅ Found in weekly_episodes",
              );
              // Transform weekly_episodes structure to match expected format
              setAnime({
                anime_id: (weeklyData as any).anime_id,
                title: (weeklyData as any).anime_title,
                title_english: (weeklyData as any).anime_title,
                image_url: (weeklyData as any).anime_image,
                score: (weeklyData as any).episode_score,
                members: null,
                episodes: (weeklyData as any).episode_number,
                type: "TV",
              });

              // Set dynamic background
              if ((weeklyData as any).anime_image) {
                document.documentElement.style.setProperty(
                  "--bg-image",
                  `url(${(weeklyData as any).anime_image})`,
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
                
                if (jikanResponse.ok) {
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
                } else {
                  console.log("[AnimeDetails] ❌ Anime not found in Jikan API either");
                  setNotFound(true);
                  setLoading(false);
                  return;
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
      {/* Hero Section */}
      <AnimeHero anime={anime} />

      {/* Main Content */}
      <div className="container mx-auto px-[24px] py-8">
        {/* Stats Bar */}
        <AnimeStats anime={anime} />

      

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Information */}
          <div className="space-y-8">
            {/* Synopsis */}
        {anime.synopsis && (
          <AnimeSynopsis synopsis={anime.synopsis} />
        )}
            <AnimeInfo anime={anime} />
          </div>

          {/* Right Column - Episodes */}
          <div className="lg:col-span-2">
            <AnimeEpisodes
              episodes={episodes}
              animeId={anime.anime_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}