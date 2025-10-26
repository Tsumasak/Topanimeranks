import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { JikanService } from '../services/jikan';
import { Episode, AnticipatedAnime } from '../types/anime';
import { CURRENT_WEEK_NUMBER } from '../config/weeks';

interface HomeCardData {
  rank: number;
  title: string;
  subtitle?: string;
  image: string;
  score?: number;
  members?: string;
  animeType?: string;
  demographics?: string[];
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
  
  // Image height and card height based on card type
  const imageHeight = isEpisode ? 'h-40' : 'h-72'; // episode = 160px (mais horizontal), anticipated = 288px (mais vertical)
  const cardHeight = isEpisode ? 'h-[420px]' : 'h-[520px]'; // Fixed heights for uniform sizing
  
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
  
  return (
    <CardWrapper 
      {...cardProps}
      className={`block theme-card rounded-lg overflow-hidden flex flex-col group border ${borderStyle} ${hoverClass} transition-all duration-300`}
    >
      {/* Image Section */}
      <div className={`relative flex-shrink-0 overflow-hidden anime-card-image ${imageHeight}`}>
        <img 
          alt={data.title} 
          className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top" 
          src={data.image} 
        />
        
        {/* Tags Container - Top Right */}
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
      <div className={`relative flex-grow flex flex-col ${contentGradient}`}>
        <div className="p-3 flex items-start">
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
          <div className="relative flex flex-col ml-3 flex-grow">
            <h3 className="font-bold text-lg leading-[1.1] mb-2" style={{ color: 'var(--foreground)' }}>
              {data.title}
            </h3>
            {data.subtitle && (
              <p className="text-sm leading-[1.1] mb-1" style={{ color: 'var(--foreground)' }}>
                {data.subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Bottom text - pushed to bottom with mt-auto */}
        <div className="font-bold text-right px-3 pb-3 text-lg mt-auto" style={{ color: 'var(--rating-yellow)' }}>
          {isAnticipated && data.members ? data.members : data.score ? `★ ${data.score}` : ''}
        </div>
      </div>
    </CardWrapper>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-[4px] items-start justify-center w-full">
      <p className="font-['Arial'] font-bold leading-[40px] relative shrink-0 text-[28px] md:text-[36px] break-words" style={{ color: 'var(--foreground)' }}>
        {title}
      </p>
      <p className="font-['Arial'] leading-[16px] text-[12px] break-words" style={{ color: 'var(--rating-text)' }}>
        {subtitle}
      </p>
    </div>
  );
}

export function HomePage() {
  const [topEpisodes, setTopEpisodes] = useState<HomeCardData[]>([]);
  const [anticipated, setAnticipated] = useState<HomeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load Top Episodes
        const weekData = await JikanService.getWeekData(CURRENT_WEEK_NUMBER);
        const topEps = weekData.episodes.slice(0, 3).map((ep: Episode, index: number) => ({
          rank: index + 1,
          title: ep.animeTitle,
          subtitle: `EP ${ep.episodeNumber} - ${ep.episodeTitle}`,
          image: ep.imageUrl,
          score: ep.score,
          animeType: ep.animeType,
          demographics: ep.demographics,
          url: ep.url
        }));
        setTopEpisodes(topEps);

        // Set dynamic background from #1 episode
        if (topEps.length > 0) {
          document.documentElement.style.setProperty('--bg-image', `url(${topEps[0].image})`);
        }

        // Load Most Anticipated (Winter 2026)
        const anticipatedData = await JikanService.getAnticipatedBySeason('winter', 2026);
        const topAnticipated = anticipatedData.animes.slice(0, 3).map((anime: AnticipatedAnime, index: number) => ({
          rank: index + 1,
          title: anime.title,
          image: anime.imageUrl,
          members: `${anime.members.toLocaleString()} Members`,
          animeType: anime.animeType,
          demographics: anime.demographics,
          url: anime.url
        }));
        setAnticipated(topAnticipated);

      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="dynamic-background min-h-screen">
      {/* Main Content */}
      <div className="container mx-auto px-[24px] pt-[32px] pb-[32px] flex flex-col gap-[32px]">
        {/* Weekly Episodes Section */}
        <div className="relative rounded-[10px] shrink-0 w-full" style={{ backgroundColor: 'var(--card-background)' }}>
          <div aria-hidden="true" className="absolute border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.3)]" style={{ borderWidth: '1px', borderColor: 'var(--card-border)' }} />
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[24px] items-start justify-center p-[24px] relative w-full">
              {/* Section Header */}
              <div className="content-stretch flex flex-col md:flex-row items-start md:items-center justify-between not-italic relative shrink-0 w-full gap-4 md:gap-0">
                <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0">
                  <p className="font-['Arial'] font-bold leading-[40px] relative shrink-0 text-[28px] md:text-[36px]" style={{ color: 'var(--foreground)' }}>
                    Weekly Anime Episode Ranking
                  </p>
                  <p className="font-['Arial'] leading-[16px] relative shrink-0 text-[12px]" style={{ color: 'var(--rating-text)' }}>
                    Rank the best episodes of the week
                  </p>
                </div>
                <p className="font-['Arial'] font-bold leading-[20px] relative shrink-0 text-[14px]" style={{ color: 'var(--rating-yellow)' }}>
                  Week {CURRENT_WEEK_NUMBER} - October 20-26, 2025
                </p>
              </div>

              {/* Cards */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {[1, 2, 3].map(i => (
                    <div key={`skeleton-episode-${i}`} className="bg-slate-700 h-[280px] w-full animate-pulse rounded-[10px]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {topEpisodes.map((ep) => (
                    <HomeAnimeCard key={`episode-${ep.rank}`} data={ep} type="episode" />
                  ))}
                </div>
              )}

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

        {/* Two Column Section */}
        <div className="flex flex-col lg:flex-row gap-[18px] items-stretch w-full">
          {/* Top Animes - Fall 2025 */}
          <div className="flex flex-col gap-[18px] lg:flex-1 w-full">
            <div className="flex items-center w-full">
              <SectionHeader 
                title="Top Animes - Fall 2025"
                subtitle="Highest rated animes of the season and worth checking out."
              />
            </div>
            <div className="relative rounded-[10px] w-full" style={{ backgroundColor: 'var(--card-background)' }}>
              <div aria-hidden="true" className="absolute border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.3)]" style={{ borderWidth: '1px', borderColor: 'var(--card-border)' }} />
              <div className="flex flex-col items-end justify-end">
                <div className="box-border flex flex-col gap-[24px] items-end justify-end p-[24px] w-full">
                  <div className="w-full">
                    {/* Single placeholder card for Top Animes */}
                    <div className="bg-slate-700/50 h-[280px] relative rounded-[10px] flex items-center justify-center">
                      <p className="text-slate-400 text-sm">Coming Soon</p>
                    </div>
                  </div>
                  <p className="font-['Arial'] font-bold leading-[20px] text-[14px] text-right w-full" style={{ color: 'var(--foreground)' }}>
                    <span style={{ color: 'var(--rating-yellow)' }}>▸ </span>View Complete Rank
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Most Anticipated Animes */}
          <div className="flex flex-col gap-[18px] lg:flex-1 w-full">
            <div className="flex items-center w-full">
              <SectionHeader 
                title="Most Anticipated Animes"
                subtitle="Most anticipated animes of the upcoming seasons. Check out all the future seasons here."
              />
            </div>
            <div className="relative rounded-[10px] w-full" style={{ backgroundColor: 'var(--card-background)' }}>
              <div aria-hidden="true" className="absolute border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.3)]" style={{ borderWidth: '1px', borderColor: 'var(--card-border)' }} />
              <div className="flex flex-col items-end justify-end">
                <div className="box-border flex flex-col gap-[24px] items-end justify-end p-[24px] w-full">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                      {[1, 2, 3].map(i => (
                        <div key={`skeleton-anticipated-${i}`} className="bg-slate-700 h-[380px] w-full animate-pulse rounded-[10px]" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                      {anticipated.map((anime) => (
                        <HomeAnimeCard key={`anticipated-${anime.rank}`} data={anime} type="anticipated" />
                      ))}
                    </div>
                  )}
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
