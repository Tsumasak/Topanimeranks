/**
 * Shared utility functions for tag styling across the application
 * This ensures consistency in tag colors and classes throughout the site
 */

/**
 * Get CSS class for anime type tags (TV, Movie, ONA, etc.)
 */
export function getTypeClass(type: string): string {
  const typeLower = type?.toLowerCase();
  if (typeLower === 'tv') return 'tag-tv';
  if (typeLower === 'ona') return 'tag-ona';
  if (typeLower === 'movie') return 'tag-movie';
  if (typeLower === 'special') return 'tag-special';
  if (typeLower === 'ova') return 'tag-ova';
  return 'tag-default';
}

/**
 * Get CSS class for season tags (Winter, Spring, Summer, Fall)
 */
export function getSeasonClass(season: string): string {
  const seasonLower = season?.toLowerCase();
  if (seasonLower === 'winter') return 'tag-winter';
  if (seasonLower === 'summer') return 'tag-summer';
  if (seasonLower === 'fall') return 'tag-fall';
  if (seasonLower === 'spring') return 'tag-spring';
  return 'tag-default';
}

/**
 * Get CSS class for status tags (Airing, Finished, Upcoming)
 */
export function getStatusClass(status: string): string {
  const statusLower = status?.toLowerCase();
  if (statusLower?.includes('airing')) return 'tag-ona'; // Green for airing
  if (statusLower?.includes('finished')) return 'tag-default';
  if (statusLower?.includes('upcoming')) return 'tag-tv'; // Blue for upcoming
  return 'tag-default';
}

/**
 * Get CSS class for demographic tags (Seinen, Shounen, Shoujo, Josei)
 */
export function getDemographicClass(demographic: string): string {
  const demoLower = demographic?.toLowerCase();
  if (demoLower === 'seinen') return 'tag-seinen';
  if (demoLower === 'shounen') return 'tag-shounen';
  if (demoLower === 'shoujo') return 'tag-shoujo';
  if (demoLower === 'josei') return 'tag-josei';
  return 'tag-demo-default';
}
