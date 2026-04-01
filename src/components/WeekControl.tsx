import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimeCard } from './AnimeCard';
import { WEEKS_DATA, CURRENT_WEEK_NUMBER, WeekData as WeekConfig, generateWeeksDataForSeason } from '../config/weeks';
import { SupabaseService } from '../services/supabase';
import { Episode } from '../types/anime';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getCurrentSeason, getPreviousSeason, getSeasonDates } from '../utils/seasons';

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
  
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const [dynamicWeeks, setDynamicWeeks] = useState<WeekConfig[]>(WEEKS_DATA);
  
  const currentSeasonInfo = getCurrentSeason();
  const prevSeasonInfo = getPreviousSeason(currentSeasonInfo.name, currentSeasonInfo.year);
  
  const [targetSeason, setTargetSeason] = useState(currentSeasonInfo.name.toLowerCase());
  const [targetYear, setTargetYear] = useState(currentSeasonInfo.year);
  
  // Ref for intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Filter weeks to show
  const visibleWeeks = dynamicWeeks.filter(week => {
    const weekNum = parseInt(week.id.replace('week', ''));
    
    // If we have specific available weeks data, use it
    if (availableWeeks.includes(week.id)) return true;
    
    // Fallback logic for visibility:
    // 1. If it's a past season (different from real-time current), show all 13 weeks
    if (targetSeason !== currentSeasonInfo.name.toLowerCase() || targetYear !== currentSeasonInfo.year) {
      return weekNum <= 13;
    }
    
    // 2. If it's the current season, show up to the latest detected week (at least week 1)
    return weekNum <= Math.max(1, latestWeekNumber);
  });

  const currentWeek = dynamicWeeks.find(week => week.id === activeWeek);
  
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
    
    // Update URL query param to persist state
    setSearchParams({ week: newWeek });
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on tab change
  };

  // Load more episodes automatically (infinite scroll) - instant, no loading
  const loadMoreEpisodes = useCallback(() => {
    if (displayedCount >= displayedEpisodes.length) return;
    
    console.log('[WeekControl] 📦 Loading more episodes...');
    setDisplayedCount(prev => Math.min(prev + 12, displayedEpisodes.length));
  }, [displayedCount, displayedEpisodes.length]);
  
  // Load available weeks on mount (check which weeks have 5+ episodes WITH SCORE)
  useEffect(() => {
    const loadAvailableWeeks = async () => {
      console.log('[WeekControl] 🔍 Starting to load available weeks (5+ scored episodes filter)...');
      
      try {
        // Call server endpoint to get weeks summary (already filtered to 5+ episodes WITH SCORE)
        console.log('[WeekControl] 📡 Calling /available-weeks endpoint...');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        console.log('[WeekControl] 📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[WeekControl] ❌ HTTP error:', response.status, errorText);
          
          // ✅ Fallback: Use Week 1 if server is down or returns error
          console.log('[WeekControl] 🔄 Falling back to Week 1 due to server error');
          setAvailableWeeks(['week1']);
          setLatestWeekNumber(1);
          setActiveWeek('week1');
          return;
        }

        const contentType = response.headers.get('content-type');
        console.log('[WeekControl] 📡 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('[WeekControl] ❌ Response is not JSON. Content-Type:', contentType);
          console.error('[WeekControl] ❌ Response body (first 500 chars):', text.substring(0, 500));
          
          // ✅ Fallback: Use Week 1 if response is HTML
          console.log('[WeekControl] 🔄 Falling back to Week 1 due to non-JSON response');
          setAvailableWeeks(['week1']);
          setLatestWeekNumber(1);
          setActiveWeek('week1');
          return;
        }

        const result = await response.json();
        console.log('[WeekControl] 📦 Server response:', result);
        
        if (result.success && result.weeks && result.weeks.length > 0 && result.latestWeek) {
          // Server filters to weeks with 5+ episodes WITH SCORE
          const weeksWithData = result.weeks.map((w: number) => `week${w}`);
          const detectedLatestWeek = result.latestWeek;
          
          console.log(`[WeekControl] ✅ Received ${weeksWithData.length} weeks with 5+ scored episodes:`, weeksWithData);
          console.log(`[WeekControl] 🎯 Latest week detected: Week ${detectedLatestWeek}`);
          
          let finalWeekNumber = detectedLatestWeek;
          let finalSeason = currentSeasonInfo.name.toLowerCase();
          let finalYear = currentSeasonInfo.year;

          const latestCount = result.weekCounts?.[detectedLatestWeek] || 0;
          if (latestCount < 3) {
            if (detectedLatestWeek > 1) {
              finalWeekNumber = detectedLatestWeek - 1;
              console.log(`[WeekControl] ⚠️ Week ${detectedLatestWeek} has only ${latestCount} episodes. Falling back to Week ${finalWeekNumber}`);
            } else {
              // Fallback to previous season
              finalSeason = prevSeasonInfo.season.toLowerCase();
              finalYear = prevSeasonInfo.year;
              finalWeekNumber = 13;
              console.log(`[WeekControl] ⚠️ Season start detected but Week 1 has only ${latestCount} episodes. Falling back to ${finalSeason} ${finalYear} Week 13`);
            }
          }

          setTargetSeason(finalSeason);
          setTargetYear(finalYear);
          setLatestWeekNumber(finalWeekNumber);

          // Update dynamic weeks if we switched season
          if (finalSeason !== currentSeasonInfo.name.toLowerCase() || finalYear !== currentSeasonInfo.year) {
            // Find the correct season info (including startDate)
            const seasonName = (finalSeason.charAt(0).toUpperCase() + finalSeason.slice(1)) as any;
            const { startDate } = getSeasonDates(seasonName, finalYear);
            
            const newWeeks = generateWeeksDataForSeason(finalYear, startDate.toISOString());
            setDynamicWeeks(newWeeks);
          } else {
            setDynamicWeeks(WEEKS_DATA);
          }
          
          const finalWeekId = `week${finalWeekNumber}`;
          
          // Check URL param for week, otherwise default to latest week
          const weekParam = searchParams.get('week');
          const weekToLoad = weekParam || finalWeekId;
          
          console.log(`[WeekControl] 📌 Setting activeWeek to: ${weekToLoad}`);
          setActiveWeek(weekToLoad);
          console.log(`[WeekControl] 📌 activeWeek set! (from URL: ${weekParam || 'not set'})`);
        } else if (result.success && result.weeks && result.weeks.length === 0) {
          // No weeks with 5+ episodes yet - use fallback
          console.log(`[WeekControl] ⚠️ Server returned 0 weeks with 5+ scored episodes`);
          console.log(`[WeekControl] 🔄 Using fallback: Week 1 only`);
          setAvailableWeeks(['week1']);
          setLatestWeekNumber(1);
          setActiveWeek('week1');
        } else {
          // Invalid response format - use fallback
          console.warn(`[WeekControl] ⚠️ Unexpected server response format:`, result);
          console.log(`[WeekControl] 🔄 Using fallback: Week 1 only`);
          setAvailableWeeks(['week1']);
          setLatestWeekNumber(1);
          setActiveWeek('week1');
        }
      } catch (error) {
        console.error('[WeekControl] ❌ Error loading available weeks:', error);
        console.error('[WeekControl] ❌ Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // ALWAYS use fallback - show Week 1
        console.log(`[WeekControl] 🔄 Using error fallback: Week 1`);
        setAvailableWeeks(['week1']);
        setLatestWeekNumber(1);
        setActiveWeek('week1');
      }
    };
    
    loadAvailableWeeks();
  }, [searchParams]);
  
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
        const weekData = await SupabaseService.getWeeklyEpisodes(
          weekNumber,
          targetSeason,
          targetYear
        );
        
        // Episodes are already in the correct format from SupabaseService
        console.log(`[WeekControl] ✅ Fetched ${weekData.episodes.length} episodes for Week ${weekNumber}`);
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
        let prevWeekNum = weekNumber - 1;
        let prevSeason = targetSeason;
        let prevYear = targetYear;

        if (weekNumber === 1) {
          const prevSeasonInfoObj = getPreviousSeason(
            (targetSeason.charAt(0).toUpperCase() + targetSeason.slice(1)) as any,
            targetYear
          );
          prevSeason = prevSeasonInfoObj.season.toLowerCase();
          prevYear = prevSeasonInfoObj.year;
          prevWeekNum = 13; // Assume 13 matches your config
        }

        try {
          const prevWeekData = await SupabaseService.getWeeklyEpisodes(prevWeekNum, prevSeason, prevYear);
          setPreviousWeekEpisodes(prevWeekData.episodes);
          console.log(`[WeekControl] Loaded ${prevWeekData.episodes.length} episodes from ${prevSeason} ${prevYear} Week ${prevWeekNum} for trend calculation`);
        } catch (err) {
          console.error('[WeekControl] Error loading previous week data:', err);
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
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          loadMoreEpisodes();
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
  }, [loadMoreEpisodes, loading]);
  
  // Auto-load more if content doesn't fill the viewport (fallback for when observer doesn't trigger)
  useEffect(() => {
    if (loading || displayedCount >= displayedEpisodes.length) return;
    
    // Check if we need to auto-load more after a short delay
    const checkViewportId = setTimeout(() => {
      const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      
      if (!hasScrollbar && displayedCount < displayedEpisodes.length) {
        console.log('[WeekControl] 🔄 Auto-loading more episodes (no scrollbar detected)');
        loadMoreEpisodes();
      }
    }, 300); // Reduced delay for instant feel
    
    return () => clearTimeout(checkViewportId);
  }, [loading, displayedEpisodes.length, displayedCount, loadMoreEpisodes, episodes.length]);

  // Scroll to anime card if hash is present in URL
  useEffect(() => {
    if (loading || displayedEpisodes.length === 0) return;
    
    const hash = window.location.hash;
    if (hash) {
      // Extract anime ID from hash (e.g., #anime-123 -> 123)
      const animeId = hash.replace('#anime-', '');
      
      // Find the index of the anime in displayedEpisodes
      const animeIndex = displayedEpisodes.findIndex(ep => ep.animeId.toString() === animeId);
      
      if (animeIndex !== -1) {
        // If anime is beyond currently displayed count, load all episodes
        if (animeIndex >= displayedCount) {
          console.log(`[WeekControl] 📦 Loading all episodes to show anime at index ${animeIndex}`);
          setDisplayedCount(displayedEpisodes.length);
        }
        
        // Wait for the DOM to render the cards
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            console.log(`[WeekControl] 📍 Scrolled to ${hash}`);
            
            // Add highlight effect
            element.classList.add('anime-card-highlight');
            setTimeout(() => {
              element.classList.remove('anime-card-highlight');
            }, 2500);
          } else {
            console.log(`[WeekControl] ⚠️ Element not found: ${hash}`);
          }
        }, 500); // Delay to ensure cards are rendered
      } else {
        console.log(`[WeekControl] ⚠️ Anime ID ${animeId} not found in this week`);
      }
    }
  }, [loading, displayedEpisodes, displayedCount, animationKey]);

  // No loading screen - render directly
  if (!activeWeek) {
    console.log(`[WeekControl] ⏳ Still waiting for activeWeek... (loading=${loading})`);
    // Show a minimal loading state
    return (
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Weekly Anime Episodes
        </h1>
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{color: 'var(--rating-yellow)'}} role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4 text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
            Loading weeks data...
          </p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    console.log(`[WeekControl] 🔄 Loading episodes for ${activeWeek}...`);
    // Show week controller but with loading state for episodes
    return (
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Weekly Anime Episodes
        </h1>
        <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
          {currentWeek ? getFormattedPeriod(currentWeek, isActiveWeekCurrent) : 'Loading period...'}
        </p>
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{color: 'var(--rating-yellow)'}} role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4 text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
            Loading episodes...
          </p>
        </div>
      </div>
    );
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
      <div className="hidden md:flex justify-center mb-4 sticky top-[82px] z-40 -mx-[40px] px-[40px] py-2">
        <div className="flex space-x-2 theme-controller rounded-lg p-1 relative">
          {visibleWeeks.map((week) => (
            <button
              key={week.id}
              onClick={() => {
                handleWeekChange(week.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
      <div className="md:hidden flex justify-center my-[16px] sticky top-[72px] z-40 mx-[0px] py-[16px] pt-[16px] pr-[0px] pb-[0px] pl-[0px]">
        <div className="theme-controller rounded-lg p-1 relative flex items-center justify-between gap-2 w-full max-w-md mx-[8px]">
          {/* Previous Week Button */}
          {(() => {
            const currentIndex = visibleWeeks.findIndex(w => w.id === activeWeek);
            const hasPrev = currentIndex > 0;
            const prevWeek = hasPrev ? visibleWeeks[currentIndex - 1] : null;
            
            return (
              <button
                onClick={() => {
                  if (prevWeek) {
                    handleWeekChange(prevWeek.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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

          {/* Current Week Label - Centered (No dropdown on mobile) */}
          <div className="flex-1 flex items-center justify-center px-2">
            <span 
              className="px-3 py-2 rounded-md text-sm whitespace-nowrap"
              style={{
                backgroundColor: 'var(--rank-background)',
                color: 'var(--rank-text)'
              }}
            >
              {visibleWeeks.find(w => w.id === activeWeek)?.label || 'Loading...'}
            </span>
          </div>

          {/* Next Week Button */}
          {(() => {
            const currentIndex = visibleWeeks.findIndex(w => w.id === activeWeek);
            const hasNext = currentIndex < visibleWeeks.length - 1 && !isActiveWeekCurrent;
            const nextWeek = hasNext ? visibleWeeks[currentIndex + 1] : null;
            
            return (
              <button
                onClick={() => {
                  if (nextWeek) {
                    handleWeekChange(nextWeek.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {displayedEpisodes.length === 0 && !loading ? (
        <div className="text-center py-16">
          <p className="text-xl" style={{color: 'var(--foreground)', opacity: 0.5}}>
            No episode data available for this week yet.
          </p>
        </div>
      ) : displayedEpisodes.length > 0 && (
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
                      linkUrl={`/anime/${episode.animeId}`}
                      bottomText={episode.episodeScore != null ? `★ ${episode.episodeScore.toFixed(2)}` : '★ N/A'}
                      animeType={episode.animeType}
                      demographics={episode.demographics}
                      genres={episode.genres}
                      themes={episode.themes}
                      positionChange={positionChange}
                      animeId={episode.animeId}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
          
          {/* Intersection Observer Target - MUST be outside AnimatePresence */}
          {displayedCount < displayedEpisodes.length && (
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                Loading more...
              </p>
            </div>
          )}

          {/* End Message */}
          {displayedCount >= displayedEpisodes.length && displayedEpisodes.length > 0 && (
            <div className="flex flex-col items-center py-8">
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                You've reached the end! ({displayedEpisodes.length} episodes total)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeekControl;