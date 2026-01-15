import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchResult } from '../types/search';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SearchBarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function SearchBar({ isMobile = false, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset search when location changes
  useEffect(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setTotalCount(0);
  }, [location.pathname]);

  // Auto-focus on mount (mobile)
  useEffect(() => {
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    // Clear results if query is too short
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/search?q=${encodeURIComponent(query)}&limit=3`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('[SearchBar] Response is not JSON:', text.substring(0, 200));
          throw new Error('Response is not JSON');
        }

        const data = await response.json();
        console.log('[SearchBar] Response:', data); // Debug
        setResults(data.results || []);
        setTotalCount(data.totalCount || 0);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (animeId: number) => {
    navigate(`/anime/${animeId}`);
    setIsOpen(false);
    setQuery('');
    if (onClose) onClose();
  };

  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Get season tag class (same as AnimeInfo)
  const getSeasonClass = (season: string) => {
    const seasonLower = season?.toLowerCase();
    if (seasonLower === 'winter') return 'tag-winter';
    if (seasonLower === 'summer') return 'tag-summer';
    if (seasonLower === 'fall') return 'tag-fall';
    if (seasonLower === 'spring') return 'tag-spring';
    return 'tag-default';
  };

  const formatSeasonDisplay = (season: string | null, year: number | null) => {
    if (!season) return null;
    const seasonCapitalized = season.charAt(0).toUpperCase() + season.slice(1);
    return year ? `${seasonCapitalized} ${year}` : seasonCapitalized;
  };

  return (
    <div className={`relative ${isMobile ? 'w-full' : 'w-full max-w-md'}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[var(--text-tertiary)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime by name, season, or tags..."
          className="w-full pl-10 pr-10 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && query.length >= 3 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-2xl overflow-hidden z-50"
        >
          {isLoading ? (
            <div className="p-4 text-center text-[var(--text-tertiary)]">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-tertiary)]">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {/* Results (max 3) */}
              <div className="divide-y divide-[var(--card-border)]">
                {results.map((result) => {
                  const seasonDisplay = formatSeasonDisplay(result.season, result.year);
                  
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.id)}
                      className="w-full flex items-center gap-3 p-3 transition-all duration-300 text-left group"
                      style={{
                        backgroundColor: 'var(--card-background)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--card-background)';
                      }}
                    >
                      {/* Image - aspect-square like BaseAnimeCard */}
                      <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden" style={{ backgroundColor: 'var(--rating-background)' }}>
                        {result.imageUrl ? (
                          <ImageWithFallback
                            src={result.imageUrl}
                            alt={result.title}
                            className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--rating-text)' }}>
                            <Search className="size-5" />
                          </div>
                        )}
                      </div>

                      {/* Info - Following BaseAnimeCard text styling */}
                      <div className="flex-1 min-w-0">
                        {/* Title - max 2 lines, using theme colors */}
                        <div className="line-clamp-2 mb-1" style={{ color: 'var(--foreground)' }}>
                          {result.title}
                        </div>
                        
                        {/* Season Tag + Score - Following BaseAnimeCard tag styling */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {seasonDisplay && result.season && (
                            <span className={`${getSeasonClass(result.season)} px-3 py-1 rounded-full text-xs`}>
                              {seasonDisplay}
                            </span>
                          )}
                          {result.score && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'var(--rating-background)' }}>
                              <span className="text-xs" style={{ color: 'var(--rating-yellow)' }}>★</span>
                              <span className="text-xs" style={{ color: 'var(--rating-text)' }}>
                                {result.score.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* View All Results Button */}
              {totalCount > 3 && (
                <button
                  onClick={handleViewAllResults}
                  className="w-full p-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors"
                >
                  View all {totalCount} results for "{query}"
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}