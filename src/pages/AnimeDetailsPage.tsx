import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { AnimeHero } from '../components/anime/AnimeHero';
import { AnimeStats } from '../components/anime/AnimeStats';
import { AnimeSynopsis } from '../components/anime/AnimeSynopsis';
import { AnimeInfo } from '../components/anime/AnimeInfo';
import { AnimeEpisodes } from '../components/anime/AnimeEpisodes';
import { AnimeExternalLinks } from '../components/anime/AnimeExternalLinks';

interface Episode {
  episode_id: number;
  episode_number: number;
  episode_title_english: string;
  episode_title_romaji?: string;
  aired_at: string;
  anime_image_url: string;
}

// Fetch anime data from Supabase tables
async function getAnimeData(animeId: number) {
  // Try to get data from season_rankings first (most complete data)
  const { data: seasonData, error: seasonError } = await supabase
    .from('season_rankings')
    .select('*')
    .eq('anime_id', animeId)
    .maybeSingle();

  if (seasonData) {
    console.log('✅ Found anime in season_rankings:', seasonData);
    return {
      ...seasonData,
      source: 'season',
    };
  }

  // If not found, try to get from weekly_episodes (get the most recent episode data)
  const { data: episodeData, error: episodeError } = await supabase
    .from('weekly_episodes')
    .select('*')
    .eq('anime_id', animeId)
    .order('aired_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (episodeData) {
    console.log('✅ Found anime in weekly_episodes:', episodeData);
    // Transform weekly_episodes data to match season_rankings structure
    return {
      anime_id: episodeData.anime_id,
      title: episodeData.anime_title_english,
      title_english: episodeData.anime_title_english,
      image_url: episodeData.anime_image_url,
      type: episodeData.type,
      status: episodeData.status,
      demographics: episodeData.demographic || [],
      genres: episodeData.genre || [],
      themes: episodeData.theme || [],
      source: 'weekly',
      // These fields might not be available in weekly_episodes
      score: null,
      scored_by: null,
      members: null,
      synopsis: null,
    };
  }

  // If not found, try anticipated_animes
  const { data: anticipatedData, error: anticipatedError } = await supabase
    .from('anticipated_animes')
    .select('*')
    .eq('anime_id', animeId)
    .maybeSingle();

  if (anticipatedData) {
    console.log('✅ Found anime in anticipated_animes:', anticipatedData);
    return {
      ...anticipatedData,
      source: 'anticipated',
    };
  }

  console.error('❌ Anime not found in any table:', { seasonError, episodeError, anticipatedError });
  return null;
}

// Fetch episodes from weekly_episodes table
async function getAnimeEpisodes(animeId: number) {
  const { data: episodes, error } = await supabase
    .from('weekly_episodes')
    .select('*')
    .eq('anime_id', animeId)
    .order('aired_at', { ascending: false });

  if (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }

  console.log(`✅ Found ${episodes?.length || 0} episodes`);
  return episodes || [];
}

export default function AnimeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchAnimeData() {
      if (!id) return;

      console.log(`[AnimeDetails] 🔍 Fetching data for anime ID: ${id}`);
      setLoading(true);
      setNotFound(false);

      try {
        const animeId = parseInt(id);

        // Priority search: season_rankings -> anticipated_animes -> weekly_episodes
        console.log('[AnimeDetails] 📊 Searching in season_rankings...');
        let { data: seasonData } = await supabase
          .from('season_rankings')
          .select('*')
          .eq('anime_id', animeId)
          .single();

        if (seasonData) {
          console.log('[AnimeDetails] ✅ Found in season_rankings');
          console.log('[AnimeDetails] 📊 Data:', seasonData);
          console.log('[AnimeDetails] 📊 Score:', seasonData.score);
          setAnime(seasonData);
          
          // Set dynamic background
          if (seasonData.image_url) {
            document.documentElement.style.setProperty('--bg-image', `url(${seasonData.image_url})`);
          }
        } else {
          console.log('[AnimeDetails] 📊 Searching in anticipated_animes...');
          let { data: anticipatedData } = await supabase
            .from('anticipated_animes')
            .select('*')
            .eq('anime_id', animeId)
            .single();

          if (anticipatedData) {
            console.log('[AnimeDetails] ✅ Found in anticipated_animes');
            setAnime(anticipatedData);
            
            // Set dynamic background
            if (anticipatedData.image_url) {
              document.documentElement.style.setProperty('--bg-image', `url(${anticipatedData.image_url})`);
            }
          } else {
            console.log('[AnimeDetails] 📊 Searching in weekly_episodes...');
            let { data: weeklyData } = await supabase
              .from('weekly_episodes')
              .select('*')
              .eq('anime_id', animeId)
              .order('episode_number', { ascending: false })
              .limit(1)
              .single();

            if (weeklyData) {
              console.log('[AnimeDetails] ✅ Found in weekly_episodes');
              // Transform weekly_episodes structure to match expected format
              setAnime({
                anime_id: weeklyData.anime_id,
                title: weeklyData.anime_title,
                title_english: weeklyData.anime_title,
                image_url: weeklyData.anime_image,
                score: weeklyData.episode_score,
                members: null,
                episodes: weeklyData.episode_number,
                type: 'TV',
              });
              
              // Set dynamic background
              if (weeklyData.anime_image) {
                document.documentElement.style.setProperty('--bg-image', `url(${weeklyData.anime_image})`);
              }
            } else {
              console.log('[AnimeDetails] ❌ Anime not found in any table');
              setNotFound(true);
              setLoading(false);
              return;
            }
          }
        }

        // Fetch episodes from weekly_episodes table
        console.log('[AnimeDetails] 📺 Fetching episodes...');
        const { data: episodesData } = await supabase
          .from('weekly_episodes')
          .select('*')
          .eq('anime_id', animeId)
          .order('episode_number', { ascending: true });

        if (episodesData) {
          console.log(`[AnimeDetails] ✅ Found ${episodesData.length} episodes`);
          setEpisodes(episodesData);
        }

        setLoading(false);
      } catch (error) {
        console.error('[AnimeDetails] ❌ Error fetching anime:', error);
        setNotFound(true);
        setLoading(false);
      }
    }

    fetchAnimeData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-2xl mb-2" style={{ color: 'var(--foreground)' }}>Loading...</div>
          <div className="text-sm" style={{ color: 'var(--rating-text)' }}>Fetching anime details</div>
        </div>
      </div>
    );
  }

  if (notFound || !anime) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ color: 'var(--foreground)' }}>404</div>
          <div className="text-2xl mb-4" style={{ color: 'var(--foreground)' }}>Anime Not Found</div>
          <div className="text-sm mb-4" style={{ color: 'var(--rating-text)' }}>
            This anime (ID: {id}) is not available in our database yet.
          </div>
          <Link to="/home" style={{ color: 'var(--nav-hover)' }} className="hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero Section */}
      <AnimeHero anime={anime} />

      {/* Main Content */}
      <div className="container mx-auto px-[24px] py-8">
        {/* Stats Bar */}
        <AnimeStats anime={anime} />

        {/* Synopsis */}
        {anime.synopsis && <AnimeSynopsis synopsis={anime.synopsis} />}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Information */}
          <div className="space-y-6">
            <AnimeInfo anime={anime} />
            <AnimeExternalLinks anime={anime} />
          </div>

          {/* Right Column - Episodes */}
          <div className="lg:col-span-2">
            <AnimeEpisodes episodes={episodes} animeId={anime.anime_id} />
          </div>
        </div>
      </div>
    </div>
  );
}