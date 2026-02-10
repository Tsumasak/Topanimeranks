import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Download, FileDown, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

type RankType = "weekly-episodes" | "top-animes" | "anime-genres" | "most-anticipated" | "";
type ExportFormat = "csv" | "xlsx";

interface ExportOptions {
  rankType: RankType;
  format: ExportFormat;
  weekNumber?: number;
  season?: string;
  year?: number;
  genre?: string;
  sortBy?: "members" | "score";
  // For weekly episodes cascading filters
  weeklyYear?: number;
  weeklySeason?: string;
}

const SEASONS = ["winter", "spring", "summer", "fall"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + 5 - i);

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Suspense"
];

export default function AdminExportRanksPage() {
  const [options, setOptions] = useState<ExportOptions>({
    rankType: "",
    format: "csv"
  });
  const [isExporting, setIsExporting] = useState(false);

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    if (!options.rankType) {
      toast.error("Please select a rank type");
      return;
    }

    // Validate required fields based on rank type
    if (options.rankType === "weekly-episodes" && (!options.weeklyYear || !options.weeklySeason || !options.weekNumber)) {
      toast.error("Please select year, season, and week number");
      return;
    }
    if (options.rankType === "top-animes" && (!options.season || !options.year)) {
      toast.error("Please select season and year");
      return;
    }
    if (options.rankType === "anime-genres" && (!options.genre || !options.sortBy)) {
      toast.error("Please select genre and sort option");
      return;
    }
    if (options.rankType === "most-anticipated" && (!options.season || !options.year)) {
      toast.error("Please select season and year");
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/export-ranks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Export failed");
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = options.format;
      let filename = `${options.rankType}-${timestamp}.${extension}`;
      
      if (options.rankType === "weekly-episodes") {
        filename = `weekly-episodes-${options.weeklyYear}-${options.weeklySeason}-week${options.weekNumber}-${timestamp}.${extension}`;
      } else if (options.rankType === "top-animes") {
        filename = `top-animes-${options.season}-${options.year}-${timestamp}.${extension}`;
      } else if (options.rankType === "anime-genres") {
        filename = `${options.genre}-by-${options.sortBy}-${timestamp}.${extension}`;
      } else if (options.rankType === "most-anticipated") {
        filename = `anticipated-${options.season}-${options.year}-${timestamp}.${extension}`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Export completed! File: ${filename}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div className="container mx-auto max-w-screen-lg px-[24px] py-12">
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-2" 
            style={{ color: "var(--foreground)" }}
          >
            Export Rankings
          </h1>
          <p className="text-gray-400">
            Download ranking data in CSV or XLSX format
          </p>
        </div>

        <Card style={{ backgroundColor: "var(--card-background)", borderColor: "var(--card-border)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--foreground)" }}>
              <FileDown className="inline-block w-6 h-6 mr-2" />
              Export Configuration
            </CardTitle>
            <CardDescription>
              Select the ranking type and configure export options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rank Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="rank-type" style={{ color: "var(--foreground)" }}>
                Rank Type *
              </Label>
              <Select 
                value={options.rankType} 
                onValueChange={(value) => updateOption("rankType", value as RankType)}
              >
                <SelectTrigger id="rank-type">
                  <SelectValue placeholder="Select rank type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly-episodes">Weekly Anime Episodes</SelectItem>
                  <SelectItem value="top-animes">Top Animes</SelectItem>
                  <SelectItem value="anime-genres">Anime Genres</SelectItem>
                  <SelectItem value="most-anticipated">Most Anticipated Animes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format" style={{ color: "var(--foreground)" }}>
                Export Format *
              </Label>
              <Select 
                value={options.format} 
                onValueChange={(value) => updateOption("format", value as ExportFormat)}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">XLSX (Excel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields Based on Rank Type */}
            {options.rankType === "weekly-episodes" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weekly-year" style={{ color: "var(--foreground)" }}>
                    Year *
                  </Label>
                  <Select 
                    value={options.weeklyYear?.toString() || ""} 
                    onValueChange={(value) => updateOption("weeklyYear", parseInt(value))}
                  >
                    <SelectTrigger id="weekly-year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly-season" style={{ color: "var(--foreground)" }}>
                    Season *
                  </Label>
                  <Select 
                    value={options.weeklySeason || ""} 
                    onValueChange={(value) => updateOption("weeklySeason", value)}
                  >
                    <SelectTrigger id="weekly-season">
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEASONS.map(season => (
                        <SelectItem key={season} value={season}>
                          {season.charAt(0).toUpperCase() + season.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="week" style={{ color: "var(--foreground)" }}>
                    Week Number *
                  </Label>
                  <Select 
                    value={options.weekNumber?.toString() || ""} 
                    onValueChange={(value) => updateOption("weekNumber", parseInt(value))}
                  >
                    <SelectTrigger id="week">
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => i + 1).map(week => (
                        <SelectItem key={week} value={week.toString()}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(options.rankType === "top-animes" || options.rankType === "most-anticipated") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="season" style={{ color: "var(--foreground)" }}>
                    Season *
                  </Label>
                  <Select 
                    value={options.season || ""} 
                    onValueChange={(value) => updateOption("season", value)}
                  >
                    <SelectTrigger id="season">
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEASONS.map(season => (
                        <SelectItem key={season} value={season}>
                          {season.charAt(0).toUpperCase() + season.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" style={{ color: "var(--foreground)" }}>
                    Year *
                  </Label>
                  <Select 
                    value={options.year?.toString() || ""} 
                    onValueChange={(value) => updateOption("year", parseInt(value))}
                  >
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {options.rankType === "anime-genres" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="genre" style={{ color: "var(--foreground)" }}>
                    Genre *
                  </Label>
                  <Select 
                    value={options.genre || ""} 
                    onValueChange={(value) => updateOption("genre", value)}
                  >
                    <SelectTrigger id="genre">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map(genre => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortBy" style={{ color: "var(--foreground)" }}>
                    Sort By *
                  </Label>
                  <Select 
                    value={options.sortBy || ""} 
                    onValueChange={(value) => updateOption("sortBy", value as "members" | "score")}
                  >
                    <SelectTrigger id="sortBy">
                      <SelectValue placeholder="Select sort option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="members">By Members</SelectItem>
                      <SelectItem value="score">By Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Export Button */}
            <div className="pt-4">
              <Button 
                onClick={handleExport}
                disabled={isExporting || !options.rankType}
                className="w-full"
                style={{
                  backgroundColor: options.rankType && !isExporting ? "var(--rating-yellow)" : "var(--card-border)",
                  color: "var(--background)",
                }}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export {options.format.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--card-border)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--foreground)" }}>Export Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-400">
              <div>
                <strong style={{ color: "var(--foreground)" }}>Weekly Anime Episodes:</strong>
                <p>Exports episode rankings for a specific year, season, and week. Select Year → Season → Week (e.g., 2026 → Winter → Week 6) to export columns: id, anime_id, anime_title_english, episode_number, episode_score, position_in_week, type, genres, themes, demographics, season, year, and more.</p>
              </div>
              <div>
                <strong style={{ color: "var(--foreground)" }}>Top Animes:</strong>
                <p>Exports anime rankings for a specific season with columns: id, anime_id, title, title_english, image_url, anime_score, members, type, status, genres, themes, demographics, studios, synopsis, and more.</p>
              </div>
              <div>
                <strong style={{ color: "var(--foreground)" }}>Anime Genres:</strong>
                <p>Exports genre-specific rankings sorted by members or score with columns: id, anime_id, genre, title, image_url, anime_score, members, type, genres, themes, demographics, studios, season, year.</p>
              </div>
              <div>
                <strong style={{ color: "var(--foreground)" }}>Most Anticipated Animes:</strong>
                <p>Exports anticipated anime rankings for upcoming seasons with columns: id, anime_id, title, title_english, image_url, members, type, status, genres, themes, demographics, studios, position, season, year.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}