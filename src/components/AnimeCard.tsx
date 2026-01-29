import BaseAnimeCard from "./BaseAnimeCard";

// Data format from HomePage
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

// Props for direct usage
interface AnimeCardDirectProps {
  rank: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  bottomText: string;
  animeType?: string;
  demographics?: string[];
  genres?: string[];
  themes?: string[];
  positionChange?: number;
  animeId?: number;
}

// Props for HomePage data format
interface AnimeCardDataProps {
  data: HomeCardData;
  type: 'episode' | 'top' | 'anticipated';
}

type AnimeCardProps = AnimeCardDirectProps | AnimeCardDataProps;

function isDataProps(props: AnimeCardProps): props is AnimeCardDataProps {
  return 'data' in props && 'type' in props;
}

export function AnimeCard(props: AnimeCardProps) {
  if (isDataProps(props)) {
    const { data, type } = props;
    
    // Transform HomeCardData to BaseAnimeCard props
    return (
      <BaseAnimeCard
        rank={data.rank}
        title={data.title}
        subtitle={data.subtitle || ''}
        imageUrl={data.image}
        linkUrl={data.url || '#'}
        bottomText={type === 'episode' 
          ? `⭐ ${(data.score || 0).toFixed(2)}`
          : type === 'anticipated'
          ? `${data.members?.toLocaleString() || '0'} Members`
          : `⭐ ${(data.score || 0).toFixed(2)}`
        }
        animeType={data.animeType}
        demographics={data.demographics}
        genres={data.genres}
        themes={data.themes}
        season={data.season}
        year={data.year}
      />
    );
  }
  
  // Direct props usage
  return (
    <BaseAnimeCard
      rank={props.rank}
      title={props.title}
      subtitle={props.subtitle}
      imageUrl={props.imageUrl}
      linkUrl={props.linkUrl}
      bottomText={props.bottomText}
      animeType={props.animeType}
      demographics={props.demographics}
      genres={props.genres}
      themes={props.themes}
      positionChange={props.positionChange}
      animeId={props.animeId}
    />
  );
}