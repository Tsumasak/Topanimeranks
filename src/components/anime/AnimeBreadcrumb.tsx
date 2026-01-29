import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

interface AnimeBreadcrumbProps {
  season?: string;
  year?: number;
  animeTitle: string;
}

export function AnimeBreadcrumb({
  season,
  year,
  animeTitle,
}: AnimeBreadcrumbProps) {
  // Capitalize season
  const formattedSeason = season
    ? season.charAt(0).toUpperCase() + season.slice(1)
    : null;

  return (
    <nav className="flex items-center gap-2 text-sm overflow-hidden">
      <Link
        to="/home"
        className="hover:opacity-70 transition-opacity shrink-0"
        style={{ color: "var(--rating-text)" }}
      >
        Home
      </Link>

      <ChevronRight
        className="h-4 w-4 shrink-0"
        style={{ color: "var(--rating-text)" }}
      />

      {formattedSeason && year ? (
        <>
          <Link
            to={`/search?q=${encodeURIComponent(`${formattedSeason} ${year}`)}`}
            className="hover:opacity-70 transition-opacity shrink-0"
            style={{ color: "var(--rating-text)" }}
          >
            {formattedSeason} {year}
          </Link>
          <ChevronRight
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--rating-text)" }}
          />
        </>
      ) : null}

      <span
        className="font-bold truncate min-w-0"
        style={{ color: "var(--rating-text)" }}
        title={animeTitle}
      >
        {animeTitle}
      </span>
    </nav>
  );
}