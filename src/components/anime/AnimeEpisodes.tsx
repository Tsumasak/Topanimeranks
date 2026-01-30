import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    // Check if airedDate is valid before processing
    if (!airedDate || airedDate.trim() === '') {
      // Silently return null - episodes without aired_at should already be filtered
      return null;
    }
    
    try {
      return getEpisodeSeasonInfo(airedDate);
    } catch (error) {
      console.error('Error getting season info:', error);
      return null;
    }
  };

  const calculateRank = (episode: Episode): number | null => {
    // ✅ FIXED: Use position_in_week from database instead of recalculating
    // The database already has the correct rank calculated
    if (episode.position_in_week && episode.position_in_week > 0) {
      return episode.position_in_week;
    }
    
    // Fallback: Calculate from weeklyData if position_in_week is not set
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

  const calculateTrend = (episode: Episode, currentRank: number | null): { change: number | null; showTrend: boolean } => {
    // If no rank or week 1, no trend to show
    if (!currentRank || !episode.week_number || episode.week_number === 1 || !weeklyData) {
      return { change: null, showTrend: false };
    }

    const prevWeekEpisodes = weeklyData[episode.week_number - 1];
    if (!prevWeekEpisodes || !Array.isArray(prevWeekEpisodes)) {
      // No previous week data - don't show trend indicator
      return { change: null, showTrend: false };
    }

    // Find the same ANIME in previous week (by anime_id, not episode_id)
    const prevIndex = prevWeekEpisodes.findIndex((ep: any) => ep.anime_id === episode.anime_id);
    
    if (prevIndex === -1) {
      // Anime not found in previous week - don't show trend indicator
      return { change: null, showTrend: false };
    }

    const prevRank = prevIndex + 1;
    const change = prevRank - currentRank;

    return { change, showTrend: true };
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
                                className="px-2 py-0.5 rounded-full text-xs font-bold border"
                                style={{
                                  backgroundColor: 'rgba(168, 85, 247, 0.2)',
                                  color: '#a855f7',
                                  borderColor: 'rgba(168, 85, 247, 0.3)'
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
                        {(() => {
                          const seasonInfo = getSeasonInfo(episode.aired_at);
                          if (seasonInfo) {
                            return (
                              <>
                                <span>{seasonInfo.seasonDisplay}</span>
                                <span>•</span>
                                <span>Aired: {formatDate(episode.aired_at)}</span>
                                <span>•</span>
                                <span>Week {seasonInfo.weekInSeason}</span>
                              </>
                            );
                          }
                          return (
                            <>
                              <span>Aired: {formatDate(episode.aired_at)}</span>
                              <span>•</span>
                              <span>Week {episode.week_number}</span>
                            </>
                          );
                        })()}
                        {/* ✅ FIXED: Only show rank/trend if episode has a score */}
                        {dynamicRank && episode.episode_score !== null && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span>Rank #{dynamicRank}</span>
                              
                              {/* Trend Indicator - same pattern as Weekly Episodes page */}
                              {trend.showTrend && trend.change !== null && (
                                trend.change > 0 ? (
                                  <span 
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ml-1"
                                    style={{ 
                                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                      color: '#22c55e',
                                      borderColor: 'rgba(34, 197, 94, 0.3)'
                                    }}
                                  >
                                    <span className="font-bold">▲</span>
                                    <span className="text-[10px]">{trend.change}</span>
                                  </span>
                                ) : trend.change < 0 ? (
                                  <span 
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ml-1"
                                    style={{ 
                                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                      color: '#ef4444',
                                      borderColor: 'rgba(239, 68, 68, 0.3)'
                                    }}
                                  >
                                    <span className="font-bold">▼</span>
                                    <span className="text-[10px]">{Math.abs(trend.change)}</span>
                                  </span>
                                ) : (
                                  <span 
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ml-1"
                                    style={{ 
                                      backgroundColor: 'rgba(107, 114, 128, 0.2)',
                                      color: '#6b7280',
                                      borderColor: 'rgba(107, 114, 128, 0.3)'
                                    }}
                                  >
                                    <span className="font-bold">=</span>
                                    <span className="text-[10px]">0</span>
                                  </span>
                                )
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