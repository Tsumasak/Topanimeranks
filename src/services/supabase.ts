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
  status: string | null;
  episodes: number | null;
  aired_from: string | null;
  aired_to: string | null;
  season: string | null;
  year: number | null;
  demographics: any[];
  genres: any[];
  themes: any[];
  studios: any[];
}

interface SyncStatusRow {
  sync_type: string;
  status: string;
  items_synced: number | null;
  duration_ms: number | null;
  created_at: string;
  error_message: string | null;
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!projectId && !!publicAnonKey;
}

// ============================================
// WEEKLY EPISODES
// ============================================

export interface WeeklyEpisodesData {
  episodes: Episode[];
  startDate: string;
  endDate: string;
}

/**
 * Get weekly episodes from Supabase
 */
export async function getWeeklyEpisodes(weekNumber: number): Promise<WeeklyEpisodesData> {
  console.log(`[SupabaseService] Fetching week ${weekNumber}...`);

  if (!isSupabaseConfigured()) {
    console.warn('[SupabaseService] Supabase not configured');
    return { episodes: [], startDate: '', endDate: '' };
  }

  try {
    const { data, error } = await supabase
      .from('weekly_episodes')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('season', 'winter')
      .eq('year', 2026)
      .not('episode_score', 'is', null) // Apenas episódios com score
      .order('episode_score', { ascending: false }); // Ordenar por score DESC

    if (error) {
      console.error('[SupabaseService] Error fetching weekly episodes:', error);
      return { episodes: [], startDate: '', endDate: '' };
    }

    if (!data || data.length === 0) {
      console.log(`[SupabaseService] ℹ️  No episodes found in Supabase for week ${weekNumber} (Winter 2026)`);
      return { episodes: [], startDate: '', endDate: '' };
    }

    console.log(`[SupabaseService] ✅ Found ${data.length} episodes in Supabase cache for Winter 2026 Week ${weekNumber}`);

    // DEBUG: Log first episode structure
    console.log('[SupabaseService] First episode data:', data[0]);

    // Get week dates from the first episode (if available)
    const firstEpisode = data[0] as any;
    const weekStartDate = firstEpisode?.week_start_date || '';
    const weekEndDate = firstEpisode?.week_end_date || '';

    console.log('[SupabaseService] Week dates from first episode:', {
      finalStartDate: weekStartDate,
      finalEndDate: weekEndDate,
    });

    // Convert database rows to Episode objects
    const episodes: Episode[] = data.map((row: any) => ({
      id: row.id,
      animeId: row.anime_id,
      animeTitle: row.anime_title_english || row.anime_title || '',
      episodeNumber: row.episode_number,
      episodeTitle: row.episode_name || '',
      episodeUrl: row.from_url || '',
      episodeScore: row.episode_score,
      imageUrl: row.anime_image_url || '',
      aired: row.aired_at,
      animeType: row.type || 'TV',
      demographics: Array.isArray(row.demographic)
        ? row.demographic.map((d: any) => typeof d === 'string' ? d : d.name)
        : [],
      genres: Array.isArray(row.genre)
        ? row.genre.map((g: any) => typeof g === 'string' ? g : g.name)
        : [],
      themes: Array.isArray(row.theme)
        ? row.theme.map((t: any) => typeof t === 'string' ? t : t.name)
        : [],
      url: row.from_url || '',
      forumUrl: row.forum_url || null,
      trend: row.trend || 'NEW',
      positionInWeek: row.position_in_week,
      isManual: row.is_manual || false,
    }));

    // If dates are not in DB, calculate them
    let finalStartDate = weekStartDate;
    let finalEndDate = weekEndDate;

    if (!finalStartDate || !finalEndDate) {
      console.log(`[SupabaseService] ℹ️  Using calculated dates for week ${weekNumber} (migration pending)`);
      const calculatedDates = calculateWeekDates(weekNumber);
      finalStartDate = calculatedDates.startDate;
      finalEndDate = calculatedDates.endDate;
    }

    return {
      episodes,
      startDate: finalStartDate,
      endDate: finalEndDate,
    };
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    return { episodes: [], startDate: '', endDate: '' };
  }
}

// ============================================
// SEASON RANKINGS
// ============================================

/**
 * Get season rankings from Supabase
 */
export async function getSeasonRankings(
  season: string,
  year: number,
  orderBy: 'score' | 'members' = 'score'
): Promise<JikanAnimeData[]> {
  console.log(`[SupabaseService] Fetching ${season} ${year} rankings (ordered by ${orderBy})...`);

  if (!isSupabaseConfigured()) {
    console.warn('[SupabaseService] Supabase not configured');
    return [];
  }

  try {
    let query = supabase
      .from('season_rankings')
      .select('*')
      .eq('season', season)
      .eq('year', year);

    // Order by the requested field
    if (orderBy === 'score') {
      query = query.order('anime_score', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('members', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupabaseService] Error fetching season rankings:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`[SupabaseService] ℹ️  No animes found for ${season} ${year}`);
      return [];
    }

    console.log(`[SupabaseService] ✅ Found ${data.length} animes`);

    // Convert database rows to JikanAnimeData objects
    return (data as SeasonRankingRow[]).map(row => ({
      mal_id: row.anime_id,
      url: `/anime/${row.anime_id}`,
      title: row.title,
      title_english: row.title_english,
      title_japanese: null,
      images: {
        jpg: {
          image_url: row.image_url,
          small_image_url: row.image_url,
          large_image_url: row.image_url,
        },
        webp: {
          image_url: row.image_url,
          small_image_url: row.image_url,
          large_image_url: row.image_url,
        },
      },
      score: row.anime_score,
      scored_by: row.scored_by,
      members: row.members,
      favorites: row.favorites,
      popularity: row.popularity,
      rank: row.rank,
      type: row.type,
      status: row.status,
      episodes: row.episodes,
      aired: {
        from: row.aired_from || '',
        to: row.aired_to,
      },
      season: row.season,
      year: row.year,
      synopsis: row.synopsis,
      demographics: row.demographics || [],
      genres: row.genres || [],
      themes: row.themes || [],
      studios: row.studios || [],
    }));
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    return [];
  }
}

// ============================================
// ANTICIPATED ANIMES
// ============================================

/**
 * Get anticipated animes from Supabase (all)
 */
export async function getAnticipatedAnimes(): Promise<AnticipatedAnime[]> {
  console.log('[SupabaseService] Fetching all anticipated animes...');

  if (!isSupabaseConfigured()) {
    console.warn('[SupabaseService] Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('anticipated_animes')
      .select('*')
      .order('members', { ascending: false });

    if (error) {
      console.error('[SupabaseService] Error fetching anticipated animes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[SupabaseService] ℹ️  No anticipated animes found');
      return [];
    }

    console.log(`[SupabaseService] ✅ Found ${data.length} anticipated animes in Supabase`);

    // Convert database rows to AnticipatedAnime objects
    return (data as AnticipatedAnimeRow[]).map(row => ({
      id: row.anime_id,
      title: row.title_english || row.title,
      imageUrl: row.image_url,
      animeScore: row.score || 0,
      members: row.members,
      synopsis: row.synopsis,
      animeType: row.type,
      season: row.season || 'unknown',
      year: row.year || 0,
      demographics: row.demographics || [],
      genres: row.genres || [],
      themes: row.themes || [],
      studios: row.studios || [],
      url: `/anime/${row.anime_id}`,
    }));
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    return [];
  }
}

/**
 * Get anticipated animes for a specific season
 */
export async function getAnticipatedAnimesBySeason(
  season: string,
  year: number
): Promise<AnticipatedAnime[]> {
  console.log(`[SupabaseService] Fetching anticipated animes for ${season} ${year}...`);

  if (!isSupabaseConfigured()) {
    console.warn('[SupabaseService] Supabase not configured');
    return [];
  }

  console.log('[SupabaseService] Fetching anticipated animes...');
  const allAnimes = await getAnticipatedAnimes();

  // Filter for the specific season
  const filtered = allAnimes.filter(anime => {
    const animeSeason = anime.season?.toLowerCase();
    const animeYear = anime.year;
    return animeSeason === season.toLowerCase() && animeYear === year;
  });

  console.log(`[SupabaseService] ✅ Filtered ${filtered.length} animes for ${season} ${year}`);
  return filtered;
}

/**
 * Get "Later" anticipated animes (Fall 2026 onwards, excluding Winter/Spring/Summer 2026)
 */
export async function getAnticipatedAnimesLater(): Promise<AnticipatedAnime[]> {
  console.log('[SupabaseService] Fetching later anticipated animes (Fall 2026 onwards)...');

  if (!isSupabaseConfigured()) {
    console.warn('[SupabaseService] Supabase not configured');
    return [];
  }

  const allAnimes = await getAnticipatedAnimes();

  // Create a Set of already shown anime IDs (Winter, Spring, Summer 2026)
  const shownAnimeIds = new Set<number>();

  allAnimes.forEach(anime => {
    const animeSeason = anime.season?.toLowerCase();
    const animeYear = anime.year;

    if (animeYear === 2026 && ['winter', 'spring', 'summer'].includes(animeSeason || '')) {
      shownAnimeIds.add(anime.id);
    }
  });

  console.log(`[SupabaseService] 🔍 Excluding ${shownAnimeIds.size} animes from Winter/Spring/Summer 2026`);

  // Filter for Fall 2026 onwards, EXCLUDING animes already shown
  const filtered = allAnimes.filter(anime => {
    const animeSeason = anime.season?.toLowerCase();
    const animeYear = anime.year;

    // CRITICAL: Exclude if already shown in Winter, Spring, or Summer
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

/**
 * Alternative function for "Later" animes - same as getAnticipatedAnimesLater
 * Kept for backwards compatibility
 */
export async function getLaterAnimes(): Promise<AnticipatedAnime[]> {
  return getAnticipatedAnimesLater();
}

// ============================================
// HERO BANNERS
// ============================================

export interface HeroBanner {
  id: string;
  tagline: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HeroBannerRow {
  id: string;
  tagline: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get active hero banner
 */
export async function getActiveHeroBanner(): Promise<HeroBanner | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseService] Error fetching active hero banner:', error);
      return null;
    }

    if (!data) return null;

    const row = data as HeroBannerRow;
    return {
      id: row.id,
      tagline: row.tagline,
      title: row.title,
      subtitle: row.subtitle,
      buttonText: row.button_text,
      buttonLink: row.button_link,
      imageUrl: row.image_url,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    return null;
  }
}

/**
 * Get all hero banners (for admin)
 */
export async function getAllHeroBanners(): Promise<HeroBanner[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseService] Error fetching hero banners:', error);
      return [];
    }

    return (data as HeroBannerRow[]).map(row => ({
      id: row.id,
      tagline: row.tagline,
      title: row.title,
      subtitle: row.subtitle,
      buttonText: row.button_text,
      buttonLink: row.button_link,
      imageUrl: row.image_url,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    return [];
  }
}

/**
 * Create hero banner
 */
export async function createHeroBanner(banner: Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>): Promise<HeroBanner | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  try {
    // If the new banner is active, deactivate all other banners first
    if (banner.isActive) {
      console.log('[SupabaseService] 🔄 Deactivating all other banners...')
      const { error: deactivateError } = await (supabase as any)
        .from('hero_banners')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deactivateError) {
        console.error('[SupabaseService] Error deactivating banners:', deactivateError);
      } else {
        console.log('[SupabaseService] ✅ All other banners deactivated');
      }
    }

    const { data, error } = await supabase
      .from('hero_banners')
      .insert({
        tagline: banner.tagline,
        title: banner.title,
        subtitle: banner.subtitle,
        button_text: banner.buttonText,
        button_link: banner.buttonLink,
        image_url: banner.imageUrl,
        is_active: banner.isActive,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] Error creating hero banner:', error);
      throw error;
    }

    const row = data as HeroBannerRow;

    // Clear cached banner in sessionStorage
    if (banner.isActive) {
      sessionStorage.removeItem('hero_banner');
      console.log('[SupabaseService] ✅ Cleared cached banner');
    }

    return {
      id: row.id,
      tagline: row.tagline,
      title: row.title,
      subtitle: row.subtitle,
      buttonText: row.button_text,
      buttonLink: row.button_link,
      imageUrl: row.image_url,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    throw error;
  }
}

/**
 * Update hero banner
 */
export async function updateHeroBanner(id: string, banner: Partial<Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<HeroBanner | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  try {
    // If setting this banner to active, deactivate all other banners first
    if (banner.isActive === true) {
      console.log('[SupabaseService] 🔄 Deactivating all other banners...');
      const { error: deactivateError } = await (supabase as any)
        .from('hero_banners')
        .update({ is_active: false })
        .eq('is_active', true)
        .neq('id', id); // Don't deactivate the one we're updating

      if (deactivateError) {
        console.error('[SupabaseService] Error deactivating banners:', deactivateError);
      } else {
        console.log('[SupabaseService] ✅ All other banners deactivated');
      }
    }

    const updateData: Record<string, any> = {};
    if (banner.tagline !== undefined) updateData.tagline = banner.tagline;
    if (banner.title !== undefined) updateData.title = banner.title;
    if (banner.subtitle !== undefined) updateData.subtitle = banner.subtitle;
    if (banner.buttonText !== undefined) updateData.button_text = banner.buttonText;
    if (banner.buttonLink !== undefined) updateData.button_link = banner.buttonLink;
    if (banner.imageUrl !== undefined) updateData.image_url = banner.imageUrl;
    if (banner.isActive !== undefined) updateData.is_active = banner.isActive;

    const { data, error } = await (supabase as any)
      .from('hero_banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] Error updating hero banner:', error);
      throw error;
    }

    const row = data as HeroBannerRow;

    // Clear cached banner in sessionStorage if we activated this banner
    if (banner.isActive === true) {
      sessionStorage.removeItem('hero_banner');
      console.log('[SupabaseService] ✅ Cleared cached banner');
    }

    return {
      id: row.id,
      tagline: row.tagline,
      title: row.title,
      subtitle: row.subtitle,
      buttonText: row.button_text,
      buttonLink: row.button_link,
      imageUrl: row.image_url,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    throw error;
  }
}

/**
 * Delete hero banner
 */
export async function deleteHeroBanner(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('hero_banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseService] Error deleting hero banner:', error);
      throw error;
    }
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    throw error;
  }
}

/**
 * Upload hero banner image to Supabase Storage
 */
export async function uploadHeroBannerImage(file: File): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('make-c1d1bfd8-hero-banners')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[SupabaseService] Error uploading image:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('make-c1d1bfd8-hero-banners')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('[SupabaseService] Error:', error);
    throw error;
  }
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
      errorMessage: row.error_message || undefined,
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
  getActiveHeroBanner,
  getAllHeroBanners,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  uploadHeroBannerImage,
};