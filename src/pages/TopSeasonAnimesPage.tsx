import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BaseAnimeCard from '../components/BaseAnimeCard';
import { SupabaseService } from '../services/supabase';
import { JikanAnimeData } from '../types/anime';
import { PAST_SEASONS_DATA } from '../config/pastSeasons';

export default function TopSeasonAnimesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial season from URL query param, fallback to winter2026
  const initialSeason = searchParams.get('season') || 'winter2026';
  const [activeSeason, setActiveSeason] = useState<string>(initialSeason);
  const [animes, setAnimes] = useState<JikanAnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12);
  const [animationKey, setAnimationKey] = useState(activeSeason);
  const [userSwitched, setUserSwitched] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const currentSeason = PAST_SEASONS_DATA.find(season => season.id === activeSeason);

  // Smooth transition function for season changes
  const handleSeasonChange = (newSeason: string) => {
    if (newSeason === activeSeason) return;
    console.log(`[TopSeasonAnimesPage] 🔄 handleSeasonChange: ${activeSeason} → ${newSeason}`);
    setUserSwitched(true);
    setActiveSeason(newSeason);
    
    // Update URL query param to persist state
    setSearchParams({ season: newSeason });
    
    // Reset displayed count for new season
    setDisplayedCount(12);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load season animes when activeSeason changes
  useEffect(() => {
    const loadSeasonAnimes = async () => {
      try {
        // Only show full loading on initial load, not on season changes
        if (!userSwitched) {
          setLoading(true);
        }
        setError(null);

        const seasonData = PAST_SEASONS_DATA.find(s => s.id === activeSeason);
        if (!seasonData) {
          setError('Invalid season selected');
          setLoading(false);
          return;
        }

        // Order by SCORE (rating-based ranking)
        // IMPORTANT: Show ALL animes for the season, even those without scores yet
        const seasonAnimes = await SupabaseService.getSeasonRankings(
          seasonData.season,
          seasonData.year,
          'score'
        );
        
        if (seasonAnimes.length === 0) {
          setError('Season rankings are being synced. Please wait a few minutes and refresh.');
          setLoading(false);
          return;
        }

        console.log(`[TopSeasonAnimesPage] ✅ Loaded ${seasonAnimes.length} ${seasonData.label} animes`);
        
        setAnimes(seasonAnimes);
        setAnimationKey(activeSeason);
        
      } catch (err) {
        console.error('[TopSeasonAnimesPage] ❌ Error loading season animes:', err);
        setError(`Failed to load season rankings: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setAnimes([]);
      } finally {
        setLoading(false);
        setUserSwitched(false);
      }
    };

    loadSeasonAnimes();
  }, [activeSeason]);

  // Infinite scroll - instant, no delay
  const loadMoreAnimes = useCallback(() => {
    if (displayedCount >= animes.length) return;
    
    console.log('[InfiniteScroll] Loading more animes...');
    setDisplayedCount(prev => Math.min(prev + 12, animes.length));
  }, [displayedCount, animes.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          loadMoreAnimes();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreAnimes, loading]);

  // No loading screen - render directly
  if (loading) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="dynamic-background min-h-screen">
        <div className="container mx-auto px-[24px] pt-[32px] pb-[32px]">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-4">
            <h1 className="text-2xl mb-4 text-red-400">No Data Available</h1>
            <p className="text-sm mb-4" style={{ color: 'var(--foreground)' }}>{error}</p>
            <p className="text-sm mb-4 text-center max-w-md" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              The season rankings are being synced automatically. Please wait a few minutes and refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-background min-h-screen">
      <div className="container mx-auto px-[24px] pt-[32px] pb-[32px]">
        {/* Header */}
        <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Top Animes
        </h1>
        <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
          Highest rated animes of {currentSeason?.period || 'the season'}
        </p>

        {/* Desktop: Season tabs with sliding indicator */}
        <div className="hidden md:flex justify-center mb-8 sticky top-[82px] z-40 -mx-[40px] px-[40px] py-2">
          <div className="flex space-x-2 theme-controller rounded-lg p-1 relative">
            {PAST_SEASONS_DATA.map((season) => (
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
        <div className="md:hidden flex justify-center mb-8 sticky top-[72px] z-40">
          <div className="theme-controller rounded-lg p-1 relative flex items-center justify-between gap-2 w-full max-w-md mx-[8px]">
            {/* Previous Season Button */}
            {(() => {
              const currentIndex = PAST_SEASONS_DATA.findIndex(s => s.id === activeSeason);
              const hasPrev = currentIndex > 0;
              const prevSeason = hasPrev ? PAST_SEASONS_DATA[currentIndex - 1] : null;
              
              return (
                <button
                  onClick={() => {
                    if (prevSeason) {
                      handleSeasonChange(prevSeason.id);
                    }
                  }}
                  disabled={!hasPrev}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm theme-nav-link transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  <span className="whitespace-nowrap">Prev</span>
                </button>
              );
            })()}

            {/* Current Season Label - Centered */}
            <div className="flex-1 flex items-center justify-center px-2">
              <span 
                className="px-3 py-2 rounded-md text-sm whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--rank-background)',
                  color: 'var(--rank-text)'
                }}
              >
                {PAST_SEASONS_DATA.find(s => s.id === activeSeason)?.label || 'Loading...'}
              </span>
            </div>

            {/* Next Season Button */}
            {(() => {
              const currentIndex = PAST_SEASONS_DATA.findIndex(s => s.id === activeSeason);
              const hasNext = currentIndex < PAST_SEASONS_DATA.length - 1;
              const nextSeason = hasNext ? PAST_SEASONS_DATA[currentIndex + 1] : null;
              
              return (
                <button
                  onClick={() => {
                    if (nextSeason) {
                      handleSeasonChange(nextSeason.id);
                    }
                  }}
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

        {/* Animes Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={animationKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
          >
            {animes.slice(0, displayedCount).map((anime, index) => (
              <motion.div
                key={`${anime.mal_id}-${index}`}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                <BaseAnimeCard
                  rank={index + 1}
                  title={anime.title_english || anime.title}
                  subtitle={`${anime.type || 'TV'} • ${currentSeason?.label || ''}`}
                  imageUrl={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || ''}
                  linkUrl={`/anime/${anime.mal_id}`}
                  bottomText={`⭐ ${(anime.score || 0).toFixed(2)}`}
                  animeType={anime.type}
                  demographics={anime.demographics?.map(d => typeof d === 'string' ? d : d.name) || []}
                  genres={anime.genres?.map(g => typeof g === 'string' ? g : g.name) || []}
                  themes={anime.themes?.map(t => typeof t === 'string' ? t : t.name) || []}
                  season={currentSeason?.season || 'fall'}
                  year={currentSeason?.year || 2025}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Intersection Observer Target */}
        {displayedCount < animes.length && (
          <div ref={observerTarget} className="h-20 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              Loading more...
            </p>
          </div>
        )}

        {/* End Message */}
        {displayedCount >= animes.length && animes.length > 0 && (
          <div className="flex flex-col items-center py-8">
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              You've reached the end! ({animes.length} animes total)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}