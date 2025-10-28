import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeCard } from './AnimeCard';
import { AnimeCardSkeleton } from './AnimeCardSkeleton';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { WEEKS_DATA, CURRENT_WEEK_NUMBER, WeekData as WeekConfig } from '../config/weeks';
import { SupabaseService } from '../services/supabase';
import { Episode } from '../types/anime';
import { EmptyDataAlert } from './EmptyDataAlert';

// Function to get the formatted period with correct "Aired" or "Airing" prefix
const getFormattedPeriod = (week: WeekConfig, isCurrentWeek: boolean): string => {
  const prefix = isCurrentWeek ? 'Airing' : 'Aired';
  // Extract the date range from the period, removing the original prefix
  const dateRange = week.period.replace(/^(Aired|Airing) - /, '');
  return `${prefix} - ${dateRange}`;
};

// Function to format dynamic dates from API
const formatDynamicPeriod = (startDate: string, endDate: string, isCurrentWeek: boolean): string => {
  const prefix = isCurrentWeek ? 'Airing' : 'Aired';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Format: "September 29 - October 05, 2025"
  // Use UTC methods to avoid timezone issues
  const startMonth = start.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const startDay = start.getUTCDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const endDay = end.getUTCDate().toString().padStart(2, '0');
  const year = end.getUTCFullYear();
  
  // If same month, show: "Month DD - DD, YYYY"
  if (startMonth === endMonth) {
    return `${prefix} - ${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  
  // If different months, show: "Month1 DD - Month2 DD, YYYY"
  return `${prefix} - ${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
};

// Function to calculate position change for an ANIME (not specific episode)
// This compares the ANIME's ranking between weeks, regardless of which episode aired
const calculatePositionChange = (
  episode: Episode,
  currentRank: number,
  previousWeekEpisodes: Episode[]
): number | undefined => {
  if (previousWeekEpisodes.length === 0) {
    console.log(`[TrendIndicator] ${episode.animeTitle}: NEW (no previous week data)`);
    return undefined; // No previous data, mark as new
  }

  // Find the same ANIME in previous week data (by animeId only, ignore episode number)
  const previousAnimeEntry = previousWeekEpisodes.find(
    prevEp => prevEp.animeId === episode.animeId
  );

  if (!previousAnimeEntry) {
    console.log(`[TrendIndicator] ${episode.animeTitle}: NEW (anime not in previous week)`);
    return undefined; // Anime not found in previous week, mark as new
  }

  // Calculate position change based on ANIME ranking (positive = went up, negative = went down)
  const previousRank = previousWeekEpisodes.indexOf(previousAnimeEntry) + 1;
  const change = previousRank - currentRank;
  
  console.log(`[TrendIndicator] ${episode.animeTitle}: #${currentRank} (was #${previousRank}, change: ${change > 0 ? '+' : ''}${change})`);
  console.log(`  → Current: EP${episode.episodeNumber} (Score: ${episode.score})`);
  console.log(`  → Previous: EP${previousAnimeEntry.episodeNumber} (Score: ${previousAnimeEntry.score})`);
  
  return change;
};

const WeekControl = () => {
  console.log("[WeekControl] Component rendering/re-rendering");
  
  // Track if component is mounted
  const isMounted = useRef(false);
  // Track if user has manually switched tabs
  const userSwitchedTab = useRef(false);
  const [activeWeek, setActiveWeek] = useState<string>(`week${CURRENT_WEEK_NUMBER}`);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [previousWeekEpisodes, setPreviousWeekEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekDates, setWeekDates] = useState<{ startDate: string; endDate: string } | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12); // Infinite scroll: start with 12 episodes
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Ref for intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const currentWeek = WEEKS_DATA.find(week => week.id === activeWeek);

  // Smooth transition function for week changes
  const handleWeekChange = (newWeek: string) => {
    if (newWeek === activeWeek) return;
    userSwitchedTab.current = true;
    setDisplayedCount(12); // Reset to 12 episodes when changing weeks
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on tab change
    setTimeout(() => {
      setActiveWeek(newWeek);
    }, 150); // Half of the transition duration
  };

  // Load more episodes automatically (infinite scroll)
  const loadMoreEpisodes = useCallback(() => {
    if (isLoadingMore || displayedCount >= episodes.length) return;
    
    console.log('[InfiniteScroll] Loading more episodes...');
    setIsLoadingMore(true);
    
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 12, episodes.length));
      setIsLoadingMore(false);
      console.log('[InfiniteScroll] Loaded more episodes');
    }, 300);
  }, [isLoadingMore, displayedCount, episodes.length]);
  
  // Load episodes when activeWeek changes
  useEffect(() => {
    console.log(`[WeekControl useEffect] Triggered for activeWeek: ${activeWeek}, isMounted: ${isMounted.current}`);
    isMounted.current = true;
    
    // Reset displayed count when week changes
    setDisplayedCount(12);
    
    const loadWeekEpisodes = async () => {
      console.log(`[WeekControl] Starting to load week data for ${activeWeek}`);
      
      // Only show full loading skeleton on initial load, not on tab changes
      if (!userSwitchedTab.current) {
        setLoading(true);
      }
      setError(null);
      
      try {
        // Get week number from activeWeek id (e.g., "week1" -> 1)
        const weekNumber = parseInt(activeWeek.replace('week', ''));
        
        console.log(`\n========== LOADING WEEK ${weekNumber} FROM SUPABASE ==========`);
        
        setLoadingProgress(30);
        setLoadingMessage('Fetching weekly episodes...');
        
        // Fetch from Supabase - returns WeekData { episodes, startDate, endDate }
        const weekData = await SupabaseService.getWeeklyEpisodes(weekNumber);
        
        setLoadingProgress(70);
        
        // Episodes are already in the correct format from SupabaseService
        setEpisodes(weekData.episodes);
        setLoadingProgress(100);
        
        console.log(`[WeekControl] Week ${weekNumber} loaded: ${weekData.episodes.length} episodes`);
        console.log(`[WeekControl] Top 5 episodes:`, weekData.episodes.slice(0, 5).map((ep, i) => 
          `#${i + 1} ${ep.animeTitle} EP${ep.episodeNumber} (Score: ${ep.score})`
        ));
        
        // Store the week dates from API
        setWeekDates({
          startDate: weekData.startDate,
          endDate: weekData.endDate,
        });

        // Load previous week for position comparison
        if (weekNumber > 1) {
          const prevWeekData = await SupabaseService.getWeeklyEpisodes(weekNumber - 1);
          setPreviousWeekEpisodes(prevWeekData.episodes);
          console.log(`[WeekControl] Previous week ${weekNumber - 1} loaded: ${prevWeekData.episodes.length} episodes`);
        } else {
          setPreviousWeekEpisodes([]);
        }
        
        console.log(`========================================\n`);
      } catch (err) {
        console.error('Error loading week data:', err);
        setError('Failed to load anime data. Please try again later.');
      } finally {
        setLoading(false);
        setTimeout(() => {
          userSwitchedTab.current = false; // Reset the flag
        }, 150);
      }
    };

    loadWeekEpisodes();
  }, [activeWeek]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    console.log(`[InfiniteScroll] Setup - displayedCount: ${displayedCount}, total episodes: ${episodes.length}, isLoadingMore: ${isLoadingMore}`);
    
    // Don't set up observer if there's nothing more to load
    if (displayedCount >= episodes.length) {
      console.log('[InfiniteScroll] All episodes already displayed, skipping observer setup');
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting;
        const canLoadMore = displayedCount < episodes.length;
        
        console.log(`[InfiniteScroll] Observer triggered - intersecting: ${isIntersecting}, canLoadMore: ${canLoadMore} (${displayedCount}/${episodes.length}), isLoadingMore: ${isLoadingMore}`);
        
        if (isIntersecting && !isLoadingMore && canLoadMore) {
          console.log('[InfiniteScroll] Conditions met, loading more...');
          loadMoreEpisodes();
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Start loading 100px before reaching the target
    );

    // Use a small delay to ensure the DOM is ready
    const timeoutId = setTimeout(() => {
      const currentTarget = observerTarget.current;
      if (currentTarget) {
        console.log('[InfiniteScroll] Observer target found, observing...');
        observer.observe(currentTarget);
      } else {
        console.log('[InfiniteScroll] Observer target NOT found');
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect(); // Disconnect all observations
    };
  }, [displayedCount, episodes.length, isLoadingMore, loadMoreEpisodes]);

  // Auto-load more if content doesn't fill the viewport (fallback for when observer doesn't trigger)
  useEffect(() => {
    if (loading || isLoadingMore || displayedCount >= episodes.length) return;
    
    // Check if we need to auto-load more after a short delay
    const checkViewportId = setTimeout(() => {
      const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      
      if (!hasScrollbar && displayedCount < episodes.length) {
        console.log('[InfiniteScroll] No scrollbar detected, auto-loading more episodes...');
        loadMoreEpisodes();
      }
    }, 500); // Wait for animations to complete
    
    return () => clearTimeout(checkViewportId);
  }, [loading, episodes.length, displayedCount, isLoadingMore, loadMoreEpisodes]);

  if (loading) {
    return (
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-4xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Weekly Episode Ranking
        </h1>
        <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
          {weekDates && currentWeek 
            ? formatDynamicPeriod(weekDates.startDate, weekDates.endDate, currentWeek.isCurrentWeek)
            : currentWeek 
            ? getFormattedPeriod(currentWeek, currentWeek.isCurrentWeek) 
            : 'Loading period...'}
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
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-4xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Weekly Episode Ranking
        </h1>
        <div className="text-center py-16">
          <p className="text-xl mb-4" style={{color: 'var(--foreground)', opacity: 0.7}}>
            {error}
          </p>
          <button
            onClick={() => {
              // Force reload by reloading the page
              window.location.reload();
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
        Weekly Anime Episodes
      </h1>
      <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
        {weekDates && currentWeek 
          ? formatDynamicPeriod(weekDates.startDate, weekDates.endDate, currentWeek.isCurrentWeek)
          : currentWeek 
          ? getFormattedPeriod(currentWeek, currentWeek.isCurrentWeek) 
          : 'Loading period...'}
      </p>
      
      {/* Desktop: Week tabs with sliding indicator */}
      <div className="hidden md:flex justify-center mb-8 sticky top-[88px] z-40 -mx-[40px] px-[40px]">
        <div className="flex space-x-2 theme-controller rounded-lg p-1 relative">
          {WEEKS_DATA.map((week) => (
            <button
              key={week.id}
              onClick={() => handleWeekChange(week.id)}
              className={`px-4 py-2 rounded-md text-sm relative overflow-hidden whitespace-nowrap ${
                activeWeek === week.id 
                  ? '' 
                  : 'theme-nav-link'
              }`}
              style={activeWeek === week.id ? { color: 'var(--rank-text)' } : {}}
            >
              {activeWeek === week.id && (
                <motion.div
                  layoutId="weekIndicator"
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: 'var(--rank-background)' }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{week.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Unified Controller Bar */}
      <div className="md:hidden flex justify-center mb-8 sticky top-[88px] z-40">
        <div className="theme-controller rounded-lg p-1 relative flex items-center justify-between gap-1 w-full max-w-md mx-[8px]">
          {/* Previous Week Button */}
          {(() => {
            const currentIndex = WEEKS_DATA.findIndex(w => w.id === activeWeek);
            const hasPrev = currentIndex > 0;
            const prevWeek = hasPrev ? WEEKS_DATA[currentIndex - 1] : null;
            
            return (
              <button
                onClick={() => prevWeek && handleWeekChange(prevWeek.id)}
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
            <Select value={activeWeek} onValueChange={handleWeekChange}>
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
                {WEEKS_DATA.map((week) => (
                  <SelectItem key={week.id} value={week.id} className="theme-nav-link">
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next Week Button */}
          {(() => {
            const currentIndex = WEEKS_DATA.findIndex(w => w.id === activeWeek);
            const hasNext = currentIndex < WEEKS_DATA.length - 1 && !currentWeek?.isCurrentWeek;
            const nextWeek = hasNext ? WEEKS_DATA[currentIndex + 1] : null;
            
            return (
              <button
                onClick={() => nextWeek && handleWeekChange(nextWeek.id)}
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

      {episodes.length === 0 ? (
        <>
          {/* Show EmptyDataAlert only if ALL weeks are empty (database not populated) */}
          {activeWeek === 1 && (
            <EmptyDataAlert />
          )}
          {activeWeek !== 1 && (
            <div className="text-center py-16">
              <p className="text-xl" style={{color: 'var(--foreground)', opacity: 0.5}}>
                No episode data available for this week yet.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {episodes.slice(0, displayedCount).map((episode, index) => {
                const rank = index + 1;
                
                // Convert trend string to positionChange number
                let positionChange: number | undefined;
                if (episode.trend) {
                  if (episode.trend === 'NEW') {
                    positionChange = undefined; // NEW episodes
                  } else if (episode.trend === '=') {
                    positionChange = 0; // Same position
                  } else {
                    positionChange = parseInt(episode.trend); // +2, -3, etc.
                  }
                }
                
                return (
                  <motion.div
                    key={`${activeWeek}-${episode.animeId}-${episode.id}`}
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
                    <AnimeCard 
                      rank={rank}
                      title={episode.animeTitle}
                      subtitle={`EP ${episode.episodeNumber}${episode.episodeTitle ? ` - ${episode.episodeTitle}` : ''}`}
                      imageUrl={episode.imageUrl}
                      linkUrl={episode.episodeUrl}
                      bottomText={episode.episodeScore && episode.episodeScore > 0 ? `★ ${episode.episodeScore.toFixed(2)}` : '★ N/A'}
                      animeType={episode.animeType}
                      demographics={episode.demographics}
                      genres={episode.genres}
                      themes={episode.themes}
                      positionChange={positionChange}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Infinite Scroll Observer Target + Load More Button */}
          {displayedCount < episodes.length ? (
            <div ref={observerTarget} className="flex flex-col items-center gap-4 mt-8 py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-t-transparent rounded-full animate-spin" 
                       style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
                  <p className="text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
                    Loading more episodes...
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs opacity-50" style={{color: 'var(--foreground)'}}>
                    Scroll to load more ({displayedCount}/{episodes.length})
                  </p>
                  {/* Manual Load More Button as fallback */}
                  <button
                    onClick={loadMoreEpisodes}
                    className="px-6 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--rank-background)',
                      color: 'var(--rank-text)',
                    }}
                  >
                    Load More Episodes
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center mt-8 py-8">
              <p className="text-sm" style={{color: 'var(--foreground)', opacity: 0.5}}>
                All {episodes.length} episodes loaded
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeekControl;
