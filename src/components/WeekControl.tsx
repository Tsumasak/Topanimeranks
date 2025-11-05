import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeCard } from './AnimeCard';
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
  
  // Validate dates first
  if (!startDate || !endDate) {
    console.warn('[formatDynamicPeriod] Missing dates:', { startDate, endDate });
    return 'Date unavailable';
  }
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('[formatDynamicPeriod] Invalid dates:', { startDate, endDate });
      return 'Date unavailable';
    }
    
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
  } catch (err) {
    console.error('[formatDynamicPeriod] Error formatting dates:', err);
    return 'Date unavailable';
  }
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
  console.log(`  → Current: EP${episode.episodeNumber} (Score: ${episode.episodeScore})`);
  console.log(`  → Previous: EP${previousAnimeEntry.episodeNumber} (Score: ${previousAnimeEntry.episodeScore})`);
  
  return change;
};

const WeekControl = () => {
  // Track if component is mounted
  const isMounted = useRef(false);
  // Track if user has manually switched tabs
  const userSwitchedTab = useRef(false);
  // Track if we're transitioning between weeks (to avoid showing empty state)
  const isTransitioning = useRef(false);
  const [activeWeek, setActiveWeek] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [displayedEpisodes, setDisplayedEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // CRITICAL: Animation key that only changes when NEW data is ready
  const [animationKey, setAnimationKey] = useState<string | null>(null);
  const [weekDates, setWeekDates] = useState<{ startDate: string; endDate: string } | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12); // Infinite scroll: start with 12 episodes
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]); // Weeks com episódios
  const [previousWeekEpisodes, setPreviousWeekEpisodes] = useState<Episode[]>([]); // For trend calculation
  const [latestWeekNumber, setLatestWeekNumber] = useState<number>(CURRENT_WEEK_NUMBER); // Latest week with 5+ scored episodes
  
  // Ref for intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Filter weeks to show only those with episodes
  const visibleWeeks = WEEKS_DATA.filter(week => availableWeeks.includes(week.id));
  const currentWeek = WEEKS_DATA.find(week => week.id === activeWeek);
  
  // Determine if the active week is the "current" week (latest with 5+ scored episodes)
  const activeWeekNumber = activeWeek ? parseInt(activeWeek.replace('week', '')) : 0;
  const isActiveWeekCurrent = activeWeekNumber === latestWeekNumber;

  // Smooth transition function for week changes
  const handleWeekChange = (newWeek: string) => {
    if (newWeek === activeWeek) return;
    console.log(`[WeekControl] 🔄 handleWeekChange: ${activeWeek} → ${newWeek}`);
    userSwitchedTab.current = true;
    setDisplayedCount(12); // Reset to 12 episodes when changing weeks
    setActiveWeek(newWeek); // Change immediately
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on tab change
  };

  // Load more episodes automatically (infinite scroll) - instant, no loading
  const loadMoreEpisodes = useCallback(() => {
    if (displayedCount >= episodes.length) return;
    
    setDisplayedCount(prev => Math.min(prev + 12, episodes.length));
  }, [displayedCount, episodes.length]);
  
  // Load available weeks on mount (check which weeks have 5+ episodes WITH SCORE)
  useEffect(() => {
    const loadAvailableWeeks = async () => {
      console.log('[WeekControl] 🔍 Starting to load available weeks (5+ scored episodes filter)...');
      console.log('[WeekControl] 📅 Config week number:', CURRENT_WEEK_NUMBER);
      
      try {
        // Call server endpoint to get weeks summary (already filtered to 5+ episodes WITH SCORE)
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        const result = await response.json();
        
        if (result.success && result.weeks && result.latestWeek) {
          // Server filters to weeks with 5+ episodes WITH SCORE
          const weeksWithData = result.weeks.map((w: number) => `week${w}`);
          const detectedLatestWeek = result.latestWeek;
          
          console.log(`[WeekControl] ✅ Received ${weeksWithData.length} weeks with 5+ scored episodes:`, weeksWithData);
          console.log(`[WeekControl] 🎯 Latest week detected: Week ${detectedLatestWeek}`);
          console.log(`[WeekControl] 📊 Week counts:`, result.weekCounts);
          
          setAvailableWeeks(weeksWithData);
          setLatestWeekNumber(detectedLatestWeek);
          
          // Default to latest week with 5+ scored episodes
          setActiveWeek(`week${detectedLatestWeek}`);
          console.log(`[WeekControl] 📌 Defaulting to Week ${detectedLatestWeek} (latest with 5+ scored episodes)`);
        } else {
          // Fallback: show only weeks up to current week (no filtering by episode count)
          const pastWeeks = WEEKS_DATA
            .filter(w => parseInt(w.id.replace('week', '')) <= CURRENT_WEEK_NUMBER)
            .map(w => w.id);
          console.log(`[WeekControl] ⚠️  Server returned no weeks - using fallback:`, pastWeeks);
          setAvailableWeeks(pastWeeks);
          setLatestWeekNumber(CURRENT_WEEK_NUMBER);
        }
      } catch (error) {
        console.error('[WeekControl] ❌ Error loading available weeks:', error);
        // Fallback: show only weeks up to current week (no filtering by episode count)
        const pastWeeks = WEEKS_DATA
          .filter(w => parseInt(w.id.replace('week', '')) <= CURRENT_WEEK_NUMBER)
          .map(w => w.id);
        console.log(`[WeekControl] ⚠️  Using fallback - showing all weeks up to ${CURRENT_WEEK_NUMBER}:`, pastWeeks);
        setAvailableWeeks(pastWeeks);
        setLatestWeekNumber(CURRENT_WEEK_NUMBER);
      }
    };
    
    loadAvailableWeeks();
  }, []);
  
  // Load episodes when activeWeek changes
  useEffect(() => {
    // Don't load if activeWeek is not set yet (waiting for available weeks fetch)
    if (!activeWeek) {
      console.log('[WeekControl useEffect] ⏳ Waiting for activeWeek to be set...');
      return;
    }
    
    console.log(`[WeekControl useEffect] ⚡ Triggered for activeWeek: ${activeWeek}, userSwitched: ${userSwitchedTab.current}`);
    console.log(`[WeekControl useEffect] 📊 Current state:`, {
      activeWeek,
      userSwitched: userSwitchedTab.current,
      animationKey,
      currentEpisodesCount: episodes.length,
      displayedEpisodesCount: displayedEpisodes.length
    });
    
    isMounted.current = true;
    
    // Reset displayed count when week changes
    setDisplayedCount(12);
    
    const loadWeekEpisodes = async () => {
      console.log(`[WeekControl] 🔍 Starting to load week data for ${activeWeek}`);
      
      // Mark that we're transitioning
      isTransitioning.current = true;
      
      // Only show loading on first mount
      if (!userSwitchedTab.current) {
        console.log(`[WeekControl] 🔃 Setting loading to true (initial load)`);
        setLoading(true);
      } else {
        console.log(`[WeekControl] 🏃 User switched - skipping loading state`);
      }
      setError(null);
      
      try {
        // Get week number from activeWeek id (e.g., "week1" -> 1)
        const weekNumber = parseInt(activeWeek.replace('week', ''));
        
        // Fetch from Supabase - returns WeekData { episodes, startDate, endDate }
        const weekData = await SupabaseService.getWeeklyEpisodes(weekNumber);
        
        // Episodes are already in the correct format from SupabaseService
        console.log(`[WeekControl] ✅ Fetched ${weekData.episodes.length} episodes for ${activeWeek}`);
        setEpisodes(weekData.episodes);
        
        // CRITICAL FIX: Update displayed episodes AND animation key together
        // This ensures AnimatePresence only triggers when NEW data is ready
        console.log(`[WeekControl] 🎬 CRITICAL: Updating displayedEpisodes (${weekData.episodes.length}) and animationKey (${activeWeek})`);
        console.log(`[WeekControl] 🎬 Previous animationKey: ${animationKey} → New: ${activeWeek}`);
        setDisplayedEpisodes(weekData.episodes);
        setAnimationKey(activeWeek); // Only NOW change the animation key
        console.log(`[WeekControl] 🎬 displayedEpisodes and animationKey updated!`);
        
        // Store the week dates from API (validate they exist)
        console.log('[WeekControl] Week data received:', { 
          episodesCount: weekData.episodes.length,
          startDate: weekData.startDate, 
          endDate: weekData.endDate,
          hasValidDates: !!(weekData.startDate && weekData.endDate)
        });
        
        if (weekData.startDate && weekData.endDate) {
          setWeekDates({
            startDate: weekData.startDate,
            endDate: weekData.endDate,
          });
        } else {
          // Dates will be calculated from config - this is expected until migration is applied
          setWeekDates(null);
        }

        // Load previous week for position comparison (for trend indicator)
        if (weekNumber > 1) {
          try {
            const prevWeekData = await SupabaseService.getWeeklyEpisodes(weekNumber - 1);
            setPreviousWeekEpisodes(prevWeekData.episodes);
            console.log(`[WeekControl] Loaded ${prevWeekData.episodes.length} episodes from Week ${weekNumber - 1} for trend calculation`);
          } catch (err) {
            console.error('[WeekControl] Error loading previous week data:', err);
            setPreviousWeekEpisodes([]);
          }
        } else {
          setPreviousWeekEpisodes([]);
        }
      } catch (err) {
        console.error('[WeekControl] ❌ Error loading week data:', err);
        setError('Failed to load anime data. Please try again later.');
        setDisplayedEpisodes([]); // Clear on error
      } finally {
        console.log(`[WeekControl] 🏁 Finally block: setting loading to false`);
        setLoading(false);
        isTransitioning.current = false;
        // Reset userSwitched flag immediately after fetch completes
        console.log(`[WeekControl] 🔄 Resetting userSwitched flag`);
        userSwitchedTab.current = false;
      }
    };

    loadWeekEpisodes();
  }, [activeWeek]); // userSwitchedTab is read but NOT a dependency to avoid double-triggering

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
        
        if (isIntersecting && canLoadMore) {
          loadMoreEpisodes();
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // Start loading earlier for seamless experience
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      observer.disconnect();
    };
  }, [displayedCount, displayedEpisodes.length, loadMoreEpisodes]);

  // Auto-load more if content doesn't fill the viewport (fallback for when observer doesn't trigger)
  useEffect(() => {
    if (loading || displayedCount >= displayedEpisodes.length) return;
    
    // Check if we need to auto-load more after a short delay
    const checkViewportId = setTimeout(() => {
      const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      
      if (!hasScrollbar && displayedCount < episodes.length) {
        loadMoreEpisodes();
      }
    }, 300); // Reduced delay for instant feel
    
    return () => clearTimeout(checkViewportId);
  }, [loading, displayedEpisodes.length, displayedCount, loadMoreEpisodes]);

  // No loading screen - render directly
  if (loading || !activeWeek) {
    console.log(`[WeekControl] 🚫 Render blocked: loading=${loading}, activeWeek=${activeWeek}`);
    return null;
  }

  if (error) {
    console.log(`[WeekControl] ⚠️  Rendering error state`);
    return (
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Weekly Anime Episodes
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

  console.log(`[WeekControl] 🎨 Rendering main content:`, {
    activeWeek,
    animationKey,
    displayedEpisodesCount: displayedEpisodes.length,
    animationKeyMatchesActiveWeek: animationKey === activeWeek
  });

  return (
    <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
      <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
        Weekly Anime Episodes
      </h1>
      <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
        {weekDates && currentWeek 
          ? formatDynamicPeriod(weekDates.startDate, weekDates.endDate, isActiveWeekCurrent)
          : currentWeek 
          ? getFormattedPeriod(currentWeek, isActiveWeekCurrent) 
          : 'Loading period...'}
      </p>
      
      {/* Desktop: Week tabs with sliding indicator */}
      <div className="hidden md:flex justify-center mb-4 sticky top-[82px] z-40 -mx-[40px] px-[40px]">
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
      <div className="md:hidden flex justify-center mb-4 sticky top-[72px] z-40">
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
            const hasNext = currentIndex < visibleWeeks.length - 1 && !isActiveWeekCurrent;
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

      {displayedEpisodes.length === 0 && !loading ? (
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
              onAnimationStart={() => console.log(`[WeekControl] 🎬 Animation START for key: ${animationKey}`)}
              onAnimationComplete={() => console.log(`[WeekControl] ✨ Animation COMPLETE for key: ${animationKey}`)}
            >
              {displayedEpisodes.slice(0, displayedCount).map((episode, index) => {
                const rank = index + 1;
                
                // Calculate position change using previous week data
                const positionChange = calculatePositionChange(episode, rank, previousWeekEpisodes);
                
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
