/**
 * Character Data Service
 * Fetches character data from Supabase and handles cross-referencing
 * with season_rankings for the animeography section.
 */

import { supabase } from "../utils/supabase/client";

// ============================================
// TYPES
// ============================================

export interface CharacterFullData {
  id: number;
  name: string;
  name_kanji: string | null;
  about: string | null;
  url: string | null;
  image_url: string | null;
  favorites: number;
  nicknames: string[] | null;
  images: any | null;
  all_pictures: any[] | null;
  animeography: AnimeographyEntry[] | null;
}

export interface AnimeographyEntry {
  role: string;
  anime: {
    mal_id: number;
    url: string;
    title: string;
    images: {
      jpg: {
        image_url: string;
        large_image_url: string;
        small_image_url: string;
      };
      webp: {
        image_url: string;
        large_image_url: string;
        small_image_url: string;
      };
    };
  };
}

export interface AnimePresenceInfo {
  anime_id: number;
  type: string;
}

// ============================================
// CHARACTER FETCH
// ============================================

/**
 * Fetch a character by ID from the `characters` table.
 */
export async function getCharacterById(
  id: number
): Promise<CharacterFullData | null> {
  try {
    const { data, error } = await supabase
      .from("characters")
      .select(
        "id, name, name_kanji, about, url, image_url, favorites, nicknames, images, all_pictures, animeography"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[CharacterService] Error fetching character:", error);
      return null;
    }

    return data as CharacterFullData | null;
  } catch (err) {
    console.error("[CharacterService] Failed to fetch character:", err);
    return null;
  }
}

// ============================================
// ANIMEOGRAPHY PRESENCE CHECK
// ============================================

/**
 * Given a list of MAL anime IDs, check which ones exist in our
 * `season_rankings` table. Returns a map of anime_id -> type.
 */
export async function getCharacterAnimesPresence(
  malIds: number[]
): Promise<Map<number, AnimePresenceInfo>> {
  const presenceMap = new Map<number, AnimePresenceInfo>();

  if (!malIds || malIds.length === 0) return presenceMap;

  try {
    const { data, error } = await supabase
      .from("season_rankings")
      .select("anime_id, type")
      .in("anime_id", malIds);

    if (error) {
      console.error(
        "[CharacterService] Error checking anime presence:",
        error
      );
      return presenceMap;
    }

    if (data) {
      for (const row of data) {
        // Only keep the first occurrence (in case of duplicates across seasons)
        if (!presenceMap.has(row.anime_id)) {
          presenceMap.set(row.anime_id, {
            anime_id: row.anime_id,
            type: row.type,
          });
        }
      }
    }
  } catch (err) {
    console.error("[CharacterService] Failed to check anime presence:", err);
  }

  return presenceMap;
}

// ============================================
// MISSING ANIMES LOGGING
// ============================================

/**
 * Log animes that are NOT in our database for future sync.
 * Uses upsert-like behavior (ON CONFLICT DO NOTHING via individual inserts).
 */
export async function logMissingAnimes(
  missingAnimes: { mal_id: number; title: string }[],
  characterId: number
): Promise<void> {
  if (!missingAnimes || missingAnimes.length === 0) return;

  try {
    // Build rows to insert
    const rows = missingAnimes.map((a) => ({
      mal_id: a.mal_id,
      title: a.title,
      detected_from_character_id: characterId,
    }));

    // Use upsert with onConflict to ignore duplicates
    const { error } = await supabase
      .from("missing_animes_log")
      .upsert(rows, { onConflict: "mal_id", ignoreDuplicates: true });

    if (error) {
      // Non-critical: don't break the page if logging fails
      console.warn("[CharacterService] Failed to log missing animes:", error);
    } else {
      console.log(
        `[CharacterService] ✅ Logged ${rows.length} missing animes for character ${characterId}`
      );
    }
  } catch (err) {
    console.warn("[CharacterService] Error logging missing animes:", err);
  }
}
