// ============================================
// Search Types
// ============================================

export interface SearchResult {
  id: number;
  title: string;
  imageUrl: string | null;
  season: string | null;
  year: number | null;
  score: number | null;
  members: number | null;
  relevance: number;
  type?: string | null;
  genres?: string[];
  themes?: string[];
  demographics?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalCount: number;
}