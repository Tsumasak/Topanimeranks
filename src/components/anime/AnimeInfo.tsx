'use client';

import { getTypeClass, getSeasonClass, getStatusClass, getDemographicClass } from '../../utils/tagHelpers';

interface AnimeInfoProps {
  anime: any;
}

export function AnimeInfo({ anime }: AnimeInfoProps) {
  // Helper to format array items
  const formatArray = (arr: any[], key: string = 'name') => {
    if (!arr || arr.length === 0) return 'N/A';
    return arr.map((item: any) => item[key] || item).join(', ');
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '?';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="rounded-lg p-6 border shadow-md"
      style={{
        background: "var(--card-background)",
        borderColor: "var(--card-border)",
      }}
    >
      <h2 className="text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
        <span>ℹ️</span>
        Information
      </h2>

      <div className="space-y-4">
        {/* Japanese Title */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Japanese Title
          </div>
          <div className="col-span-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {anime.title || 'N/A'}
          </div>
        </div>
        {/* Type with Tag */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Type
          </div>
          <div className="col-span-2">
            {anime.type ? (
              <span className={`${getTypeClass(anime.type)} px-3 py-1 rounded-full text-xs inline-block`}>
                {anime.type}
              </span>
            ) : (
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>N/A</span>
            )}
          </div>
        </div>

        {/* Episodes */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Episodes
          </div>
          <div className="col-span-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {anime.episodes || '?'}
          </div>
        </div>

        {/* Status with Tag */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Status
          </div>
          <div className="col-span-2">
            {anime.status ? (
              <span className={`${getStatusClass(anime.status)} px-3 py-1 rounded-full text-xs inline-block`}>
                {anime.status}
              </span>
            ) : (
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>N/A</span>
            )}
          </div>
        </div>

        {/* Aired */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Aired
          </div>
          <div className="col-span-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {formatDate(anime.aired_from)} to {formatDate(anime.aired_to)}
          </div>
        </div>

        {/* Season with Tag */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Season
          </div>
          <div className="col-span-2">
            {anime.season && anime.year ? (
              <span className={`${getSeasonClass(anime.season)} px-3 py-1 rounded-full text-xs inline-block`}>
                {anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} {anime.year}
              </span>
            ) : (
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>N/A</span>
            )}
          </div>
        </div>

        {/* Studios */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Studios
          </div>
          <div className="col-span-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {formatArray(anime.studios)}
          </div>
        </div>

        {/* Source */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Source
          </div>
          <div className="col-span-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {anime.source || 'N/A'}
          </div>
        </div>

        {/* Duration */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Duration
          </div>
          <div className="col-span-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {anime.duration || 'N/A'}
          </div>
        </div>

        {/* Rating */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
            Rating
          </div>
          <div className="col-span-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {anime.rating || 'N/A'}
          </div>
        </div>

        {/* Genres with standardized tags */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
              Genres
            </div>
            <div className="col-span-2 flex flex-wrap gap-2">
              {anime.genres.map((genre: any, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 theme-rating text-xs rounded-full border"
                  style={{
                    borderColor: 'var(--card-border)'
                  }}
                >
                  {genre.name || genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Themes with standardized tags */}
        {anime.themes && anime.themes.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
              Themes
            </div>
            <div className="col-span-2 flex flex-wrap gap-2">
              {anime.themes.map((theme: any, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 theme-rating text-xs rounded-full border"
                  style={{
                    borderColor: 'var(--card-border)'
                  }}
                >
                  {theme.name || theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Demographics with standardized tags */}
        {anime.demographics && anime.demographics.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 text-sm" style={{ color: 'var(--rating-text)' }}>
              Demographics
            </div>
            <div className="col-span-2 flex flex-wrap gap-2">
              {anime.demographics.map((demo: any, index: number) => {
                const demoName = typeof demo === 'string' ? demo : demo.name;
                return (
                  <span
                    key={index}
                    className={`${getDemographicClass(demoName)} px-3 py-1 rounded-full text-xs`}
                  >
                    {demoName}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}