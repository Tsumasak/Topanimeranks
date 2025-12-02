import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SearchResult } from '../types/search';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import BaseAnimeCard from '../components/BaseAnimeCard';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to load search results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen pb-12">
      <div className="container mx-auto px-[24px] pt-[32px] pb-[32px]">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--card-border)] border-t-[var(--accent)] mb-4" />
            <p className="text-[var(--text-secondary)]">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* No Query */}
        {!query && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="size-16 text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)] text-lg">
              Enter a search query to find anime
            </p>
          </div>
        )}

        {/* Query Too Short */}
        {query && query.length < 3 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="size-16 text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)] text-lg">
              Please enter at least 3 characters to search
            </p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && query.length >= 3 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="size-16 text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)] text-lg mb-2">
              No results found for "{query}"
            </p>
            <p className="text-[var(--text-tertiary)] text-sm">
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {/* Results Grid - Same as Top Season Animes: 4 cols max on XL */}
        {!isLoading && !error && results.length > 0 && (
          <>
            <div className="mb-4 text-[var(--text-secondary)]">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for <span className="font-medium" style={{color: 'var(--rating-yellow)'}}>"{query}"</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((result, index) => {
                return (
                  <BaseAnimeCard
                    key={result.id}
                    rank={index + 1}
                    hideRank={true}
                    title={result.title}
                    subtitle=""
                    imageUrl={result.imageUrl || ''}
                    linkUrl={`/anime/${result.id}`}
                    bottomText={result.score ? `⭐ ${result.score.toFixed(2)}` : ''}
                    animeType={result.type || undefined}
                    demographics={result.demographics || []}
                    genres={result.genres || []}
                    themes={result.themes || []}
                    season={result.season}
                    year={result.year}
                    animeId={result.id}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}