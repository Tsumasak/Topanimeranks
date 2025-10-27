import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnticipatedAnimeCard from './AnticipatedAnimeCard';
import { AnticipatedCardSkeleton } from './AnimeCardSkeleton';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SEASONS_DATA } from '../config/seasons';
import { SupabaseService } from '../services/supabase';
import { AnticipatedAnime } from '../types/anime';

const SeasonControl = () => {
  console.log("[SeasonControl] Component rendering/re-rendering");
  
  const [activeSeason, setActiveSeason] = useState<string>('fall2025');
  const [animes, setAnimes] = useState<AnticipatedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSwitched, setUserSwitched] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
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
    setUserSwitched(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on tab change
    setTimeout(() => {
      setActiveSeason(newSeason);
    }, 150); // Half of the transition duration
  };
  
  // Load animes when activeSeason changes
  useEffect(() => {
    console.log(`[SeasonControl useEffect] Triggered for activeSeason: ${activeSeason}`);
    
    const loadSeasonAnimes = async () => {
      console.log(`[SeasonControl] Starting to load season data for ${activeSeason}`);
      
      // Only show full loading skeleton on initial load, not on season changes
      if (!userSwitched) {
        setLoading(true);
      }
      setError(null);
      
      try {
        const { season, year } = parseSeasonId(activeSeason);
        // Use Supabase service (with Jikan fallback)
        const animesList = await SupabaseService.getSeasonRankings(season, year);
        setAnimes(animesList);
        setLoadingProgress(100);
      } catch (err) {
        console.error('Error loading season data:', err);
        setError('Failed to load anime data. Please try again later.');
      } finally {
        setLoading(false);
        setTimeout(() => {
          setUserSwitched(false); // Reset flag
        }, 150);
      }
    };

    loadSeasonAnimes();
  }, [activeSeason, userSwitched]);

  if (loading) {
    return (
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-4xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Most Anticipated Animes
        </h1>
        <p className="text-center mb-16 text-sm" style={{color: 'var(--rating-yellow)'}}>
          {currentSeason ? currentSeason.period : 'Loading period...'}
        </p>

        <div className="mb-8 text-center max-w-2xl mx-auto">
          <p className="text-sm mb-4" style={{color: 'var(--foreground)', opacity: 0.7}}>
            {loadingMessage || 'Loading data from MyAnimeList... This may take a moment on first load.'}
          </p>
          <div className="w-full">
            <Progress 
              value={loadingProgress} 
              className="h-3"
              style={{
                backgroundColor: 'var(--card-background)',
              }}
            />
            <p className="text-xs mt-2" style={{color: 'var(--foreground)', opacity: 0.5}}>
              {loadingProgress}%
            </p>
          </div>
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
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-4xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Most Anticipated Animes
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
    <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
      <h1 className="text-4xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
        Most Anticipated Animes
      </h1>
      <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
        {currentSeason ? currentSeason.period : 'Loading period...'}
      </p>
      
      {/* Desktop: Season tabs with sliding indicator */}
      <div className="hidden md:flex justify-center mb-8 sticky top-[88px] z-40 -mx-[40px] px-[40px]">
        <div className="flex space-x-2 theme-controller rounded-lg p-1 relative">
          {SEASONS_DATA.map((season) => (
            <button
              key={season.id}
              onClick={() => handleSeasonChange(season.id)}
              className={`px-4 py-2 rounded-md text-sm relative overflow-hidden whitespace-nowrap ${
                activeSeason === season.id 
                  ? '' 
                  : 'theme-nav-link'
              }`}
              style={activeSeason === season.id ? { color: 'var(--rank-text)' } : {}}
            >
              {activeSeason === season.id && (
                <motion.div
                  layoutId="seasonIndicator"
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: 'var(--rank-background)' }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{season.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Unified Controller Bar */}
      <div className="md:hidden flex justify-center mb-8 sticky top-[88px] z-40">
        <div className="theme-controller rounded-lg p-1 relative flex items-center justify-between gap-1 w-full max-w-md mx-[8px]">
          {/* Previous Season Button */}
          {(() => {
            const currentIndex = SEASONS_DATA.findIndex(s => s.id === activeSeason);
            const hasPrev = currentIndex > 0;
            const prevSeason = hasPrev ? SEASONS_DATA[currentIndex - 1] : null;
            
            return (
              <button
                onClick={() => prevSeason && handleSeasonChange(prevSeason.id)}
                disabled={!hasPrev}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm theme-nav-link transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                <span className="whitespace-nowrap">Prev</span>
              </button>
            );
          })()}

          {/* Dropdown (Active State) - Centered and compact */}
          <div className="flex-shrink-0">
            <Select value={activeSeason} onValueChange={handleSeasonChange}>
              <SelectTrigger 
                className="border-0 px-3 py-2 rounded-md text-sm flex items-center gap-1.5 w-auto [&_svg]:!text-white [&_svg]:!opacity-100"
                style={{
                  backgroundColor: 'var(--rank-background)',
                  color: 'var(--rank-text)'
                }}
              >
                <SelectValue className="text-center" />
              </SelectTrigger>
              <SelectContent className="theme-card border" style={{borderColor: 'var(--card-border)'}}>
                {SEASONS_DATA.map((season) => (
                  <SelectItem key={season.id} value={season.id} className="theme-nav-link">
                    {season.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next Season Button */}
          {(() => {
            const currentIndex = SEASONS_DATA.findIndex(s => s.id === activeSeason);
            const hasNext = currentIndex < SEASONS_DATA.length - 1;
            const nextSeason = hasNext ? SEASONS_DATA[currentIndex + 1] : null;
            
            return (
              <button
                onClick={() => nextSeason && handleSeasonChange(nextSeason.id)}
                disabled={!hasNext}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm theme-nav-link transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="whitespace-nowrap">Next</span>
                <ChevronRight size={16} />
              </button>
            );
          })()}
        </div>
      </div>

      {animes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl" style={{color: 'var(--foreground)', opacity: 0.5}}>
            No anime data available for this season yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {animes.map((anime, index) => (
              <motion.div
                key={`${activeSeason}-${anime.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: "easeOut"
                }}
                className="h-full"
              >
                <AnticipatedAnimeCard 
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SeasonControl;
