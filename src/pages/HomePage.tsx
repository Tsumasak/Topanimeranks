import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CURRENT_WEEK_NUMBER, WEEKS_DATA } from '../config/weeks';

interface HomeCardData {
  rank: number;
  title: string;
  subtitle?: string;
  image: string;
  score?: number;
  members?: string;
  animeType?: string;
  demographics?: string[];
  genres?: string[];
  themes?: string[];
  url?: string;
}

function HomeAnimeCard({ data, type }: { data: HomeCardData; type: 'episode' | 'top' | 'anticipated' }) {
  const isEpisode = type === 'episode';
  const isAnticipated = type === 'anticipated';
  
  // Border and hover styling based on rank (same as BaseAnimeCard)
  let borderStyle = 'border border-gray-600';
  let hoverClass = 'rank-hover-4plus';
  let contentGradient = '';
  let rankStyle = 'rank-4plus';
  
  if (data.rank === 1) {
    borderStyle = 'border border-yellow-600';
    hoverClass = 'rank-hover-1';
    contentGradient = 'bg-gradient-to-br from-yellow-500/30 via-yellow-500/15 to-transparent';
  } else if (data.rank === 2) {
    borderStyle = 'border border-gray-500';
    hoverClass = 'rank-hover-2';
    contentGradient = 'bg-gradient-to-br from-gray-400/30 via-gray-400/15 to-transparent';
  } else if (data.rank === 3) {
    borderStyle = 'border border-orange-500';
    hoverClass = 'rank-hover-3';
    contentGradient = 'bg-gradient-to-br from-orange-400/30 via-orange-400/15 to-transparent';
  }
  
  // Image height: Episode cards use old size (160px), new layout uses 230px on desktop, 280px on mobile
  const imageHeight = isEpisode ? 'h-40' : 'h-[280px] md:h-[230px]';
  
  // SVG Badge Components for top 3 positions (same as BaseAnimeCard)
  const GoldBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id="gold-home" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill="url(#gold-home)" stroke="#B8860B" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#1</tspan>
      </text>
    </svg>
  );

  const SilverBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id="silver-home" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5E5E5" />
          <stop offset="50%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#A0A0A0" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill="url(#silver-home)" stroke="#808080" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#2</tspan>
      </text>
    </svg>
  );

  const BronzeBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id="bronze-home" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="50%" stopColor="#B87333" />
          <stop offset="100%" stopColor="#A0522D" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill="url(#bronze-home)" stroke="#8B4513" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#3</tspan>
      </text>
    </svg>
  );

  // Determine anime type tag styling (same as BaseAnimeCard)
  let typeTagStyle = 'tag-default';
  if (data.animeType === 'TV') {
    typeTagStyle = 'tag-tv';
  } else if (data.animeType === 'ONA') {
    typeTagStyle = 'tag-ona';
  }

  // Determine demographics tag styling (same as BaseAnimeCard)
  const getDemographicsTagStyle = (demographic: string) => {
    switch (demographic.toLowerCase()) {
      case 'seinen': return 'tag-seinen';
      case 'shounen': return 'tag-shounen';
      case 'shoujo': return 'tag-shoujo';
      case 'josei': return 'tag-josei';
      default: return 'tag-demo-default';
    }
  };
  
  const CardWrapper = data.url ? 'a' : 'div';
  const cardProps = data.url ? { href: data.url, target: '_blank', rel: 'noopener noreferrer' } : {};
  
  // OLD LAYOUT for Weekly Episodes (original design)
  if (isEpisode) {
    return (
      <CardWrapper 
        {...cardProps}
        className={`block theme-card rounded-lg overflow-hidden flex flex-col group border ${borderStyle} ${hoverClass} transition-all duration-300 w-full h-full`}
      >
        {/* Image Section */}
        <div className={`relative flex-shrink-0 overflow-hidden anime-card-image ${imageHeight}`}>
          <img 
            alt={data.title} 
            className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top" 
            src={data.image} 
          />
          
          {/* Tags Container - Top Right (only Type and Demographics) */}
          <div className="absolute top-2 right-2 flex flex-row gap-1">
            {/* Anime Type Tag */}
            {data.animeType && (
              <div className={`px-3 py-1 rounded-full text-xs ${typeTagStyle}`}>
                {data.animeType}
              </div>
            )}
            
            {/* Demographics Tag - only show first demographic if available */}
            {data.demographics && data.demographics.length > 0 && (
              <div className={`px-3 py-1 rounded-full text-xs ${getDemographicsTagStyle(data.demographics[0])}`}>
                {data.demographics[0]}
              </div>
            )}
          </div>
        </div>

        {/* Container with gradient for top 3 positions */}
        <div className={`relative flex-grow flex flex-col justify-between ${contentGradient}`}>
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
                  <div className={`px-3 py-1 rounded-full text-sm ${rankStyle}`}>
                    #{data.rank}
                  </div>
                </div>
              )}
            </div>
            
            {/* Title and Subtitle */}
            <div className="relative flex flex-col ml-4 flex-grow">
              <h3 className="font-bold text-lg line-clamp-3 leading-[1.1] mb-3" style={{ color: 'var(--foreground)' }}>
                {data.title}
              </h3>
              {data.subtitle && (
                <p className="text-sm leading-[1.1] mb-2" style={{ color: 'var(--foreground)' }}>
                  {data.subtitle}
                </p>
              )}
              
              {/* Genres + Themes Tags - Combine and show first 3 total */}
              {((data.genres && data.genres.length > 0) || (data.themes && data.themes.length > 0)) && (
                <div className="flex gap-1 flex-wrap">
                  {[...(data.genres || []), ...(data.themes || [])].slice(0, 3).map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 theme-rating text-xs rounded-full border"
                      style={{borderColor: 'var(--card-border)'}}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Bottom text container */}
          <div className="font-bold text-right px-4 pb-4 text-lg mt-auto" style={{ color: 'var(--rating-yellow)' }}>
            {data.score ? `★ ${data.score}` : ''}
          </div>
        </div>
      </CardWrapper>
    );
  }
  
  // NEW LAYOUT for Top Animes & Most Anticipated (centered badge design)
  return (
    <CardWrapper 
      {...cardProps}
      className={`relative block theme-card rounded-lg overflow-visible flex flex-col group border ${borderStyle} ${hoverClass} transition-all duration-300 w-[213px] min-h-[380px]`}
    >
      {/* Image Section */}
      <div className={`relative flex-shrink-0 overflow-hidden ${imageHeight} rounded-t-lg`}>
        <img 
          alt={data.title} 
          className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top" 
          src={data.image} 
        />
        
        {/* Tags Container - Top Right (only Type and Demographics) */}
        <div className="absolute top-2 right-2 flex flex-row gap-1">
          {/* Anime Type Tag */}
          {data.animeType && (
            <div className={`px-3 py-1 rounded-full text-xs ${typeTagStyle}`}>
              {data.animeType}
            </div>
          )}
          
          {/* Demographics Tag - only show first demographic if available */}
          {data.demographics && data.demographics.length > 0 && (
            <div className={`px-3 py-1 rounded-full text-xs ${getDemographicsTagStyle(data.demographics[0])}`}>
              {data.demographics[0]}
            </div>
          )}
        </div>
      </div>

      {/* Container with gradient for top 3 positions */}
      <div className={`relative flex-grow flex flex-col justify-between ${contentGradient}`}>
        {/* Badge - Centered at top, overlapping image */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[24px] flex items-center justify-center w-12 h-12">
          {data.rank === 1 ? (
            <GoldBadge />
          ) : data.rank === 2 ? (
            <SilverBadge />
          ) : data.rank === 3 ? (
            <BronzeBadge />
          ) : (
            <div className={`px-3 py-1 rounded-full text-sm ${rankStyle}`}>
              #{data.rank}
            </div>
          )}
        </div>
        
        {/* Content Area */}
        <div className="pt-[30px] pb-4 px-4 flex flex-col min-h-[120px]">
          {/* Title */}
          <h3 className="font-bold text-lg line-clamp-3 leading-[1.1] mb-3" style={{ color: 'var(--foreground)' }}>
            {data.title}
          </h3>
          
          {/* Genres + Themes Tags - Combine and show first 3 total */}
          {((data.genres && data.genres.length > 0) || (data.themes && data.themes.length > 0)) && (
            <div className="flex gap-1 flex-wrap">
              {[...(data.genres || []), ...(data.themes || [])].slice(0, 3).map((tag, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 theme-rating text-xs rounded-full border h-[26px] flex items-center"
                  style={{borderColor: 'var(--card-border)'}}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Bottom text container */}
        <div className="font-bold text-right px-4 pb-4 text-lg mt-auto h-[36px] flex items-center justify-end" style={{ color: 'var(--rating-yellow)' }}>
          {isAnticipated && data.members ? data.members : data.score ? `★ ${data.score}` : ''}
        </div>
      </div>
    </CardWrapper>
  );
}

function SectionHeader({ title, subtitle, highlightText, highlightColor }: { 
  title: string; 
  subtitle: string;
  highlightText?: string;
  highlightColor?: string;
}) {
  // Split title to highlight specific text
  const renderTitle = () => {
    if (!highlightText) {
      return title;
    }
    
    const parts = title.split(highlightText);
    return (
      <>
        {parts[0]}
        <span style={{ color: highlightColor || 'var(--rating-yellow)' }}>{highlightText}</span>
        {parts[1]}
      </>
    );
  };
  
  return (
    <div className="flex flex-col gap-[4px] items-start justify-center w-full">
      <p className="font-['Arial'] font-bold leading-[32px] relative shrink-0 text-[24px] md:text-[30px] break-words" style={{ color: 'var(--foreground)' }}>
        {renderTitle()}
      </p>
      <p className="font-['Arial'] leading-[16px] text-[12px] break-words" style={{ color: 'var(--rating-text)' }}>
        {subtitle}
      </p>
    </div>
  );
}

export function HomePage() {
  const [topEpisodes, setTopEpisodes] = useState<HomeCardData[]>([]);
  const [topSeasonAnimes, setTopSeasonAnimes] = useState<HomeCardData[]>([]);
  const [anticipated, setAnticipated] = useState<HomeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedWeekNumber, setDisplayedWeekNumber] = useState(CURRENT_WEEK_NUMBER);
  const [weekPeriod, setWeekPeriod] = useState('');
  
  // Animation keys for smooth entry animations
  const [animationKey, setAnimationKey] = useState('initial');

  useEffect(() => {
    const loadData = async () => {
      console.log('[HomePage] 🔍 Starting to load home data');
      try {
        setIsLoading(true);

        // Load Top Season Animes from Supabase (Fall 2025)
        const supabaseImport = await import('../services/supabase');
        const SupabaseService = supabaseImport.SupabaseService;
        
        // Fall 2025 - Order by SCORE (rating-based ranking)
        const seasonAnimes = await SupabaseService.getSeasonRankings('fall', 2025, 'score');
        
        // Process Top Season Animes (top 3)
        if (seasonAnimes.length > 0) {
          const topSeason = seasonAnimes.slice(0, 3).map((anime, index) => ({
            rank: index + 1,
            title: anime.title_english || anime.title,
            image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
            score: anime.score || 0,
            animeType: anime.type || 'TV',
            demographics: (anime.demographics || []) as string[],
            genres: (anime.genres || []) as string[],
            themes: (anime.themes || []) as string[],
            url: anime.url || `https://myanimelist.net/anime/${anime.mal_id}`
          }));
          setTopSeasonAnimes(topSeason);
          
          // Set dynamic background from #1 anime
          if (topSeason.length > 0) {
            document.documentElement.style.setProperty('--bg-image', `url(${topSeason[0].image})`);
          }
        }

        // Winter 2026 - Order by MEMBERS (popularity-based ranking)
        const winter2026Animes = await SupabaseService.getSeasonRankings('winter', 2026, 'members');
        
        if (winter2026Animes.length > 0) {
          const topAnticipated = winter2026Animes.slice(0, 3).map((anime, index) => ({
            rank: index + 1,
            title: anime.title_english || anime.title,
            image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
            members: `${(anime.members / 1000).toFixed(0)}K Members`,
            animeType: anime.type || 'TV',
            demographics: (anime.demographics || []) as string[],
            genres: (anime.genres || []) as string[],
            themes: (anime.themes || []) as string[],
            url: anime.url || `https://myanimelist.net/anime/${anime.mal_id}`
          }));
          setAnticipated(topAnticipated);
        }

        // Weekly Episodes - Try current week, fallback to previous if less than 3 episodes
        let weeklyEpisodesData = await SupabaseService.getWeeklyEpisodes(CURRENT_WEEK_NUMBER);
        let weekToShow = CURRENT_WEEK_NUMBER;
        
        // If current week has less than 3 episodes, try previous week
        if (weeklyEpisodesData.episodes.length < 3 && CURRENT_WEEK_NUMBER > 1) {
          console.log(`[HomePage] Week ${CURRENT_WEEK_NUMBER} has less than 3 episodes, trying Week ${CURRENT_WEEK_NUMBER - 1}...`);
          weeklyEpisodesData = await SupabaseService.getWeeklyEpisodes(CURRENT_WEEK_NUMBER - 1);
          weekToShow = CURRENT_WEEK_NUMBER - 1;
        }
        
        if (weeklyEpisodesData.episodes.length > 0) {
          const topWeekly = weeklyEpisodesData.episodes.slice(0, 3).map((episode, index) => ({
            rank: index + 1,
            title: episode.animeTitle,
            subtitle: episode.episodeTitle ? `EP ${episode.episodeNumber} - ${episode.episodeTitle}` : `EP ${episode.episodeNumber}`,
            image: episode.imageUrl || '',
            score: episode.episodeScore || 0,
            animeType: episode.animeType || 'TV',
            demographics: (episode.demographics || []) as string[],
            genres: (episode.genres || []) as string[],
            themes: (episode.themes || []) as string[],
            url: episode.url || `https://myanimelist.net/anime/${episode.animeId}`
          }));
          setTopEpisodes(topWeekly);
          setDisplayedWeekNumber(weekToShow);
          
          // Format week period
          const weekConfig = WEEKS_DATA.find(w => w.id === `week${weekToShow}`);
          if (weekConfig) {
            const start = new Date(weeklyEpisodesData.startDate);
            const end = new Date(weeklyEpisodesData.endDate);
            const startMonth = start.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
            const startDay = start.getUTCDate();
            const endMonth = end.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
            const endDay = end.getUTCDate();
            const year = end.getUTCFullYear();
            const prefix = weekConfig.isCurrentWeek ? 'Airing' : 'Aired';
            
            if (startMonth === endMonth) {
              setWeekPeriod(`${prefix} - ${startMonth} ${startDay} - ${endDay}, ${year}`);
            } else {
              setWeekPeriod(`${prefix} - ${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`);
            }
          }
          
          console.log(`[HomePage] ✅ Loaded ${topWeekly.length} episodes from Week ${weekToShow}`);
        } else {
          console.log('[HomePage] No weekly episodes found');
          setTopEpisodes([]);
        }

        // CRITICAL: Update animation key after ALL data is loaded
        console.log('[HomePage] 🎬 CRITICAL: All data loaded, updating animationKey');
        setAnimationKey('loaded');
        
      } catch (error) {
        console.error('[HomePage] ❌ Error loading home data:', error);
      } finally {
        console.log('[HomePage] 🏁 Finally block: setting loading to false');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // No loading screen - instant render
  if (isLoading) {
    console.log('[HomePage] 🚫 Render blocked: loading is true');
    return (
      <div className="dynamic-background min-h-screen">
        <div className="container mx-auto px-[24px] pt-[32px] pb-[32px]">
          {/* Content renders immediately */}
        </div>
      </div>
    );
  }

  console.log('[HomePage] 🎨 Rendering main content:', {
    animationKey,
    topEpisodesCount: topEpisodes.length,
    topSeasonAnimesCount: topSeasonAnimes.length,
    anticipatedCount: anticipated.length
  });

  return (
    <div className="dynamic-background min-h-screen">
      {/* Main Content */}
      <div className="container mx-auto px-[24px] pt-[32px] pb-[32px] flex flex-col gap-[32px]">
        {/* Weekly Episodes Section */}
        <div className="flex flex-col gap-[18px] w-full">
          {/* Section Header - Outside card */}
          <div className="flex items-center w-full">
            <SectionHeader 
              title={`Weekly Anime Episodes - Week ${displayedWeekNumber}`}
              subtitle={weekPeriod || 'Loading period...'}
              highlightText={`Week ${displayedWeekNumber}`}
              highlightColor="var(--rating-yellow)"
            />
          </div>
          
          {/* Card Container */}
          <div className="relative rounded-[10px] shrink-0 w-full" style={{ backgroundColor: 'var(--card-background)' }}>
            <div aria-hidden="true" className="absolute border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.3)]" style={{ borderWidth: '1px', borderColor: 'var(--card-border)' }} />
            <div className="flex flex-col justify-center size-full">
              <div className="box-border content-stretch flex flex-col gap-[24px] items-start justify-center p-[24px] relative w-full">

                {/* Cards */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`episodes-${animationKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col md:flex-row gap-[24px] w-full"
                    onAnimationStart={() => console.log('[HomePage] 🎬 Animation START for episodes')}
                    onAnimationComplete={() => console.log('[HomePage] ✨ Animation COMPLETE for episodes')}
                  >
                    {topEpisodes.length > 0 ? (
                      topEpisodes.map((ep, index) => (
                        <motion.div
                          key={`episode-${ep.rank}`}
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.03,
                            ease: [0.34, 1.56, 0.64, 1]
                          }}
                          className="flex md:flex-1 w-full"
                        >
                          <HomeAnimeCard data={ep} type="episode" />
                        </motion.div>
                      ))
                    ) : (
                      [1, 2, 3].map(i => (
                        <div key={`placeholder-episode-${i}`} className="bg-slate-700/50 h-[320px] md:flex-1 w-full rounded-[10px] flex items-center justify-center">
                          <p className="text-slate-400 text-sm">Loading...</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* View Complete Link */}
                <Link 
                  to="/ranks"
                  className="font-['Arial'] font-bold leading-[20px] relative shrink-0 text-[14px] text-right w-full hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--foreground)' }}
                >
                  <span style={{ color: 'var(--rating-yellow)' }}>▸ </span>View Complete Rank
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Section */}
        <div className="flex flex-col lg:flex-row gap-[18px] items-stretch w-full">
          {/* Top Animes - Fall 2025 */}
          <div className="flex flex-col gap-[18px] lg:flex-1 w-full">
            <div className="flex items-center w-full">
              <SectionHeader 
                title="Top Animes - Fall 2025"
                subtitle="Highest rated animes of the season and worth checking out."
                highlightText="Fall 2025"
                highlightColor="var(--rating-yellow)"
              />
            </div>
            <div className="relative rounded-[10px] w-full" style={{ backgroundColor: 'var(--card-background)' }}>
              <div aria-hidden="true" className="absolute border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.3)]" style={{ borderWidth: '1px', borderColor: 'var(--card-border)' }} />
              <div className="flex flex-col items-end justify-end">
                <div className="box-border flex flex-col gap-[24px] items-end justify-end p-[24px] w-full">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={`season-${animationKey}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col md:flex-row gap-6 w-full md:overflow-x-auto items-center"
                      onAnimationStart={() => console.log('[HomePage] 🎬 Animation START for season animes')}
                      onAnimationComplete={() => console.log('[HomePage] ✨ Animation COMPLETE for season animes')}
                    >
                      {topSeasonAnimes.length > 0 ? (
                        topSeasonAnimes.map((anime, index) => (
                          <motion.div
                            key={`season-${anime.rank}`}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.03,
                              ease: [0.34, 1.56, 0.64, 1]
                            }}
                            className="flex-shrink-0 flex"
                          >
                            <HomeAnimeCard data={anime} type="top" />
                          </motion.div>
                        ))
                      ) : (
                        [1, 2, 3].map(i => (
                          <div key={`placeholder-season-${i}`} className="bg-slate-700/50 h-[380px] w-[213px] flex-shrink-0 rounded-[10px] flex items-center justify-center">
                            <p className="text-slate-400 text-sm">Loading...</p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <Link 
                    to="/top-season-animes"
                    className="font-['Arial'] font-bold leading-[20px] relative shrink-0 text-[14px] text-right w-full hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <span style={{ color: 'var(--rating-yellow)' }}>▸ </span>View Complete Rank
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Most Anticipated Animes */}
          <div className="flex flex-col gap-[18px] lg:flex-1 w-full">
            <div className="flex items-center w-full">
              <SectionHeader 
                title="Most Anticipated Animes - Winter 2026"
                subtitle="Most anticipated animes of the upcoming seasons. Check out all the future seasons here."
                highlightText="Winter 2026"
                highlightColor="var(--rating-yellow)"
              />
            </div>
            <div className="relative rounded-[10px] w-full" style={{ backgroundColor: 'var(--card-background)' }}>
              <div aria-hidden="true" className="absolute border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.3)]" style={{ borderWidth: '1px', borderColor: 'var(--card-border)' }} />
              <div className="flex flex-col items-end justify-end">
                <div className="box-border flex flex-col gap-[24px] items-end justify-end p-[24px] w-full">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={`anticipated-${animationKey}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col md:flex-row gap-6 w-full md:overflow-x-auto items-center"
                      onAnimationStart={() => console.log('[HomePage] 🎬 Animation START for anticipated animes')}
                      onAnimationComplete={() => console.log('[HomePage] ✨ Animation COMPLETE for anticipated animes')}
                    >
                      {anticipated.length > 0 ? (
                        anticipated.map((anime, index) => (
                          <motion.div
                            key={`anticipated-${anime.rank}`}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.03,
                              ease: [0.34, 1.56, 0.64, 1]
                            }}
                            className="flex-shrink-0 flex"
                          >
                            <HomeAnimeCard data={anime} type="anticipated" />
                          </motion.div>
                        ))
                      ) : (
                        [1, 2, 3].map(i => (
                          <div key={`placeholder-anticipated-${i}`} className="bg-slate-700/50 h-[380px] w-[213px] flex-shrink-0 rounded-[10px] flex items-center justify-center">
                            <p className="text-slate-400 text-sm">Loading...</p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <Link 
                    to="/most-anticipated-animes"
                    className="font-['Arial'] font-bold leading-[20px] relative shrink-0 text-[14px] text-right w-full hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <span style={{ color: 'var(--rating-yellow)' }}>▸ </span>View Complete Rank
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-[12px] items-center pb-8 px-4 w-full">
          <p className="font-['Arial'] leading-[16px] text-[12px] text-center break-words max-w-full" style={{ color: 'var(--rating-text)' }}>
            Top Anime Ranks is a property of GR Design de Produtos, Ltd. ©2025 All Rights Reserved.
          </p>
          <div className="flex gap-[24px] items-start justify-center">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="shrink-0 size-[24px] opacity-70 hover:opacity-100 transition-opacity">
              <svg className="block size-full" fill="var(--logo-color)" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="shrink-0 size-[24px] opacity-70 hover:opacity-100 transition-opacity">
              <svg className="block size-full" fill="var(--logo-color)" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="shrink-0 size-[24px] opacity-70 hover:opacity-100 transition-opacity">
              <svg className="block size-full" fill="none" stroke="var(--logo-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
