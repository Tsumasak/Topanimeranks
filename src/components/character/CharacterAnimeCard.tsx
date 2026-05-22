import { Link } from "react-router-dom";
import { getTypeClass } from "../../utils/tagHelpers";

interface CharacterAnimeCardProps {
  malId: number;
  title: string;
  imageUrl: string;
  role: string;
  isPresent: boolean;
  typeTag?: string | null;
}

export function CharacterAnimeCard({
  malId,
  title,
  imageUrl,
  role,
  isPresent,
  typeTag,
}: CharacterAnimeCardProps) {
  const cardContent = (
    <>
      {/* Image Container */}
      <div
        style={{
          width: "100%",
          height: "264px",
          overflow: "hidden",
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          position: "relative",
          background: "var(--background)",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
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

        {/* Type Badge - Only show when anime exists in our DB */}
        {isPresent && typeTag && (
          <span
            className={`${getTypeClass(typeTag)} absolute top-2 right-2 px-3 py-1 rounded-full text-xs`}
          >
            {typeTag}
          </span>
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
            {role || "Unknown"}
          </span>
        </div>

        {/* Anime Title */}
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
          title={title}
        >
          {title}
        </p>
      </div>
    </>
  );

  const baseCardStyles: React.CSSProperties = {
    background: "var(--card-background)",
    borderColor: "var(--card-border)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "10px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    textDecoration: "none",
    boxShadow: "0 4px 6px -1px var(--shadow)",
    flexShrink: 0,
  };

  if (isPresent) {
    return (
      <Link
        to={`/anime/${malId}`}
        className="theme-card character-anime-card rounded-[10px] overflow-hidden flex flex-col shrink-0 no-underline border"
      >
        {cardContent}
      </Link>
    );
  }

  // Non-clickable card for animes not in our DB
  return (
    <div
      className="character-anime-card rounded-[10px] overflow-hidden flex flex-col shrink-0 border"
      style={{
        ...baseCardStyles,
        opacity: 0.4,
        cursor: "default",
      }}
    >
      {cardContent}
    </div>
  );
}

