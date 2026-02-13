// Jikan API Response Types
export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
}

export interface JikanEpisodesResponse {
  data: JikanEpisode[];
  pagination: JikanPagination;
}

export interface JikanEpisode {
  mal_id: number;
  url: string;
  title: string;
  title_japanese: string;
  title_romanji: string;
  aired: string;
  score: number;
  filler: boolean;
  recap: boolean;
  forum_url: string;
}

export interface JikanAnimeData {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string;
  episodes: number | null;
  status: string;
  aired: {
    from: string;
    to: string | null;
  };
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number;
  members: number;
  favorites: number;
  synopsis: string | null;
  season: string | null;
  year: number | null;
  studios: Array<{
    mal_id: number;
    name: string;
  }>;
  genres: Array<{
    mal_id: number;
    name: string;
  }>;
  demographics: Array<{
    mal_id: number;
    name: string;
  }>;
  themes: Array<{
    mal_id: number;
    name: string;
  }>;
}

// Internal App Types
export interface Episode {
  id: number;
  animeId: number;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  episodeUrl: string; // Link to MAL episode page
  episodeScore: number; // Score of the specific episode
  imageUrl: string;
  aired: string;
  animeType: string;
  demographics: string[];
  genres: string[];
  themes: string[];
  url: string; // Link to anime page (from_url)
  forumUrl?: string | null; // Link to MAL episode discussion forum (forum_url from Jikan API)
  trend?: string; // Position change: 'NEW', '+1', '-2', '='
  positionInWeek?: number; // Current ranking position
  isManual?: boolean; // True if episode was added manually (not from API)
}

export interface AnticipatedAnime {
  id: number;
  title: string;
  imageUrl: string;
  animeScore: number | null; // Overall anime score
  members: number;
  synopsis: string;
  animeType: string;
  season: string;
  year: number;
  demographics: string[];
  genres: string[];
  themes: string[];
  studios: string[];
  url: string;
}

export interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  episodes: Episode[];
}

export interface SeasonData {
  season: string;
  animes: AnticipatedAnime[];
}

// Search Result Type
export interface SearchResult {
  id: number;
  title: string;
  imageUrl: string;
  season: string | null;
  year: number | null;
  tags: string[]; // Combined genres, themes, demographics (max 5)
  members: number;
  score: number | null;
  source: 'weekly_episodes' | 'season_rankings' | 'anticipated_animes';
  relevance: number; // Internal ranking score
}