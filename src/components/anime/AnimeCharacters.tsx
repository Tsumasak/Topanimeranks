import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase/client";
import { formatName } from "../../utils/character";

interface CharacterData {
  id: number;
  name: string;
  image_url: string;
  favorites: number;
}

interface AnimeCharacter {
  role: string;
  characters: CharacterData | null;
}

interface AnimeCharactersProps {
  animeId: number;
}

export function AnimeCharacters({ animeId }: AnimeCharactersProps) {
  const [characters, setCharacters] = useState<AnimeCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);
  const [visibleCount, setVisibleCount] = useState(() => (window.innerWidth <= 767 ? 6 : 9));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync visibleCount if it was at default value
  useEffect(() => {
    setVisibleCount((prev) => {
      if (prev === 6 && !isMobile) return 9;
      if (prev === 9 && isMobile) return 6;
      return prev;
    });
  }, [isMobile]);

  useEffect(() => {
    async function fetchCharacters() {
      if (!animeId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("anime_characters")
          .select(`
            role,
            characters (
              id,
              name,
              image_url,
              favorites
            )
          `)
          .eq("anime_id", animeId);

        if (error) {
          console.error("[AnimeCharacters] Error fetching characters:", error);
          return;
        }

        if (data) {
          // Cast to any[] because Supabase can't infer types for relational joins
          const rows = data as any[];
          // Filter out dummy characters (id -1) and null joins
          let validCharacters = rows.filter(
            (c) => c.characters && c.characters.id !== -1
          ) as AnimeCharacter[];

          // Sort by favorites (descending)
          validCharacters.sort((a, b) => {
            const favA = a.characters?.favorites || 0;
            const favB = b.characters?.favorites || 0;
            return favB - favA;
          });

          setCharacters(validCharacters);
        }
      } catch (err) {
        console.error("[AnimeCharacters] Failed to fetch characters:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCharacters();
  }, [animeId]);


  const handleViewMore = () => {
    setVisibleCount((prev) => prev + (isMobile ? 6 : 9));
  };

  if (loading) {
    return (
      <div
        className="rounded-lg p-6 border shadow-md flex justify-center items-center"
        style={{
          background: "var(--card-background)",
          borderColor: "var(--card-border)",
          minHeight: "200px",
        }}
      >
        <div style={{ color: "var(--rating-text)", fontSize: "14px" }}>
          Loading characters...
        </div>
      </div>
    );
  }

  // Hide section if no characters
  if (characters.length === 0) {
    return null;
  }

  const visibleCharacters = characters.slice(0, visibleCount);
  const totalCharacters = characters.length;
  const hasMore = visibleCount < totalCharacters;

  return (
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
      {/* Header - Same pattern as Synopsis/Info */}
      <h2 className="text-2xl flex items-center gap-2" style={{ color: "var(--foreground)", margin: 0 }}>
        <span>🧝</span>
        Characters ({totalCharacters})
      </h2>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: "16px",
          width: "100%",
        }}
      >
        {visibleCharacters.map((charData, index) => {
          const char = charData.characters;
          if (!char) return null;

          return (
            <Link
              key={`${char.id}-${index}`}
              to={`/character/${char.id}`}
              className="theme-card rounded-[10px] overflow-hidden flex flex-col shrink-0 no-underline border"
            >
              {/* Character Image - Square */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  borderTopLeftRadius: "10px",
                  borderTopRightRadius: "10px",
                  background: "var(--background)",
                }}
              >
                {char.image_url ? (
                  <img
                    src={char.image_url}
                    alt={formatName(char.name)}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--rating-text)",
                      fontSize: "12px",
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>

              {/* Info Container */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "16px 12px",
                }}
              >
                {/* Role Tag */}
                <div
                  style={{
                    background: "var(--rating-background)",
                    borderRadius: "9999px",
                    padding: "5px 13px",
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "var(--rating-text)",
                      fontSize: "12px",
                      lineHeight: "16px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {charData.role || "Unknown"}
                  </span>
                </div>

                {/* Character Name */}
                <p
                  style={{
                    color: "var(--foreground)",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "19.8px",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                  title={formatName(char.name)}
                >
                  {formatName(char.name)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>


      {/* View More Button */}
      {hasMore && (
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
            onClick={handleViewMore}
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
            onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#3b82f6")}
          >
            <span style={{ fontSize: "14px" }}>▼</span>
            VIEW MORE CHARACTERS
          </button>
        </div>
      )}
    </div>
  );
}
