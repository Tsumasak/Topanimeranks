// ============================================
// Anime Data Service
// NUNCA chama Jikan API diretamente
// Apenas lê dados do Supabase (cache)
// ============================================

import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Episode, AnticipatedAnime, WeekData, SeasonData } from '../types/anime';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8`;

type ProgressCallback = (current: number, total: number, message: string) => void;

export class AnimeDataService {
  // Helper: Convert database episode to Episode type
  private static convertDbEpisodeToEpisode(dbEpisode: any): Episode {
    return {
      id: dbEpisode.episode_number,
      animeId: dbEpisode.anime_id,
      animeTitle: dbEpisode.anime_title_english || dbEpisode.anime_title,
      episodeNumber: dbEpisode.episode_number,
      episodeTitle: `Episode ${dbEpisode.episode_number}`,
      episodeUrl: dbEpisode.episode_url || `https://myanimelist.net/anime/${dbEpisode.anime_id}`,
      episodeScore: dbEpisode.episode_score || dbEpisode.score || 0,
      imageUrl: dbEpisode.anime_image_url || '',
      aired: dbEpisode.aired_at || new Date().toISOString(),
      animeType: dbEpisode.type || 'TV',
      demographics: Array.isArray(dbEpisode.demographics) 
        ? dbEpisode.demographics.map((d: any) => typeof d === 'string' ? d : d.name) 
        : [],
      genres: Array.isArray(dbEpisode.genres) 
        ? dbEpisode.genres.map((g: any) => typeof g === 'string' ? g : g.name) 
        : [],
      themes: Array.isArray(dbEpisode.themes) 
        ? dbEpisode.themes.map((t: any) => typeof t === 'string' ? t : t.name) 
        : [],
      url: dbEpisode.forum_url || `https://myanimelist.net/anime/${dbEpisode.anime_id}`,
      isManual: dbEpisode.is_manual || false,
    };
  }

  // Helper: Convert database anime to AnticipatedAnime type
  private static convertDbAnimeToAnticipatedAnime(dbAnime: any): AnticipatedAnime {
    return {
      id: dbAnime.anime_id,
      title: dbAnime.title_english || dbAnime.title,
      imageUrl: dbAnime.image_url || '',
      animeScore: dbAnime.score || 0,
      members: dbAnime.members || 0,
      synopsis: dbAnime.synopsis || '',
      animeType: dbAnime.type || 'TV',
      season: dbAnime.season || 'unknown',
      year: dbAnime.year || 2025,
      demographics: Array.isArray(dbAnime.demographics) 
        ? dbAnime.demographics.map((d: any) => typeof d === 'string' ? d : d.name) 
        : [],
      genres: Array.isArray(dbAnime.genres) 
        ? dbAnime.genres.map((g: any) => typeof g === 'string' ? g : g.name) 
        : [],
      themes: Array.isArray(dbAnime.themes) 
        ? dbAnime.themes.map((t: any) => typeof t === 'string' ? t : t.name) 
        : [],
      studios: Array.isArray(dbAnime.studios) 
        ? dbAnime.studios.map((s: any) => typeof s === 'string' ? s : s.name) 
        : [],
      url: `https://myanimelist.net/anime/${dbAnime.anime_id}`,
    };
  }

  // ============================================
  // GET WEEK DATA (from Supabase only)
  // ============================================
  static async getWeekData(
    weekNumber: number, 
    onProgress?: ProgressCallback
  ): Promise<WeekData> {
    onProgress?.(0, 100, 'Loading from database...');

    try {
      console.log(`[AnimeData] Fetching week ${weekNumber} from Supabase...`);
      
      const response = await fetch(
        `${SERVER_URL}/weekly-episodes/${weekNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[AnimeData] Response is not JSON:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }

      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        console.log(`[AnimeData] No data in Supabase for week ${weekNumber}`);
        
        onProgress?.(100, 100, 'No data available');
        
        // Return empty week data
        const baseDate = new Date(Date.UTC(2025, 8, 29)); // September 29, 2025
        const weekStart = new Date(baseDate);
        weekStart.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        weekStart.setUTCHours(0, 0, 0, 0);
        weekEnd.setUTCHours(23, 59, 59, 999);

        return {
          weekNumber,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          episodes: [],
        };
      }

      onProgress?.(50, 100, 'Processing data...');

      const episodes = result.data.map((dbEp: any) => 
        this.convertDbEpisodeToEpisode(dbEp)
      );

      console.log(`[AnimeData] ✓ Loaded ${episodes.length} episodes from Supabase`);

      onProgress?.(100, 100, 'Complete!');

      // Calculate week dates
      const baseDate = new Date(Date.UTC(2025, 8, 29)); // September 29, 2025
      const weekStart = new Date(baseDate);
      weekStart.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
      weekStart.setUTCHours(0, 0, 0, 0);
      weekEnd.setUTCHours(23, 59, 59, 999);

      return {
        weekNumber,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        episodes,
      };
    } catch (error) {
      console.error('[AnimeData] Error fetching weekly episodes:', error);
      
      onProgress?.(100, 100, 'Error loading data');
      
      // Return empty week data on error
      const baseDate = new Date(Date.UTC(2025, 8, 29));
      const weekStart = new Date(baseDate);
      weekStart.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
      weekStart.setUTCHours(0, 0, 0, 0);
      weekEnd.setUTCHours(23, 59, 59, 999);

      return {
        weekNumber,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        episodes: [],
      };
    }
  }

  // ============================================
  // GET SEASON DATA (from Supabase only)
  // ============================================
  static async getAnticipatedBySeason(
    season: string,
    year: number,
    onProgress?: ProgressCallback
  ): Promise<SeasonData> {
    onProgress?.(0, 100, 'Loading from database...');

    try {
      console.log(`[AnimeData] Fetching ${season} ${year} from Supabase...`);
      
      const response = await fetch(
        `${SERVER_URL}/season-rankings/${season}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[AnimeData] Response is not JSON:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }

      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        console.log(`[AnimeData] No data in Supabase for ${season} ${year}`);
        
        onProgress?.(100, 100, 'No data available');
        
        return {
          season,
          animes: [],
        };
      }

      onProgress?.(50, 100, 'Processing data...');

      const animes = result.data.map((dbAnime: any) => 
        this.convertDbAnimeToAnticipatedAnime(dbAnime)
      );

      console.log(`[AnimeData] ✓ Loaded ${animes.length} animes from Supabase`);

      onProgress?.(100, 100, 'Complete!');

      return {
        season,
        animes,
      };
    } catch (error) {
      console.error('[AnimeData] Error fetching season rankings:', error);
      
      onProgress?.(100, 100, 'Error loading data');
      
      return {
        season,
        animes: [],
      };
    }
  }

  // ============================================
  // GET ANTICIPATED ANIMES (from Supabase only)
  // ============================================
  static async getAnticipatedAnimes(
    onProgress?: ProgressCallback
  ): Promise<AnticipatedAnime[]> {
    onProgress?.(0, 100, 'Loading from database...');

    try {
      console.log(`[AnimeData] Fetching anticipated animes from Supabase...`);
      
      const response = await fetch(
        `${SERVER_URL}/anticipated-animes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[AnimeData] Response is not JSON:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }

      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        console.log(`[AnimeData] No anticipated data in Supabase`);
        
        onProgress?.(100, 100, 'No data available');
        
        return [];
      }

      onProgress?.(50, 100, 'Processing data...');

      const animes = result.data.map((dbAnime: any) => 
        this.convertDbAnimeToAnticipatedAnime(dbAnime)
      );

      console.log(`[AnimeData] ✓ Loaded ${animes.length} anticipated animes from Supabase`);

      onProgress?.(100, 100, 'Complete!');

      return animes;
    } catch (error) {
      console.error('[AnimeData] Error fetching anticipated animes:', error);
      
      onProgress?.(100, 100, 'Error loading data');
      
      return [];
    }
  }

  // ============================================
  // TRIGGER MANUAL SYNC (for testing/setup)
  // ============================================
  static async triggerSync(syncType: 'weekly_episodes' | 'season_rankings' | 'anticipated'): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      console.log(`[AnimeData] Triggering manual sync: ${syncType}`);
      
      const syncUrl = `https://${projectId}.supabase.co/functions/v1/sync-anime-data`;
      
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ sync_type: syncType }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[AnimeData] Response is not JSON:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }

      const result = await response.json();

      if (result.success) {
        console.log(`[AnimeData] ✓ Sync completed: ${syncType}`);
        return {
          success: true,
          message: `Sync completed successfully for ${syncType}`,
        };
      } else {
        console.error(`[AnimeData] ✗ Sync failed: ${syncType}`, result.error);
        return {
          success: false,
          error: result.error || 'Unknown error',
        };
      }
    } catch (error) {
      console.error('[AnimeData] Error triggering sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}