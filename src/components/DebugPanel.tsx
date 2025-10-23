import { useState } from 'react';
import { Episode } from '../types/anime';
import { X, Bug } from 'lucide-react';

interface DebugPanelProps {
  currentWeek: number;
  currentEpisodes: Episode[];
  previousEpisodes: Episode[];
}

export function DebugPanel({ currentWeek, currentEpisodes, previousEpisodes }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<string>('');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-transform hover:scale-105"
        style={{ background: 'var(--card-background)', border: '1px solid var(--card-border)' }}
        title="Open Debug Panel"
      >
        <Bug className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>Debug</span>
      </button>
    );
  }

  // Get unique anime titles from current episodes
  const animeList = Array.from(new Set(currentEpisodes.map(ep => ep.animeTitle))).sort();

  // Find episodes from selected anime
  const currentAnimeEpisodes = selectedAnime 
    ? currentEpisodes.filter(ep => ep.animeTitle === selectedAnime)
    : [];
  
  const previousAnimeEpisodes = selectedAnime 
    ? previousEpisodes.filter(ep => ep.animeTitle === selectedAnime)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div 
        className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-lg shadow-2xl flex flex-col"
        style={{ background: 'var(--card-background)', border: '2px solid var(--card-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-3">
            <Bug className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className="text-xl" style={{ color: 'var(--foreground)' }}>
                Debug Panel - Week {currentWeek}
              </h2>
              <p className="text-sm opacity-70" style={{ color: 'var(--foreground)' }}>
                Compare episodes between weeks
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ background: 'var(--card-hover)' }}
          >
            <X className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ background: 'var(--background)' }}>
              <div className="text-sm opacity-70 mb-1" style={{ color: 'var(--foreground)' }}>Current Week</div>
              <div className="text-2xl" style={{ color: 'var(--primary)' }}>{currentEpisodes.length}</div>
              <div className="text-xs opacity-50" style={{ color: 'var(--foreground)' }}>episodes</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--background)' }}>
              <div className="text-sm opacity-70 mb-1" style={{ color: 'var(--foreground)' }}>Previous Week</div>
              <div className="text-2xl" style={{ color: 'var(--primary)' }}>{previousEpisodes.length}</div>
              <div className="text-xs opacity-50" style={{ color: 'var(--foreground)' }}>episodes</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--background)' }}>
              <div className="text-sm opacity-70 mb-1" style={{ color: 'var(--foreground)' }}>Unique Animes</div>
              <div className="text-2xl" style={{ color: 'var(--primary)' }}>{animeList.length}</div>
              <div className="text-xs opacity-50" style={{ color: 'var(--foreground)' }}>titles</div>
            </div>
          </div>

          {/* Anime Selector */}
          <div className="mb-4">
            <label className="block text-sm mb-2" style={{ color: 'var(--foreground)' }}>
              Select Anime to Compare:
            </label>
            <select
              value={selectedAnime}
              onChange={(e) => setSelectedAnime(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                background: 'var(--background)', 
                color: 'var(--foreground)',
                borderColor: 'var(--card-border)'
              }}
            >
              <option value="">-- Select an anime --</option>
              {animeList.map(anime => (
                <option key={anime} value={anime}>{anime}</option>
              ))}
            </select>
          </div>

          {/* Comparison Table */}
          {selectedAnime && (
            <div className="space-y-4">
              <h3 className="text-lg mb-3" style={{ color: 'var(--foreground)' }}>
                {selectedAnime}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Current Week */}
                <div>
                  <h4 className="text-sm mb-2 opacity-70" style={{ color: 'var(--foreground)' }}>
                    Current Week {currentWeek}
                  </h4>
                  {currentAnimeEpisodes.length === 0 ? (
                    <p className="text-sm opacity-50" style={{ color: 'var(--foreground)' }}>
                      No episodes this week
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentAnimeEpisodes.map((ep, idx) => {
                        const rank = currentEpisodes.indexOf(ep) + 1;
                        return (
                          <div 
                            key={idx} 
                            className="p-3 rounded-lg text-sm"
                            style={{ background: 'var(--background)' }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold" style={{ color: 'var(--primary)' }}>
                                #{rank}
                              </span>
                              <span style={{ color: 'var(--rating-yellow)' }}>
                                ★ {ep.score.toFixed(2)}
                              </span>
                            </div>
                            <div style={{ color: 'var(--foreground)' }}>
                              EP{ep.episodeNumber}
                            </div>
                            <div className="text-xs opacity-60 mt-1" style={{ color: 'var(--foreground)' }}>
                              ID: {ep.id} | AnimeID: {ep.animeId}
                            </div>
                            <div className="text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
                              Aired: {new Date(ep.aired).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Previous Week */}
                <div>
                  <h4 className="text-sm mb-2 opacity-70" style={{ color: 'var(--foreground)' }}>
                    Previous Week {currentWeek - 1}
                  </h4>
                  {previousAnimeEpisodes.length === 0 ? (
                    <p className="text-sm opacity-50" style={{ color: 'var(--foreground)' }}>
                      No episodes last week
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {previousAnimeEpisodes.map((ep, idx) => {
                        const rank = previousEpisodes.indexOf(ep) + 1;
                        return (
                          <div 
                            key={idx} 
                            className="p-3 rounded-lg text-sm"
                            style={{ background: 'var(--background)' }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold" style={{ color: 'var(--primary)' }}>
                                #{rank}
                              </span>
                              <span style={{ color: 'var(--rating-yellow)' }}>
                                ★ {ep.score.toFixed(2)}
                              </span>
                            </div>
                            <div style={{ color: 'var(--foreground)' }}>
                              EP{ep.episodeNumber}
                            </div>
                            <div className="text-xs opacity-60 mt-1" style={{ color: 'var(--foreground)' }}>
                              ID: {ep.id} | AnimeID: {ep.animeId}
                            </div>
                            <div className="text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
                              Aired: {new Date(ep.aired).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis */}
              {currentAnimeEpisodes.length > 0 && (
                <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--background)' }}>
                  <h4 className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>Analysis (Anime-based ranking):</h4>
                  {currentAnimeEpisodes.map(currentEp => {
                    const currentRank = currentEpisodes.indexOf(currentEp) + 1;
                    // NEW LOGIC: Find by animeId only (not episode-specific)
                    const previousEp = previousAnimeEpisodes.find(
                      prevEp => prevEp.animeId === currentEp.animeId
                    );
                    
                    if (!previousEp) {
                      return (
                        <div key={currentEp.id} className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
                          • EP{currentEp.episodeNumber}: <span style={{ color: '#3b82f6' }}>🆕 NEW</span> (anime not in previous week)
                        </div>
                      );
                    }
                    
                    const previousRank = previousEpisodes.indexOf(previousEp) + 1;
                    const change = previousRank - currentRank;
                    const changeColor = change > 0 ? '#22c55e' : change < 0 ? '#ef4444' : '#6b7280';
                    const changeSymbol = change > 0 ? '▲' : change < 0 ? '▼' : '=';
                    
                    return (
                      <div key={currentEp.id} className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
                        • EP{currentEp.episodeNumber} (★{currentEp.score.toFixed(2)}): #{currentRank} (was #{previousRank} with EP{previousEp.episodeNumber})
                        <span style={{ color: changeColor }}>
                          {' '}{changeSymbol} {change > 0 ? '+' : ''}{change}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
