/**
 * Anime Seasons Utility - Server Side
 * 
 * Handles season detection and week calculation for anime episodes.
 * Each season is approximately 13 weeks (12-14 weeks).
 * 
 * Seasons follow Japanese broadcast pattern:
 * - Winter: January - March
 * - Spring: April - June  
 * - Summer: July - September
 * - Fall: October - December
 */

export type SeasonName = 'winter' | 'spring' | 'summer' | 'fall';

export interface SeasonInfo {
  name: SeasonName;
  year: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Get the start and end dates for a specific season and year
 */
export function getSeasonDates(season: SeasonName, year: number): { startDate: Date; endDate: Date } {
  let startMonth: number;
  let endMonth: number;
  
  switch (season.toLowerCase()) {
    case 'winter':
      startMonth = 0; // January
      endMonth = 2;   // March
      break;
    case 'spring':
      startMonth = 3; // April
      endMonth = 5;   // June
      break;
    case 'summer':
      startMonth = 6; // July
      endMonth = 8;   // September
      break;
    case 'fall':
      startMonth = 9; // October
      endMonth = 11;  // December
      break;
    default:
      startMonth = 0;
      endMonth = 2;
  }
  
  // Season starts on first day of first month
  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  
  // Season ends on last day of last month
  const endDate = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999));
  
  return { startDate, endDate };
}

/**
 * Determine which season a date falls into
 */
export function getSeasonFromDate(date: Date): SeasonInfo {
  const month = date.getUTCMonth(); // 0-11
  const year = date.getUTCFullYear();
  
  let season: SeasonName;
  
  if (month >= 0 && month <= 2) {
    // January - March
    season = 'winter';
  } else if (month >= 3 && month <= 5) {
    // April - June
    season = 'spring';
  } else if (month >= 6 && month <= 8) {
    // July - September
    season = 'summer';
  } else {
    // October - December
    season = 'fall';
  }
  
  const { startDate, endDate } = getSeasonDates(season, year);
  
  return {
    name: season,
    year,
    startDate,
    endDate,
  };
}

/**
 * Calculate which week within a season a date falls into
 * Week 1 is the first Monday of the season (or the Monday before if season starts mid-week)
 */
export function getWeekInSeason(date: Date, seasonInfo: SeasonInfo): number {
  const { startDate } = seasonInfo;
  
  // Find the first Monday of the season (or the Monday before season start)
  const firstMonday = new Date(startDate);
  const dayOfWeek = firstMonday.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (dayOfWeek === 0) {
    // Sunday - go back 6 days to previous Monday
    firstMonday.setUTCDate(firstMonday.getUTCDate() - 6);
  } else if (dayOfWeek !== 1) {
    // Not Monday - adjust to previous Monday
    firstMonday.setUTCDate(firstMonday.getUTCDate() - (dayOfWeek - 1));
  }
  
  // Calculate days difference
  const diffTime = date.getTime() - firstMonday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate week number (1-based)
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  // Clamp to reasonable range (1-15 weeks per season)
  return Math.max(1, Math.min(15, weekNumber));
}

/**
 * Get complete season information for an episode based on its aired date
 * Returns week number relative to the episode's broadcast season
 */
export function getEpisodeWeekNumber(airedDate: Date | string): {
  season: SeasonName;
  year: number;
  weekNumber: number;
} {
  const date = typeof airedDate === 'string' ? new Date(airedDate) : airedDate;
  
  // Get season info
  const seasonInfo = getSeasonFromDate(date);
  
  // Get week within that season
  const weekNumber = getWeekInSeason(date, seasonInfo);
  
  return {
    season: seasonInfo.name,
    year: seasonInfo.year,
    weekNumber,
  };
}

/**
 * Format season for display
 */
export function formatSeason(season: SeasonName): string {
  return season.charAt(0).toUpperCase() + season.slice(1);
}
