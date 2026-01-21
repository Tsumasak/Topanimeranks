import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, Star } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../utils/supabase/client';

interface RankDataPoint {
  week: number;
  weekLabel: string;
  rank: number;
  displayRank: number;
  score: number;
  episodeNumber: number;
}

interface SeasonInfo {
  season: string;
  year: number;
  displayName: string;
}

interface RankEvolutionChartProps {
  animeId: number;
}

export function RankEvolutionChart({ animeId }: RankEvolutionChartProps) {
  const [rankData, setRankData] = useState<RankDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRank, setAverageRank] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [bestRank, setBestRank] = useState<number | null>(null);
  const [worstRank, setWorstRank] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [maxRank, setMaxRank] = useState<number>(20);

  useEffect(() => {
    async function fetchSeasons() {
      try {
        console.log('[RankEvolution] Fetching seasons for anime:', animeId);

        const { data: episodes, error } = await supabase
          .from('weekly_episodes')
          .select('season, year')
          .eq('anime_id', animeId)
          .not('episode_score', 'is', null)
          .not('aired_at', 'is', null);

        if (error || !episodes || episodes.length === 0) {
          console.log('[RankEvolution] No episodes found');
          setLoading(false);
          return;
        }

        const uniqueSeasons = new Map<string, SeasonInfo>();
        episodes.forEach((ep: any) => {
          const key = `${ep.season}-${ep.year}`;
          if (!uniqueSeasons.has(key)) {
            const seasonName = ep.season.charAt(0).toUpperCase() + ep.season.slice(1);
            uniqueSeasons.set(key, {
              season: ep.season,
              year: ep.year,
              displayName: `${seasonName} ${ep.year}`,
            });
          }
        });

        const seasonsList = Array.from(uniqueSeasons.values()).sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          const seasonOrder = { winter: 0, spring: 1, summer: 2, fall: 3 };
          return seasonOrder[a.season as keyof typeof seasonOrder] - seasonOrder[b.season as keyof typeof seasonOrder];
        });

        setSeasons(seasonsList);
        
        if (seasonsList.length > 0) {
          const firstSeasonKey = `${seasonsList[0].season}-${seasonsList[0].year}`;
          setSelectedSeason(firstSeasonKey);
        }

        console.log('[RankEvolution] Found seasons:', seasonsList);
      } catch (error) {
        console.error('[RankEvolution] Error fetching seasons:', error);
        setLoading(false);
      }
    }

    fetchSeasons();
  }, [animeId]);

  useEffect(() => {
    if (!selectedSeason) return;

    async function fetchRankEvolution() {
      try {
        const [season, year] = selectedSeason.split('-');
        console.log('[RankEvolution] Fetching rank data for season:', season, year);

        const { data: episodes, error } = await supabase
          .from('weekly_episodes')
          .select('*')
          .eq('anime_id', animeId)
          .eq('season', season)
          .eq('year', parseInt(year))
          .not('episode_score', 'is', null)
          .not('aired_at', 'is', null)
          .order('episode_number', { ascending: true });

        if (error) {
          console.error('[RankEvolution] Error fetching episodes:', error);
          setLoading(false);
          return;
        }

        if (!episodes || episodes.length === 0) {
          console.log('[RankEvolution] No episodes found for this season');
          setRankData([]);
          setLoading(false);
          return;
        }

        console.log('[RankEvolution] Found episodes:', episodes.length);

        // Check scenario: all episodes in same week?
        const uniqueWeeks = new Set(episodes.map((ep: any) => ep.week_number));
        const allSameWeek = uniqueWeeks.size === 1;

        console.log('[RankEvolution] Unique weeks:', uniqueWeeks.size, 'Use episode axis:', allSameWeek);

        const dataPoints: RankDataPoint[] = [];

        // Process each episode
        for (const episode of episodes as any[]) {
          const weekNum = episode.week_number;
          const epNum = episode.episode_number;

          // Get all episodes from the same week to calculate rank
          const { data: weekEpisodes, error: weekError } = await supabase
            .from('weekly_episodes')
            .select('*')
            .eq('season', season)
            .eq('year', parseInt(year))
            .eq('week_number', weekNum)
            .not('episode_score', 'is', null)
            .order('episode_score', { ascending: false });

          if (weekError || !weekEpisodes) {
            console.error('[RankEvolution] Error fetching week data:', weekError);
            continue;
          }

          const rank = weekEpisodes.findIndex((ep: any) => 
            ep.anime_id === animeId && ep.episode_number === epNum
          ) + 1;

          if (rank > 0) {
            dataPoints.push({
              week: weekNum,
              weekLabel: allSameWeek ? `Episode ${epNum}` : `Week ${weekNum}`,
              rank,
              displayRank: 0, // Will be calculated after we know maxRank
              score: episode.episode_score,
              episodeNumber: epNum,
            });
          }
        }

        console.log('[RankEvolution] Data points:', dataPoints);

        if (dataPoints.length > 0) {
          const ranks = dataPoints.map(d => d.rank);
          const scores = dataPoints.map(d => d.score);
          const avgRank = ranks.reduce((sum, r) => sum + r, 0) / ranks.length;
          const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
          const best = Math.min(...ranks);
          const worst = Math.max(...ranks);
          const maxR = worst + 2;
          
          // Inverter ranks para display (maiores valores = melhores posições no gráfico)
          const invertedData = dataPoints.map(d => ({
            ...d,
            displayRank: maxR - d.rank,
          }));
          
          setRankData(invertedData);
          setAverageRank(avgRank);
          setAverageScore(avgScore);
          setBestRank(best);
          setWorstRank(worst);
          setMaxRank(maxR);
        } else {
          setRankData([]);
          setAverageRank(null);
          setAverageScore(null);
          setBestRank(null);
          setWorstRank(null);
        }

        setLoading(false);
      } catch (error) {
        console.error('[RankEvolution] Error:', error);
        setLoading(false);
      }
    }

    fetchRankEvolution();
  }, [animeId, selectedSeason]);

  if (loading) {
    return (
      <div 
        className="rounded-lg p-6 mb-8 border shadow-md"
        style={{
          background: "var(--card-background)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--rating-yellow)' }}></div>
        </div>
      </div>
    );
  }

  if (seasons.length === 0) {
    return null;
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="rounded-lg p-3 shadow-lg border"
          style={{ 
            borderColor: 'var(--card-border)',
            background: 'var(--card-background)',
          }}
        >
          <p className="font-bold mb-2 text-sm" style={{ color: 'var(--foreground)' }}>
            {data.weekLabel}
          </p>
          <p className="text-xs mb-1" style={{ color: 'var(--foreground)' }}>
            <span className="opacity-70">Position:</span>{' '}
            <span className="font-bold" style={{ color: 'var(--rating-yellow)' }}>
              #{data.rank}
            </span>
          </p>
          <p className="text-xs mb-1" style={{ color: 'var(--foreground)' }}>
            <span className="opacity-70">Score:</span>{' '}
            <span className="font-bold" style={{ color: 'var(--rating-green)' }}>
              {data.score.toFixed(2)}
            </span>
          </p>
          <p className="text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
            Episode {data.episodeNumber}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot
  const CustomDot = (props: any) => {
    const { cx, cy } = props;
    if (!cx || !cy) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--rating-yellow)"
        stroke="var(--background)"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      />
    );
  };

  // Custom Y axis tick to show actual ranks
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    // payload.value agora é o displayRank invertido, precisamos converter de volta
    const displayValue = payload.value;
    const actualRank = maxRank - displayValue;
    if (!actualRank || actualRank < 1) return null;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="var(--foreground)"
          opacity={0.6}
          fontSize={11}
        >
          #{actualRank}
        </text>
      </g>
    );
  };

  const getTrend = () => {
    if (rankData.length < 2) return null;
    const firstRank = rankData[0].rank;
    const lastRank = rankData[rankData.length - 1].rank;
    const change = firstRank - lastRank;
    return { change, improved: change > 0 };
  };

  const trend = getTrend();

  return (
    <div 
      className="rounded-lg p-6 mb-8 border shadow-md"
      style={{
        background: "var(--card-background)",
        borderColor: "var(--card-border)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 md:mb-0">
          <h2 className="text-2xl flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <span>📈</span>
            Rank Evolution
          </h2>
          
          {/* Season Selector */}
          {seasons.length > 1 && (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1.5 pr-8 rounded-lg border text-sm"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
            >
              {seasons.map((s) => (
                <option key={`${s.season}-${s.year}`} value={`${s.season}-${s.year}`}>
                  {s.displayName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Stats */}
        {rankData.length > 0 && (
          <div className="flex gap-4 flex-wrap">
            {averageRank && (
              <div className="text-center">
                <div 
                  className="text-xs opacity-60 mb-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  Avg Position
                </div>
                <div 
                  className="text-xl font-bold"
                  style={{ color: 'var(--rating-yellow)' }}
                >
                  #{averageRank.toFixed(2)}
                </div>
              </div>
            )}
            {averageScore && (
              <div className="text-center">
                <div 
                  className="text-xs opacity-60 mb-1 flex items-center gap-1 justify-center"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Star size={12} />
                  Avg Score
                </div>
                <div 
                  className="text-xl font-bold"
                  style={{ color: 'var(--rating-green)' }}
                >
                  {averageScore.toFixed(2)}
                </div>
              </div>
            )}
            {bestRank && (
              <div className="text-center">
                <div 
                  className="text-xs opacity-60 mb-1 flex items-center gap-1 justify-center"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Award size={12} />
                  Best
                </div>
                <div 
                  className="text-xl font-bold"
                  style={{ color: 'var(--rating-green)' }}
                >
                  #{bestRank}
                </div>
              </div>
            )}
            {trend && (
              <div className="text-center">
                <div 
                  className="text-xs opacity-60 mb-1 flex items-center gap-1 justify-center"
                  style={{ color: 'var(--foreground)' }}
                >
                  {trend.improved ? (
                    <TrendingUp size={12} style={{ color: 'var(--rating-green)' }} />
                  ) : (
                    <TrendingDown size={12} style={{ color: 'var(--rating-red)' }} />
                  )}
                  Trend
                </div>
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    color: trend.improved ? 'var(--rating-green)' : 'var(--rating-red)' 
                  }}
                >
                  {trend.improved ? '+' : ''}{Math.abs(trend.change)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {rankData.length > 0 ? (
        <div className="w-full" style={{ height: '280px', minHeight: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={rankData}
              margin={{ 
                top: 10, 
                right: 10,   
                left: -20,  
                bottom: 5   
              }}
            >
              <defs>
                <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor="var(--rating-yellow)" 
                    stopOpacity={0.4}
                  />
                  <stop 
                    offset="100%" 
                    stopColor="var(--rating-yellow)" 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--card-border)"
                opacity={0.3}
              />
              <XAxis
                dataKey="weekLabel"
                axisLine={false}
                tick={{ fill: 'var(--foreground)', opacity: 0.6, fontSize: 10 }}
                tickLine={{ stroke: 'var(--foreground)', opacity: 0.2 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                domain={[maxRank - (worstRank || maxRank), maxRank - (bestRank || 1)]}
                axisLine={false}
                tick={<CustomYAxisTick />}
                tickLine={{ stroke: 'var(--foreground)', opacity: 0.2 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="displayRank"
                stroke="var(--rating-yellow)"
                strokeWidth={3}
                fill="url(#rankGradient)"
                dot={<CustomDot />}
                activeDot={{ 
                  r: 7,
                  fill: 'var(--rating-yellow)',
                  stroke: 'var(--background)',
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 opacity-60" style={{ color: 'var(--foreground)' }}>
          No ranking data available for this season
        </div>
      )}
    </div>
  );
}