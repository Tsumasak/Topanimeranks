import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import BaseAnimeCard from './BaseAnimeCard';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GenreRankingPageProps {
  genre: string;
}

interface AnimeData {
  anime_id: number;
  title: string;
  title_english: string | null;
  image_url: string;
  anime_score: number | null;
  members: number;
  type: string;
  season: string;
  year: number;
  demographics: Array<{ name: string }>;
  genres: Array<{ name: string }>;
  themes: Array<{ name: string }>;
}

// Cache for fetched data
const dataCache = new Map<string, { data: AnimeData[]; totalCount: number; hasMore: boolean }>();

export function GenreRankingPage({ genre }: GenreRankingPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [animes, setAnimes] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'popularity'>('score');
  const [animationKey, setAnimationKey] = useState<string>('');
  const [userSwitched, setUserSwitched] = useState(false);
  
  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20; // Load 20 animes at a time
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const allSeasons = [
    { value: 'all', label: 'All Seasons' },
    { value: 'winter', label: 'Winter' },
    { value: 'spring', label: 'Spring' },
    { value: 'summer', label: 'Summer' },
    { value: 'fall', label: 'Fall' },
  ];

  // Filter seasons based on available seasons for the selected year
  const seasons = allSeasons.filter(season => 
    season.value === 'all' || availableSeasons.includes(season.value)
  );

  // Generate cache key
  const getCacheKey = (genre: string, year: number, season: string, sortBy: string, offset: number) => {
    return `${genre}-${year}-${season}-${sortBy}-${offset}`;
  };

  // Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/genre-years?genre=${encodeURIComponent(genre)}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const availableYears = data.years || [];
          setYears(availableYears);
          
          // Check URL params or set default year
          const yearParam = searchParams.get('year');
          const seasonParam = searchParams.get('season');
          const sortParam = searchParams.get('sort');
          
          if (yearParam && availableYears.includes(parseInt(yearParam))) {
            setSelectedYear(parseInt(yearParam));
          } else if (availableYears.length > 0) {
            setSelectedYear(Math.max(...availableYears));
          }
          
          if (seasonParam) {
            setSelectedSeason(seasonParam);
          }
          
          if (sortParam === 'popularity') {
            setSortBy('popularity');
          }
        }
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };

    fetchYears();
  }, [genre]);

  // Fetch available seasons when year changes
  useEffect(() => {
    if (selectedYear === null) return;

    const fetchSeasons = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/genre-seasons?genre=${encodeURIComponent(genre)}&year=${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const seasons = data.seasons || [];
          setAvailableSeasons(seasons);
          
          // If current season is not available, reset to 'all'
          if (selectedSeason !== 'all' && !seasons.includes(selectedSeason)) {
            setSelectedSeason('all');
          }
          
          console.log(`[GenreRankingPage] ✅ Available seasons for ${genre} ${selectedYear}:`, seasons);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
        setAvailableSeasons([]);
      }
    };

    fetchSeasons();
  }, [genre, selectedYear, selectedSeason]);

  // Handle filter changes
  const handleYearChange = (year: number) => {
    if (year === selectedYear) return;
    setUserSwitched(true);
    setAnimes([]); // Clear immediately
    setLoading(true); // Show loading state
    setSelectedYear(year);
    setSearchParams({ 
      year: year.toString(), 
      season: selectedSeason,
      sort: sortBy 
    });
    setOffset(0);
    setHasMore(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeasonChange = (season: string) => {
    if (season === selectedSeason) return;
    setUserSwitched(true);
    setAnimes([]); // Clear immediately
    setLoading(true); // Show loading state
    setSelectedSeason(season);
    setSearchParams({ 
      year: selectedYear?.toString() || '', 
      season: season,
      sort: sortBy 
    });
    setOffset(0);
    setHasMore(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (sort: 'score' | 'popularity') => {
    if (sort === sortBy) return;
    setUserSwitched(true);
    setAnimes([]); // Clear immediately
    setLoading(true); // Show loading state
    setSortBy(sort);
    setSearchParams({ 
      year: selectedYear?.toString() || '', 
      season: selectedSeason,
      sort: sort 
    });
    setOffset(0);
    setHasMore(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch animes with pagination
  const fetchAnimes = useCallback(async (currentOffset: number, isLoadingMore: boolean = false) => {
    if (selectedYear === null) return;

    const fetchStartTime = Date.now();
    const cacheKey = getCacheKey(genre, selectedYear, selectedSeason, sortBy, currentOffset);
    
    console.log(`[GenreRankingPage] 🔍 Fetching ${genre} rankings for ${selectedYear}/${selectedSeason} (offset: ${currentOffset}, limit: ${LIMIT})...`);
    
    // Check cache first
    if (dataCache.has(cacheKey)) {
      const cached = dataCache.get(cacheKey)!;
      console.log(`[GenreRankingPage] ✅ Using cached data (${cached.data.length} animes)`);
      
      if (isLoadingMore) {
        setAnimes(prev => [...prev, ...cached.data]);
      } else {
        setAnimes(cached.data);
      }
      setHasMore(cached.hasMore);
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    
    if (!isLoadingMore && !userSwitched) {
      setLoading(true);
    } else if (isLoadingMore) {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const params = new URLSearchParams({
        genre: genre,
        year: selectedYear.toString(),
        sortBy: sortBy,
        offset: currentOffset.toString(),
        limit: LIMIT.toString(),
      });

      if (selectedSeason !== 'all') {
        params.append('season', selectedSeason);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/genre-rankings?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const fetchEndTime = Date.now();
      console.log(`[GenreRankingPage] ⏱️  Fetch took ${fetchEndTime - fetchStartTime}ms`);

      if (response.ok) {
        const data = await response.json();
        const fetchedAnimes = data.data || [];
        
        // Log performance metrics from backend
        if (data.performance) {
          console.log(`[GenreRankingPage] 📊 Backend Performance:`);
          console.log(`  - Query time: ${data.performance.queryTime}ms`);
          if (data.performance.filterTime !== undefined) {
            console.log(`  - Filter time: ${data.performance.filterTime}ms`);
            console.log(`  - Sort time: ${data.performance.sortTime}ms`);
          }
          console.log(`  - Total time: ${data.performance.totalTime}ms`);
          console.log(`  - Source: ${data.source}`);
          console.log(`  - Is Optimized: ${data.performance.isOptimized}`);
          if (data.performance.retrievedCount !== undefined) {
            console.log(`  - Retrieved: ${data.performance.retrievedCount} animes`);
            console.log(`  - Filtered: ${data.performance.filteredCount} animes`);
          }
        }
        
        const hasMoreData = data.hasMore || false;
        
        // Cache the result
        dataCache.set(cacheKey, {
          data: fetchedAnimes,
          totalCount: data.count || 0,
          hasMore: hasMoreData
        });
        
        if (isLoadingMore) {
          setAnimes(prev => [...prev, ...fetchedAnimes]);
        } else {
          setAnimes(fetchedAnimes);
          setAnimationKey(`${genre}-${selectedYear}-${selectedSeason}-${sortBy}`);
        }
        
        setHasMore(hasMoreData);
        console.log(`[GenreRankingPage] ✅ Total time (frontend + backend): ${Date.now() - fetchStartTime}ms`);
        console.log(`[GenreRankingPage] 📊 Total animes: ${data.count}, Loaded: ${fetchedAnimes.length}, Has more: ${hasMoreData}`);
      } else {
        console.error(`[GenreRankingPage] ❌ HTTP ${response.status}`);
        const text = await response.text();
        console.error(`[GenreRankingPage] ❌ Response body:`, text);
        setError(`Failed to load anime rankings (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('[GenreRankingPage] ❌ Error fetching animes:', error);
      setError('Failed to load anime rankings');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setUserSwitched(false);
    }
  }, [genre, selectedYear, selectedSeason, sortBy, userSwitched]);

  // Initial fetch and filter changes
  useEffect(() => {
    if (selectedYear === null) return;
    
    setOffset(0);
    fetchAnimes(0, false);
  }, [selectedYear, selectedSeason, sortBy, fetchAnimes]);

  // Infinite scroll - load more when reaching bottom
  useEffect(() => {
    // Don't set up observer if we're loading initial data
    if (loading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const newOffset = offset + LIMIT;
          setOffset(newOffset);
          fetchAnimes(newOffset, true);
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
  }, [hasMore, loading, loadingMore, offset, fetchAnimes]);

  // Dynamic background based on genre
  const getGenreGradient = (genreName: string) => {
    const genreColors: { [key: string]: string } = {
      Action: 'from-red-500/14 via-orange-500/7 to-transparent',
      Adventure: 'from-green-500/14 via-emerald-500/7 to-transparent',
      Comedy: 'from-yellow-500/14 via-amber-500/7 to-transparent',
      Drama: 'from-purple-500/14 via-violet-500/7 to-transparent',
      Fantasy: 'from-pink-500/14 via-fuchsia-500/7 to-transparent',
      Horror: 'from-gray-800/14 via-gray-700/7 to-transparent',
      Mystery: 'from-indigo-500/14 via-blue-500/7 to-transparent',
      Romance: 'from-rose-500/14 via-pink-500/7 to-transparent',
      'Sci-Fi': 'from-cyan-500/14 via-blue-500/7 to-transparent',
      'Slice of Life': 'from-teal-500/14 via-green-500/7 to-transparent',
      Sports: 'from-orange-500/14 via-red-500/7 to-transparent',
      Supernatural: 'from-violet-500/14 via-purple-500/7 to-transparent',
      Thriller: 'from-red-800/14 via-orange-800/7 to-transparent',
    };

    return genreColors[genreName] || 'from-blue-500/14 via-indigo-500/7 to-transparent';
  };

  return (
    <div className="container mx-auto px-[24px] py-[32px] min-h-screen">
      {/* Dynamic background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getGenreGradient(genre)} pointer-events-none`} />
      
      <div className="max-w-[1400px] mx-auto relative">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl text-center mb-2 font-bold" style={{color: 'var(--foreground)'}}>
            {genre} Anime Rankings
          </h1>
          <p className="text-center mb-8 text-sm" style={{ color: 'var(--rating-yellow)' }}>
            Discover the best {genre.toLowerCase()} anime across all seasons
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 md:justify-between md:items-center">
          {/* Left side (Desktop) / Top (Mobile): Year and Season */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {/* Year Filter */}
            <div>
              <select
                value={selectedYear || ''}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="px-4 py-2 rounded-lg bg-[var(--card-background)] border border-[var(--card-border)] text-[var(--foreground)] cursor-pointer hover:bg-[var(--card-background)]/80 transition-colors"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Season Filter */}
            <div>
              <select
                value={selectedSeason}
                onChange={(e) => handleSeasonChange(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[var(--card-background)] border border-[var(--card-border)] text-[var(--foreground)] cursor-pointer hover:bg-[var(--card-background)]/80 transition-colors"
              >
                {seasons.map((season) => (
                  <option key={season.value} value={season.value}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right side (Desktop) / Bottom (Mobile): Sort By */}
          <div className="flex items-center gap-4 justify-center md:justify-end">
            <span className="text-sm font-medium text-[var(--foreground)]">Sort By</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sortBy"
                value="score"
                checked={sortBy === 'score'}
                onChange={(e) => handleSortChange(e.target.value as 'score' | 'popularity')}
                className="w-4 h-4 accent-[var(--rating-yellow)]"
              />
              <span className="text-sm text-[var(--foreground)]">Score</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sortBy"
                value="popularity"
                checked={sortBy === 'popularity'}
                onChange={(e) => handleSortChange(e.target.value as 'score' | 'popularity')}
                className="w-4 h-4 accent-[var(--rating-yellow)]"
              />
              <span className="text-sm text-[var(--foreground)]">Members</span>
            </label>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Loading State - Initial Load */}
        {loading && animes.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#fbbf24] border-t-transparent"></div>
            <p className="mt-4 text-lg text-[var(--foreground)]/70">Loading {genre} anime rankings...</p>
          </div>
        )}

        {/* Anime Grid */}
        {!error && animes.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            >
              {animes.map((anime, index) => {
                // Extract genre names
                const genreNames = anime.genres?.map(g => 
                  typeof g === 'string' ? g : g?.name || 'Unknown'
                ) || [];
                
                // Extract theme names
                const themeNames = anime.themes?.map(t => 
                  typeof t === 'string' ? t : t?.name || 'Unknown'
                ) || [];
                
                // Extract demographic names
                const demographicNames = anime.demographics?.map(d => 
                  typeof d === 'string' ? d : d?.name || 'Unknown'
                ) || [];

                // Bottom text: Show only Score or Members based on sortBy
                const bottomText = sortBy === 'score' 
                  ? `⭐ ${(anime.anime_score || 0).toFixed(2)}`
                  : `${anime.members?.toLocaleString() || '0'} Members`;

                return (
                  <motion.div
                    key={`${anime.anime_id}-${index}`}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.03,
                      ease: 'easeOut',
                    }}
                  >
                    <BaseAnimeCard
                      rank={index + offset + 1}
                      title={anime.title_english || anime.title}
                      subtitle="" 
                      imageUrl={anime.image_url}
                      linkUrl={`/anime/${anime.anime_id}`}
                      bottomText={bottomText}
                      animeType={anime.type}
                      demographics={demographicNames}
                      genres={genreNames}
                      themes={themeNames}
                      animeId={anime.anime_id}
                      season={anime.season}
                      year={anime.year}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#fbbf24] border-t-transparent"></div>
            <p className="mt-2 text-sm text-[var(--foreground)]/70">Loading more...</p>
          </div>
        )}

        {/* Infinite Scroll Observer Target */}
        {hasMore && !loadingMore && (
          <div ref={observerTarget} className="h-20" />
        )}

        {/* No More Results */}
        {!hasMore && animes.length > 0 && (
          <div className="text-center py-8">
            <p className="text-[var(--foreground)]/70">You've reached the end of the list</p>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && animes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-[var(--foreground)]/70">
              No {genre.toLowerCase()} anime found for this selection
            </p>
          </div>
        )}
      </div>
    </div>
  );
}