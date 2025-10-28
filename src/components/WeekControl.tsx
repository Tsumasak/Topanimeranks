import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeCard } from './AnimeCard';
import { AnimeCardSkeleton } from './AnimeCardSkeleton';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { WEEKS_DATA, CURRENT_WEEK_NUMBER, WeekData as WeekConfig } from '../config/weeks';
import { SupabaseService } from '../services/supabase';
import { Episode } from '../types/anime';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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
// NOTE: Currently not used, but kept for future trend calculation features
/*const calculatePositionChange = (
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
  console.log(`  → Current: EP${episode.episodeNumber} (Score: ${episode.episodeScore})`);
  console.log(`  → Previous: EP${previousAnimeEntry.episodeNumber} (Score: ${previousAnimeEntry.episodeScore})`);
  
  return change;
};*/

const WeekControl = () => {
  // Track if component is mounted
  const isMounted = useRef(false);
  // Track if user has manually switched tabs
  const userSwitchedTab = useRef(false);
  // Track if we're transitioning between weeks (to avoid showing empty state)
  const isTransitioning = useRef(false);
  const [activeWeek, setActiveWeek] = useState<string>(`week${CURRENT_WEEK_NUMBER}`);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [displayedEpisodes, setDisplayedEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangingWeek, setIsChangingWeek] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CRITICAL: Animation key that only changes when NEW data is ready
  const [animationKey, setAnimationKey] = useState(activeWeek);
  const [weekDates, setWeekDates] = useState<{ startDate: string; endDate: string } | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12); // Infinite scroll: start with 12 episodes
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]); // Weeks com episódios
  
  // Ref for intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Filter weeks to show only those with episodes
  const visibleWeeks = WEEKS_DATA.filter(week => availableWeeks.includes(week.id));
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
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 12, episodes.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, displayedCount, episodes.length]);
  
  // Load available weeks on mount (check which weeks have data)
  useEffect(() => {
    const loadAvailableWeeks = async () => {
      console.log('[WeekControl] Checking which weeks have data...');
      
      try {
        // Call server endpoint to get weeks summary
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        const result = await response.json();
        
        if (result.success && result.weeks) {
          // Filter to only show weeks that have data AND are not in the future
          const weeksWithData = result.weeks
            .filter((w: number) => w <= CURRENT_WEEK_NUMBER) // Only past and current weeks
            .map((w: number) => `week${w}`);
          
          setAvailableWeeks(weeksWithData);
          
          // If current week has no data, switch to first available or last week
          if (weeksWithData.length > 0 && !weeksWithData.includes(`week${CURRENT_WEEK_NUMBER}`)) {
            // Try to use the last available week (most recent)
            setActiveWeek(weeksWithData[weeksWithData.length - 1]);
          }
        } else {
          // Fallback: show only weeks up to current week
          const pastWeeks = WEEKS_DATA
            .filter(w => parseInt(w.id.replace('week', '')) <= CURRENT_WEEK_NUMBER)
            .map(w => w.id);
          setAvailableWeeks(pastWeeks);
        }
      } catch (error) {
        console.error('[WeekControl] Error loading available weeks:', error);
        // Fallback: show only weeks up to current week
        const pastWeeks = WEEKS_DATA
          .filter(w => parseInt(w.id.replace('week', '')) <= CURRENT_WEEK_NUMBER)
          .map(w => w.id);
        setAvailableWeeks(pastWeeks);
      }
    };
    
    loadAvailableWeeks();
  }, []);
  
  // Load episodes when activeWeek changes
  useEffect(() => {
    isMounted.current = true;
    
    // Reset displayed count when week changes
    setDisplayedCount(12);
    
    const loadWeekEpisodes = async () => {
      // Mark that we're transitioning
      isTransitioning.current = true;
      
      // If user switched tabs manually, just set changing week flag
      if (userSwitchedTab.current) {
        setIsChangingWeek(true);
        // Keep old episodes visible AND keep animation key unchanged
        // Animation key will only change when new data arrives
      } else {
        // First load - show full loading skeleton
        setLoading(true);
        setDisplayedEpisodes([]); // Clear on first load
        setAnimationKey(activeWeek); // Set initial animation key
      }
      setError(null);
      
      try {
        // Get week number from activeWeek id (e.g., "week1" -> 1)
        const weekNumber = parseInt(activeWeek.replace('week', ''));
        
        setLoadingProgress(30);
        setLoadingMessage('Fetching weekly episodes...');
        
        // Fetch from Supabase - returns WeekData { episodes, startDate, endDate }
        const weekData = await SupabaseService.getWeeklyEpisodes(weekNumber);
        
        setLoadingProgress(70);
        
        // Episodes are already in the correct format from SupabaseService
        setEpisodes(weekData.episodes);
        
        // CRITICAL FIX: Update displayed episodes AND animation key together
        // This ensures AnimatePresence only triggers when NEW data is ready
        setDisplayedEpisodes(weekData.episodes);
        setAnimationKey(activeWeek); // Only NOW change the animation key
        
        setLoadingProgress(100);
        
        // Store the week dates from API
        setWeekDates({
          startDate: weekData.startDate,
          endDate: weekData.endDate,
        });

        // Load previous week for position comparison
        if (weekNumber > 1) {
          const prevWeekData = await SupabaseService.getWeeklyEpisodes(weekNumber - 1);
          setPreviousWeekEpisodes(prevWeekData.episodes);
        } else {
          setPreviousWeekEpisodes([]);
        }
      } catch (err) {
        setError('Failed to load anime data. Please try again later.');
        setDisplayedEpisodes([]); // Clear on error
      } finally {
        setLoading(false);
        setIsChangingWeek(false);
        isTransitioning.current = false;
        userSwitchedTab.current = false; // Reset the flag
      }
    };

    loadWeekEpisodes();
  }, [activeWeek]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    // Don't set up observer if there's nothing more to load
    if (displayedCount >= displayedEpisodes.length) {
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting;
        const canLoadMore = displayedCount < displayedEpisodes.length;
        
        if (isIntersecting && !isLoadingMore && canLoadMore) {
          loadMoreEpisodes();
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Start loading 100px before reaching the target
    );

    // Use a small delay to ensure the DOM is ready
    const timeoutId = setTimeout(() => {
      const currentTarget = observerTarget.current;
      if (currentTarget) {
        observer.observe(currentTarget);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect(); // Disconnect all observations
    };
  }, [displayedCount, displayedEpisodes.length, isLoadingMore, loadMoreEpisodes]);

  // Auto-load more if content doesn't fill the viewport (fallback for when observer doesn't trigger)
  useEffect(() => {
    if (loading || isLoadingMore || displayedCount >= displayedEpisodes.length) return;
    
    // Check if we need to auto-load more after a short delay
    const checkViewportId = setTimeout(() => {
      const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      
      if (!hasScrollbar && displayedCount < episodes.length) {
        loadMoreEpisodes();
      }
    }, 500); // Wait for animations to complete
    
    return () => clearTimeout(checkViewportId);
  }, [loading, displayedEpisodes.length, displayedCount, isLoadingMore, loadMoreEpisodes]);

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
          {visibleWeeks.map((week) => (
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
            const currentIndex = visibleWeeks.findIndex(w => w.id === activeWeek);
            const hasPrev = currentIndex > 0;
            const prevWeek = hasPrev ? visibleWeeks[currentIndex - 1] : null;
            
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
                {visibleWeeks.map((week) => (
                  <SelectItem key={week.id} value={week.id} className="theme-nav-link">
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next Week Button */}
          {(() => {
            const currentIndex = visibleWeeks.findIndex(w => w.id === activeWeek);
            const hasNext = currentIndex < visibleWeeks.length - 1 && !currentWeek?.isCurrentWeek;
            const nextWeek = hasNext ? visibleWeeks[currentIndex + 1] : null;
            
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

      {displayedEpisodes.length === 0 && !loading && !isChangingWeek ? (
        <div className="text-center py-16">
          <p className="text-xl" style={{color: 'var(--foreground)', opacity: 0.5}}>
            No episode data available for this week yet.
          </p>
        </div>
      ) : displayedEpisodes.length > 0 ? (
        <>
          <AnimatePresence mode="wait">
            <motion.div 
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {displayedEpisodes.slice(0, displayedCount).map((episode, index) => {
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
                    key={`${episode.animeId}-ep${episode.episodeNumber}`}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.03,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    className="h-full"
                  >
                    <AnimeCard 
                      rank={rank}
                      title={episode.animeTitle}
                      subtitle={`EP ${episode.episodeNumber}${episode.episodeTitle ? ` - ${episode.episodeTitle}` : ''}`}
                      imageUrl={episode.imageUrl}
                      linkUrl={episode.episodeUrl}
                      bottomText={episode.episodeScore != null ? `★ ${episode.episodeScore.toFixed(2)}` : '★ N/A'}
                      animeType={episode.animeType}
                      demographics={episode.demographics}
                      genres={episode.genres}
                      themes={episode.themes}
                      positionChange={positionChange}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
          
          {/* Infinite Scroll Observer Target + Load More Button */}
          {displayedCount < displayedEpisodes.length ? (
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
                    Scroll to load more ({displayedCount}/{displayedEpisodes.length})
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
      ) : null}
    </div>
  );
};

export default WeekControl;
