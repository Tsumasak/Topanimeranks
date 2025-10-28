import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Episode, AnticipatedAnime, WeekData, SeasonData } from '../types/anime';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8`;

export class SupabaseDataService {
  // Helper: Convert database episode to Episode type
  private static convertDbEpisodeToEpisode(dbEpisode: any): Episode {
    return {
      id: dbEpisode.episode_number,
      animeId: dbEpisode.anime_id,
      animeTitle: dbEpisode.anime_title_english || dbEpisode.anime_title,
      episodeNumber: dbEpisode.episode_number,
      episodeTitle: dbEpisode.episode_title || `Episode ${dbEpisode.episode_number}`,
      episodeUrl: dbEpisode.episode_url || `https://myanimelist.net/anime/${dbEpisode.anime_id}`,
      episodeScore: dbEpisode.episode_score || 0,
      imageUrl: dbEpisode.anime_image_url || '',
      aired: dbEpisode.aired_at || new Date().toISOString(),
      animeType: dbEpisode.type || 'TV',
      demographics: Array.isArray(dbEpisode.demographics) ? dbEpisode.demographics.map((d: any) => d.name || d) : [],
      genres: Array.isArray(dbEpisode.genres) ? dbEpisode.genres.map((g: any) => g.name || g) : [],
      themes: Array.isArray(dbEpisode.themes) ? dbEpisode.themes.map((t: any) => t.name || t) : [],
      url: dbEpisode.forum_url || `https://myanimelist.net/anime/${dbEpisode.anime_id}`,
      trend: dbEpisode.trend || 'NEW',
      positionInWeek: dbEpisode.position_in_week,
      isManual: dbEpisode.is_manual || false,
    };
  }

  // Helper: Convert database anime to AnticipatedAnime type
  private static convertDbAnimeToAnticipatedAnime(dbAnime: any): AnticipatedAnime {
    return {
      id: dbAnime.anime_id,
      title: dbAnime.title_english || dbAnime.title,
      imageUrl: dbAnime.image_url || '',
      animeScore: dbAnime.anime_score || 0,
      members: dbAnime.members || 0,
      synopsis: dbAnime.synopsis || '',
      animeType: dbAnime.type || 'TV',
      season: dbAnime.season || 'unknown',
      year: dbAnime.year || 2025,
      demographics: Array.isArray(dbAnime.demographics) ? dbAnime.demographics.map((d: any) => d.name || d) : [],
      genres: Array.isArray(dbAnime.genres) ? dbAnime.genres.map((g: any) => g.name || g) : [],
      themes: Array.isArray(dbAnime.themes) ? dbAnime.themes.map((t: any) => t.name || t) : [],
      studios: Array.isArray(dbAnime.studios) ? dbAnime.studios.map((s: any) => s.name || s) : [],
      url: `https://myanimelist.net/anime/${dbAnime.anime_id}`,
    };
  }

  // Get weekly episodes from Supabase
  static async getWeeklyEpisodes(weekNumber: number): Promise<{ success: boolean; data: Episode[]; needsData?: boolean }> {
    try {
      console.log(`[SupabaseData] Fetching week ${weekNumber} from Supabase...`);
      
      const response = await fetch(
        `${SERVER_URL}/weekly-episodes/${weekNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.log(`[SupabaseData] No data in Supabase for week ${weekNumber}`);
        return { success: false, data: [], needsData: true };
      }

      if (!result.data || result.data.length === 0) {
        console.log(`[SupabaseData] Empty data for week ${weekNumber}, needs sync`);
        return { success: false, data: [], needsData: true };
      }

      const episodes = result.data.map((dbEp: any) => this.convertDbEpisodeToEpisode(dbEp));
      console.log(`[SupabaseData] ✓ Found ${episodes.length} episodes in Supabase for week ${weekNumber}`);

      return { success: true, data: episodes };
    } catch (error) {
      console.error('[SupabaseData] Error fetching weekly episodes:', error);
      return { success: false, data: [], needsData: true };
    }
  }

  // Get season rankings from Supabase
  static async getSeasonRankings(season: string, year: number): Promise<{ success: boolean; data: any[]; needsData?: boolean }> {
    try {
      console.log(`[SupabaseData] Fetching ${season} ${year} from Supabase...`);
      
      const response = await fetch(
        `${SERVER_URL}/season-rankings/${season}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.log(`[SupabaseData] No data in Supabase for ${season} ${year}`);
        return { success: false, data: [], needsData: true };
      }

      if (!result.data || result.data.length === 0) {
        console.log(`[SupabaseData] Empty data for ${season} ${year}, needs sync`);
        return { success: false, data: [], needsData: true };
      }

      console.log(`[SupabaseData] ✓ Found ${result.data.length} animes in Supabase for ${season} ${year}`);

      return { success: true, data: result.data };
    } catch (error) {
      console.error('[SupabaseData] Error fetching season rankings:', error);
      return { success: false, data: [], needsData: true };
    }
  }

  // Get anticipated animes from Supabase
  static async getAnticipatedAnimes(): Promise<{ success: boolean; data: AnticipatedAnime[]; needsData?: boolean }> {
    try {
      console.log(`[SupabaseData] Fetching anticipated animes from Supabase...`);
      
      const response = await fetch(
        `${SERVER_URL}/anticipated-animes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.log(`[SupabaseData] No anticipated data in Supabase`);
        return { success: false, data: [], needsData: true };
      }

      if (!result.data || result.data.length === 0) {
        console.log(`[SupabaseData] Empty anticipated data, needs sync`);
        return { success: false, data: [], needsData: true };
      }

      const animes = result.data.map((dbAnime: any) => this.convertDbAnimeToAnticipatedAnime(dbAnime));
      console.log(`[SupabaseData] ✓ Found ${animes.length} anticipated animes in Supabase`);

      return { success: true, data: animes };
    } catch (error) {
      console.error('[SupabaseData] Error fetching anticipated animes:', error);
      return { success: false, data: [], needsData: true };
    }
  }
}
