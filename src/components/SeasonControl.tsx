import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnticipatedAnimeCard from './AnticipatedAnimeCard';
import { SEASONS_DATA } from '../config/seasons';
import { SupabaseService } from '../services/supabase';
import { AnticipatedAnime, JikanAnimeData } from '../types/anime';

const SeasonControl = () => {
  console.log("[SeasonControl] Component rendering/re-rendering");
  
  const [activeSeason, setActiveSeason] = useState<string>('winter2026');
  const [animes, setAnimes] = useState<AnticipatedAnime[]>([]);
  const [displayedAnimes, setDisplayedAnimes] = useState<AnticipatedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSwitched, setUserSwitched] = useState(false);
  
  // CRITICAL: Animation key that only changes when NEW data is ready
  const [animationKey, setAnimationKey] = useState(activeSeason);
  
  const currentSeason = SEASONS_DATA.find(season => season.id === activeSeason);

  // Parse season ID to get season name and year
  const parseSeasonId = (seasonId: string): { season: string; year: number; isLater?: boolean } => {
    if (seasonId === 'later') {
      return { season: 'summer', year: 2026, isLater: true };
    }
    // Extract season and year from ID like "winter2026"
    const match = seasonId.match(/([a-z]+)(\d+)/);
    if (match) {
      return { season: match[1], year: parseInt(match[2]) };
    }
    return { season: 'winter', year: 2026 };
  };

  // Smooth transition function for season changes
  const handleSeasonChange = (newSeason: string) => {
    if (newSeason === activeSeason) return;
    console.log(`[SeasonControl] 🔄 handleSeasonChange: ${activeSeason} → ${newSeason}`);
    setUserSwitched(true);
    setActiveSeason(newSeason); // Change immediately
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on tab change
  };
  
  // Load animes when activeSeason changes
  useEffect(() => {
    console.log(`[SeasonControl useEffect] ⚡ Triggered for activeSeason: ${activeSeason}, userSwitched: ${userSwitched}`);
    console.log(`[SeasonControl useEffect] 📊 Current state:`, {
      activeSeason,
      userSwitched,
      animationKey,
      currentAnimesCount: animes.length,
      displayedAnimesCount: displayedAnimes.length
    });
    
    const loadSeasonAnimes = async () => {
      console.log(`[SeasonControl] 🔍 Starting to load season data for ${activeSeason}`);
      
      // Only show full loading skeleton on initial load, not on season changes
      if (!userSwitched) {
        console.log(`[SeasonControl] 🔃 Setting loading to true (initial load)`);
        setLoading(true);
      } else {
        console.log(`[SeasonControl] 🏃 User switched - skipping loading state`);
      }
      setError(null);
      
      try {
        const { season, year, isLater } = parseSeasonId(activeSeason);
        
        // Use Supabase service - ANTICIPATED ANIMES table
        if (isLater) {
          // For "Later" tab, get all upcoming animes from Summer 2026 onwards
          // This function already returns AnticipatedAnime[] format - no need to transform!
          const laterAnimes = await SupabaseService.getAnticipatedAnimesLater();
          
          console.log(`[SeasonControl] ✅ Fetched ${laterAnimes.length} animes for later (already in AnticipatedAnime format)`);
          
          // Set displayedAnimes directly - no transformation needed!
          setDisplayedAnimes(laterAnimes);
          setAnimationKey('later');
          console.log(`[SeasonControl] 🎬 CRITICAL: Updating displayedAnimes (${laterAnimes.length}) and animationKey (later)`);
          return; // CRITICAL: Early return to avoid double transformation
        }
        
        // For regular seasons (winter/spring)
        let jikanAnimesList: JikanAnimeData[];
        
        if (activeSeason === 'later') {
          // This should never execute now due to early return above
          jikanAnimesList = await SupabaseService.getAnticipatedAnimesLater();
        } else {
          // For regular seasons, use getAnticipatedAnimesBySeason (ordered by Plan to Watch count)
          const anticipatedList = await SupabaseService.getAnticipatedAnimesBySeason(season, year);
          
          // Transform AnticipatedAnime to JikanAnimeData format for compatibility
          jikanAnimesList = anticipatedList.map(anime => ({
            mal_id: anime.id,
            title: anime.title,
            title_english: anime.title,
            title_japanese: null,
            images: {
              jpg: {
                image_url: anime.imageUrl,
                small_image_url: anime.imageUrl,
                large_image_url: anime.imageUrl,
              },
              webp: {
                image_url: anime.imageUrl,
                small_image_url: anime.imageUrl,
                large_image_url: anime.imageUrl,
              },
            },
            score: anime.animeScore,
            scored_by: null,
            members: anime.members,
            favorites: null,
            popularity: null,
            rank: null,
            type: anime.animeType,
            status: 'Not yet aired',
            episodes: null,
            aired: { from: '', to: null },
            season: anime.season,
            year: anime.year,
            synopsis: anime.synopsis,
            demographics: anime.demographics,
            genres: anime.genres,
            themes: anime.themes,
            studios: anime.studios,
          }));
        }
        
        // Transform to AnticipatedAnime format for display
        const transformedAnimes: AnticipatedAnime[] = jikanAnimesList.map(anime => ({
          id: anime.mal_id,
          title: anime.title_english || anime.title,
          imageUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
          animeScore: anime.score,
          members: anime.members || 0,
          synopsis: anime.synopsis || '',
          animeType: anime.type || 'TV',
          season: anime.season || season,
          year: anime.year || year,
          demographics: Array.isArray(anime.demographics) ? anime.demographics.map(d => typeof d === 'string' ? d : d.name) : [],
          genres: Array.isArray(anime.genres) ? anime.genres.map(g => typeof g === 'string' ? g : g.name) : [],
          themes: Array.isArray(anime.themes) ? anime.themes.map(t => typeof t === 'string' ? t : t.name) : [],
          studios: Array.isArray(anime.studios) ? anime.studios.map(s => typeof s === 'string' ? s : s.name) : [],
          url: `/anime/${anime.mal_id}`,
        }));
        
        console.log(`[SeasonControl] ✅ Fetched ${transformedAnimes.length} animes for ${activeSeason}`);
        setAnimes(transformedAnimes);
        
        // CRITICAL FIX: Update displayed animes AND animation key together
        // This ensures AnimatePresence only triggers when NEW data is ready
        console.log(`[SeasonControl] 🎬 CRITICAL: Updating displayedAnimes (${transformedAnimes.length}) and animationKey (${activeSeason})`);
        console.log(`[SeasonControl] 🎬 Previous animationKey: ${animationKey} → New: ${activeSeason}`);
        setDisplayedAnimes(transformedAnimes);
        setAnimationKey(activeSeason); // Only NOW change the animation key
        console.log(`[SeasonControl] 🎬 displayedAnimes and animationKey updated!`);
      } catch (err) {
        console.error('[SeasonControl] ❌ Error loading season data:', err);
        setError('Failed to load anime data. Please try again later.');
        setDisplayedAnimes([]); // Clear on error
      } finally {
        console.log(`[SeasonControl] 🏁 Finally block: setting loading to false`);
        setLoading(false);
        // Reset userSwitched flag immediately after fetch completes
        console.log(`[SeasonControl] 🔄 Resetting userSwitched flag`);
        setUserSwitched(false);
      }
    };

    loadSeasonAnimes();
  }, [activeSeason]); // userSwitched is read but NOT a dependency to avoid double-triggering

  // No loading screen - render directly
  if (loading) {
    console.log(`[SeasonControl] 🚫 Render blocked: loading is true`);
    return null;
  }

  if (error) {
    console.log(`[SeasonControl] ⚠️  Rendering error state`);
    return (
      <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
        <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Most Anticipated Animes
        </h1>
        <div className="text-center py-16">
          <p className="text-xl mb-4" style={{color: 'var(--foreground)', opacity: 0.7}}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="theme-rank px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log(`[SeasonControl] 🎨 Rendering main content:`, {
    activeSeason,
    animationKey,
    displayedAnimesCount: displayedAnimes.length,
    animationKeyMatchesActiveSeason: animationKey === activeSeason
  });

  return (
    <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
      <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
        Most Anticipated Animes
      </h1>
      <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
        {currentSeason ? currentSeason.period : 'Loading period...'}
      </p>
      
      {/* Desktop: Season tabs with sliding indicator */}
      <div className="hidden md:flex justify-center mb-4 sticky top-[82px] z-40 -mx-[40px] px-[40px] py-2">
        <div className="flex space-x-2 theme-controller rounded-lg p-1 relative">
          {SEASONS_DATA.map((season) => (
            <button
              key={season.id}
              onClick={() => {
                handleSeasonChange(season.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
      <div className="md:hidden flex justify-center mb-4 sticky top-[72px] z-40">
        <div className="theme-controller rounded-lg p-1 relative flex items-center justify-between gap-2 w-full max-w-md mx-[8px]">
          {/* Previous Season Button */}
          {(() => {
            const currentIndex = SEASONS_DATA.findIndex(s => s.id === activeSeason);
            const hasPrev = currentIndex > 0;
            const prevSeason = hasPrev ? SEASONS_DATA[currentIndex - 1] : null;
            
            return (
              <button
                onClick={() => {
                  if (prevSeason) {
                    handleSeasonChange(prevSeason.id);
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

          {/* Current Season Label - Centered (No dropdown on mobile) */}
          <div className="flex-1 flex items-center justify-center px-2">
            <span 
              className="px-3 py-2 rounded-md text-sm whitespace-nowrap"
              style={{
                backgroundColor: 'var(--rank-background)',
                color: 'var(--rank-text)'
              }}
            >
              {SEASONS_DATA.find(s => s.id === activeSeason)?.label || 'Loading...'}
            </span>
          </div>

          {/* Next Season Button */}
          {(() => {
            const currentIndex = SEASONS_DATA.findIndex(s => s.id === activeSeason);
            const hasNext = currentIndex < SEASONS_DATA.length - 1;
            const nextSeason = hasNext ? SEASONS_DATA[currentIndex + 1] : null;
            
            return (
              <button
                onClick={() => {
                  if (nextSeason) {
                    handleSeasonChange(nextSeason.id);
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

      {displayedAnimes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl" style={{color: 'var(--foreground)', opacity: 0.5}}>
            No anime data available for this season yet.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={animationKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            onAnimationStart={() => console.log(`[SeasonControl] 🎬 Animation START for key: ${animationKey}`)}
            onAnimationComplete={() => console.log(`[SeasonControl] ✨ Animation COMPLETE for key: ${animationKey}`)}
          >
            {displayedAnimes
              .filter(anime => {
                // DEBUG: Log first 3 animes to see what we're getting
                if (displayedAnimes.indexOf(anime) < 3) {
                  console.log(`[SeasonControl] 🎯 DEBUG - Anime #${displayedAnimes.indexOf(anime)}:`, {
                    id: anime.id,
                    title: anime.title,
                    imageUrl: anime.imageUrl,
                    imageUrlType: typeof anime.imageUrl,
                    imageUrlLength: anime.imageUrl?.length,
                  });
                }
                
                // CRITICAL: Filter out animes with invalid data
                if (!anime.imageUrl || anime.imageUrl.trim() === '') {
                  console.warn(`⚠️  Skipping anime with empty imageUrl:`, anime.title);
                  return false;
                }
                return true;
              })
              .map((anime, index) => (
              <motion.div
                key={`${animationKey}-${anime.id}-${index}`}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                className="h-full"
              >
                <AnticipatedAnimeCard 
                  rank={index + 1}
                  title={anime.title}
                  imageUrl={anime.imageUrl}
                  score={anime.animeScore}
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
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default SeasonControl;