import { ImageWithFallback } from './figma/ImageWithFallback';
import { Link } from 'react-router';
import { getTypeClass, getDemographicClass, getSeasonClass } from '../utils/tagHelpers';

interface BaseAnimeCardProps {
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
  animeId?: number; // Anime ID for anchor links
  hideRank?: boolean; // Hide rank display (for search results)
  season?: string | null; // Season name (winter, spring, summer, fall)
  year?: number | null; // Year
}

export default function BaseAnimeCard({ 
  rank, 
  title, 
  subtitle, // Now used for episode info
  imageUrl, 
  linkUrl = "#", 
  bottomText,
  animeType,
  demographics = [],
  genres = [],
  themes = [],
  positionChange, // Now used for trend indicator
  animeId,
  hideRank = false,
  season,
  year
}: BaseAnimeCardProps) {
  // Determine border styling and gradients based on rank
  let borderStyle = 'border border-gray-600'; // Default border for positions 4+
  let hoverClass = 'rank-hover-4plus'; // Default hover class for positions 4+
  let contentGradient = ''; // Gradient for top 3 positions
  let rankStyle = 'rank-4plus'; // Default style for positions 4+
  
  // Only apply special styling if not hiding rank
  if (!hideRank) {
    if (rank === 1) {
      contentGradient = 'bg-gradient-to-br from-yellow-500/30 via-yellow-500/15 to-transparent';
      borderStyle = 'border border-yellow-600';
      hoverClass = 'rank-hover-1';
    } else if (rank === 2) {
      contentGradient = 'bg-gradient-to-br from-gray-400/30 via-gray-400/15 to-transparent';
      borderStyle = 'border border-gray-500';
      hoverClass = 'rank-hover-2';
    } else if (rank === 3) {
      contentGradient = 'bg-gradient-to-br from-orange-400/30 via-orange-400/15 to-transparent';
      borderStyle = 'border border-orange-500';
      hoverClass = 'rank-hover-3';
    }
  }

  // Generate unique ID for gradients to avoid conflicts with multiple cards
  const uniqueId = `${rank}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Trend Indicator Component
  const TrendIndicator = ({ change }: { change: number | undefined }) => {
    if (change === undefined) {
      return (
        <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
          <span className="font-bold">NEW</span>
        </div>
      );
    }
    
    if (change === 0) {
      return (
        <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
          <span>=</span>
        </div>
      );
    }
    
    const isPositive = change > 0;
    const displayValue = Math.abs(change);
    
    return (
      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
        isPositive 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}>
        <span className="font-bold">{isPositive ? '↑' : '↓'}</span>
        <span className="font-bold">{displayValue}</span>
      </div>
    );
  };
  
  // SVG Badge Components for top 3 positions
  const GoldBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id={`gold-base-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill={`url(#gold-base-${uniqueId})`} stroke="#B8860B" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#1</tspan>
      </text>
    </svg>
  );

  const SilverBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id={`silver-base-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5E5E5" />
          <stop offset="50%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#A0A0A0" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill={`url(#silver-base-${uniqueId})`} stroke="#808080" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#2</tspan>
      </text>
    </svg>
  );

  const BronzeBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id={`bronze-base-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="50%" stopColor="#B87333" />
          <stop offset="100%" stopColor="#A0522D" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill={`url(#bronze-base-${uniqueId})`} stroke="#8B4513" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#3</tspan>
      </text>
    </svg>
  );

  // Determine anime type tag styling
  const typeTagStyle = animeType ? getTypeClass(animeType) : 'tag-default';

  return (
    <Link 
      to={linkUrl} 
      id={animeId ? `anime-${animeId}` : undefined}
      className={`block theme-card rounded-lg overflow-hidden flex flex-col h-full group border ${borderStyle} ${hoverClass} transition-all duration-300`}
    >
      <div className="relative flex-shrink-0 overflow-hidden anime-card-image aspect-square">
        <ImageWithFallback 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover object-center transition-all duration-1500 ease-out group-hover:object-top" 
        />
        
        {/* Tags Container - Top Right */}
        <div className="absolute top-2 right-2 flex flex-row gap-1">
          {/* Anime Type Tag */}
          {animeType && (
            <div className={`px-3 py-1 rounded-full text-xs ${typeTagStyle}`}>
              {animeType}
            </div>
          )}
          
          {/* Demographics Tag - only show first demographic if available */}
          {demographics && demographics.length > 0 && (
            <div className={`px-3 py-1 rounded-full text-xs ${getDemographicClass(demographics[0])}`}>
              {typeof demographics[0] === 'string' ? demographics[0] : demographics[0]?.name || 'Unknown'}
            </div>
          )}
        </div>
      </div>

      {/* Container with gradient for top 3 positions */}
      <div className={`relative flex-grow flex flex-col ${contentGradient}`}>
        <div className="p-4 flex items-start flex-grow">
          {/* Rank Display - Only show if not hideRank */}
          {!hideRank && (
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              {rank === 1 ? (
                <GoldBadge />
              ) : rank === 2 ? (
                <SilverBadge />
              ) : rank === 3 ? (
                <BronzeBadge />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center">
                  <div className={`px-3 py-1 rounded-full text-sm ${rankStyle}`}>
                    #{rank}
                  </div>
                </div>
              )}
              
              {/* Trend Indicator - positioned below rank badge */}
              <TrendIndicator change={positionChange} />
            </div>
          )}
          
          <div className={`relative flex flex-col ${hideRank ? '' : 'ml-4'} flex-grow`}>
            <h3 className="text-lg line-clamp-2 leading-[1.1] mb-3" style={{color: 'var(--foreground)', fontWeight: '700'}}>{title}</h3>
            
            {/* Season Tag - show when season and year are available */}
            {!hideRank && season && typeof season === 'string' && year && (
              <div className="mb-2">
                <span className={`${getSeasonClass(season)} px-3 py-1 rounded-full text-xs inline-block`}>
                  {season.charAt(0).toUpperCase() + season.slice(1)} {year}
                </span>
              </div>
            )}
            
            {/* Episode Subtitle - only show when NOT hiding rank and no season tag */}
            {!hideRank && subtitle && !season && (
              <p className="text-sm mb-2" style={{color: 'var(--foreground)', opacity: 0.8}}>
                {subtitle}
              </p>
            )}
            
            {/* Genres + Themes Tags - Combine and show first 3 total */}
            {((genres && genres.length > 0) || (themes && themes.length > 0)) && (
              <div className="flex gap-1 flex-wrap mb-2">
                {[...genres, ...themes].slice(0, 3).map((tag, index) => {
                  const tagName = typeof tag === 'string' ? tag : tag?.name || 'Unknown';
                  return (
                    <span 
                      key={index} 
                      className="px-2.5 py-1 text-xs rounded-full border theme-rating"
                      style={{
                        borderColor: 'var(--card-border)'
                      }}
                    >
                      {tagName}
                    </span>
                  );
                })}
              </div>
            )}
            
            {/* Season Tag - show in search results when hideRank is true */}
            {hideRank && season && typeof season === 'string' && (
              <div className="flex gap-1">
                <span className={`px-2.5 py-1 text-xs rounded-full ${getSeasonClass(season)}`}>
                  {season.toLowerCase() === 'upcoming' && year === 9999 
                    ? 'Upcoming'
                    : `${season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()} ${year}`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Bottom text container */}
        <div className="font-bold text-right px-4 pb-4 text-lg mt-auto" style={{color: 'var(--rating-yellow)'}}>
          {bottomText}
        </div>
      </div>
    </Link>
  );
}