import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CopyPlus, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../services/supabase";
import * as XLSX from "xlsx";

export default function AdminExportAnimePage() {
  const [animeIdOrName, setAnimeIdOrName] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!animeIdOrName) {
      toast.error("Please enter an anime ID or name");
      return;
    }

    setIsExporting(true);

    try {
      // Find anime details (First by ID, then by Name)
      let animeId = parseInt(animeIdOrName);
      let globalInfo: any = null;
      let episodesInfo: any[] = [];

      // If it's a number, try ID directly, otherwise search by name
      if (isNaN(animeId)) {
        // Search by name
        const { data, error } = await supabase
          .from("season_rankings")
          .select("*")
          .ilike("title", `%${animeIdOrName}%`)
          .limit(1);
          
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
          throw new Error("Could not find any anime with this name.");
        }
        globalInfo = data[0];
        animeId = globalInfo.anime_id;
      } else {
        // Find by ID
        const { data, error } = await supabase
          .from("season_rankings")
          .select("*")
          .eq("anime_id", animeId)
          .limit(1);

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
          throw new Error("Could not find any anime with this ID.");
        }
        globalInfo = data[0];
      }

      // Fetch Episodes
      const { data: eps, error: epError } = await supabase
        .from("weekly_episodes")
        .select("*")
        .eq("anime_id", animeId)
        .order("episode_number", { ascending: true });

      if (epError) throw new Error(epError.message);
      
      episodesInfo = eps || [];

      // Calculate Medians
      const avgScore = episodesInfo.length > 0 
        ? episodesInfo.reduce((acc, ep) => acc + (ep.episode_score || 0), 0) / episodesInfo.length 
        : 0;

      const avgPosition = episodesInfo.length > 0
        ? episodesInfo.reduce((acc, ep) => acc + (ep.position_in_week || 0), 0) / episodesInfo.length
        : 0;

      const bestPosition = episodesInfo.length > 0
        ? Math.min(...episodesInfo.map(ep => ep.position_in_week || 999))
        : null;

      // 1. Generate Info CSV Data
      const infoData = [
        {
          "English Name": globalInfo.title_english || globalInfo.title,
          "Japanese Name": globalInfo.title,
          "Rating": globalInfo.anime_score,
          "Members": globalInfo.members,
          "Rank": globalInfo.rank,
          "Popularity": globalInfo.popularity,
          "Avg Position": avgPosition > 0 ? `#${avgPosition.toFixed(2)}` : "-",
          "Avg Score": avgScore > 0 ? avgScore.toFixed(2) : "-",
          "Best Position": bestPosition !== null && bestPosition !== 999 ? `#${bestPosition}` : "-"
        }
      ];

      // 2. Generate Episodes CSV Data
      const safeEpisodesData = episodesInfo.map(ep => {
        let titleParts = [];
        if (ep.episode_name) {
          const split = ep.episode_name.split(' - ');
          // Handle logic if subtitle has ' - ' vs raw
          titleParts = split.length > 1 ? split.slice(1).join(' - ') : ep.episode_name;
        }

        return {
          "Episode Number": `EP ${ep.episode_number}`,
          "Episode Name": titleParts || "-",
          "Aired At": ep.aired_at ? new Date(ep.aired_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-",
          "Week Number": `Week ${ep.week_number}`,
          "Rank in Week": `Rank #${ep.position_in_week}`,
          "Trend": ep.trend === 'up' ? '▲' : ep.trend === 'down' ? '▼' : '-',
          "Score": ep.episode_score ? ep.episode_score.toFixed(2) : "-"
        };
      });

      const sanitizedTitle = (globalInfo.title_english || globalInfo.title).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

      // Download helper
      const downloadCSV = (jsonData: any[], filename: string) => {
        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      downloadCSV(infoData, `export_info_${sanitizedTitle}.csv`);
      
      if (safeEpisodesData.length > 0) {
        setTimeout(() => {
          downloadCSV(safeEpisodesData, `export_episodes_${sanitizedTitle}.csv`);
        }, 500);
      }

      toast.success("Anime Details Exported successfully!");

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to generate CSVs.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div className="container mx-auto max-w-screen-lg px-[24px] py-12">
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-2 flex items-center gap-3" 
            style={{ color: "var(--foreground)" }}
          >
            <CopyPlus className="w-10 h-10" />
            Export Anime Details
          </h1>
          <p className="text-gray-400">
            Generate specific dataset files (Info and Episodes) for an individual anime.
          </p>
        </div>

        <Card style={{ backgroundColor: "var(--card-background)", borderColor: "var(--card-border)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--foreground)" }}>
              Anime CSV Request
            </CardTitle>
            <CardDescription>
              Enter the anime name or MAL ID directly to generate your export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="anime-search" style={{ color: "var(--foreground)" }}>
                Anime ID or Name *
              </Label>
              <Input 
                id="anime-search"
                value={animeIdOrName}
                onChange={(e) => setAnimeIdOrName(e.target.value)}
                placeholder="e.g. 52991 or Frieren"
                style={{ backgroundColor: "var(--background)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
            </div>

            <Button 
                onClick={handleExport}
                disabled={isExporting || !animeIdOrName}
                className="w-full mt-4"
                style={{
                  backgroundColor: animeIdOrName && !isExporting ? "#22c55e" : "var(--card-border)",
                  color: "var(--background)",
                }}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating CSVs...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Sub-files (ZIP/CSV)
                  </>
                )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
