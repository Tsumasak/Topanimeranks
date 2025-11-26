'use client';

import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';

interface Episode {
  id: number;
  anime_id: number;
  from_url?: string;
  episode_number: number;
  episode_name: string;
  episode_score: number | null;
  aired_at: string;
  position_in_week: number;
  week_number: number;
  trend: string;
}

interface AnimeEpisodesProps {
  episodes: Episode[];
  animeId?: number;
}

export function AnimeEpisodes({ episodes }: AnimeEpisodesProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Reverse episodes to show newest first
  const sortedEpisodes = [...episodes].reverse();

  if (episodes.length === 0) {
    return (
      <div 
        className="rounded-lg p-6 border shadow-md"
        style={{
          background: "var(--card-background)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2 className="text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <span>🎬</span>
          Episodes
        </h2>
        <p style={{ color: 'var(--rating-text)' }}>No episodes aired yet.</p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-6 border shadow-md"
      style={{
        background: "var(--card-background)",
        borderColor: "var(--card-border)",
      }}
    >
      <h2 className="text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
        <span>🎬</span>
        Episodes ({episodes.length})
      </h2>

      <div className="space-y-3">
        {sortedEpisodes.map((episode, index) => (
          <div
            key={episode.id}
            className="block"
          >
            <Link 
              to={`/ranks?week=week${episode.week_number}#anime-${episode.anime_id}`}
              className="rounded-lg p-4 border block hover:shadow-lg hover:-translate-y-1"
              style={{ 
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Episode Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ color: 'var(--foreground)' }}>EP {episode.episode_number}</span>
                    {/* NEW Badge for most recent episode */}
                    {index === 0 && (
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <h3 style={{ color: 'var(--rating-yellow)', fontSize: '1rem', fontWeight: '700' }}>
                    {episode.episode_name}
                  </h3>
                </div>

                {/* Score */}
                {episode.episode_score !== null ? (
                  <div className="flex items-center gap-1" style={{ color: 'var(--rating-yellow)' }}>
                    <span>⭐</span>
                    <span className="font-bold text-[20px]">{episode.episode_score.toFixed(2)}</span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    N/A
                  </Badge>
                )}
              </div>

              {/* Episode Info */}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--rating-text)' }}>
                <span>Aired: {formatDate(episode.aired_at)}</span>
                <span>•</span>
                <span>Week {episode.week_number}</span>
                {episode.position_in_week && (
                  <>
                    <span>•</span>
                    <span>Rank #{episode.position_in_week}</span>
                  </>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}