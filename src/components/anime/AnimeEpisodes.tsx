'use client';

import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import { getEpisodeSeasonInfo } from '../../utils/seasons';

interface Episode {
  id: number;
  anime_id: number;
  episode_id?: string;
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
  weeklyData?: Record<number, any[]>;
}

interface SeasonGroup {
  season: string;
  year: number;
  seasonDisplay: string;
  episodes: Episode[];
}

export function AnimeEpisodes({ episodes, weeklyData = {} }: AnimeEpisodesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSeasonInfo = (airedDate: string) => {
    try {
      return getEpisodeSeasonInfo(airedDate);
    } catch (error) {
      console.error('Error getting season info:', error);
      return null;
    }
  };

  const calculateRank = (episode: Episode): number | null => {
    if (!weeklyData || !episode.week_number) return null;
    
    const weekEpisodes = weeklyData[episode.week_number];
    if (!weekEpisodes || !Array.isArray(weekEpisodes)) return null;

    const episodeId = episode.episode_id || `${episode.anime_id}_${episode.episode_number}`;
    
    const rank = weekEpisodes.findIndex((ep: any) => {
      const epId = ep.episode_id || `${ep.anime_id}_${ep.episode_number}`;
      return epId === episodeId;
    }) + 1;
    
    return rank > 0 ? rank : null;
  };

  const calculateTrend = (episode: Episode, currentRank: number | null): { change: number | null; symbol: string; color: string } => {
    if (!currentRank || !episode.week_number || episode.week_number === 1 || !weeklyData) {
      return { change: null, symbol: '', color: '' };
    }

    const prevWeekEpisodes = weeklyData[episode.week_number - 1];
    if (!prevWeekEpisodes || !Array.isArray(prevWeekEpisodes)) {
      return { change: null, symbol: '', color: '' };
    }

    const prevIndex = prevWeekEpisodes.findIndex((ep: any) => ep.anime_id === episode.anime_id);
    
    if (prevIndex === -1) {
      return { change: null, symbol: '', color: '' };
    }

    const prevRank = prevIndex + 1;
    const change = prevRank - currentRank;

    if (change > 0) {
      return { change, symbol: '▲', color: '#22c55e' };
    } else if (change < 0) {
      return { change: Math.abs(change), symbol: '▼', color: '#ef4444' };
    } else {
      return { change: 0, symbol: '=', color: '#6b7280' };
    }
  };

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

  // Group episodes by season/year
  const episodesBySeasonYear = sortedEpisodes.reduce((acc, episode) => {
    const seasonInfo = getSeasonInfo(episode.aired_at);
    const key = seasonInfo 
      ? `${seasonInfo.season}-${seasonInfo.year}` 
      : 'unknown';
    
    if (!acc[key]) {
      acc[key] = {
        season: seasonInfo?.season || 'Unknown',
        year: seasonInfo?.year || 0,
        seasonDisplay: seasonInfo?.seasonDisplay || 'Unknown Season',
        episodes: []
      };
    }
    
    acc[key].episodes.push(episode);
    return acc;
  }, {} as Record<string, SeasonGroup>);

  // Convert to array and sort by year DESC, then season order
  const seasonOrder: Record<string, number> = { fall: 4, summer: 3, spring: 2, winter: 1, unknown: 0 };
  const seasonGroups = Object.values(episodesBySeasonYear).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const aOrder = seasonOrder[a.season.toLowerCase()] || 0;
    const bOrder = seasonOrder[b.season.toLowerCase()] || 0;
    return bOrder - aOrder;
  });

  const hasMultipleSeasons = seasonGroups.length > 1;
  let globalIndex = 0;

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

      <div className="space-y-6">
        {seasonGroups.map((group) => {
          return (
            <div key={`${group.season}-${group.year}`} className="space-y-3">
              {hasMultipleSeasons && (
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="h-[2px] flex-1 rounded"
                    style={{ background: 'var(--card-border)' }}
                  />
                  <h3 
                    className="text-lg font-bold px-3"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {group.seasonDisplay}
                  </h3>
                  <div 
                    className="h-[2px] flex-1 rounded"
                    style={{ background: 'var(--card-border)' }}
                  />
                </div>
              )}

              {group.episodes.map((episode) => {
                const dynamicRank = calculateRank(episode);
                const trend = calculateTrend(episode, dynamicRank);
                const isGlobalFirst = globalIndex === 0;
                globalIndex++;

                return (
                  <div key={episode.id} className="block">
                    <Link 
                      to={`/ranks?week=week${episode.week_number}#anime-${episode.anime_id}`}
                      className="rounded-lg p-4 border block hover:shadow-lg hover:-translate-y-1"
                      style={{ 
                        background: 'var(--background)',
                        borderColor: 'var(--card-border)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                              EP {episode.episode_number}
                            </span>
                            {isGlobalFirst && (
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

                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--rating-text)' }}>
                        <span>Aired: {formatDate(episode.aired_at)}</span>
                        <span>•</span>
                        {(() => {
                          const seasonInfo = getSeasonInfo(episode.aired_at);
                          if (seasonInfo) {
                            return (
                              <>
                                <span>{seasonInfo.seasonDisplay}</span>
                                <span>•</span>
                                <span>Week {seasonInfo.weekInSeason}</span>
                              </>
                            );
                          }
                          return <span>Week {episode.week_number}</span>;
                        })()}
                        {dynamicRank && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span>Rank #{dynamicRank}</span>
                              {trend.change !== null && trend.symbol !== '' && (
                                <span 
                                  className="flex items-center gap-0.5 ml-1"
                                  style={{ color: trend.color }}
                                >
                                  <span className="font-bold">{trend.symbol}</span>
                                  <span className="text-[10px]">{trend.change}</span>
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
