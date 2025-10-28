import { useState, useEffect, useCallback, useRef } from 'react';
import BaseAnimeCard from '../components/BaseAnimeCard';
import { AnimeCardSkeleton } from '../components/AnimeCardSkeleton';
import { Progress } from '../components/ui/progress';
import { SupabaseService } from '../services/supabase';
import { JikanAnimeData } from '../types/anime';

export default function TopSeasonAnimesPage() {
  const [animes, setAnimes] = useState<JikanAnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load season animes on mount
  useEffect(() => {
    const loadSeasonAnimes = async () => {
      try {
        setLoading(true);
        setLoadingProgress(10);
        setLoadingMessage('Connecting to Supabase...');

        // Fetch Fall 2025 from season_rankings table
        setLoadingProgress(30);
        setLoadingMessage('Loading Fall 2025 rankings...');
        
        // Fall 2025 - Order by SCORE (rating-based ranking)
        const seasonAnimes = await SupabaseService.getSeasonRankings('fall', 2025, 'score');
        
        if (seasonAnimes.length === 0) {
          setError('Season rankings are being synced. Please wait a few minutes and refresh.');
          setLoading(false);
          return;
        }

        console.log(`[TopSeasonAnimesPage] Loaded ${seasonAnimes.length} Fall 2025 animes`);
        
        setAnimes(seasonAnimes);
        setLoadingProgress(100);
        setLoadingMessage('Complete!');
        
      } catch (err) {
        console.error('[TopSeasonAnimesPage] Error loading season animes:', err);
        setError(`Failed to load season rankings: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadSeasonAnimes();
  }, []);

  // Infinite scroll
  const loadMoreAnimes = useCallback(() => {
    if (isLoadingMore || displayedCount >= animes.length) return;
    
    console.log('[InfiniteScroll] Loading more animes...');
    setIsLoadingMore(true);
    
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 12, animes.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, displayedCount, animes.length]);

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

  // Loading state
  if (loading) {
    return (
      <div className="dynamic-background min-h-screen">
        <div className="container mx-auto px-[24px] pt-[32px] pb-[32px]">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <h1 className="text-3xl mb-4" style={{ color: 'var(--foreground)' }}>
              Loading Top Season Animes
            </h1>
            <p className="text-sm mb-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              {loadingMessage || 'Fetching Fall 2025 rankings...'}
            </p>
            <div className="w-full max-w-md mb-4">
              <Progress 
                value={loadingProgress} 
                className="h-3"
                style={{
                  '--progress-background': 'var(--card-background)',
                  '--progress-foreground': 'var(--rating-yellow)',
                } as React.CSSProperties}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              {loadingProgress}% complete
            </p>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-4xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
          Top Animes - Fall 2025
        </h1>
        <p className="text-center mb-8 text-sm" style={{color: 'var(--rating-yellow)'}}>
          Highest rated animes of Fall 2025 season - sorted by MAL score and popularity
        </p>

        {/* Animes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {animes.slice(0, displayedCount).map((anime, index) => (
            <BaseAnimeCard
              key={`${anime.mal_id}-${index}`}
              rank={index + 1}
              title={anime.title_english || anime.title}
              subtitle={`${anime.type || 'TV'} • Fall 2025`}
              imageUrl={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || ''}
              linkUrl={anime.url || `https://myanimelist.net/anime/${anime.mal_id}`}
              bottomText={`⭐ ${(anime.score || 0).toFixed(2)}`}
              animeType={anime.type}
              demographics={anime.demographics?.map(d => d.name || d) || []}
              genres={anime.genres?.map(g => g.name || g) || []}
              themes={anime.themes?.map(t => t.name || t) || []}
            />
          ))}
        </div>

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <AnimeCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        )}

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
