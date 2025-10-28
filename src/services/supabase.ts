// ============================================
// Supabase Service - Fast data fetching
// ============================================

import { createClient } from '@supabase/supabase-js';
import type { 
  Episode, 
  AnticipatedAnime,
  JikanAnimeData
} from '../types/anime';
import { JikanService } from './jikan';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Initialize Supabase client
const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : '';
const supabaseAnonKey = publicAnonKey || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Check if Supabase is configured
// ============================================
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
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

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        console.log(`[SupabaseService] ✅ Found ${result.data.length} episodes in Supabase cache`);
        
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
          demographics: Array.isArray(row.demographic) ? row.demographic : [],
          genres: Array.isArray(row.genre) ? row.genre : [],
          themes: Array.isArray(row.theme) ? row.theme : [],
          url: row.from_url || `https://myanimelist.net/anime/${row.anime_id}`,
          isManual: row.is_manual || false,
        }));

        onProgress?.(100, 100, 'Complete!');

        // Calculate dates from first episode
        const firstEpisode = result.data[0];
        return {
          episodes,
          startDate: firstEpisode.week_start_date,
          endDate: firstEpisode.week_end_date,
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

/**
 * Merge manual episodes with API data
 * Note: Manual episodes are already merged in JikanService.getWeekData
 * This function is here for consistency but manual episodes from config
 * should ideally be handled by the sync function, not the frontend
 */
async function mergeManualEpisodes(
  apiEpisodes: Episode[],
  weekNumber: number
): Promise<Episode[]> {
  // For now, just return the API episodes
  // Manual episodes should be synced to Supabase by the Edge Function
  // If needed, we could fetch and convert them here using JikanService
  return apiEpisodes;
}

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
      if (orderBy === 'members') {
        query = query
          .order('members', { ascending: false, nullsFirst: false })
          .order('anime_score', { ascending: false });
      } else {
        // Order by score (rating) for "Top Animes"
        query = query
          .order('anime_score', { ascending: false, nullsFirst: false })
          .order('scored_by', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SupabaseService] Query error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`[SupabaseService] ✅ Found ${data.length} animes`);
        
        // Transform Supabase data to JikanAnimeData format
        const animes: JikanAnimeData[] = data.map(row => ({
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
          score: row.score,
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
          demographics: row.demographics || [],
          genres: row.genres || [],
          themes: row.themes || [],
          studios: row.studios || [],
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
      const filteredData = allData?.filter(row => {
        const season = row.season?.toLowerCase();
        const year = row.year;
        const status = row.status;
        
        // Only include "Not yet aired" animes
        if (status !== 'Not yet aired') return false;
        
        // Exclude these specific seasons that have their own tabs
        if (season === 'fall' && year === 2025) return false;
        if (season === 'winter' && year === 2026) return false;
        if (season === 'spring' && year === 2026) return false;
        
        return true;
      }) || [];

      // Sort by members first, then score
      const sortedData = filteredData.sort((a, b) => {
        const membersA = a.members || 0;
        const membersB = b.members || 0;
        if (membersB !== membersA) return membersB - membersA;
        return (b.score || 0) - (a.score || 0);
      });

      if (sortedData.length > 0) {
        console.log(`[SupabaseService] ✅ Found ${sortedData.length} Later animes`);
        
        // Transform to JikanAnimeData format (same as getSeasonRankings)
        const animes: JikanAnimeData[] = sortedData.map(row => ({
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
          score: row.score,
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
          demographics: row.demographics || [],
          genres: row.genres || [],
          themes: row.themes || [],
          studios: row.studios || [],
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
        const animes: AnticipatedAnime[] = data.map(row => ({
          mal_id: row.anime_id,
          title: row.title,
          title_english: row.title_english,
          images: {
            jpg: {
              large_image_url: row.image_url,
            },
          },
          score: row.score,
          scored_by: row.scored_by,
          members: row.members,
          favorites: row.favorites,
          type: row.type,
          status: row.status,
          rating: row.rating,
          source: row.source,
          episodes: row.episodes,
          aired: {
            from: row.aired_from,
          },
          synopsis: row.synopsis,
          demographics: row.demographics,
          genres: row.genres,
          themes: row.themes,
          studios: row.studios,
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

    return (data || []).map(row => ({
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
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-anime-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ sync_type: syncType }),
    });

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
  getSyncStatus,
  triggerManualSync,
  isConfigured: isSupabaseConfigured,
};
