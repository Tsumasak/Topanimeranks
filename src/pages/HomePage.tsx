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

  // Border and hover styling based on rank
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

  // Generate unique ID for gradients
  const uniqueId = `${data.rank}-${Math.random().toString(36).substr(2, 9)}`;

  // SVG Badge Components for top 3 positions
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
        className={`block theme-card rounded-lg overflow-hidden flex flex-col group border ${borderStyle} ${hoverClass} transition-all duration-300 w-full h-full`}
      >
        {/* Image Section - Fixed height */}
        <div className="relative flex-shrink-0 overflow-hidden anime-card-image w-full h-[280px]">
          <img
            alt={data.title}
            className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top"
            src={data.image}
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
          className={`relative flex-1 flex flex-col ${contentGradient}`}
        >
          <div className="p-4 flex flex-col">
            {/* Rank and Title Row */}
            <div className="flex items-start gap-3 mb-2">
              {/* Rank Display - SVG badges for top 3, pill for others */}
              <div className="flex-shrink-0">
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

              {/* Title - HUG with max 3 lines */}
              <h3
                className="font-bold text-lg line-clamp-3 leading-[1.2] flex-1"
                style={{ color: "var(--foreground)" }}
              >
                {data.title}
              </h3>
            </div>

            {/* Subtitle - HUG with max 2 lines */}
            {data.subtitle && (
              <p
                className="text-sm leading-[1.2] line-clamp-2 mb-2"
                style={{ color: "var(--foreground)" }}
              >
                {data.subtitle}
              </p>
            )}

            {/* Genres + Themes Tags - HUG with max 2 lines */}
            {((data.genres && data.genres.length > 0) ||
              (data.themes && data.themes.length > 0)) && (
              <div className="flex gap-1 flex-wrap mb-2">
                {[
                  ...(data.genres || []),
                  ...(data.themes || []),
                ]
                  .slice(0, 4)
                  .map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 theme-rating text-xs rounded-full border"
                      style={{
                        borderColor: "var(--card-border)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}

            {/* Flexible Space - Grows to fill remaining space */}
            <div className="flex-1" />

            {/* Bottom Rating - Always at bottom right */}
            <div
              className="font-bold text-right text-lg flex-shrink-0"
              style={{ color: "var(--rating-yellow)" }}
            >
              {data.score ? `★ ${data.score}` : ""}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // NEW LAYOUT for Top Animes & Most Anticipated (centered badge design)
  return (
    <Link
      to={data.url || "#"}
      className={`relative block theme-card rounded-lg overflow-visible flex flex-col group border ${borderStyle} ${hoverClass} transition-all duration-300 w-full h-full`}
    >
      {/* Image Section - Fixed height */}
      <div className="relative flex-shrink-0 overflow-hidden w-full h-[280px] rounded-t-lg">
        <img
          alt={data.title}
          className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top"
          src={data.image}
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
        className={`relative flex-1 flex flex-col ${contentGradient}`}
      >
        {/* Badge - Centered at top, overlapping image */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[24px] flex items-center justify-center w-12 h-12 z-10">
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
        <div className="pt-[30px] pb-4 px-4 flex flex-col">
          {/* Title - HUG with max 3 lines */}
          <h3
            className="font-bold text-lg line-clamp-3 leading-[1.2] mb-2"
            style={{ color: "var(--foreground)" }}
          >
            {data.title}
          </h3>

          {/* Genres + Themes Tags - HUG with max 2 lines */}
          {((data.genres && data.genres.length > 0) ||
            (data.themes && data.themes.length > 0)) && (
            <div className="flex gap-1 flex-wrap mb-2">
              {[...(data.genres || []), ...(data.themes || [])]
                .slice(0, 4)
                .map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 theme-rating text-xs rounded-full border"
                    style={{
                      borderColor: "var(--card-border)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}

          {/* Season Tag - HUG */}
          {data.season && data.year && (
            <div className="mb-2">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
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

          {/* Flexible Space - Grows to fill remaining space */}
          <div className="flex-1" />

          {/* Bottom Rating - Always at bottom right */}
          <div
            className="font-bold text-right text-lg flex-shrink-0"
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
      </div>
    </Link>
  );
}

export function HomePage() {
  const [topEpisodes, setTopEpisodes] = useState<
    HomeCardData[]
  >([]);
  const [topSeasonAnimes, setTopSeasonAnimes] = useState<
    HomeCardData[]
  >([]);
  const [anticipated, setAnticipated] = useState<
    HomeCardData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [weekPeriod, setWeekPeriod] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[HomePage] 🔄 Fetching data...");

        // Fetch Top Episodes
        const episodesResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/home/topEpisodes`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        const episodesData = await episodesResponse.json();
        console.log("[HomePage] ✅ Episodes data:", episodesData);

        // Fetch Top Season Animes
        const seasonResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/home/topSeason`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        const seasonData = await seasonResponse.json();
        console.log("[HomePage] ✅ Season data:", seasonData);

        // Fetch Most Anticipated
        const anticipatedResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/home/mostAnticipated`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        const anticipatedData = await anticipatedResponse.json();
        console.log("[HomePage] ✅ Anticipated data:", anticipatedData);

        // Set state
        setTopEpisodes(episodesData.items || []);
        setTopSeasonAnimes(seasonData.items || []);
        setAnticipated(anticipatedData.items || []);
        setWeekPeriod(episodesData.period || "");

        setIsLoading(false);
        setAnimationKey((prev) => prev + 1);
      } catch (error) {
        console.error("[HomePage] ❌ Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    console.log(
      "[HomePage] 🚫 Render blocked: loading is true",
    );
    return (
      <div className="dynamic-background min-h-screen">
        <div className="container mx-auto px-[24px] pt-[32px] pb-[32px]">
          {/* Content renders immediately */}
        </div>
      </div>
    );
  }

  console.log("[HomePage] 🎨 Rendering main content:", {
    animationKey,
    topEpisodesCount: topEpisodes.length,
    topSeasonAnimesCount: topSeasonAnimes.length,
    anticipatedCount: anticipated.length,
  });

  return (
    <div className="dynamic-background min-h-screen">
      {/* Main Content */}
      <div className="container mx-auto max-w-screen-2xl px-[24px] pt-[32px] pb-[32px] flex flex-col gap-[32px] overflow-x-hidden">
        {/* Weekly Episodes Section */}
        <div className="flex flex-col gap-[18px] w-full">
          {/* Section Header - Outside card */}
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
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(var(--primary-rgb), 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(var(--primary-rgb), 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                View All →
              </Link>
            </div>
            <p
              className="font-['Arial'] leading-[16px] text-[12px] break-words hidden"
              style={{ color: "var(--rating-text)" }}
            >
              {weekPeriod || "Loading period..."}
            </p>
          </div>

          {/* Mobile: Carousel without card container */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`episodes-mobile-${animationKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-col gap-4"
                style={{ "--carousel-item-height": "420px" } as React.CSSProperties}
                onAnimationStart={() =>
                  console.log(
                    "[HomePage] 🎬 Animation START for episodes mobile",
                  )
                }
                onAnimationComplete={() =>
                  console.log(
                    "[HomePage] ✨ Animation COMPLETE for episodes mobile",
                  )
                }
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
                              className="pl-0 basis-[280px] h-[420px] flex"
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
                                className="w-full h-full flex"
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
                              key={`placeholder-episode-${i}`}
                              className="pl-0 basis-[280px] h-[420px]"
                            >
                              <div className="bg-slate-700/50 h-full w-full rounded-[10px] flex items-center justify-center">
                                <p className="text-slate-400 text-sm">
                                  Loading...
                                </p>
                              </div>
                            </CarouselItem>
                          ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop: Grid inside card container */}
          <div className="hidden md:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={`episodes-desktop-${animationKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onAnimationStart={() =>
                  console.log(
                    "[HomePage] 🎬 Animation START for episodes desktop",
                  )
                }
                onAnimationComplete={() =>
                  console.log(
                    "[HomePage] ✨ Animation COMPLETE for episodes desktop",
                  )
                }
              >
                <div className="theme-card rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                          >
                            <HomeAnimeCard
                              data={ep}
                              type="episode"
                            />
                          </motion.div>
                        ))
                      : [1, 2, 3, 4].map((i) => (
                          <div
                            key={`placeholder-episode-${i}`}
                            className="bg-slate-700/50 h-[320px] w-full rounded-[10px] flex items-center justify-center"
                          >
                            <p className="text-slate-400 text-sm">
                              Loading...
                            </p>
                          </div>
                        ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Top Season Animes Section */}
        <div className="flex flex-col gap-[18px] w-full">
          {/* Section Header - Outside card */}
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
                Top Animes of the Season
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
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(var(--primary-rgb), 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(var(--primary-rgb), 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                View All &gt;
              </Link>
            </div>
          </div>

          {/* Mobile: Carousel without card container */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`season-mobile-${animationKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-col gap-4"
                style={{ "--carousel-item-height": "480px" } as React.CSSProperties}
              >
                <div className="-mx-[18px]">
                  <Carousel
                    className="w-full"
                    opts={{ align: "start", loop: false }}
                  >
                    <CarouselContent className="gap-3 px-[18px] items-stretch">
                      {topSeasonAnimes.length > 0
                        ? topSeasonAnimes.map(
                            (anime, index) => (
                              <CarouselItem
                                key={`season-${anime.rank}`}
                                className="pl-0 basis-[280px] h-[480px] flex"
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
                                  className="w-full h-full flex"
                                >
                                  <HomeAnimeCard
                                    data={anime}
                                    type="top"
                                  />
                                </motion.div>
                              </CarouselItem>
                            ),
                          )
                        : [1, 2, 3, 4, 5].map((i) => (
                            <CarouselItem
                              key={`placeholder-season-${i}`}
                              className="pl-0 basis-[280px] h-[480px]"
                            >
                              <div className="bg-slate-700/50 h-full w-full rounded-[10px] flex items-center justify-center">
                                <p className="text-slate-400 text-sm">
                                  Loading...
                                </p>
                              </div>
                            </CarouselItem>
                          ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop: Grid inside card container */}
          <div className="hidden md:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={`season-desktop-${animationKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="theme-card rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {topSeasonAnimes.length > 0
                      ? topSeasonAnimes.map((anime, index) => (
                          <motion.div
                            key={`season-${anime.rank}`}
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
                      : [1, 2, 3, 4].map((i) => (
                          <div
                            key={`placeholder-season-${i}`}
                            className="bg-slate-700/50 h-[380px] w-full rounded-[10px] flex items-center justify-center"
                          >
                            <p className="text-slate-400 text-sm">
                              Loading...
                            </p>
                          </div>
                        ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Most Anticipated Section */}
        <div className="flex flex-col gap-[18px] w-full">
          {/* Section Header - Outside card */}
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
                Most Anticipated
              </p>
              <Link
                to="/anticipated"
                className="md:hidden leading-[16px] text-[12px] whitespace-nowrap rounded px-2 py-1 transition-all duration-200"
                style={{
                  color: "var(--rating-yellow)",
                  fontWeight: "bold",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(var(--primary-rgb), 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(var(--primary-rgb), 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                View All &gt;
              </Link>
            </div>
          </div>

          {/* Mobile: Carousel without card container */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`anticipated-mobile-${animationKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-col gap-4"
                style={{ "--carousel-item-height": "480px" } as React.CSSProperties}
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
                              className="pl-0 basis-[280px] h-[480px] flex"
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
                                className="w-full h-full flex"
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
                              key={`placeholder-anticipated-${i}`}
                              className="pl-0 basis-[280px] h-[480px]"
                            >
                              <div className="bg-slate-700/50 h-full w-full rounded-[10px] flex items-center justify-center">
                                <p className="text-slate-400 text-sm">
                                  Loading...
                                </p>
                              </div>
                            </CarouselItem>
                          ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop: Grid inside card container */}
          <div className="hidden md:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={`anticipated-desktop-${animationKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="theme-card rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {anticipated.length > 0
                      ? anticipated.map((anime, index) => (
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
                      : [1, 2, 3, 4].map((i) => (
                          <div
                            key={`placeholder-anticipated-${i}`}
                            className="bg-slate-700/50 h-[380px] w-full rounded-[10px] flex items-center justify-center"
                          >
                            <p className="text-slate-400 text-sm">
                              Loading...
                            </p>
                          </div>
                        ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;