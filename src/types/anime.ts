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
  score: number;
  imageUrl: string;
  aired: string;
  animeType: string;
  demographics: string[];
  genres: string[];
  themes: string[];
  url: string;
  isManual?: boolean; // True if episode was added manually (not from API)
}

export interface AnticipatedAnime {
  id: number;
  title: string;
  imageUrl: string;
  score: number | null;
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
