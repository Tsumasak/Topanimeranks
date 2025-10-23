import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimeCard } from './AnimeCard';
import { AnimeCardSkeleton } from './AnimeCardSkeleton';
import { WEEKS_DATA, CURRENT_WEEK_NUMBER, WeekData as WeekConfig } from '../config/weeks';
import { JikanService } from '../services/jikan';
import { Episode } from '../types/anime';

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
  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const endDay = end.getDate().toString().padStart(2, '0');
  const year = end.getFullYear();
  
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
  // Track if user has manually switched tabs
  const userSwitchedTab = useRef(false);
  const [activeWeek, setActiveWeek] = useState<string>(`week${CURRENT_WEEK_NUMBER}`);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [previousWeekEpisodes, setPreviousWeekEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [weekDates, setWeekDates] = useState<{ startDate: string; endDate: string } | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12); // Infinite scroll: start with 12 episodes
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Ref for intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const currentWeek = WEEKS_DATA.find(week => week.id === activeWeek);

  // Smooth transition function for week changes
  const handleWeekChange = (newWeek: string) => {
    if (newWeek === activeWeek) return;
    userSwitchedTab.current = true;
    setIsTransitioning(true);
    setDisplayedCount(12); // Reset to 12 episodes when changing weeks
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
    const loadWeekEpisodes = async () => {
      // Only show full loading skeleton on initial load, not on tab changes
      if (!userSwitchedTab.current) {
        setLoading(true);
      }
      setError(null);
      
      try {
        // Get week number from activeWeek id (e.g., "week1" -> 1)
        const weekNumber = parseInt(activeWeek.replace('week', ''));
        
        console.log(`\n========== LOADING WEEK ${weekNumber} ==========`);
        
        // Load current week episodes
        const weekData = await JikanService.getWeekData(weekNumber);
        setEpisodes(weekData.episodes);
        
        console.log(`[WeekControl] Week ${weekNumber} loaded: ${weekData.episodes.length} episodes`);
        console.log(`[WeekControl] Top 5 episodes:`, weekData.episodes.slice(0, 5).map(ep => 
          `#${weekData.episodes.indexOf(ep) + 1} ${ep.animeTitle} EP${ep.episodeNumber} (ID: ${ep.id}, AnimeID: ${ep.animeId})`
        ));
        
        // Store the week dates from API
        setWeekDates({
          startDate: weekData.startDate,
          endDate: weekData.endDate,
        });

        // Load previous week data for comparison
        if (weekNumber > 1) {
          console.log(`[WeekControl] Loading previous week ${weekNumber - 1} for comparison...`);
          const previousWeekData = await JikanService.getWeekData(weekNumber - 1);
          setPreviousWeekEpisodes(previousWeekData.episodes);
          
          console.log(`[WeekControl] Previous week ${weekNumber - 1} loaded: ${previousWeekData.episodes.length} episodes`);
          console.log(`[WeekControl] Previous week top 5:`, previousWeekData.episodes.slice(0, 5).map(ep => 
            `#${previousWeekData.episodes.indexOf(ep) + 1} ${ep.animeTitle} EP${ep.episodeNumber} (ID: ${ep.id}, AnimeID: ${ep.animeId})`
          ));
        } else {
          setPreviousWeekEpisodes([]);
          console.log(`[WeekControl] Week 1 - no previous week data`);
        }
        
        console.log(`========================================\n`);
      } catch (err) {
        console.error('Error loading week data:', err);
        setError('Failed to load anime data. Please try again later.');
      } finally {
        setLoading(false);
        setDisplayedCount(12); // Reset to 12 on new load
        setTimeout(() => {
          setIsTransitioning(false);
          userSwitchedTab.current = false; // Reset the flag
        }, 150);
      }
    };

    loadWeekEpisodes();
  }, [activeWeek]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && displayedCount < episodes.length) {
          console.log('[InfiniteScroll] Intersection detected, loading more...');
          loadMoreEpisodes();
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // Start loading 200px before reaching the target
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
  }, [displayedCount, episodes.length, isLoadingMore, loadMoreEpisodes]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-8 pb-8 min-h-screen">
        <h1 className="text-4xl text-center mb-2" style={{color: 'var(--foreground)'}}>
          Top Anime Ranks
        </h1>
        <p className="text-center mb-8 text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
          {weekDates && currentWeek 
            ? formatDynamicPeriod(weekDates.startDate, weekDates.endDate, currentWeek.isCurrentWeek)
            : currentWeek 
            ? getFormattedPeriod(currentWeek, currentWeek.isCurrentWeek) 
            : 'Loading period...'}
        </p>
        
        {/* Week tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 theme-card rounded-lg p-1">
            {WEEKS_DATA.map(week => (
              <button
                key={week.id}
                onClick={() => handleWeekChange(week.id)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  activeWeek === week.id 
                    ? 'theme-rank' 
                    : 'theme-nav-link'
                }`}
              >
                {week.label}
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
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 pt-8 pb-8 min-h-screen">
        <h1 className="text-4xl text-center mb-2" style={{color: 'var(--foreground)'}}>
          Top Anime Ranks
        </h1>
        <div className="text-center py-16">
          <p className="text-xl mb-4" style={{color: 'var(--foreground)', opacity: 0.7}}>
            {error}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              const weekNumber = parseInt(activeWeek.replace('week', ''));
              JikanService.getWeekData(weekNumber).then(weekData => {
                setEpisodes(weekData.episodes);
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
        Top Anime Ranks
      </h1>
      <p className="text-center mb-8 text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
        {weekDates && currentWeek 
          ? formatDynamicPeriod(weekDates.startDate, weekDates.endDate, currentWeek.isCurrentWeek)
          : currentWeek 
          ? getFormattedPeriod(currentWeek, currentWeek.isCurrentWeek) 
          : 'Loading period...'}
      </p>
      
      {/* Week tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 theme-card rounded-lg p-1">
          {WEEKS_DATA.map(week => (
            <button
              key={week.id}
              onClick={() => handleWeekChange(week.id)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                activeWeek === week.id 
                  ? 'theme-rank' 
                  : 'theme-nav-link'
              }`}
            >
              {week.label}
            </button>
          ))}
        </div>
      </div>

      {episodes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl" style={{color: 'var(--foreground)', opacity: 0.5}}>
            No episode data available for this week yet.
          </p>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {episodes.slice(0, displayedCount).map((episode, index) => {
              const rank = index + 1;
              const positionChange = calculatePositionChange(episode, rank, previousWeekEpisodes);
              return (
                <AnimeCard 
                  key={`${activeWeek}-${episode.animeId}-${episode.id}`} 
                  rank={rank}
                  title={episode.animeTitle}
                  subtitle={`EP ${episode.episodeNumber} - ${episode.episodeTitle}`}
                  imageUrl={episode.imageUrl}
                  linkUrl={episode.url}
                  bottomText={episode.score > 0 ? `★ ${episode.score.toFixed(2)}` : '★ N/A'}
                  animeType={episode.animeType}
                  demographics={episode.demographics}
                  genres={episode.genres}
                  themes={episode.themes}
                  positionChange={positionChange}
                />
              );
            })}
          </div>
          
          {/* Infinite Scroll Observer Target */}
          {displayedCount < episodes.length && (
            <div ref={observerTarget} className="flex justify-center mt-8 py-8">
              {isLoadingMore && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-t-transparent rounded-full animate-spin" 
                       style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
                  <p className="text-sm" style={{color: 'var(--foreground)', opacity: 0.7}}>
                    Loading more episodes...
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeekControl;
