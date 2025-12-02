import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BaseAnimeCard from '../components/BaseAnimeCard';
import { SupabaseService } from '../services/supabase';
import { JikanAnimeData } from '../types/anime';

export default function TopSeasonAnimesPage() {
  const [animes, setAnimes] = useState<JikanAnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12);
  const [animationKey, setAnimationKey] = useState('initial');
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load season animes on mount
  useEffect(() => {
    const loadSeasonAnimes = async () => {
      try {
        setLoading(true);

        // Fall 2025 - Order by SCORE (rating-based ranking)
        const seasonAnimes = await SupabaseService.getSeasonRankings('fall', 2025, 'score');
        
        if (seasonAnimes.length === 0) {
          setError('Season rankings are being synced. Please wait a few minutes and refresh.');
          setLoading(false);
          return;
        }

        console.log(`[TopSeasonAnimesPage] ✅ Loaded ${seasonAnimes.length} Fall 2025 animes`);
        
        setAnimes(seasonAnimes);
        
        // Update animation key after data is loaded
        console.log('[TopSeasonAnimesPage] 🎬 CRITICAL: Data loaded, updating animationKey');
        setAnimationKey('loaded');
        
      } catch (err) {
        console.error('[TopSeasonAnimesPage] ❌ Error loading season animes:', err);
        setError(`Failed to load season rankings: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        console.log('[TopSeasonAnimesPage] 🏁 Finally block: setting loading to false');
        setLoading(false);
      }
    };

    loadSeasonAnimes();
  }, []);

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
    console.log('[TopSeasonAnimesPage] 🚫 Render blocked: loading is true');
    return null;
  }
  
  console.log('[TopSeasonAnimesPage] 🎨 Rendering main content:', {
    animationKey,
    animesCount: animes.length,
    displayedCount
  });

  // Error state
  if (error) {
    return (
      <div className="dynamic-background min-h-screen">
        <div className="container mx-auto px-[24px] pt-[32px] pb-[32px]">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-4">
            <h1 className="text-2xl mb-4 text-red-400">No Data Available</h1>
            <p className="text-sm mb-4" style={{ color: 'var(--foreground)' }}>{error}</p>
            <p className="text-sm mb-4 text-center max-w-md" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              The Fall 2025 season rankings are being synced automatically. Please wait a few minutes and refresh the page.
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
          Top Animes - Fall 2025
        </h1>
        <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
          Highest rated animes of Fall 2025 season
        </p>

        {/* Animes Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={animationKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
            onAnimationStart={() => console.log('[TopSeasonAnimesPage] 🎬 Animation START')}
            onAnimationComplete={() => console.log('[TopSeasonAnimesPage] ✨ Animation COMPLETE')}
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
                  subtitle={`${anime.type || 'TV'} • Fall 2025`}
                  imageUrl={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || ''}
                  linkUrl={`/anime/${anime.mal_id}`}
                  bottomText={`⭐ ${(anime.score || 0).toFixed(2)}`}
                  animeType={anime.type}
                  demographics={anime.demographics?.map(d => typeof d === 'string' ? d : d.name) || []}
                  genres={anime.genres?.map(g => typeof g === 'string' ? g : g.name) || []}
                  themes={anime.themes?.map(t => typeof t === 'string' ? t : t.name) || []}
                  season="fall"
                  year={2025}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Loading More - no skeleton, just seamless addition */}

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