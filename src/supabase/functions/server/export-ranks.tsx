import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

interface ExportOptions {
  rankType: "weekly-episodes" | "top-animes" | "anime-genres" | "most-anticipated";
  format: "csv" | "xlsx";
  weekNumber?: number;
  season?: string;
  year?: number;
  genre?: string;
  sortBy?: "members" | "score";
  // For weekly episodes cascading filters
  weeklyYear?: number;
  weeklySeason?: string;
}

// Helper to serialize JSON fields for CSV
function serializeJson(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

// Export Weekly Episodes
async function exportWeeklyEpisodes(supabase: any, weekNumber: number, year?: number, season?: string) {
  let query = supabase
    .from("weekly_episodes")
    .select("*")
    .eq("week_number", weekNumber);

  // Add year and season filters if provided
  if (year) {
    query = query.eq("year", year);
  }
  if (season) {
    query = query.eq("season", season.toLowerCase());
  }

  const { data, error } = await query.order("episode_score", { ascending: false });

  if (error) {
    console.error("Error fetching weekly episodes:", error);
    throw new Error(`Failed to fetch weekly episodes: ${error.message}`);
  }

  if (!data || data.length === 0) {
    const filters = [
      `week ${weekNumber}`,
      year ? `year ${year}` : null,
      season ? `season ${season}` : null
    ].filter(Boolean).join(', ');
    throw new Error(`No data found for ${filters}`);
  }

  // Map to match the specified column structure
  return data.map((row: any) => ({
    id: row.id,
    anime_id: row.anime_id,
    anime_title_english: row.anime_title_english,
    anime_image_url: row.anime_image_url,
    from_url: row.from_url,
    episode_number: row.episode_number,
    episode_name: row.episode_name,
    episode_score: row.episode_score,
    week_number: row.week_number,
    position_in_week: row.position_in_week,
    is_manual: row.is_manual || false,
    type: serializeJson(row.type),
    status: row.status,
    demographic: serializeJson(row.demographic),
    genre: serializeJson(row.genre),
    theme: serializeJson(row.theme),
    aired_at: row.aired_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    trend: row.trend,
    genres: serializeJson(row.genres),
    themes: serializeJson(row.themes),
    demographics: serializeJson(row.demographics),
    season: row.season,
    year: row.year,
  }));
}

// Export Top Animes
async function exportTopAnimes(supabase: any, season: string, year: number) {
  const { data, error } = await supabase
    .from("season_animes")
    .select("*")
    .eq("season", season.toLowerCase())
    .eq("year", year)
    .order("anime_score", { ascending: false });

  if (error) {
    console.error("Error fetching top animes:", error);
    throw new Error(`Failed to fetch top animes: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No data found for ${season} ${year}`);
  }

  return data.map((row: any) => ({
    id: row.id,
    anime_id: row.anime_id,
    title: row.title,
    title_english: row.title_english,
    image_url: row.image_url,
    anime_score: row.anime_score,
    scored_by: row.scored_by,
    members: row.members,
    favorites: row.favorites,
    popularity: row.popularity,
    rank: row.rank,
    type: row.type,
    status: row.status,
    rating: row.rating,
    source: row.source,
    episodes: row.episodes,
    aired_from: row.aired_from,
    aired_to: row.aired_to,
    duration: row.duration,
    demographics: serializeJson(row.demographics),
    genres: serializeJson(row.genres),
    themes: serializeJson(row.themes),
    studios: serializeJson(row.studios),
    synopsis: row.synopsis,
    season: row.season,
    year: row.year,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pictures: serializeJson(row.pictures),
  }));
}

// Export Anime Genres
async function exportAnimeGenres(supabase: any, genre: string, sortBy: "members" | "score") {
  const orderColumn = sortBy === "members" ? "members" : "anime_score";
  
  const { data, error } = await supabase
    .from("genre_rankings")
    .select("*")
    .eq("genre", genre)
    .order(orderColumn, { ascending: false })
    .limit(500); // Limit to top 500

  if (error) {
    console.error("Error fetching genre rankings:", error);
    throw new Error(`Failed to fetch genre rankings: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No data found for genre ${genre}`);
  }

  return data.map((row: any) => ({
    id: row.id,
    anime_id: row.anime_id,
    genre: row.genre,
    year: row.year,
    season: row.season,
    title: row.title,
    title_english: row.title_english,
    image_url: row.image_url,
    anime_score: row.anime_score,
    members: row.members,
    type: row.type,
    status: row.status,
    episodes: row.episodes,
    genres: serializeJson(row.genres),
    themes: serializeJson(row.themes),
    demographics: serializeJson(row.demographics),
    studios: serializeJson(row.studios),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

// Export Most Anticipated Animes
async function exportMostAnticipated(supabase: any, season: string, year: number) {
  // First try to order by score (if available), fallback to members
  const { data, error } = await supabase
    .from("upcoming_animes")
    .select("*")
    .eq("season", season.toLowerCase())
    .eq("year", year)
    .order("score", { ascending: false, nullsLast: true })
    .order("members", { ascending: false });

  if (error) {
    console.error("Error fetching anticipated animes:", error);
    throw new Error(`Failed to fetch anticipated animes: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No data found for ${season} ${year}`);
  }

  return data.map((row: any) => ({
    id: row.id,
    anime_id: row.anime_id,
    title: row.title,
    title_english: row.title_english,
    image_url: row.image_url,
    score: row.score,
    scored_by: row.scored_by,
    members: row.members,
    favorites: row.favorites,
    type: row.type,
    status: row.status,
    rating: row.rating,
    source: row.source,
    episodes: row.episodes,
    aired_from: row.aired_from,
    synopsis: row.synopsis,
    demographics: serializeJson(row.demographics),
    genres: serializeJson(row.genres),
    themes: serializeJson(row.themes),
    studios: serializeJson(row.studios),
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at,
    season: row.season,
    year: row.year,
  }));
}

// Generate export file
export async function generateExport(options: ExportOptions) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let data: any[];

  // Fetch data based on rank type
  switch (options.rankType) {
    case "weekly-episodes":
      if (!options.weekNumber) throw new Error("Week number is required");
      data = await exportWeeklyEpisodes(supabase, options.weekNumber, options.weeklyYear, options.weeklySeason);
      break;

    case "top-animes":
      if (!options.season || !options.year) throw new Error("Season and year are required");
      data = await exportTopAnimes(supabase, options.season, options.year);
      break;

    case "anime-genres":
      if (!options.genre || !options.sortBy) throw new Error("Genre and sortBy are required");
      data = await exportAnimeGenres(supabase, options.genre, options.sortBy);
      break;

    case "most-anticipated":
      if (!options.season || !options.year) throw new Error("Season and year are required");
      data = await exportMostAnticipated(supabase, options.season, options.year);
      break;

    default:
      throw new Error(`Unknown rank type: ${options.rankType}`);
  }

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rankings");

  // Generate file based on format
  let fileBuffer: Uint8Array;
  let contentType: string;

  if (options.format === "xlsx") {
    const xlsxBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    fileBuffer = new Uint8Array(xlsxBuffer);
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else {
    // CSV format
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    fileBuffer = new TextEncoder().encode(csv);
    contentType = "text/csv";
  }

  return {
    buffer: fileBuffer,
    contentType,
  };
}