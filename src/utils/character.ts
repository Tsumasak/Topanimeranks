/**
 * Shared character utility functions
 * Extracted from AnimeCharacters.tsx for reuse across the site.
 */

/**
 * Convert name from "Lastname, Firstname" to "Firstname Lastname"
 * Used for displaying character names in western order.
 */
export function formatName(name: string): string {
  if (!name) return "";
  if (name.includes(",")) {
    const parts = name.split(",");
    if (parts.length === 2) {
      return `${parts[1].trim()} ${parts[0].trim()}`;
    }
  }
  return name;
}

/**
 * Format a number with locale-aware thousand separators
 * e.g. 178892 -> "178,892"
 */
export function formatFavorites(num: number): string {
  if (!num && num !== 0) return "0";
  return num.toLocaleString("en-US");
}
