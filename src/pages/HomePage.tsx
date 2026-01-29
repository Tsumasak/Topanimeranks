import { useState, useEffect } from "react";
import { Link } from "react-router";
import { AnimeCard } from "../components/AnimeCard";
import { motion, AnimatePresence } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem } from "../components/ui/carousel";
import { projectId, publicAnonKey } from "../utils/supabase/info";

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
                View All {'>'}
              </Link>
            </div>
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
                                <AnimeCard
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
                            <AnimeCard
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
                View All {'>'}
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
                                  <AnimeCard
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
                            <AnimeCard
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
                View All {'>'}
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
                                <AnimeCard
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
                            <AnimeCard
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