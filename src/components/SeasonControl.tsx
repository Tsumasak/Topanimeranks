import { useState, useEffect } from 'react';
import AnticipatedAnimeCard from './AnticipatedAnimeCard';
import { AnticipatedCardSkeleton } from './AnimeCardSkeleton';
import { SEASONS_DATA, SeasonData as SeasonConfig } from '../config/seasons';
import { JikanService } from '../services/jikan';
import { AnticipatedAnime } from '../types/anime';

const SeasonControl = () => {
  const [activeSeason, setActiveSeason] = useState<string>('fall2025');
  const [animes, setAnimes] = useState<AnticipatedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const currentSeason = SEASONS_DATA.find(season => season.id === activeSeason);

  // Parse season ID to get season name and year
  const parseSeasonId = (seasonId: string): { season: string; year: number } => {
    if (seasonId === 'later') {
      return { season: 'later', year: 2026 };
    }
    // Extract season and year from ID like "fall2025"
    const match = seasonId.match(/([a-z]+)(\d+)/);
    if (match) {
      return { season: match[1], year: parseInt(match[2]) };
    }
    return { season: 'fall', year: 2025 };
  };

  // Smooth transition function for season changes
  const handleSeasonChange = (newSeason: string) => {
    if (newSeason === activeSeason) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSeason(newSeason);
    }, 150); // Half of the transition duration
  };
  
  // Load animes when activeSeason changes
  useEffect(() => {
    const loadSeasonAnimes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { season, year } = parseSeasonId(activeSeason);
        const seasonData = await JikanService.getAnticipatedBySeason(season, year);
        setAnimes(seasonData.animes);
      } catch (err) {
        console.error('Error loading season data:', err);
        setError('Failed to load anime data. Please try again later.');
      } finally {
        setLoading(false);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 150);
      }
    };

    loadSeasonAnimes();
  }, [activeSeason]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-8 pb-8 min-h-screen">
        <h1 className="text-4xl text-center mb-2" style={{color: 'var(--foreground)'}}>
          Most Anticipated Anime
        </h1>
        <p className="text-center mb-8 text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
          {currentSeason ? currentSeason.period : 'Loading period...'}
        </p>
        
        {/* Season tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 theme-card rounded-lg p-1">
            {SEASONS_DATA.map(season => (
              <button
                key={season.id}
                onClick={() => handleSeasonChange(season.id)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  activeSeason === season.id 
                    ? 'theme-rank' 
                    : 'theme-nav-link'
                }`}
              >
                {season.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 text-center">
          <p className="text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
            Loading data from MyAnimeList... This may take a moment on first load.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnticipatedCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 pt-8 pb-8 min-h-screen">
        <h1 className="text-4xl text-center mb-2" style={{color: 'var(--foreground)'}}>
          Most Anticipated Anime
        </h1>
        <div className="text-center py-16">
          <p className="text-xl mb-4" style={{color: 'var(--foreground)', opacity: 0.7}}>
            {error}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              const { season, year } = parseSeasonId(activeSeason);
              JikanService.getAnticipatedBySeason(season, year).then(seasonData => {
                setAnimes(seasonData.animes);
                setLoading(false);
              });
            }}
            className="theme-rank px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-8 pb-8 min-h-screen">
      <h1 className="text-4xl text-center mb-2" style={{color: 'var(--foreground)'}}>
        Most Anticipated Anime
      </h1>
      <p className="text-center mb-8 text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
        {currentSeason ? currentSeason.period : 'Loading period...'}
      </p>
      
      {/* Season tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 theme-card rounded-lg p-1">
          {SEASONS_DATA.map(season => (
            <button
              key={season.id}
              onClick={() => handleSeasonChange(season.id)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                activeSeason === season.id 
                  ? 'theme-rank' 
                  : 'theme-nav-link'
              }`}
            >
              {season.label}
            </button>
          ))}
        </div>
      </div>

      {animes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl" style={{color: 'var(--foreground)', opacity: 0.5}}>
            No anime data available for this season yet.
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {animes.map((anime, index) => (
            <AnticipatedAnimeCard 
              key={anime.id}
              rank={index + 1}
              title={anime.title}
              imageUrl={anime.imageUrl}
              score={anime.score}
              members={anime.members}
              synopsis={anime.synopsis}
              animeType={anime.animeType}
              demographics={anime.demographics}
              genres={anime.genres}
              themes={anime.themes}
              studios={anime.studios}
              animeUrl={anime.url}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SeasonControl;
