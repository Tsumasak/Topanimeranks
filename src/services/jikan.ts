import { JikanAnimeData, JikanEpisode, JikanEpisodesResponse, Episode, AnticipatedAnime, WeekData, SeasonData } from '../types/anime';
import { CacheService } from './cache';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 350; // 350ms between requests (allows ~3 requests per second, staying under the 3/sec limit)
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Cache version - increment this to invalidate all caches when fixing bugs
const CACHE_VERSION = 'v4';

// Progress callback type
type ProgressCallback = (current: number, total: number, message: string) => void;

class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
      }
      
      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }
    
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

export class JikanService {
  private static async fetchWithRetry<T>(endpoint: string, retries = MAX_RETRIES, returnFullResponse = false): Promise<T> {
    return rateLimiter.add(async () => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(`${JIKAN_BASE_URL}${endpoint}`);
          
          if (response.status === 429) {
            // Rate limited, wait and retry
            const retryAfter = parseInt(response.headers.get('Retry-After') || '2');
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          }
          
          if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`);
          }
          
          const json = await response.json();
          return returnFullResponse ? json as T : json.data as T;
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        }
      }
      throw new Error('Max retries reached');
    });
  }

  // Get anime by season with pagination
  static async getSeasonAnimes(year: number, season: string, maxPages: number = 5): Promise<JikanAnimeData[]> {
    const cacheKey = `${CACHE_VERSION}_jikan_season_${year}_${season}_${maxPages}`;
    const cached = CacheService.get<JikanAnimeData[]>(cacheKey);
    if (cached) return cached;

    const allAnimes: JikanAnimeData[] = [];
    
    // Fetch multiple pages to get more animes
    for (let page = 1; page <= maxPages; page++) {
      try {
        const response = await this.fetchWithRetry<{data: JikanAnimeData[], pagination: JikanPagination}>(
          `/seasons/${year}/${season}?page=${page}`,
          MAX_RETRIES,
          true
        );
        
        allAnimes.push(...response.data);
        
        // Stop if there are no more pages
        if (!response.pagination.has_next_page) {
          console.log(`[SeasonAnimes] Fetched all ${allAnimes.length} animes for ${season} ${year} (${page} pages)`);
          break;
        }
      } catch (error) {
        console.warn(`[SeasonAnimes] Failed to fetch page ${page} for ${season} ${year}:`, error);
        break;
      }
    }
    
    console.log(`[SeasonAnimes] Total animes fetched for ${season} ${year}: ${allAnimes.length}`);
    CacheService.set(cacheKey, allAnimes);
    return allAnimes;
  }

  // Get upcoming animes with pagination
  static async getUpcomingAnimes(maxPages: number = 10): Promise<JikanAnimeData[]> {
    const cacheKey = `${CACHE_VERSION}_jikan_upcoming_${maxPages}`;
    const cached = CacheService.get<JikanAnimeData[]>(cacheKey);
    if (cached) return cached;

    const allAnimes: JikanAnimeData[] = [];
    
    // Fetch multiple pages to get more upcoming animes
    for (let page = 1; page <= maxPages; page++) {
      try {
        const response = await this.fetchWithRetry<{data: JikanAnimeData[], pagination: JikanPagination}>(
          `/seasons/upcoming?page=${page}`,
          MAX_RETRIES,
          true
        );
        
        allAnimes.push(...response.data);
        
        // Stop if there are no more pages
        if (!response.pagination.has_next_page) {
          console.log(`[UpcomingAnimes] Fetched all ${allAnimes.length} animes (${page} pages)`);
          break;
        }
      } catch (error) {
        console.warn(`[UpcomingAnimes] Failed to fetch page ${page}:`, error);
        break;
      }
    }
    
    console.log(`[UpcomingAnimes] Total animes fetched: ${allAnimes.length}`);
    CacheService.set(cacheKey, allAnimes);
    return allAnimes;
  }

  // Get episodes for an anime with pagination support
  static async getAnimeEpisodes(animeId: number): Promise<JikanEpisode[]> {
    const cacheKey = `${CACHE_VERSION}_jikan_episodes_${animeId}_all`;
    const cached = CacheService.get<JikanEpisode[]>(cacheKey);
    if (cached) return cached;

    try {
      // First, get the first page to check pagination
      const firstPageResponse = await this.fetchWithRetry<JikanEpisodesResponse>(
        `/anime/${animeId}/episodes`, 
        MAX_RETRIES, 
        true
      );
      
      let allEpisodes = firstPageResponse.data;
      
      // If there are more pages, fetch them
      if (firstPageResponse.pagination.has_next_page) {
        const lastPage = firstPageResponse.pagination.last_visible_page;
        
        // For animes with many episodes, only fetch the last page
        // (where the most recent episodes are)
        if (lastPage > 1) {
          const lastPageResponse = await this.fetchWithRetry<JikanEpisodesResponse>(
            `/anime/${animeId}/episodes?page=${lastPage}`,
            MAX_RETRIES,
            true
          );
          
          // Combine first page and last page episodes
          allEpisodes = [...allEpisodes, ...lastPageResponse.data];
        }
      }
      
      CacheService.set(cacheKey, allEpisodes);
      return allEpisodes;
    } catch (error) {
      console.warn(`Failed to fetch episodes for anime ${animeId}:`, error);
      return [];
    }
  }

  // Calculate the correct episode page URL for MAL
  static getEpisodePageUrl(animeUrl: string, episodeNumber: number, totalEpisodes: number): string {
    // Extract the anime name from the URL
    // Example: https://myanimelist.net/anime/57025/Tondemo_Skill_de_Isekai_Hourou_Meshi_2
    // We want: https://myanimelist.net/anime/57025/Tondemo_Skill_de_Isekai_Hourou_Meshi_2/episode
    
    let baseUrl = animeUrl;
    
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // MAL shows 100 episodes per page
    // offset is calculated as: (pageNumber - 1) * 100
    // For episode 1150, it would be on page 12 (offset=1100)
    
    if (totalEpisodes > 100 && episodeNumber > 100) {
      // Calculate which page this episode is on
      const pageNumber = Math.ceil(episodeNumber / 100);
      const offset = (pageNumber - 1) * 100;
      return `${baseUrl}/episode?offset=${offset}`;
    }
    
    return `${baseUrl}/episode`;
  }

  // Get anime details
  static async getAnimeDetails(animeId: number): Promise<JikanAnimeData> {
    const cacheKey = `${CACHE_VERSION}_jikan_anime_${animeId}`;
    const cached = CacheService.get<JikanAnimeData>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchWithRetry<JikanAnimeData>(`/anime/${animeId}`);
    CacheService.set(cacheKey, data);
    return data;
  }

  // Helper: Convert Jikan anime + episode to our Episode type
  static convertToEpisode(anime: JikanAnimeData, episode: JikanEpisode): Episode {
    const totalEpisodes = anime.episodes || 0;
    const episodePageUrl = this.getEpisodePageUrl(anime.url, episode.mal_id, totalEpisodes);
    
    // Use episode score if available, otherwise default to 0
    const episodeScore = episode.score || 0;
    
    // IMPORTANT: episode.mal_id is the EPISODE NUMBER, not a unique episode ID
    // This means if the same episode airs in different weeks, it will have the same ID
    const episodeData = {
      id: episode.mal_id,
      animeId: anime.mal_id,
      animeTitle: anime.title_english || anime.title,
      episodeNumber: episode.mal_id,
      episodeTitle: episode.title,
      score: episodeScore,
      imageUrl: anime.images.webp.large_image_url || anime.images.jpg.large_image_url,
      aired: episode.aired,
      animeType: anime.type || 'TV',
      demographics: anime.demographics.map(d => d.name),
      genres: anime.genres.map(g => g.name),
      themes: anime.themes.map(t => t.name),
      url: episodePageUrl,
    };
    
    return episodeData;
  }

  // Helper: Convert Jikan anime to our AnticipatedAnime type
  static convertToAnticipatedAnime(anime: JikanAnimeData): AnticipatedAnime {
    return {
      id: anime.mal_id,
      title: anime.title_english || anime.title,
      imageUrl: anime.images.webp.large_image_url || anime.images.jpg.large_image_url,
      score: anime.score,
      members: anime.members,
      synopsis: anime.synopsis || '',
      animeType: anime.type || 'TV',
      season: anime.season || 'unknown',
      year: anime.year || 2025,
      demographics: anime.demographics.map(d => d.name),
      genres: anime.genres.map(g => g.name),
      themes: anime.themes.map(t => t.name),
      studios: anime.studios.map(s => s.name),
      url: anime.url,
    };
  }

  // Get week data for Fall 2025
  static async getWeekData(weekNumber: number, onProgress?: ProgressCallback): Promise<WeekData> {
    const cacheKey = `${CACHE_VERSION}_anime_week_${weekNumber}`;
    const cached = CacheService.get<WeekData>(cacheKey);
    if (cached) {
      console.log(`[WeekData] Loading week ${weekNumber} from cache`);
      return cached;
    }

    console.log(`[WeekData] Fetching fresh data for week ${weekNumber}`);
    
    onProgress?.(0, 100, 'Fetching anime list from MyAnimeList...');

    // Calculate week dates (Week 1 starts September 29, 2025 - Fall 2025)
    const baseDate = new Date('2025-09-29');
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + (weekNumber - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Set time to start of day for weekStart (00:00:00)
    weekStart.setHours(0, 0, 0, 0);
    // Set time to end of day for weekEnd (23:59:59)
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`[WeekData] Week ${weekNumber} range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    // Get Fall 2025 animes (September - December 2025)
    onProgress?.(10, 100, 'Fetching anime list from MyAnimeList...');
    const animes = await this.getSeasonAnimes(2025, 'fall');
    console.log(`[WeekData] Found ${animes.length} animes in Fall 2025`);
    
    onProgress?.(20, 100, `Found ${animes.length} animes, filtering by popularity...`);
    
    // FILTER: Only animes with 10,000+ members
    const popularAnimes = animes.filter(anime => anime.members >= 10000);
    const filteredOut = animes.filter(anime => anime.members < 10000);
    
    console.log(`[WeekData] After 10k+ members filter: ${popularAnimes.length} animes (filtered out ${filteredOut.length})`);
    
    // Log some examples of filtered out animes (if any)
    if (filteredOut.length > 0) {
      console.log(`[WeekData] Examples of filtered animes (< 20k members):`);
      filteredOut.slice(0, 5).forEach(anime => {
        console.log(`  - ${anime.title}: ${anime.members.toLocaleString()} members`);
      });
      if (filteredOut.length > 5) {
        console.log(`  ... and ${filteredOut.length - 5} more`);
      }
    }
    
    // Get episodes for each anime and filter by week
    const allEpisodes: Episode[] = [];
    
    // Process all popular animes (no hard limit, just the member filter)
    console.log(`[WeekData] Processing ${popularAnimes.length} animes with 20k+ members`);
    
    const totalAnimes = popularAnimes.length;
    let processedAnimes = 0;
    
    for (const anime of popularAnimes) {
      processedAnimes++;
      const progress = 20 + Math.floor((processedAnimes / totalAnimes) * 70); // 20% to 90%
      onProgress?.(progress, 100, `Processing ${processedAnimes}/${totalAnimes} animes...`);
      
      console.log(`[WeekData] Checking anime: ${anime.title} (${anime.members.toLocaleString()} members)`);
      const episodes = await this.getAnimeEpisodes(anime.mal_id);
      
      // DEBUG: Log all episodes for specific anime to help debug duplicates
      if (anime.title.includes('Yasei no Last Boss') || anime.title.includes('Boku no Hero')) {
        console.log(`\n🔍 DEBUG: All episodes for "${anime.title}":`);
        episodes.forEach(ep => {
          console.log(`  EP${ep.mal_id}: ${ep.title || 'No title'}`);
          console.log(`    → Aired: ${ep.aired || 'N/A'}`);
          console.log(`    → Score: ${ep.score || 'N/A'}`);
        });
        console.log('');
      }
      
      const weekEpisodes = episodes
        .filter(ep => {
          // Skip episodes with no aired date (N/A)
          if (!ep.aired) {
            console.log(`[WeekData] Week ${weekNumber} - Skipping ${anime.title} EP${ep.mal_id}: NO AIRED DATE`);
            return false;
          }

          const epDate = new Date(ep.aired);
          
          // Check if date is valid
          if (isNaN(epDate.getTime())) {
            console.log(`[WeekData] Week ${weekNumber} - Skipping ${anime.title} EP${ep.mal_id}: INVALID DATE`);
            return false;
          }

          // Calculate date differences
          const msInDay = 1000 * 60 * 60 * 24;
          const daysSinceWeekStart = (epDate.getTime() - weekStart.getTime()) / msInDay;
          const daysSinceWeekEnd = (epDate.getTime() - weekEnd.getTime()) / msInDay;
          
          console.log(`[WeekData] Week ${weekNumber} - Checking ${anime.title} EP${ep.mal_id}:`);
          console.log(`  → Aired: ${ep.aired} (${epDate.toLocaleDateString()})`);
          console.log(`  → Week: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`);
          console.log(`  → Days from week start: ${daysSinceWeekStart.toFixed(1)}`);
          console.log(`  → Days from week end: ${daysSinceWeekEnd.toFixed(1)}`);

          // STRICT RULE: Episode must be within the week range
          // No future date inference - only accept episodes that actually aired in this week
          const isInWeek = epDate >= weekStart && epDate <= weekEnd;
          
          if (isInWeek) {
            console.log(`  ✓ ACCEPTED: Episode is within week ${weekNumber}`);
          } else if (epDate < weekStart) {
            console.log(`  ✗ REJECTED: Episode aired BEFORE week ${weekNumber} (${Math.abs(daysSinceWeekStart).toFixed(1)} days too early)`);
          } else {
            console.log(`  ✗ REJECTED: Episode aired AFTER week ${weekNumber} (${daysSinceWeekEnd.toFixed(1)} days too late)`);
          }
          
          return isInWeek;
        })
        .map(ep => this.convertToEpisode(anime, ep));
      
      allEpisodes.push(...weekEpisodes);
    }

    console.log(`[WeekData] Total episodes found: ${allEpisodes.length}`);
    
    onProgress?.(90, 100, 'Organizing and ranking episodes...');

    // CRITICAL FIX: Keep only ONE episode per anime (the one with highest score)
    const animeMap = new Map<number, Episode>();
    
    for (const episode of allEpisodes) {
      const existingEpisode = animeMap.get(episode.animeId);
      
      if (!existingEpisode) {
        // First episode from this anime
        animeMap.set(episode.animeId, episode);
        console.log(`[Dedup] Adding ${episode.animeTitle} EP${episode.episodeNumber} (Score: ${episode.score}, Aired: ${new Date(episode.aired).toLocaleDateString()})`);
      } else {
        // Compare scores and keep the highest
        if (episode.score > existingEpisode.score) {
          console.log(`[Dedup] ⚠️ REPLACING ${existingEpisode.animeTitle} EP${existingEpisode.episodeNumber} (${existingEpisode.score}) with EP${episode.episodeNumber} (${episode.score}) - HIGHER SCORE`);
          console.log(`  → Old aired: ${new Date(existingEpisode.aired).toLocaleDateString()}`);
          console.log(`  → New aired: ${new Date(episode.aired).toLocaleDateString()}`);
          animeMap.set(episode.animeId, episode);
        } else {
          console.log(`[Dedup] Skipping ${episode.animeTitle} EP${episode.episodeNumber} (${episode.score}) - already have EP${existingEpisode.episodeNumber} (${existingEpisode.score})`);
        }
      }
    }

    // Convert map back to array
    const uniqueEpisodes = Array.from(animeMap.values());
    console.log(`[WeekData] After deduplication: ${uniqueEpisodes.length} unique animes (was ${allEpisodes.length} episodes)`);

    // Sort by score (highest first), episodes without score go to the end
    uniqueEpisodes.sort((a, b) => {
      if (!a.score && !b.score) return 0;
      if (!a.score) return 1;
      if (!b.score) return -1;
      return b.score - a.score;
    });

    const weekData: WeekData = {
      weekNumber,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      episodes: uniqueEpisodes.slice(0, 50), // Top 50 animes (one episode each)
    };

    console.log(`[WeekData] Caching ${weekData.episodes.length} episodes for week ${weekNumber}`);
    CacheService.set(cacheKey, weekData);
    
    onProgress?.(100, 100, 'Complete!');
    
    return weekData;
  }

  // Get anticipated animes by season
  static async getAnticipatedBySeason(season: string, year: number, onProgress?: ProgressCallback): Promise<SeasonData> {
    const cacheKey = `${CACHE_VERSION}_anime_anticipated_${season}_${year}`;
    const cached = CacheService.get<SeasonData>(cacheKey);
    if (cached) return cached;

    onProgress?.(0, 100, 'Fetching upcoming anime from MyAnimeList...');
    
    let animes: JikanAnimeData[] = [];

    if (season === 'later') {
      // For "later": Get ALL upcoming, subtract animes from other tabs
      onProgress?.(10, 100, 'Fetching all upcoming anime...');
      
      // 1. Get ALL upcoming animes
      const allUpcoming = await this.getUpcomingAnimes();
      console.log(`[Later] Total upcoming animes: ${allUpcoming.length}`);
      
      onProgress?.(30, 100, 'Fetching Fall 2025 animes...');
      
      // 2. Get animes from other tabs to subtract
      const fall2025Animes = await this.getSeasonAnimes(2025, 'fall');
      
      onProgress?.(45, 100, 'Fetching Winter 2026 animes...');
      const winter2026Animes = await this.getSeasonAnimes(2026, 'winter');
      
      onProgress?.(60, 100, 'Fetching Spring 2026 animes...');
      const spring2026Animes = await this.getSeasonAnimes(2026, 'spring');
      
      onProgress?.(75, 100, 'Filtering Later animes...');
      
      // 3. Create a Set of IDs from other seasons
      const otherSeasonsIds = new Set<number>();
      [...fall2025Animes, ...winter2026Animes, ...spring2026Animes].forEach(anime => {
        otherSeasonsIds.add(anime.mal_id);
      });
      
      console.log(`[Later] Animes in other seasons: ${otherSeasonsIds.size}`);
      
      // 4. Filter upcoming: remove animes that appear in other tabs
      animes = allUpcoming.filter(anime => !otherSeasonsIds.has(anime.mal_id));
      
      console.log(`[Later] After subtracting other seasons: ${animes.length} animes`);
    } else {
      // For specific seasons, try to get from upcoming or season endpoint
      try {
        onProgress?.(30, 100, 'Fetching season anime...');
        const seasonAnimes = await this.getSeasonAnimes(year, season);
        
        // STRICT FILTER: Only include animes that match the exact season and year
        animes = seasonAnimes.filter(anime => {
          const matchesSeason = anime.season?.toLowerCase() === season.toLowerCase();
          const matchesYear = anime.year === year;
          
          if (!matchesSeason || !matchesYear) {
            console.log(`[AnticipatedBySeason] Filtering out ${anime.title_english || anime.title}: Season=${anime.season} ${anime.year} (expected: ${season} ${year})`);
            return false;
          }
          
          return true;
        });
      } catch {
        // If season doesn't exist yet, get from upcoming
        onProgress?.(30, 100, 'Fetching from upcoming anime...');
        const upcoming = await this.getUpcomingAnimes();
        onProgress?.(60, 100, 'Filtering by season...');
        animes = upcoming.filter(anime => {
          const matchesSeason = anime.season?.toLowerCase() === season.toLowerCase();
          const matchesYear = anime.year === year;
          
          if (!matchesSeason || !matchesYear) {
            return false;
          }
          
          return true;
        });
      }
    }

    onProgress?.(80, 100, 'Sorting by popularity...');
    
    console.log(`[AnticipatedBySeason] Found ${animes.length} animes for ${season} ${year}`);
    
    // DEDUPLICATION: Remove duplicates by mal_id
    const uniqueAnimeMap = new Map<number, JikanAnimeData>();
    for (const anime of animes) {
      const existing = uniqueAnimeMap.get(anime.mal_id);
      if (!existing) {
        uniqueAnimeMap.set(anime.mal_id, anime);
      } else {
        console.log(`[AnticipatedBySeason] ⚠️ Duplicate found: ${anime.title} (ID: ${anime.mal_id})`);
      }
    }
    
    const uniqueAnimes = Array.from(uniqueAnimeMap.values());
    console.log(`[AnticipatedBySeason] After deduplication: ${uniqueAnimes.length} unique animes`);
    
    // FILTER: Only animes with 10,000+ members to avoid overloading
    const popularAnimes = uniqueAnimes.filter(anime => anime.members >= 10000);
    const filteredOut = uniqueAnimes.filter(anime => anime.members < 10000);
    
    console.log(`[AnticipatedBySeason] After 10k+ members filter: ${popularAnimes.length} animes (filtered out ${filteredOut.length})`);
    
    // Sort by members (most popular first)
    popularAnimes.sort((a, b) => b.members - a.members);
    
    // Log top 5 for debugging
    console.log(`[AnticipatedBySeason] Top 5 animes:`, popularAnimes.slice(0, 5).map(a => 
      `${a.title_english || a.title} (${a.members.toLocaleString()} members, Season: ${a.season} ${a.year})`
    ));

    const seasonData: SeasonData = {
      season: `${season}_${year}`,
      animes: popularAnimes.slice(0, 50).map(anime => this.convertToAnticipatedAnime(anime)),
    };

    CacheService.set(cacheKey, seasonData);
    
    onProgress?.(100, 100, 'Complete!');
    
    return seasonData;
  }
}
