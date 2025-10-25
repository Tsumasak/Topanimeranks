# Manual Episodes System

## Overview

This directory contains the configuration for manually adding episodes that are not yet available in the Jikan API.

## How It Works

1. **Add episodes** to `/data/manual-episodes.ts`
2. Episodes are **automatically fetched** with full anime details (image, tags, genres, etc.) using the anime ID
3. Manual episodes are **merged** with API episodes
4. **API episodes replace manual ones** when the same episode (same anime + episode number) is found

## Adding Manual Episodes

Edit `/data/manual-episodes.ts` and add entries to the `MANUAL_EPISODES` array:

```typescript
{
  animeId: 61930,           // MAL Anime ID
  episodeNumber: 3,         // Episode number
  episodeTitle: "The World's Best",  // Episode title
  weekNumber: 3,            // Which week (1-13)
  score: 4.59              // Episode score
}
```

### Required Fields

- **animeId**: The MyAnimeList (MAL) anime ID
  - Find it in the anime URL: `https://myanimelist.net/anime/61930/...` → ID is `61930`
  
- **episodeNumber**: The episode number (e.g., 1, 2, 3...)

- **episodeTitle**: The episode title/name

- **weekNumber**: Which week this episode should appear in (1-13)
  - Week 1 starts September 29, 2025
  - Each week is Monday-Sunday

- **score**: The episode score (e.g., 4.59)

### Optional Fields

- **aired**: Custom air date in `YYYY-MM-DD` format
  - If not provided, uses the week's start date (Monday)

## Example

```typescript
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  {
    animeId: 61930,
    episodeNumber: 3,
    episodeTitle: "The World's Best",
    weekNumber: 3,
    score: 4.59
  },
  {
    animeId: 54857,
    episodeNumber: 1,
    episodeTitle: "The Beginning",
    weekNumber: 1,
    score: 4.85,
    aired: "2025-09-29" // Optional: specific air date
  }
];
```

## Automatic Replacement

Manual episodes are **automatically replaced** when:

1. The Jikan API returns an episode with the **same anime ID** and **same episode number**
2. The API version will **always replace** the manual version

This ensures your manual data is temporary and gets replaced with official API data when available.

## How to Find Anime Information

1. Go to [MyAnimeList](https://myanimelist.net)
2. Search for the anime
3. Copy the anime ID from the URL
4. The system will automatically fetch:
   - Anime image
   - Genres
   - Themes
   - Demographics
   - Type (TV, Movie, etc.)
   - All other metadata

## Clearing Cache

If you update manual episodes and don't see changes:

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Clear the cache for the specific week
4. Or increment `CACHE_VERSION` in `/services/jikan.ts`

## Notes

- Manual episodes are marked with `isManual: true` in the data
- They follow the same 20,000+ members filter as API episodes
- Only the highest-scored episode per anime is shown (whether manual or API)
- Manual episodes respect the week date ranges
