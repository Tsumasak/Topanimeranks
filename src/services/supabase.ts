// ============================================
// Supabase Service - Fast data fetching
// ============================================

import { supabase } from '../utils/supabase/client';
import type { 
  Episode, 
  AnticipatedAnime,
  JikanAnimeData
} from '../types/anime';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Re-export the singleton instance
export { supabase };

// ============================================
// SEASON UTILITIES (copied from server)
// ============================================

/**
 * Calculate week dates for Winter 2026 following the same logic as server
 * Week 1: Season start (Jan 1) to first Sunday
 * Week 2+: Monday to Sunday (full weeks)
 */
function calculateWeekDates(weekNumber: number): { startDate: string; endDate: string } {
  // Winter 2026 starts January 1, 2026 (Wednesday)
  const seasonStart = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));
  
  // Find the first Sunday of the season
  const firstSunday = new Date(seasonStart);
  const dayOfWeek = firstSunday.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
  firstSunday.setUTCDate(firstSunday.getUTCDate() + daysUntilSunday);
  firstSunday.setUTCHours(23, 59, 59, 999);
  
  if (weekNumber === 1) {
    // Week 1: Season start to first Sunday
    return {
      startDate: seasonStart.toISOString().split('T')[0],
      endDate: firstSunday.toISOString().split('T')[0],
    };
  }
  
  // Week 2+: Monday to Sunday (full weeks)
  const firstMonday = new Date(firstSunday);
  firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);
  firstMonday.setUTCHours(0, 0, 0, 0);
  
  // Calculate start of requested week
  const weekStart = new Date(firstMonday);
  weekStart.setUTCDate(firstMonday.getUTCDate() + (weekNumber - 2) * 7);
  
  // Calculate end of requested week (6 days later)
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  
  return {
    startDate: weekStart.toISOString().split('T')[0],
    endDate: weekEnd.toISOString().split('T')[0],
  };
}

// Define types for Supabase rows
interface SeasonRankingRow {
  anime_id: number;
  title: string;
  title_english: string;
  image_url: string;
  anime_score: number | null; // FIXED: Changed from 'score' to 'anime_score'
  scored_by: number | null;
  members: number;
  favorites: number;
  popularity: number;
  rank: number;
  type: string;
  status: string;
  episodes: number | null;
  aired_from: string | null;
  aired_to: string | null;
  season: string;
  year: number;
  synopsis: string;
  demographics: any[];
  genres: any[];
  themes: any[];
  studios: any[];
}

interface AnticipatedAnimeRow {
  anime_id: number;
  title: string;
  title_english: string;
  image_url: string;
  score: number | null; // FIXED: Match the anticipated_animes table column name
  scored_by: number | null;
  members: number;
  favorites: number | null;
  synopsis: string;
  type: string;
  status: string;
  rating: string | null;
  source: string | null;
  episodes: number | null;
  aired_from: string | null;
  season: string;
  year: number;
  demographics: any[];
  genres: any[];
  themes: any[];
  studios: any[];
}

interface SyncStatusRow {
  sync_type: string;
  status: string;
  items_synced: number;
  duration_ms: number;
  created_at: string;
  error_message?: string;
}

// ============================================
// Check if Supabase is configured
// ============================================
export const isSupabaseConfigured = () => {
  return Boolean(projectId && publicAnonKey);
};

// ============================================
// Helper function to convert string arrays to object arrays
// ============================================
const convertToObjectArray = (arr: any[]): Array<{ mal_id: number; name: string }> => {
  return (arr || []).map((item: any) => 
    typeof item === 'string' ? { mal_id: 0, name: item } : item
  );
};

// ============================================
// WEEKLY EPISODES
// ============================================

export interface WeekData {
  episodes: Episode[];
  startDate: string;
  endDate: string;
}

/**
 * Get weekly episodes from Supabase (fast!) with fallback to Jikan
 */
export async function getWeeklyEpisodes(
  weekNumber: number,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<WeekData> {
  console.log(`[SupabaseService] Fetching week ${weekNumber}...`);

  // Try Supabase via server endpoint first
  if (isSupabaseConfigured()) {
    try {
      onProgress?.(10, 100, 'Checking Supabase cache...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/weekly-episodes/${weekNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        console.log(`[SupabaseService] ✅ Found ${result.data.length} episodes in Supabase cache`);
        console.log('[SupabaseService] First episode data:', result.data[0]);
        
        onProgress?.(50, 100, 'Loading from cache...');
        
        // Transform Supabase data to Episode format
        const episodes: Episode[] = result.data.map((row: any) => ({
          id: parseInt(row.episode_id?.split('_')[0]) || row.anime_id,
          animeId: row.anime_id,
          animeTitle: row.anime_title_english || row.anime_title || '',
          episodeNumber: row.episode_number,
          episodeTitle: row.episode_name || `Episode ${row.episode_number}`,
          episodeScore: row.episode_score ?? null,
          episodeUrl: row.from_url || `https://myanimelist.net/anime/${row.anime_id}`,
          score: row.episode_score ?? null,
          imageUrl: row.anime_image_url || '',
          aired: row.aired_at || '',
          animeType: row.type || 'TV',
          demographics: Array.isArray(row.demographic) ? row.demographic.map((d: any) => typeof d === 'string' ? d : d.name) : [],
          genres: Array.isArray(row.genre) ? row.genre.map((g: any) => typeof g === 'string' ? g : g.name) : [],
          themes: Array.isArray(row.theme) ? row.theme.map((t: any) => typeof t === 'string' ? t : t.name) : [],
          url: row.from_url || `https://myanimelist.net/anime/${row.anime_id}`,
          isManual: row.is_manual || false,
        }));

        onProgress?.(100, 100, 'Complete!');

        // Calculate dates from first episode
        const firstEpisode = result.data[0];
        const startDate = firstEpisode.week_start_date || firstEpisode.week_start || '';
        const endDate = firstEpisode.week_end_date || firstEpisode.week_end || '';
        
        console.log('[SupabaseService] Week dates from first episode:', { 
          week_start_date: firstEpisode.week_start_date,
          week_end_date: firstEpisode.week_end_date,
          week_start: firstEpisode.week_start,
          week_end: firstEpisode.week_end,
          finalStartDate: startDate,
          finalEndDate: endDate
        });
        
        // If dates are still empty, calculate them from week number (FALLBACK)
        if (!startDate || !endDate) {
          console.log(`[SupabaseService] ℹ️ Using calculated dates for week ${weekNumber} (migration pending)`);
          
          // Use the same logic as server: Week 1 goes to first Sunday, Week 2+ are full weeks
          const { startDate: calcStart, endDate: calcEnd } = calculateWeekDates(weekNumber);
          
          return {
            episodes,
            startDate: calcStart,
            endDate: calcEnd,
          };
        }
        
        return {
          episodes,
          startDate,
          endDate,
        };
      }

      console.log('[SupabaseService] ⚠️ No data in Supabase, falling back to Jikan...');
    } catch (error) {
      console.error('[SupabaseService] Error:', error);
      console.log('[SupabaseService] Falling back to Jikan...');
    }
  }

  // NO FALLBACK TO JIKAN - Data must be in Supabase
  console.log('[SupabaseService] ❌ No data in Supabase. Please run sync job first.');
  onProgress?.(100, 100, 'No data available - sync required');
  
  // Return empty data
  const baseDate = new Date(Date.UTC(2025, 8, 29)); // September 29, 2025
  const weekStart = new Date(baseDate);
  weekStart.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekStart.setUTCHours(0, 0, 0, 0);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return {
    episodes: [],
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
  };
}

// ============================================
// EPISODE RANK CALCULATION WITH CACHE
// ============================================

// Cache para evitar queries repetidas por week
const weekRankingsCache = new Map<number, Array<{ episode_id: string; episode_score: number }>>();

/**
 * Calcula o rank de um episódio dentro da sua week baseado no episode_score
 * Usa cache por week_number para evitar queries repetidas
 */
export async function getEpisodeRankInWeek(
  weekNumber: number,
  episodeId: string,
  episodeScore: number
): Promise<number> {
  try {
    if (!weekRankingsCache.has(weekNumber)) {
      const { data, error } = await supabase
        .from('weekly_episodes')
        .select('episode_id, episode_score')
        .eq('week_number', weekNumber)
        .not('episode_score', 'is', null)
        .order('episode_score', { ascending: false });
      
      if (error) {
        console.error('Error fetching week rankings:', error);
        return 0;
      }
      
      weekRankingsCache.set(weekNumber, data || []);
    }
    
    const rankings = weekRankingsCache.get(weekNumber) || [];
    const position = rankings.findIndex(ep => ep.episode_id === episodeId);
    
    if (position === -1) {
      const positionByScore = rankings.findIndex(ep => ep.episode_score === episodeScore);
      return positionByScore !== -1 ? positionByScore + 1 : 0;
    }
    
    return position + 1;
    
  } catch (error) {
    console.error('Error calculating episode rank:', error);
    return 0;
  }
}

/**
 * Limpa o cache de rankings (útil quando dados são atualizados)
 */
export function clearWeekRankingsCache(weekNumber?: number) {
  if (weekNumber !== undefined) {
    weekRankingsCache.delete(weekNumber);
  } else {
    weekRankingsCache.clear();
  }
}

/**
 * Merge manual episodes with API data
 * Note: Manual episodes are already merged in JikanService.getWeekData
 * This function is here for consistency but manual episodes from config
 * should ideally be handled by the sync function, not the frontend
 */
// async function mergeManualEpisodes(
//   apiEpisodes: Episode[],
//   weekNumber: number
// ): Promise<Episode[]> {
//   // For now, just return the API episodes
//   // Manual episodes should be synced to Supabase by the Edge Function
//   // If needed, we could fetch and convert them here using JikanService
//   return apiEpisodes;
// }

// ============================================
// SEASON RANKINGS
// ============================================

/**
 * Get season rankings from Supabase with fallback to Jikan
 * @param orderBy - 'score' for rating-based ranking, 'members' for popularity-based ranking
 */
export async function getSeasonRankings(
  season: string,
  year: number,
  orderBy: 'score' | 'members' = 'score'
): Promise<JikanAnimeData[]> {
  console.log(`[SupabaseService] Fetching ${season} ${year} rankings (ordered by ${orderBy})...`);

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      // Case-insensitive search using ilike
      let query = supabase
        .from('season_rankings')
        .select('*')
        .ilike('season', season) // Case-insensitive match
        .eq('year', year);

      // Order by requested field
      // IMPORTANT: Show ALL animes, even those without scores yet (nulls last)
      if (orderBy === 'members') {
        query = query
          .order('members', { ascending: false, nullsFirst: false })
          .order('anime_score', { ascending: false, nullsFirst: false }); // FIXED: Changed 'score' to 'anime_score'
      } else {
        // Order by score (rating) for "Top Animes"
        // nullsFirst: false means animes without scores go to the end
        query = query
          .order('anime_score', { ascending: false, nullsFirst: false }) // FIXED: Changed 'score' to 'anime_score'
          .order('scored_by', { ascending: false, nullsFirst: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SupabaseService] Query error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`[SupabaseService] ✅ Found ${data.length} animes`);
        
        // Transform Supabase data to JikanAnimeData format
        const animes: JikanAnimeData[] = (data as SeasonRankingRow[]).map(row => ({
          mal_id: row.anime_id,
          url: `https://myanimelist.net/anime/${row.anime_id}`,
          title: row.title,
          title_english: row.title_english,
          title_japanese: null,
          images: {
            jpg: {
              image_url: row.image_url || '',
              small_image_url: row.image_url || '',
              large_image_url: row.image_url || '',
            },
            webp: {
              image_url: row.image_url || '',
              small_image_url: row.image_url || '',
              large_image_url: row.image_url || '',
            },
          },
          score: row.anime_score, // FIXED: Changed from 'score' to 'anime_score'
          scored_by: row.scored_by,
          members: row.members,
          favorites: row.favorites,
          popularity: row.popularity,
          rank: row.rank,
          type: row.type || 'TV',
          status: row.status || 'Currently Airing',
          episodes: row.episodes,
          aired: {
            from: row.aired_from || '',
            to: row.aired_to || null,
          },
          season: row.season,
          year: row.year,
          synopsis: row.synopsis,
          demographics: convertToObjectArray(row.demographics),
          genres: convertToObjectArray(row.genres),
          themes: convertToObjectArray(row.themes),
          studios: convertToObjectArray(row.studios),
        }));

        return animes;
      }

      console.log('[SupabaseService] ⚠️ No data found for the specified season/year');
    } catch (error) {
      console.error('[SupabaseService] Error:', error);
    }
  }

  return [];
}

/**
 * Get "Later" animes - all upcoming animes EXCEPT Fall 2025, Winter 2026, Spring 2026
 */
export async function getLaterAnimes(): Promise<JikanAnimeData[]> {
  console.log('[SupabaseService] Fetching Later animes (all upcoming)...');

  if (isSupabaseConfigured()) {
    try {
      // Get ALL animes from season_rankings
      const { data: allData, error } = await supabase
        .from('season_rankings')
        .select('*');

      if (error) {
        console.error('[SupabaseService] Query error:', error);
        throw error;
      }

      // Filter out ONLY Fall 2025, Winter 2026, Spring 2026
      // Keep everything else including 'upcoming' animes
      // IMPORTANT: Only show "Not yet aired" animes
      // INCLUDE: Summer 2026+, year 2026+ without season, 2027+, future dates, "Not available"
      const filteredData = (allData as SeasonRankingRow[])?.filter(row => {
        const season = row.season?.toLowerCase();
        const year = row.year;
        const status = row.status;
        const airedFrom = row.aired_from ? new Date(row.aired_from) : null;
        const now = new Date();
        
        // Only include "Not yet aired" animes
        if (status !== 'Not yet aired') return false;
        
        // Exclude these specific seasons that have their own tabs
        if (season === 'fall' && year === 2025) return false;
        if (season === 'winter' && year === 2026) return false;
        if (season === 'spring' && year === 2026) return false;
        
        // INCLUDE all of these cases:
        // 1. Summer 2026 and beyond (explicit season/year)
        if (season && year >= 2026) return true;
        
        // 2. Year 2026+ without specific season (e.g., "2026 to ?")
        if (!season && year >= 2026) return true;
        
        // 3. Year 2027+ (any case)
        if (year >= 2027) return true;
        
        // 4. Future aired_from date (e.g., "Aired: Not available" but has future date)
        if (airedFrom && airedFrom > now) return true;
        
        // 5. No aired_from and no season (e.g., "Aired: Not available")
        // Include if it's marked as "Not yet aired"
        if (!airedFrom && !season) return true;
        
        return false;
      }) || [];

      // Sort by members first, then score
      const sortedData = filteredData.sort((a, b) => {
        const membersA = a.members || 0;
        const membersB = b.members || 0;
        if (membersB !== membersA) return membersB - membersA;
        return (b.anime_score || 0) - (a.anime_score || 0); // FIXED: Changed from 'score' to 'anime_score'
      });

      if (sortedData.length > 0) {
        console.log(`[SupabaseService] ✅ Found ${sortedData.length} Later animes`);
        
        // Log breakdown of types
        const breakdown = {
          withSeason: sortedData.filter(r => r.season).length,
          withoutSeason: sortedData.filter(r => !r.season).length,
          year2026: sortedData.filter(r => r.year === 2026).length,
          year2027Plus: sortedData.filter(r => r.year >= 2027).length,
          noAiredFrom: sortedData.filter(r => !r.aired_from).length,
        };
        console.log(`[SupabaseService] 📊 Breakdown:`, breakdown);
        
        // Transform to JikanAnimeData format (same as getSeasonRankings)
        const animes: JikanAnimeData[] = (sortedData as SeasonRankingRow[]).map(row => ({
          mal_id: row.anime_id,
          url: `https://myanimelist.net/anime/${row.anime_id}`,
          title: row.title,
          title_english: row.title_english,
          title_japanese: null,
          images: {
            jpg: {
              image_url: row.image_url || '',
              small_image_url: row.image_url || '',
              large_image_url: row.image_url || '',
            },
            webp: {
              image_url: row.image_url || '',
              small_image_url: row.image_url || '',
              large_image_url: row.image_url || '',
            },
          },
          score: row.anime_score, // FIXED: Changed from 'score' to 'anime_score'
          scored_by: row.scored_by,
          members: row.members,
          favorites: row.favorites,
          popularity: row.popularity,
          rank: row.rank,
          type: row.type || 'TV',
          status: row.status || 'Not yet aired',
          episodes: row.episodes,
          aired: {
            from: row.aired_from || '',
            to: row.aired_to || null,
          },
          season: row.season,
          year: row.year,
          synopsis: row.synopsis,
          demographics: convertToObjectArray(row.demographics),
          genres: convertToObjectArray(row.genres),
          themes: convertToObjectArray(row.themes),
          studios: convertToObjectArray(row.studios),
        }));

        return animes;
      }

      console.log('[SupabaseService] ⚠️ No Later animes found');
    } catch (error) {
      console.error('[SupabaseService] Error:', error);
    }
  }

  return [];
}

// ============================================
// ANTICIPATED ANIMES
// ============================================

/**
 * Get anticipated animes from Supabase with fallback to Jikan
 */
export async function getAnticipatedAnimes(): Promise<AnticipatedAnime[]> {
  console.log('[SupabaseService] Fetching anticipated animes...');

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('anticipated_animes')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        console.error('[SupabaseService] Query error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`[SupabaseService] ✅ Found ${data.length} anticipated animes in Supabase`);
        
        // Transform Supabase data to AnticipatedAnime format
        const animes: AnticipatedAnime[] = (data as AnticipatedAnimeRow[]).map(row => ({
          id: row.anime_id,
          title: row.title_english || row.title,
          imageUrl: row.image_url,
          animeScore: row.score, // FIXED: Changed from 'anime_score' to 'score'
          members: row.members,
          synopsis: row.synopsis || '',
          animeType: row.type || 'TV',
          season: row.season, // CRITICAL: Keep null as null, don't use fallback
          year: row.year, // CRITICAL: Keep null as null, don't use fallback
          demographics: row.demographics || [],
          genres: row.genres || [],
          themes: row.themes || [],
          studios: row.studios || [],
          url: `/anime/${row.anime_id}`, // FIXED: Internal link instead of MAL
        }));

        return animes;
      }

      console.log('[SupabaseService] ⚠️ No data in Supabase, falling back to Jikan...');
    } catch (error) {
      console.error('[SupabaseService] Error:', error);
      console.log('[SupabaseService] Falling back to Jikan...');
    }
  }

  // NO FALLBACK TO JIKAN - Data must be in Supabase
  console.log('[SupabaseService] ❌ No data in Supabase. Please run sync job first.');
  return [];
}

/**
 * Get anticipated animes filtered by season and year from Supabase
 */
export async function getAnticipatedAnimesBySeason(season: string, year: number): Promise<AnticipatedAnime[]> {
  console.log(`[SupabaseService] Fetching anticipated animes for ${season} ${year}...`);

  // Get all anticipated animes and filter client-side
  // (season/year columns don't exist in the table, data is parsed from MAL API seasonally)
  const allAnimes = await getAnticipatedAnimes();
  
  // Filter by season and year in the anime data
  const filtered = allAnimes.filter(anime => {
    const animeSeason = anime.season?.toLowerCase();
    const animeYear = anime.year;
    return animeSeason === season.toLowerCase() && animeYear === year;
  });

  console.log(`[SupabaseService] ✅ Filtered ${filtered.length} animes for ${season} ${year}`);
  return filtered;
}

/**
 * Get "later" anticipated animes (Fall 2026 onwards) from Supabase
 * EXCLUDES animes that are already shown in Winter, Spring, and Summer 2026 tabs
 */
export async function getAnticipatedAnimesLater(): Promise<AnticipatedAnime[]> {
  console.log('[SupabaseService] Fetching later anticipated animes...');

  // Get all anticipated animes and filter client-side
  const allAnimes = await getAnticipatedAnimes();
  
  // First, get IDs of animes already shown in Winter, Spring, and Summer 2026
  const winterAnimes = allAnimes.filter(anime => 
    anime.season?.toLowerCase() === 'winter' && anime.year === 2026
  );
  const springAnimes = allAnimes.filter(anime => 
    anime.season?.toLowerCase() === 'spring' && anime.year === 2026
  );
  const summerAnimes = allAnimes.filter(anime => 
    anime.season?.toLowerCase() === 'summer' && anime.year === 2026
  );
  
  const shownAnimeIds = new Set([
    ...winterAnimes.map(a => a.id),
    ...springAnimes.map(a => a.id),
    ...summerAnimes.map(a => a.id)
  ]);
  
  console.log(`[SupabaseService] 🔍 Excluding ${shownAnimeIds.size} animes already shown in Winter/Spring/Summer 2026`);
  
  // Filter for Fall 2026 onwards, EXCLUDING animes already shown
  const filtered = allAnimes.filter(anime => {
    const animeSeason = anime.season?.toLowerCase();
    const animeYear = anime.year;
    
    // CRITICAL: Exclude if already shown in Winter, Spring, or Summer 2026
    if (shownAnimeIds.has(anime.id)) {
      console.log(`[SupabaseService] ⏭️  Skipping ${anime.title} (ID: ${anime.id}) - already in Winter/Spring/Summer`);
      return false;
    }
    
    // INCLUDE animes with null season/year (upcoming animes without defined release date)
    if (!animeYear || !animeSeason) {
      console.log(`[SupabaseService] ✅ Including ${anime.title} (ID: ${anime.id}) - null season/year (upcoming)`);
      return true;
    }
    
    // Include if year > 2026
    if (animeYear > 2026) return true;
    
    // Include if year === 2026 and season is fall
    if (animeYear === 2026 && animeSeason === 'fall') {
      return true;
    }
    
    return false;
  });

  console.log(`[SupabaseService] ✅ Filtered ${filtered.length} later anticipated animes (after exclusions)`);
  
  // DEBUG: Log FIRST 3 rows BEFORE transformation
  console.log('[SupabaseService] 🔍 First 3 rows BEFORE transformation:', filtered.slice(0, 3).map(row => ({
    anime_id: row.id,
    title: row.title,
    image_url: row.imageUrl,
    image_url_type: typeof row.imageUrl,
    image_url_length: row.imageUrl?.length,
  })));
  
  return filtered;
}

// ============================================
// SYNC STATUS
// ============================================

export interface SyncStatus {
  syncType: string;
  status: string;
  itemsSynced: number;
  durationMs: number;
  createdAt: string;
  errorMessage?: string;
}

/**
 * Get latest sync status
 */
export async function getSyncStatus(): Promise<SyncStatus[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('latest_sync_status')
      .select('*');

    if (error) {
      console.error('[SupabaseService] Error fetching sync status:', error);
      return [];
    }

    return ((data || []) as SyncStatusRow[]).map(row => ({
      syncType: row.sync_type,
      status: row.status,
      itemsSynced: row.items_synced || 0,
      durationMs: row.duration_ms || 0,
      createdAt: row.created_at,
      errorMessage: row.error_message,
    }));
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    return [];
  }
}

/**
 * Manually trigger a sync (for testing/admin)
 */
export async function triggerManualSync(syncType: 'weekly_episodes' | 'season_rankings' | 'anticipated') {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  console.log(`[SupabaseService] Triggering manual sync: ${syncType}`);

  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/sync-anime-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ sync_type: syncType }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
    }

    const result = await response.json();
    console.log('[SupabaseService] Sync result:', result);
    
    return result;
  } catch (error) {
    console.error('[SupabaseService] Sync error:', error);
    throw error;
  }
}

export const SupabaseService = {
  getWeeklyEpisodes,
  getSeasonRankings,
  getLaterAnimes,
  getAnticipatedAnimes,
  getAnticipatedAnimesBySeason,
  getAnticipatedAnimesLater,
  getSyncStatus,
  triggerManualSync,
  isConfigured: isSupabaseConfigured,
};