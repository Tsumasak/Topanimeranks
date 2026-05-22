import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Share2, ExternalLink, ChevronRight, Image, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "../components/ui/carousel";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { CharacterAnimeCard } from "../components/character/CharacterAnimeCard";
import {
  getCharacterById,
  getCharacterAnimesPresence,
  logMissingAnimes,
  type CharacterFullData,
  type AnimeographyEntry,
  type AnimePresenceInfo,
} from "../services/character-data";
import { formatName, formatFavorites } from "../utils/character";

export default function CharacterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<CharacterFullData | null>(null);
  const [animePresence, setAnimePresence] = useState<
    Map<number, AnimePresenceInfo>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);
  const bioRef = useRef<HTMLDivElement>(null);
  const [showBioToggle, setShowBioToggle] = useState(false);

  // Biography expand/collapse state
  const [bioExpanded, setBioExpanded] = useState(false);

  // Animeography expand/collapse state
  const [animeExpanded, setAnimeExpanded] = useState(false);

  // Lightbox gallery states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!character?.about || !bioRef.current) return;

    const checkOverflow = () => {
      const element = bioRef.current;
      if (element && !bioExpanded) {
        const hasOverflow = element.scrollHeight > element.clientHeight;
        setShowBioToggle(hasOverflow);
      }
    };

    // Use ResizeObserver to reliably detect when sizing and font rendering complete
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(bioRef.current);

    // Run initial check
    checkOverflow();

    return () => {
      resizeObserver.disconnect();
    };
  }, [character?.about, bioExpanded, loading]);

  const animeVisibleLimit = isMobile ? 6 : 5;

  useEffect(() => {
    async function fetchCharacterData() {
      if (!id) return;

      console.log(`[CharacterDetails] 🔍 Fetching character ID: ${id}`);
      setLoading(true);
      setNotFound(false);

      try {
        const charId = parseInt(id);
        const charData = await getCharacterById(charId);

        if (!charData) {
          console.log("[CharacterDetails] ❌ Character not found");
          setNotFound(true);
          setLoading(false);
          return;
        }

        console.log("[CharacterDetails] ✅ Character found:", charData.name);
        setCharacter(charData);

        // Set dynamic background
        if (charData.image_url) {
          document.documentElement.style.setProperty(
            "--bg-image",
            `url(${charData.image_url})`
          );
        }

        // Cross-reference animeography with season_rankings
        if (charData.animeography && charData.animeography.length > 0) {
          const malIds = charData.animeography.map(
            (entry: AnimeographyEntry) => entry.anime.mal_id
          );
          const presenceMap = await getCharacterAnimesPresence(malIds);
          setAnimePresence(presenceMap);

          // Log missing animes asynchronously (fire-and-forget)
          const missingAnimes = charData.animeography
            .filter(
              (entry: AnimeographyEntry) =>
                !presenceMap.has(entry.anime.mal_id)
            )
            .map((entry: AnimeographyEntry) => ({
              mal_id: entry.anime.mal_id,
              title: entry.anime.title,
            }));

          if (missingAnimes.length > 0) {
            logMissingAnimes(missingAnimes, charId);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("[CharacterDetails] ❌ Error:", error);
        setNotFound(true);
        setLoading(false);
      }
    }

    fetchCharacterData();
  }, [id]);

  // Get all pictures (including main image)
  const allPictures =
    character && character.all_pictures && Array.isArray(character.all_pictures) && character.all_pictures.length > 0
      ? [
          // ALWAYS start with the main image (default poster)
          { large: character.image_url, small: character.image_url },
          // Then add the rest of the pictures
          ...character.all_pictures.map((pic: any) => ({
            large:
              pic.jpg?.large_image_url ||
              pic.webp?.large_image_url ||
              pic.jpg?.image_url ||
              pic.webp?.image_url,
            small:
              pic.jpg?.image_url ||
              pic.webp?.image_url ||
              pic.jpg?.large_image_url ||
              pic.webp?.large_image_url, // Use full image, not thumbnail
          })),
        ]
      : character
      ? [{ large: character.image_url, small: character.image_url }]
      : [];

  // Navigate to previous image
  const handlePrevImage = () => {
    if (allPictures.length === 0) return;
    setSelectedImageIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : allPictures.length - 1;
      return newIndex;
    });
  };

  // Navigate to next image
  const handleNextImage = () => {
    if (allPictures.length === 0) return;
    setSelectedImageIndex((prev) => {
      const newIndex = prev < allPictures.length - 1 ? prev + 1 : 0;
      return newIndex;
    });
  };

  // Sync carousel with selected image and CENTER it
  useEffect(() => {
    if (carouselApi) {
      // Scroll to selected index whenever it changes
      carouselApi.scrollTo(selectedImageIndex);
    }
  }, [selectedImageIndex, carouselApi]);

  // Handle carousel slide change (when user clicks on carousel arrows)
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const newIndex = carouselApi.selectedScrollSnap();
      setSelectedImageIndex(newIndex);
    };

    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Share handler (same pattern as AnimeHero)
  const handleShare = async () => {
    const shareData = {
      title: character ? formatName(character.name) : "Character",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    }

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
        alert(`Share this URL: ${window.location.href}`);
      }
    } catch (err) {
      alert(`Share this URL: ${window.location.href}`);
    }
  };

  // Biography clamping logic handled via CSS and ref overflow detection

  // ===========================
  // LOADING STATE
  // ===========================
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center">
          <div
            className="text-2xl mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Loading...
          </div>
          <div
            className="text-sm"
            style={{ color: "var(--rating-text)" }}
          >
            Fetching character details
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // NOT FOUND STATE
  // ===========================
  if (notFound || !character) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center">
          <div
            className="text-4xl mb-4"
            style={{ color: "var(--foreground)" }}
          >
            404
          </div>
          <div
            className="text-2xl mb-4"
            style={{ color: "var(--foreground)" }}
          >
            Character Not Found
          </div>
          <div
            className="text-sm mb-4"
            style={{ color: "var(--rating-text)" }}
          >
            This character (ID: {id}) is not available in our database yet.
          </div>
          <Link
            to="/home"
            style={{ color: "var(--nav-hover)" }}
            className="hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ===========================
  // COMPUTED VALUES
  // ===========================
  const displayName = formatName(character.name);
  const nicknames =
    character.nicknames && character.nicknames.length > 0
      ? `"${character.nicknames.join(", ")}"`
      : null;
  const malLink = character.url || `https://myanimelist.net/character/${character.id}`;
  const animeography = character.animeography
    ? [...character.animeography].sort((a, b) => b.anime.mal_id - a.anime.mal_id)
    : [];
  const totalAnimes = animeography.length;
  const visibleAnimes = animeExpanded
    ? animeography
    : animeography.slice(0, animeVisibleLimit);
  const hasMoreAnimes = totalAnimes > animeVisibleLimit;
  const displayBio = character.about;

  // ===========================
  // RENDER
  // ===========================
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* ===== HERO SECTION ===== */}
      <div
        className="relative w-full overflow-hidden"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* Background Blur Layer */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${character.image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(10px)",
            opacity: "var(--bg-opacity)",
            transform: "scale(1.1)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full md:container md:mx-auto md:px-[24px] py-[24px]">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm overflow-hidden px-6 md:px-0">
            <Link
              to="/home"
              className="hover:opacity-70 transition-opacity shrink-0"
              style={{ color: "var(--rating-text)" }}
            >
              Home
            </Link>
            <ChevronRight
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--rating-text)" }}
            />
            <span
              className="shrink-0"
              style={{ color: "var(--rating-text)" }}
            >
              Characters
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--rating-text)" }}
            />
            <span
              className="font-bold truncate min-w-0"
              style={{ color: "var(--rating-text)" }}
              title={displayName}
            >
              {displayName}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mt-6 px-6 md:px-0">
            {/* Character Image */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div
                className="w-64 rounded-lg overflow-hidden border-2 cursor-pointer hover:opacity-90 transition-opacity relative"
                style={{
                  borderColor: "var(--card-border)",
                  boxShadow:
                    "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
                onClick={() => {
                  setSelectedImageIndex(0);
                  setLightboxOpen(true);
                }}
              >
                <ImageWithFallback
                  src={character.image_url || ""}
                  alt={displayName}
                  className="w-full h-[400px] object-cover"
                />

                {/* Image Count Badge */}
                {allPictures.length > 1 && (
                  <div
                    className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 backdrop-blur-sm border border-white/20 shadow-lg"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    <Image className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-semibold">
                      {allPictures.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 w-full flex flex-col h-full md:h-[400px] items-center md:items-start">
              {/* Content Group */}
              <div className="space-y-4 w-full">
                {/* Name */}
                <div className="text-center md:text-left">
                  <h1
                    className="text-3xl md:text-5xl mb-2 font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {displayName}
                  </h1>

                  {/* Nicknames + Kanji */}
                  {(nicknames || character.name_kanji) && (
                    <div
                      className="flex flex-wrap items-center gap-3 text-lg justify-center md:justify-start"
                      style={{ color: "var(--rating-text)" }}
                    >
                      {nicknames && <span>{nicknames}</span>}
                      {nicknames && character.name_kanji && <span>•</span>}
                      {character.name_kanji && (
                        <span>{character.name_kanji}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Favorites */}
                <TooltipProvider>
                  <div
                    className="flex flex-wrap items-center gap-4 justify-center md:justify-start"
                    style={{ color: "var(--foreground)" }}
                  >
                    {character.favorites != null && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <span className="text-lg">❤️</span>
                            <span className="text-lg text-[20px] font-bold">
                              {formatFavorites(character.favorites)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Favorites</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              </div>

              {/* Share and MAL Buttons - pushed to bottom */}
              <div className="mt-4 md:mt-auto w-full flex gap-3 justify-center md:justify-start">
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="relative rounded-[32px] overflow-visible group cursor-pointer hover:-translate-y-[2px] hover:shadow-lg"
                  style={{
                    backgroundColor: "rgba(var(--primary-rgb), 0.2)",
                    transition:
                      "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-[-1.4px] pointer-events-none rounded-[33.4px] border-[1.4px] border-solid transition-all group-hover:inset-[-2px]"
                    style={{ borderColor: "var(--primary)" }}
                  />
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

                {/* MyAnimeList Button */}
                <a
                  href={malLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative rounded-[32px] overflow-visible group cursor-pointer hover:-translate-y-[2px] hover:shadow-lg"
                  style={{
                    backgroundColor: "rgba(var(--primary-rgb), 0.2)",
                    transition:
                      "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-[-1.4px] pointer-events-none rounded-[33.4px] border-[1.4px] border-solid transition-all group-hover:inset-[-2px]"
                    style={{ borderColor: "var(--primary)" }}
                  />
                  <div className="flex items-center justify-center gap-3 px-[12px] py-[8px]">
                    <ExternalLink
                      className="h-5 w-5"
                      style={{ color: "var(--foreground)" }}
                    />
                    <span
                      className="text-[16px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      MyAnimeList
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT SECTION ===== */}
      <div className="container mx-auto px-[24px] py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN — Biography */}
          <div className="lg:col-span-1">
            {character.about && (
              <div
                className="rounded-lg p-6 border shadow-md"
                style={{
                  background: "var(--card-background)",
                  borderColor: "var(--card-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <h2
                  className="text-2xl flex items-center gap-2"
                  style={{ color: "var(--foreground)", margin: 0 }}
                >
                  <span>📖</span>
                  Biography
                </h2>

                <div
                  ref={bioRef}
                  className={`biography-text ${bioExpanded ? "" : "clamped"}`}
                  style={{
                    color: "var(--rating-text)",
                    fontSize: "16px",
                    lineHeight: "26px",
                  }}
                >
                  {displayBio}
                </div>

                {showBioToggle && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      width: "100%",
                      paddingRight: "10px",
                    }}
                  >
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#3b82f6",
                        fontWeight: 700,
                        fontSize: "14px",
                        lineHeight: "20px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 0",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#60a5fa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#3b82f6")
                      }
                    >
                      <span style={{ fontSize: "14px" }}>
                        {bioExpanded ? "▲" : "▼"}
                      </span>
                      {bioExpanded ? "VIEW LESS" : "VIEW MORE ABOUT"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — Animeography */}
          <div className="lg:col-span-2 min-w-0">
            {animeography.length > 0 && (
              <div
                className="rounded-lg p-6 border shadow-md"
                style={{
                  background: "var(--card-background)",
                  borderColor: "var(--card-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <h2
                  className="text-2xl flex items-center gap-2"
                  style={{ color: "var(--foreground)", margin: 0 }}
                >
                  <span>📺</span>
                  Animeography ({totalAnimes})
                </h2>

                {/* Anime Cards Row */}
                <div className="animeography-grid">
                  {visibleAnimes.map(
                    (entry: AnimeographyEntry, index: number) => {
                      const presence = animePresence.get(
                        entry.anime.mal_id
                      );
                      const isPresent = !!presence;
                      const imageUrl =
                        entry.anime.images?.jpg?.image_url ||
                        entry.anime.images?.webp?.image_url ||
                        "";

                      return (
                        <CharacterAnimeCard
                          key={`${entry.anime.mal_id}-${index}`}
                          malId={entry.anime.mal_id}
                          title={entry.anime.title}
                          imageUrl={imageUrl}
                          role={entry.role}
                          isPresent={isPresent}
                          typeTag={presence?.type || null}
                        />
                      );
                    }
                  )}
                </div>

                {/* View All Button */}
                {hasMoreAnimes && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      width: "100%",
                      paddingRight: "10px",
                    }}
                  >
                    <button
                      onClick={() => setAnimeExpanded(!animeExpanded)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#3b82f6",
                        fontWeight: 700,
                        fontSize: "14px",
                        lineHeight: "20px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 0",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#60a5fa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#3b82f6")
                      }
                    >
                      <span style={{ fontSize: "14px" }}>
                        {animeExpanded ? "▲" : "▼"}
                      </span>
                      {animeExpanded
                        ? "VIEW LESS"
                        : "VIEW ALL ANIMES"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && allPictures.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 pt-24 gap-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            animation: "fadeIn 0.3s ease-in-out"
          }}
          onClick={(e) => {
            // Fecha apenas se clicar no backdrop (não no conteúdo)
            if (e.target === e.currentTarget) {
              setLightboxOpen(false);
            }
          }}
        >
          {/* Main Image Container with Navigation Arrows */}
          <div
            className="flex flex-col items-center gap-4 max-w-[90vw]"
            style={{ animation: "zoomIn 0.3s ease-in-out" }}
          >
            {/* Image with arrows overlay (mobile only) */}
            <div className="relative flex items-center justify-center">
              {/* Mobile Navigation Arrows - Inside image on mobile */}
              {allPictures.length > 1 && (
                <>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="md:hidden absolute left-2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white transition-all"
                    aria-label="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="md:hidden absolute right-2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white transition-all"
                    aria-label="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </>
              )}

              <img
                src={allPictures[selectedImageIndex].large}
                alt={displayName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Thumbnail Carousel - Only show if there are multiple images */}
            {allPictures.length > 1 && (
              <div className="w-full max-w-[600px] relative">
                <Carousel
                  opts={{
                    align: "center",
                    loop: false,
                    containScroll: false, // Permite espaço vazio nas pontas!
                  }}
                  setApi={setCarouselApi}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2">
                    {allPictures.map((pic: { large: string; small: string }, index: number) => (
                      <CarouselItem
                        key={index}
                        className="pl-2 basis-[80px] md:basis-[100px]"
                      >
                        <div
                          className={`cursor-pointer rounded-lg overflow-hidden transition-all relative`}
                          style={{
                            opacity: index === selectedImageIndex ? 1 : 0.6,
                          }}
                          onMouseEnter={(e) => {
                            if (index !== selectedImageIndex) {
                              e.currentTarget.style.opacity = "0.9";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (index !== selectedImageIndex) {
                              e.currentTarget.style.opacity = "0.6";
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex(index);
                          }}
                        >
                          <img
                            src={pic.small}
                            alt={`${displayName} - ${index + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                          {/* Stroke overlay - por cima da imagem */}
                          <div
                            className="absolute inset-0 pointer-events-none rounded-lg"
                            style={{
                              boxShadow: index === selectedImageIndex
                                ? "inset 0 0 0 4px #fbbf24" // Stroke amarela INSET (por dentro)
                                : "inset 0 0 0 2px rgba(255, 255, 255, 0.2)", // Stroke branca INSET
                            }}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {/* Desktop Navigation Arrows */}
                  <CarouselPrevious
                    className="hidden md:flex -left-12 bg-white/10 hover:bg-white/20 border-white/20 text-white disabled:opacity-30"
                  />
                  <CarouselNext
                    className="hidden md:flex -right-12 bg-white/10 hover:bg-white/20 border-white/20 text-white disabled:opacity-30"
                  />
                </Carousel>
              </div>
            )}
          </div>

          {/* Close Button - Below Everything */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
            style={{ color: "white" }}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
            <span className="font-semibold">Close</span>
          </button>
        </div>
      )}
    </div>
  );
}
