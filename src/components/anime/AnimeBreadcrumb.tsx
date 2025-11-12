'use client';

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface AnimeBreadcrumbProps {
  season?: string;
  year?: number;
  animeTitle: string;
}

export function AnimeBreadcrumb({ season, year, animeTitle }: AnimeBreadcrumbProps) {
  // Capitalize season
  const formattedSeason = season 
    ? season.charAt(0).toUpperCase() + season.slice(1)
    : null;

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link 
        to="/home" 
        className="hover:opacity-70 transition-opacity"
        style={{ color: 'var(--rating-text)' }}
      >
        Home
      </Link>
      
      <ChevronRight className="h-4 w-4" style={{ color: 'var(--rating-text)' }} />
      
      {formattedSeason && year ? (
        <>
          <Link 
            to={`/home?season=${season}&year=${year}`} 
            className="hover:opacity-70 transition-opacity"
            style={{ color: 'var(--rating-text)' }}
          >
            {formattedSeason} {year}
          </Link>
          <ChevronRight className="h-4 w-4" style={{ color: 'var(--rating-text)' }} />
        </>
      ) : null}
      
      <span className="font-bold" style={{ color: 'var(--rating-text)' }}>{animeTitle}</span>
    </nav>
  );
}