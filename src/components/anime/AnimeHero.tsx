"use client";

import { Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { AnimeBreadcrumb } from "./AnimeBreadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface AnimeHeroProps {
  anime: any;
}

export function AnimeHero({ anime }: AnimeHeroProps) {
  const handleShare = async () => {
    const shareData = {
      title: anime.title_english || anime.title,
      url: window.location.href,
    };

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or error - fall through to fallback
        console.log("Share cancelled or failed:", err);
      }
    }

    // Fallback: Create a temporary input element to copy text
    try {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        textArea.remove();
        alert("Link copied to clipboard!");
      } catch (err) {
        textArea.remove();
        // If all else fails, just show the URL
        alert(`Share this URL: ${window.location.href}`);
      }
    } catch (err) {
      // Last resort - just show the URL
      alert(`Share this URL: ${window.location.href}`);
    }
  };

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  // Get all genre/theme names
  const allTags = [
    ...(anime.genres?.map((g: any) => g.name || g) || []),
    ...(anime.themes?.map((t: any) => t.name || t) || []),
  ].slice(0, 5); // Limit to 5 tags

  // Get demographic tag class
  const getDemographicClass = (demo: string) => {
    const demoLower = demo?.toLowerCase();
    if (demoLower === "seinen") return "tag-seinen";
    if (demoLower === "shounen") return "tag-shounen";
    if (demoLower === "shoujo") return "tag-shoujo";
    if (demoLower === "josei") return "tag-josei";
    return "tag-demo-default";
  };

  // Get type tag class
  const getTypeClass = (type: string) => {
    const typeLower = type?.toLowerCase();
    if (typeLower === "tv") return "tag-tv";
    if (typeLower === "ona") return "tag-ona";
    return "tag-default";
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Background Blur Layer - Mesmo padrão do dynamic-background do site */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${anime.image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(10px)",
          opacity: "var(--bg-opacity)",
          transform: "scale(1.1)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full md:container md:mx-auto px-0 md:px-[24px] py-[24px] p-[24px]">
        {/* Breadcrumb */}
        <AnimeBreadcrumb
          season={anime.season}
          year={anime.year}
          animeTitle={anime.title_english || anime.title}
        />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mt-6 px-6 p-[0px]">
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div
              className="w-64 rounded-lg overflow-hidden border-2"
              style={{
                borderColor: "var(--card-border)",
                boxShadow:
                  "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <img
                src={anime.image_url}
                alt={anime.title_english || anime.title}
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 w-full flex flex-col h-full md:h-[400px] items-center md:items-start">
            {/* Content Group - stays at top */}
            <div className="space-y-4 w-full">
              {/* Title */}
              <div className="text-center md:text-left">
                <h1
                  className="text-3xl md:text-5xl mb-2 font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {anime.title_english || anime.title}
                </h1>
                {anime.title_japanese && (
                  <p
                    className="text-lg md:text-xl"
                    style={{ color: "var(--rating-text)" }}
                  >
                    {anime.title_japanese}
                  </p>
                )}
              </div>

              {/* Quick Stats - Score, Members, Favorites */}
              <TooltipProvider>
                <div
                  className="flex flex-wrap items-center gap-4 justify-center md:justify-start"
                  style={{ color: "var(--foreground)" }}
                >
                  {(anime.score || anime.anime_score) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <span className="text-lg">⭐</span>
                          <span className="text-lg font-bold text-[20px]">
                            {(
                              anime.score || anime.anime_score
                            )?.toFixed(2)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rating</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {anime.members && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <span className="text-lg">👪</span>
                          <span className="text-lg font-bold text-[20px]">
                            {formatNumber(anime.members)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Members on MAL</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {anime.favorites && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <span className="text-lg">❤️</span>
                          <span className="text-lg text-[20px] font-bold">
                            {formatNumber(anime.favorites)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Favorited</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>

              {/* Type, Season, Status, Demographics */}
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                {/* Type with proper CSS class */}
                {anime.type && (
                  <span
                    className={`${getTypeClass(anime.type)} px-3 py-1 rounded-full text-xs`}
                  >
                    {anime.type}
                  </span>
                )}

                {/* Season & Year */}
                {anime.season && anime.year && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      anime.season.toLowerCase() === "winter"
                        ? "tag-winter"
                        : anime.season.toLowerCase() ===
                            "summer"
                          ? "tag-summer"
                          : anime.season.toLowerCase() ===
                              "fall"
                            ? "tag-fall"
                            : anime.season.toLowerCase() ===
                                "spring"
                              ? "tag-spring"
                              : "tag-default"
                    }`}
                  >
                    {anime.season.charAt(0).toUpperCase() +
                      anime.season.slice(1)}{" "}
                    {anime.year}
                  </span>
                )}

                {/* Status */}
                {anime.status && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      anime.status === "Currently Airing"
                        ? "tag-ona"
                        : "tag-default"
                    }`}
                  >
                    {anime.status}
                  </span>
                )}

                {/* Demographics with proper CSS classes */}
                {anime.demographics &&
                  anime.demographics.length > 0 &&
                  anime.demographics.map(
                    (demo: any, index: number) => {
                      const demoName =
                        typeof demo === "string"
                          ? demo
                          : demo.name;
                      return (
                        <span
                          key={index}
                          className={`${getDemographicClass(demoName)} px-3 py-1 rounded-full text-xs`}
                        >
                          {demoName}
                        </span>
                      );
                    },
                  )}
              </div>

              {/* Genres/Themes */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {allTags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 theme-rating text-xs rounded-full border"
                      style={{
                        borderColor: "var(--card-border)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Share Button - pushed to bottom */}
            <div className="mt-4 md:mt-auto w-full flex justify-center md:justify-start">
              <button
                onClick={handleShare}
                className="relative rounded-[32px] overflow-visible group cursor-pointer hover:-translate-y-[2px] hover:shadow-lg"
                style={{
                  backgroundColor:
                    "rgba(var(--primary-rgb), 0.2)",
                  transition:
                    "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* Borda externa destacada */}
                <div
                  aria-hidden="true"
                  className="absolute inset-[-1.4px] pointer-events-none rounded-[33.4px] border-[1.4px] border-solid transition-all group-hover:inset-[-2px]"
                  style={{
                    borderColor: "var(--primary)",
                  }}
                />

                {/* Conteúdo do botão */}
                <div className="flex items-center justify-center gap-3 px-[12px] py-[8px]">
                  <Share2
                    className="h-5 w-5"
                    style={{ color: "var(--foreground)" }}
                  />
                  <span
                    className="text-[16px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Share
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}