import BaseAnimeCard from "./BaseAnimeCard";

interface AnimeCardProps {
  rank: number;
  title: string;
  subtitle: string; // Episode info, season info, etc.
  imageUrl: string;
  linkUrl?: string;
  bottomText: string; // Rating, Members, etc.
  animeType?: string; // For type badges like TV/ONA
  demographics?: string[]; // Demographics array like ["Seinen", "Shounen"]
  genres?: string[]; // Genres array like ["Action", "Comedy"]
  themes?: string[]; // Themes array like ["School", "Super Power"]
  positionChange?: number; // Position change from previous week (positive = up, negative = down, 0 = same, undefined = new)
  isManual?: boolean; // True if episode was manually added (not from API)
}

export function AnimeCard({ 
  rank, 
  title, 
  subtitle, 
  imageUrl, 
  linkUrl = "#", 
  bottomText,
  animeType,
  demographics = [],
  genres = [],
  themes = [],
  positionChange,
  isManual = false
}: AnimeCardProps) {
  return (
    <BaseAnimeCard
      rank={rank}
      title={title}
      subtitle={subtitle}
      imageUrl={imageUrl}
      linkUrl={linkUrl}
      bottomText={bottomText}
      animeType={animeType}
      demographics={demographics}
      genres={genres}
      themes={themes}
      positionChange={positionChange}
      isManual={isManual}
    />
  );
}
