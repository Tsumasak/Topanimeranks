import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTypeClass, getDemographicClass } from "../utils/tagHelpers";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../components/ui/carousel";
import { ChevronRight, Sparkles, Instagram } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { SupabaseService } from "../services/supabase";
import type { HeroBanner } from "../services/supabase";
import Union from "../imports/Union";

interface HomeCardData {
  rank: number;
  title: string;
  subtitle?: string;
  image: string;
  score?: number;
  members?: number;
  animeType?: string;
  demographics?: string[];
  genres?: string[];
  themes?: string[];
  url?: string;
  season?: string;
  year?: number;
}

function HomeAnimeCard({
  data,
  type,
}: {
  data: HomeCardData;
  type: "episode" | "top" | "anticipated";
}) {
  const isEpisode = type === "episode";
  const isAnticipated = type === "anticipated";

  // Border and hover styling based on rank (same as BaseAnimeCard)
  let borderStyle = "border border-gray-600";
  let hoverClass = "rank-hover-4plus";
  let contentGradient = "";
  let rankStyle = "rank-4plus";

  if (data.rank === 1) {
    borderStyle = "border border-yellow-600";
    hoverClass = "rank-hover-1";
    contentGradient =
      "bg-gradient-to-br from-yellow-500/30 via-yellow-500/15 to-transparent";
  } else if (data.rank === 2) {
    borderStyle = "border border-gray-500";
    hoverClass = "rank-hover-2";
    contentGradient =
      "bg-gradient-to-br from-gray-400/30 via-gray-400/15 to-transparent";
  } else if (data.rank === 3) {
    borderStyle = "border border-orange-500";
    hoverClass = "rank-hover-3";
    contentGradient =
      "bg-gradient-to-br from-orange-400/30 via-orange-400/15 to-transparent";
  }

  // Image container class: Episode cards use h-40, new layout uses aspect-square
  const imageContainerClass = isEpisode
    ? "aspect-square md:h-[215px]"
    : "aspect-square";

  // Generate unique ID for gradients to avoid conflicts with multiple cards
  const uniqueId = `${data.rank}-${Math.random().toString(36).substr(2, 9)}`;

  // SVG Badge Components for top 3 positions (same as BaseAnimeCard)
  const GoldBadge = () => (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient
          id={`gold-home-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path
          d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z"
          fill={`url(#gold-home-${uniqueId})`}
          stroke="#B8860B"
          strokeWidth="100"
        />
      </g>
      <text
        x="24"
        y="29"
        textAnchor="middle"
        className="text-sm fill-black"
      >
        <tspan className="font-bold">#1</tspan>
      </text>
    </svg>
  );

  const SilverBadge = () => (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient
          id={`silver-home-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#E5E5E5" />
          <stop offset="50%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#A0A0A0" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path
          d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z"
          fill={`url(#silver-home-${uniqueId})`}
          stroke="#808080"
          strokeWidth="100"
        />
      </g>
      <text
        x="24"
        y="29"
        textAnchor="middle"
        className="text-sm fill-black"
      >
        <tspan className="font-bold">#2</tspan>
      </text>
    </svg>
  );

  const BronzeBadge = () => (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient
          id={`bronze-home-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="50%" stopColor="#B87333" />
          <stop offset="100%" stopColor="#A0522D" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path
          d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z"
          fill={`url(#bronze-home-${uniqueId})`}
          stroke="#8B4513"
          strokeWidth="100"
        />
      </g>
      <text
        x="24"
        y="29"
        textAnchor="middle"
        className="text-sm fill-black"
      >
        <tspan className="font-bold">#3</tspan>
      </text>
    </svg>
  );

  // Use shared tag helper functions
  const typeTagStyle = data.animeType ? getTypeClass(data.animeType) : "tag-default";

  // OLD LAYOUT for Weekly Episodes (original design)
  if (isEpisode) {
    return (
      <Link
        to={data.url || "#"}
        className={`block theme-card rounded-lg overflow-hidden flex flex-col group border ${borderStyle} ${hoverClass} transition-all duration-300 w-[280px] md:w-full h-full`}
      >
        {/* Image Section */}
        <div
          className={`relative flex-shrink-0 overflow-hidden anime-card-image ${imageContainerClass}`}
        >
          <img
            alt={data.title}
            className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top"
            src={data.image}
            loading="lazy"
          />

          {/* Tags Container - Top Right (only Type and Demographics) */}
          <div className="absolute top-2 right-2 flex flex-row gap-1">
            {/* Anime Type Tag */}
            {data.animeType && (
              <div
                className={`px-3 py-1 rounded-full text-xs ${typeTagStyle}`}
              >
                {data.animeType}
              </div>
            )}

            {/* Demographics Tag - only show first demographic if available */}
            {data.demographics &&
              data.demographics.length > 0 && (
                <div
                  className={`px-3 py-1 rounded-full text-xs ${getDemographicClass(data.demographics[0])}`}
                >
                  {data.demographics[0]}
                </div>
              )}
          </div>
        </div>

        {/* Container with gradient for top 3 positions */}
        <div
          className={`relative flex-grow flex flex-col justify-between ${contentGradient}`}
        >
          <div className="p-4 flex items-start flex-grow">
            {/* Rank Display - SVG badges for top 3, pill for others */}
            <div className="flex-shrink-0 flex flex-col items-center">
              {data.rank === 1 ? (
                <GoldBadge />
              ) : data.rank === 2 ? (
                <SilverBadge />
              ) : data.rank === 3 ? (
                <BronzeBadge />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center">
                  <div
                    className={`px-3 py-1 rounded-full text-sm ${rankStyle}`}
                  >
                    #{data.rank}
                  </div>
                </div>
              )}
            </div>

            {/* Title and Subtitle */}
            <div className="relative flex flex-col ml-4 flex-grow">
              <h3
                className="font-bold text-lg line-clamp-3 leading-[1.1] mb-3"
                style={{ color: "var(--foreground)" }}
              >
                {data.title}
              </h3>
              {data.subtitle && (
                <p
                  className="text-sm leading-[1.1] mb-2"
                  style={{ color: "var(--foreground)" }}
                >
                  {data.subtitle}
                </p>
              )}

              {/* Genres + Themes Tags - Combine and show first 3 total */}
              {((data.genres && data.genres.length > 0) || (data.themes && data.themes.length > 0)) && (
                <div className="flex gap-1 flex-wrap">
                  {[
                    ...(data.genres || []),
                    ...(data.themes || []),
                  ]
                    .slice(0, 3)
                    .map((tag, index) => (
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
          </div>
          {/* Bottom text container */}
          <div
            className="font-bold text-right px-4 pb-4 text-lg mt-auto"
            style={{ color: "var(--rating-yellow)" }}
          >
            {isAnticipated && data.members ? (
              <div className="flex flex-row md:flex-col items-end leading-tight gap-1 md:gap-0">
                <div>{data.members.toLocaleString()}</div>
                <div className="text-sm">Plan to Watch</div>
              </div>
            ) : data.score ? (
              `★ ${data.score}`
            ) : (
              ""
            )}
          </div>
        </div>
      </Link>
    );
  }

  // NEW LAYOUT for Top Animes & Most Anticipated (centered badge design)
  return (
    <Link
      to={data.url || "#"}
      className={`relative block theme-card rounded-lg overflow-visible flex flex-col group border ${borderStyle} ${hoverClass} transition-all duration-300 w-[280px] md:w-full md:h-full min-h-[380px]`}
    >
      {/* Image Section */}
      <div
        className={`relative flex-shrink-0 overflow-hidden ${imageContainerClass} rounded-t-lg`}
      >
        <img
          alt={data.title}
          className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top"
          src={data.image}
          loading="lazy"
        />

        {/* Tags Container - Top Right (only Type and Demographics) */}
        <div className="absolute top-2 right-2 flex flex-row gap-1">
          {/* Anime Type Tag */}
          {data.animeType && (
            <div
              className={`px-3 py-1 rounded-full text-xs ${typeTagStyle}`}
            >
              {data.animeType}
            </div>
          )}

          {/* Demographics Tag - only show first demographic if available */}
          {data.demographics &&
            data.demographics.length > 0 && (
              <div
                className={`px-3 py-1 rounded-full text-xs ${getDemographicClass(data.demographics[0])}`}
              >
                {data.demographics[0]}
              </div>
            )}
        </div>
      </div>

      {/* Container with gradient for top 3 positions */}
      <div
        className={`relative flex-grow flex flex-col justify-between ${contentGradient}`}
      >
        {/* Badge - Centered at top, overlapping image */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[24px] flex items-center justify-center w-12 h-12">
          {data.rank === 1 ? (
            <GoldBadge />
          ) : data.rank === 2 ? (
            <SilverBadge />
          ) : data.rank === 3 ? (
            <BronzeBadge />
          ) : (
            <div
              className={`px-3 py-1 rounded-full text-sm ${rankStyle}`}
            >
              #{data.rank}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="pt-[30px] pb-4 px-4 flex flex-col min-h-[120px]">
          {/* Title */}
          <h3
            className="font-bold text-lg line-clamp-3 leading-[1.1] mb-3"
            style={{ color: "var(--foreground)" }}
          >
            {data.title}
          </h3>

          {/* Genres + Themes Tags - Combine and show first 3 total */}
          {((data.genres && data.genres.length > 0) || (data.themes && data.themes.length > 0)) && (
            <div className="flex gap-1 flex-wrap">
              {[...(data.genres || []), ...(data.themes || [])]
                .slice(0, 3)
                .map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 theme-rating text-xs rounded-full border h-[26px] flex items-center"
                    style={{
                      borderColor: "var(--card-border)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}

          {/* Season Tag - Show below genres/themes */}
          {data.season && data.year && (
            <div className="mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  data.season.toLowerCase() === "winter"
                    ? "tag-winter"
                    : data.season.toLowerCase() === "summer"
                      ? "tag-summer"
                      : data.season.toLowerCase() === "fall"
                        ? "tag-fall"
                        : data.season.toLowerCase() === "spring"
                          ? "tag-spring"
                          : "tag-default"
                }`}
              >
                {data.season.charAt(0).toUpperCase() + data.season.slice(1)} {data.year}
              </span>
            </div>
          )}
        </div>

        {/* Bottom text container */}
        <div
          className="font-bold text-right px-4 pb-4 text-lg mt-auto h-[36px] flex items-center justify-end"
          style={{ color: "var(--rating-yellow)" }}
        >
          {isAnticipated && data.members ? (
            <div className="flex flex-row md:flex-col items-end leading-tight gap-1 md:gap-0">
              <div>{data.members.toLocaleString()}</div>
              <div className="text-sm">Plan to Watch</div>
            </div>
          ) : data.score ? (
            `★ ${data.score}`
          ) : (
            ""
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomeNewPage() {
  const [topEpisodes, setTopEpisodes] = useState<HomeCardData[]>([]);
  const [topSeasonAnimes, setTopSeasonAnimes] = useState<HomeCardData[]>([]);
  const [anticipated, setAnticipated] = useState<HomeCardData[]>([]);
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(() => {
    // Initialize from sessionStorage if available
    const cached = sessionStorage.getItem('hero_banner');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Animation keys for smooth entry animations
  const [animationKey, setAnimationKey] = useState("initial");

  useEffect(() => {
    const loadData = async () => {
      console.log("[HomeNewPage] 🔍 Starting to load home data");
      try {
        setIsLoading(true);

        // Load Top Season Animes from Supabase (Winter 2026)
        // Winter 2026 - Order by SCORE (rating-based ranking)
        const seasonAnimes = await SupabaseService.getSeasonRankings(
          "winter",
          2026,
          "score",
        );

        // Process Top Season Animes (top 3)
        if (seasonAnimes.length > 0) {
          const topSeason = seasonAnimes
            .slice(0, 5)
            .map((anime, index) => ({
              rank: index + 1,
              title: anime.title_english || anime.title,
              image:
                anime.images?.jpg?.large_image_url ||
                anime.images?.jpg?.image_url ||
                "",
              score: anime.score || 0,
              animeType: anime.type || "TV",
              demographics:
                anime.demographics?.map((d) => d.name) || [],
              genres: anime.genres?.map((g) => g.name) || [],
              themes: anime.themes?.map((t) => t.name) || [],
              url: `/anime/${anime.mal_id}`,
              season: anime.season || "winter",
              year: anime.year || 2026,
            }));
          setTopSeasonAnimes(topSeason);

          // Set dynamic background from #1 anime
          if (topSeason.length > 0) {
            document.documentElement.style.setProperty(
              "--bg-image",
              `url(${topSeason[0].image})`,
            );
          }
        }

        // Spring 2026 - Order by MEMBERS (popularity-based ranking)
        const spring2026Animes =
          await SupabaseService.getAnticipatedAnimesBySeason(
            "spring",
            2026,
          );

        if (spring2026Animes.length > 0) {
          const topAnticipated = spring2026Animes
            .slice(0, 5)
            .map((anime, index) => ({
              rank: index + 1,
              title: anime.title,
              image: anime.imageUrl,
              members: anime.members,
              animeType: anime.animeType,
              demographics: Array.isArray(anime.demographics)
                ? anime.demographics.map((d: any) =>
                    typeof d === "string" ? d : d.name,
                  )
                : [],
              genres: Array.isArray(anime.genres)
                ? anime.genres.map((g: any) =>
                    typeof g === "string" ? g : g.name,
                  )
                : [],
              themes: Array.isArray(anime.themes)
                ? anime.themes.map((t: any) =>
                    typeof t === "string" ? t : t.name,
                  )
                : [],
              url: anime.url,
              season: anime.season || "spring",
              year: anime.year || 2026,
            }));
          setAnticipated(topAnticipated);
        }

        // Weekly Episodes - Auto-detect latest week with 5+ scored episodes
        let weekToShow = 1;

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            },
          );

          if (!response.ok) {
            console.error(`[HomeNewPage] ❌ HTTP error: ${response.status}`);
            console.log(`[HomeNewPage] 🔄 Falling back to Week 1 due to server error`);
            // Continue with weekToShow = 1 (already set)
          } else {
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.error(`[HomeNewPage] ❌ Response is not JSON. Content-Type: ${contentType}`);
              console.log(`[HomeNewPage] 🔄 Falling back to Week 1 due to non-JSON response`);
              // Continue with weekToShow = 1 (already set)
            } else {
              const result = await response.json();

              if (result.success && result.latestWeek) {
                weekToShow = result.latestWeek;
                console.log(
                  `[HomeNewPage] 🎯 Using latest week: Week ${weekToShow} (auto-detected)`,
                );
              } else {
                console.log(
                  `[HomeNewPage] ⚠️ Could not detect latest week, falling back to Week 1`,
                );
              }
            }
          }
        } catch (error) {
          console.error(
            "[HomeNewPage] ❌ Error detecting latest week:",
            error,
          );
          console.log(`[HomeNewPage] ⚠️ Falling back to Week 1`);
        }

        let weeklyEpisodesData =
          await SupabaseService.getWeeklyEpisodes(weekToShow);

        if (weeklyEpisodesData.episodes.length > 0) {
          const topWeekly = weeklyEpisodesData.episodes
            .slice(0, 5)
            .map((episode, index) => ({
              rank: index + 1,
              title: episode.animeTitle,
              subtitle: episode.episodeTitle
                ? `EP ${episode.episodeNumber} - ${episode.episodeTitle}`
                : `EP ${episode.episodeNumber}`,
              image: episode.imageUrl || "",
              score: episode.episodeScore || 0,
              animeType: episode.animeType || "TV",
              demographics: episode.demographics || [],
              genres: episode.genres || [],
              themes: episode.themes || [],
              url: `/anime/${episode.animeId}`,
            }));
          setTopEpisodes(topWeekly);

          // Week period info (removed - no longer needed)
          // const weekConfig = WEEKS_DATA.find((w) => w.id === `week${weekToShow}`);
          // Calculate week period dates for display

          console.log(
            `[HomeNewPage] ✅ Loaded ${topWeekly.length} episodes from Week ${weekToShow}`,
          );
        } else {
          console.log("[HomeNewPage] No weekly episodes found");
          setTopEpisodes([]);
        }

        // Load Hero Banner
        const heroBannerData = await SupabaseService.getActiveHeroBanner();
        if (heroBannerData) {
          setHeroBanner(heroBannerData);
          console.log('[HomeNewPage] ✅ Loaded hero banner:', heroBannerData.title);
          // Cache hero banner in sessionStorage
          sessionStorage.setItem('hero_banner', JSON.stringify(heroBannerData));
        } else {
          console.log('[HomeNewPage] ℹ️ No active hero banner found');
          // Clear cache if no active banner
          sessionStorage.removeItem('hero_banner');
          setHeroBanner(null);
        }

        console.log(
          "[HomeNewPage] 🎬 CRITICAL: All data loaded, updating animationKey",
        );
        setAnimationKey("loaded");
      } catch (error) {
        console.error(
          "[HomeNewPage] ❌ Error loading home data:",
          error,
        );
      } finally {
        console.log(
          "[HomeNewPage] 🏁 Finally block: setting loading to false",
        );
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        {/* Hero Skeleton */}
        <div className="relative w-full h-[50vh] md:h-[55vh] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded-lg mx-auto"></div>
              <div className="h-12 w-96 max-w-full bg-gray-300 dark:bg-gray-700 rounded-lg mx-auto"></div>
              <div className="h-6 w-full max-w-md bg-gray-300 dark:bg-gray-700 rounded-lg mx-auto"></div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="container mx-auto px-[24px] pt-[48px] pb-[32px] space-y-12">
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-4">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((card) => (
                  <div key={card} className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Hero Banner - Full Width but Smaller Height */}
      <section className="relative w-full h-[50vh] md:h-[55vh] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={heroBanner?.imageUrl || "https://images.unsplash.com/photo-1613723984367-a9b7ee9052d8?w=1920&q=75&fm=webp&fit=crop"}
            alt={heroBanner?.title || "Hero Banner"}
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Gradient Overlays - Adapts to theme with balanced mobile gradients */}
          {/* Mobile gradients - strong but allows image visibility */}
          <div 
            className="absolute inset-0 md:hidden"
            style={{
              background: `linear-gradient(to right, rgba(var(--background-rgb), 0.92) 0%, rgba(var(--background-rgb), 0.75) 50%, rgba(var(--background-rgb), 0.45) 75%, transparent 100%)`
            }}
          />
          <div 
            className="absolute inset-0 md:hidden"
            style={{
              background: `linear-gradient(to top, rgba(var(--background-rgb), 0.95) 0%, rgba(var(--background-rgb), 0.25) 65%, transparent 100%)`
            }}
          />
          
          {/* Desktop gradients - original strength */}
          <div 
            className="absolute inset-0 hidden md:block"
            style={{
              background: `linear-gradient(to right, rgba(var(--background-rgb), 0.95) 0%, rgba(var(--background-rgb), 0.7) 40%, transparent 100%)`
            }}
          />
          <div 
            className="absolute inset-0 hidden md:block"
            style={{
              background: `linear-gradient(to top, rgba(var(--background-rgb), 1) 0%, transparent 50%)`
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative h-full container mx-auto px-6 md:px-12 flex items-center">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium tracking-wider uppercase text-xs">
                {heroBanner?.tagline || "Welcome to Top Anime Ranks"}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black mb-4 leading-tight"
              style={{ color: 'var(--foreground)' }}
            >
              {heroBanner?.title ? (
                heroBanner.title
              ) : (
                <>
                  <span className="block">Discover the</span>
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Best Anime
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg mb-6 max-w-2xl leading-relaxed"
              style={{ 
                color: 'var(--foreground)',
                opacity: 0.9
              }}
            >
              {heroBanner?.subtitle || "Weekly rankings updated, featured episodes and the most anticipated anime. All in one place."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to={heroBanner?.buttonLink || "/ranks"}
                className="group relative px-6 py-3 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: 'var(--rank-background)',
                  color: 'var(--rank-text)',
                  overflow: 'visible',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <span className="relative flex items-center gap-2 font-semibold text-sm">
                  {heroBanner?.buttonText || "View Weekly Rankings"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-screen-2xl px-[24px] pt-[32px] flex flex-col gap-[48px] overflow-x-hidden">
        {/* Weekly Episodes Section */}
        <div className="flex flex-col gap-[18px] w-full">
          {/* Section Header */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between gap-4 w-full">
              <p
                className="leading-[32px] text-[20px] md:text-[30px] break-words"
                style={{
                  color: "var(--foreground)",
                  fontWeight: "bold",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                }}
              >
                Weekly Anime Episodes
              </p>
              <Link
                to="/ranks"
                className="md:hidden leading-[16px] text-[12px] whitespace-nowrap rounded px-2 py-1 transition-all duration-200"
                style={{
                  color: "var(--rating-yellow)",
                  fontWeight: "bold",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                }}
              >
                View All {'>'}
              </Link>
            </div>
          </div>

          {/* Mobile: Carousel */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`episodes-mobile-${animationKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-col gap-4"
              >
                <div className="-mx-[18px]">
                  <Carousel
                    className="w-full"
                    opts={{ align: "start", loop: false }}
                  >
                    <CarouselContent className="gap-3 px-[18px] items-stretch">
                      {topEpisodes.length > 0
                        ? topEpisodes.map((ep, index) => (
                            <CarouselItem
                              key={`episode-${ep.rank}`}
                              className="pl-0 basis-[280px]"
                            >
                              <motion.div
                                initial={{
                                  opacity: 0,
                                  scale: 0.9,
                                  y: 20,
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                  y: 0,
                                }}
                                transition={{
                                  duration: 0.3,
                                  delay: index * 0.03,
                                  ease: [0.34, 1.56, 0.64, 1],
                                }}
                                className="flex flex-1"
                              >
                                <HomeAnimeCard
                                  data={ep}
                                  type="episode"
                                />
                              </motion.div>
                            </CarouselItem>
                          ))
                        : [1, 2, 3, 4, 5].map((i) => (
                            <CarouselItem
                              key={`placeholder-${i}`}
                              className="pl-0 basis-[280px]"
                            >
                              <div className="bg-slate-700/50 h-[320px] rounded-[10px] flex items-center justify-center">
                                <p className="text-slate-400 text-sm">
                                  Loading...
                                </p>
                              </div>
                            </CarouselItem>
                          ))}
                      {/* Spacer for right margin */}
                      <div className="w-[18px] flex-shrink-0" aria-hidden="true" />
                    </CarouselContent>
                  </Carousel>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop: Card Container */}
          <div className="hidden md:block">
            <div
              className="theme-card rounded-[10px] overflow-hidden"
              style={{
                backgroundColor: "var(--card-background)",
                borderWidth: "1px",
                borderColor: "var(--card-border)",
              }}
            >
              <div className="flex flex-col justify-center size-full">
                <div className="box-border content-stretch flex flex-col gap-[24px] items-start justify-center p-[24px] relative w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`episodes-${animationKey}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-row gap-[24px] w-full"
                    >
                      {topEpisodes.length > 0
                        ? topEpisodes.map((ep, index) => (
                            <motion.div
                              key={`episode-${ep.rank}`}
                              initial={{
                                opacity: 0,
                                scale: 0.9,
                                y: 20,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                              }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.03,
                                ease: [0.34, 1.56, 0.64, 1],
                              }}
                              className="flex flex-1"
                            >
                              <HomeAnimeCard
                                data={ep}
                                type="episode"
                              />
                            </motion.div>
                          ))
                        : [1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={`placeholder-episode-${i}`}
                              className="bg-slate-700/50 h-[320px] flex-1 rounded-[10px] flex items-center justify-center"
                            >
                              <p className="text-slate-400 text-sm">
                                Loading...
                              </p>
                            </div>
                          ))}
                    </motion.div>
                  </AnimatePresence>

                  <Link
                    to="/ranks"
                    className="font-['Arial'] font-bold leading-[20px] relative shrink-0 text-[14px] text-right w-full hover:opacity-80 transition-opacity"
                    style={{ color: "var(--foreground)" }}
                  >
                    <span style={{ color: "var(--rating-yellow)" }}>
                      ▸{" "}
                    </span>
                    View Complete Rank
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Continued */}
      <div className="container mx-auto max-w-screen-2xl px-[24px] pb-[32px] pt-[48px] flex flex-col gap-[48px] overflow-x-hidden">
        {/* Two Column Section */}
        <div className="flex flex-col lg:flex-row gap-[48px] lg:gap-[18px] items-stretch w-full">
          {/* Top Animes - Winter 2026 */}
          <div className="flex flex-col gap-[18px] lg:flex-1 w-full">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between gap-4 w-full">
                <p
                  className="leading-[32px] text-[20px] md:text-[30px] break-words"
                  style={{
                    color: "var(--foreground)",
                    fontWeight: "bold",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                  }}
                >
                  Top Animes
                </p>
                <Link
                  to="/top-season-animes"
                  className="md:hidden leading-[16px] text-[12px] whitespace-nowrap rounded px-2 py-1 transition-all duration-200"
                  style={{
                    color: "var(--rating-yellow)",
                    fontWeight: "bold",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                  }}
                >
                  View All {'>'}
                </Link>
              </div>
              <p
                className="font-['Arial'] leading-[16px] text-[12px] break-words"
                style={{ color: "var(--rating-text)" }}
              >
                Winter 2026
              </p>
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`top-animes-mobile-${animationKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="-mx-[18px]">
                    <Carousel
                      className="w-full"
                      opts={{ align: "start", loop: false }}
                    >
                      <CarouselContent className="gap-3 px-[18px] items-stretch">
                        {topSeasonAnimes.length > 0
                          ? topSeasonAnimes.map((anime, index) => (
                              <CarouselItem
                                key={`top-anime-${anime.rank}`}
                                className="pl-0 basis-[280px]"
                              >
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    scale: 0.9,
                                    y: 20,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                  }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.03,
                                    ease: [0.34, 1.56, 0.64, 1],
                                  }}
                                >
                                  <HomeAnimeCard
                                    data={anime}
                                    type="top"
                                  />
                                </motion.div>
                              </CarouselItem>
                            ))
                          : [1, 2, 3, 4, 5].map((i) => (
                              <CarouselItem
                                key={`placeholder-${i}`}
                                className="pl-0 basis-[280px]"
                              >
                                <div className="bg-slate-700/50 h-[380px] rounded-[10px] flex items-center justify-center">
                                  <p className="text-slate-400 text-sm">
                                    Loading...
                                  </p>
                                </div>
                              </CarouselItem>
                            ))}
                      {/* Spacer for right margin */}
                      <div className="w-[18px] flex-shrink-0" aria-hidden="true" />
                      </CarouselContent>
                    </Carousel>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Card */}
            <div className="hidden md:block">
              <div
                className="theme-card rounded-[10px] overflow-hidden h-full"
                style={{
                  backgroundColor: "var(--card-background)",
                  borderWidth: "1px",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex flex-col justify-center size-full">
                  <div className="box-border flex flex-col gap-[24px] items-start justify-center p-[24px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`top-animes-${animationKey}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-3 gap-[24px] w-full"
                      >
                        {topSeasonAnimes.length > 0
                          ? topSeasonAnimes.slice(0, 3).map((anime, index) => (
                              <motion.div
                                key={`top-anime-${anime.rank}`}
                                initial={{
                                  opacity: 0,
                                  scale: 0.9,
                                  y: 20,
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                  y: 0,
                                }}
                                transition={{
                                  duration: 0.3,
                                  delay: index * 0.03,
                                  ease: [0.34, 1.56, 0.64, 1],
                                }}
                              >
                                <HomeAnimeCard
                                  data={anime}
                                  type="top"
                                />
                              </motion.div>
                            ))
                          : [1, 2, 3].map((i) => (
                              <div
                                key={`placeholder-top-${i}`}
                                className="bg-slate-700/50 h-[380px] rounded-[10px] flex items-center justify-center"
                              >
                                <p className="text-slate-400 text-sm">
                                  Loading...
                                </p>
                              </div>
                            ))}
                      </motion.div>
                    </AnimatePresence>

                    <Link
                      to="/top-season-animes"
                      className="font-['Arial'] font-bold leading-[20px] text-[14px] text-right w-full hover:opacity-80 transition-opacity"
                      style={{ color: "var(--foreground)" }}
                    >
                      <span style={{ color: "var(--rating-yellow)" }}>
                        ▸{" "}
                      </span>
                      View Complete Rank
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Most Anticipated - Spring 2026 */}
          <div className="flex flex-col gap-[18px] lg:flex-1 w-full">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between gap-4 w-full">
                <p
                  className="leading-[32px] text-[20px] md:text-[30px] break-words"
                  style={{
                    color: "var(--foreground)",
                    fontWeight: "bold",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                  }}
                >
                  Most Anticipated Animes
                </p>
                <Link
                  to="/most-anticipated-animes"
                  className="md:hidden leading-[16px] text-[12px] whitespace-nowrap rounded px-2 py-1 transition-all duration-200"
                  style={{
                    color: "var(--rating-yellow)",
                    fontWeight: "bold",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                  }}
                >
                  View All {'>'}
                </Link>
              </div>
              <p
                className="font-['Arial'] leading-[16px] text-[12px] break-words"
                style={{ color: "var(--rating-text)" }}
              >
                Spring 2026
              </p>
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`anticipated-mobile-${animationKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="-mx-[18px]">
                    <Carousel
                      className="w-full"
                      opts={{ align: "start", loop: false }}
                    >
                      <CarouselContent className="gap-3 px-[18px] items-stretch">
                        {anticipated.length > 0
                          ? anticipated.map((anime, index) => (
                              <CarouselItem
                                key={`anticipated-${anime.rank}`}
                                className="pl-0 basis-[280px]"
                              >
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    scale: 0.9,
                                    y: 20,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                  }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.03,
                                    ease: [0.34, 1.56, 0.64, 1],
                                  }}
                                >
                                  <HomeAnimeCard
                                    data={anime}
                                    type="anticipated"
                                  />
                                </motion.div>
                              </CarouselItem>
                            ))
                          : [1, 2, 3, 4, 5].map((i) => (
                              <CarouselItem
                                key={`placeholder-${i}`}
                                className="pl-0 basis-[280px]"
                              >
                                <div className="bg-slate-700/50 h-[380px] rounded-[10px] flex items-center justify-center">
                                  <p className="text-slate-400 text-sm">
                                    Loading...
                                  </p>
                                </div>
                              </CarouselItem>
                            ))}
                      {/* Spacer for right margin */}
                      <div className="w-[18px] flex-shrink-0" aria-hidden="true" />
                      </CarouselContent>
                    </Carousel>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Card */}
            <div className="hidden md:block">
              <div
                className="theme-card rounded-[10px] overflow-hidden h-full"
                style={{
                  backgroundColor: "var(--card-background)",
                  borderWidth: "1px",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex flex-col justify-center size-full">
                  <div className="box-border flex flex-col gap-[24px] items-start justify-center p-[24px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`anticipated-${animationKey}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-3 gap-[24px] w-full"
                      >
                        {anticipated.length > 0
                          ? anticipated.slice(0, 3).map((anime, index) => (
                              <motion.div
                                key={`anticipated-${anime.rank}`}
                                initial={{
                                  opacity: 0,
                                  scale: 0.9,
                                  y: 20,
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                  y: 0,
                                }}
                                transition={{
                                  duration: 0.3,
                                  delay: index * 0.03,
                                  ease: [0.34, 1.56, 0.64, 1],
                                }}
                              >
                                <HomeAnimeCard
                                  data={anime}
                                  type="anticipated"
                                />
                              </motion.div>
                            ))
                          : [1, 2, 3].map((i) => (
                              <div
                                key={`placeholder-anticipated-${i}`}
                                className="bg-slate-700/50 h-[380px] rounded-[10px] flex items-center justify-center"
                              >
                                <p className="text-slate-400 text-sm">
                                  Loading...
                                </p>
                              </div>
                            ))}
                      </motion.div>
                    </AnimatePresence>

                    <Link
                      to="/most-anticipated-animes"
                      className="font-['Arial'] font-bold leading-[20px] text-[14px] text-right w-full hover:opacity-80 transition-opacity"
                      style={{ color: "var(--foreground)" }}
                    >
                      <span style={{ color: "var(--rating-yellow)" }}>
                        ▸{" "}
                      </span>
                      View Complete Rank
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Social Media & Logo */}
      <footer className="w-full relative py-8 overflow-hidden mt-6 border-t" style={{ borderColor: 'var(--card-border)' }}>
        {/* Dynamic Background with Blurred Anime Image - #1 Top Anime */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={topSeasonAnimes.length > 0 ? topSeasonAnimes[0].image : "https://images.unsplash.com/photo-1764730282847-fbea83b8e932?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGNoYXJhY3RlciUyMGJsdXJ8ZW58MXx8fHwxNzY4MzUwMjAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"}
            alt="Footer Background"
            className="w-full h-full object-cover"
            loading="lazy"
            style={{
              filter: 'blur(8px)',
              opacity: 'var(--bg-opacity)'
            }}
          />
        </div>
        {/* Overlay with reduced opacity */}
        <div 
          className="absolute inset-0" 
          style={{
            background: `rgba(var(--background-rgb), 0.85)`
          }}
        />
        
        <div className="relative container mx-auto max-w-screen-2xl px-[24px]">
          {/* Social Media & Info */}
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p 
                className="leading-[32px] text-[20px] md:text-[30px] break-words"
                style={{
                  color: "var(--foreground)",
                  fontWeight: "bold",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                }}
              >
                Join Our Community
              </p>
              <p className="text-sm text-gray-400 text-center md:text-left">
                Stay updated with the latest anime rankings and releases
              </p>
            </div>
            
            {/* Logo & Social Icons Stacked */}
            <div className="flex flex-col items-center md:items-end gap-4">
              {/* Logo */}
              <div className="h-[35px] md:h-[50px] opacity-90 hover:opacity-100 transition-opacity">
                <Union />
              </div>
              
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/topanimeranks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    border: '2px solid var(--card-border)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                </a>
                
                <a
                  href="https://x.com/topanimeranks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    border: '2px solid var(--card-border)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Follow us on X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)' }}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                
                <a
                  href="https://www.threads.com/@topanimeranks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    border: '2px solid var(--card-border)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Follow us on Threads"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 192 192" style={{ color: 'var(--foreground)' }}>
                    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-4 pt-3 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Top Anime Ranks. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}