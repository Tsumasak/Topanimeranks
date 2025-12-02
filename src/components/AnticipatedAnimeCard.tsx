import React from 'react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AnticipatedAnimeCardProps {
  rank: number;
  title: string;
  imageUrl: string;
  score: number | null;
  members: number; // Plan to Watch count from MAL
  synopsis: string;
  animeType: string;
  demographics: string[];
  genres: string[];
  themes: string[];
  studios: string[];
  animeUrl: string;
}

const AnticipatedAnimeCard: React.FC<AnticipatedAnimeCardProps> = ({ 
  rank,
  title,
  imageUrl,
  members,
  animeType,
  demographics,
  genres,
  themes,
  animeUrl,
}) => {
  // Validate props to prevent undefined errors
  if (!title || !imageUrl || !members) {
    console.warn('Invalid anime data:', { title, imageUrl, members });
    return null;
  }

  // Determine border styling based on rank
  let borderStyle = 'border border-gray-600';
  let hoverClass = 'rank-hover-4plus';
  let contentGradient = '';
  
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

  // Generate unique ID for gradients to avoid conflicts with multiple cards
  const uniqueId = `${rank}-${Math.random().toString(36).substr(2, 9)}`;

  // SVG Badge Components for top 3 positions
  const GoldBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id={`gold-base-anticipated-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill={`url(#gold-base-anticipated-${uniqueId})`} stroke="#B8860B" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#1</tspan>
      </text>
    </svg>
  );

  const SilverBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id={`silver-base-anticipated-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5E5E5" />
          <stop offset="50%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#A0A0A0" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill={`url(#silver-base-anticipated-${uniqueId})`} stroke="#808080" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#2</tspan>
      </text>
    </svg>
  );

  const BronzeBadge = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <defs>
        <linearGradient id={`bronze-base-anticipated-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="50%" stopColor="#B87333" />
          <stop offset="100%" stopColor="#A0522D" />
        </linearGradient>
      </defs>
      <g transform="scale(0.0038)">
        <path d="M4152 12409 c-262 -32 -449 -288 -980 -1344 -317 -630 -429 -836 -517 -953 -118 -157 -255 -249 -1033 -696 -862 -495 -1174 -721 -1272 -920 -110 -223 -15 -540 497 -1651 293 -636 370 -823 399 -972 33 -173 19 -319 -120 -1234 -115 -756 -148 -1164 -112 -1371 46 -253 181 -360 656 -516 239 -79 358 -111 1059 -287 782 -196 908 -239 1066 -360 74 -57 345 -327 556 -555 562 -606 845 -892 1034 -1043 128 -102 259 -172 350 -186 234 -35 523 130 1375 784 832 638 911 689 1162 739 104 21 404 51 818 81 1030 75 1388 126 1605 230 287 138 339 388 365 1770 11 588 23 831 46 962 30 176 102 313 376 717 619 913 768 1146 886 1383 134 268 150 398 69 568 -86 179 -359 450 -942 935 -597 495 -689 574 -794 675 -241 232 -265 286 -542 1185 -380 1233 -515 1520 -755 1609 -30 12 -97 26 -148 33 -177 22 -608 -34 -1176 -152 -932 -195 -1128 -230 -1290 -230 -182 0 -330 43 -845 245 -390 154 -446 176 -580 228 -167 65 -438 162 -590 211 -315 101 -483 132 -623 115z" 
              fill={`url(#bronze-base-anticipated-${uniqueId})`} stroke="#8B4513" strokeWidth="100"/>
      </g>
      <text x="24" y="29" textAnchor="middle" className="text-sm fill-black">
        <tspan className="font-bold">#3</tspan>
      </text>
    </svg>
  );

  return (
    <Link 
      to={animeUrl}
      className={`theme-card rounded-lg overflow-hidden ${borderStyle} ${hoverClass} transition-all duration-300 h-full flex flex-col group`}
    >
      {/* Image Section with Tags */}
      <div className="relative aspect-square w-full overflow-hidden flex-shrink-0 anime-card-image">
        <ImageWithFallback 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover transition-all duration-1500 ease-out group-hover:object-top"
          loading="lazy"
        />
        
        {/* Tags Container - Top Right */}
        <div className="absolute top-2 right-2 flex flex-row gap-1">
          {/* Anime Type Tag */}
          {animeType && (
            <div className={`px-3 py-1 rounded-full text-xs ${animeType === 'TV' ? 'tag-tv' : animeType === 'ONA' ? 'tag-ona' : 'tag-default'}`}>
              {animeType}
            </div>
          )}
          
          {/* Demographics Tag - only show first demographic if available */}
          {demographics && demographics.length > 0 && (() => {
            const demographic: string = typeof demographics[0] === 'string' ? demographics[0] : (demographics[0] as any)?.name;
            return demographic ? (
              <div className={`px-3 py-1 rounded-full text-xs ${
                demographic.toLowerCase() === 'seinen' ? 'tag-seinen' :
                demographic.toLowerCase() === 'shounen' ? 'tag-shounen' :
                demographic.toLowerCase() === 'shoujo' ? 'tag-shoujo' :
                demographic.toLowerCase() === 'josei' ? 'tag-josei' :
                'tag-demo-default'
              }`}>
                {demographic}
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Content Section with gradient for top 3 */}
      <div className={`relative flex-1 flex flex-col ${contentGradient}`}>
        <div className="p-4 flex items-start flex-grow">
          {/* Rank Display - SVG badges for top 3, pill for others */}
          <div className="flex-shrink-0">
            {rank === 1 ? (
              <GoldBadge />
            ) : rank === 2 ? (
              <SilverBadge />
            ) : rank === 3 ? (
              <BronzeBadge />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center">
                <div className="px-3 py-1 rounded-full text-sm rank-4plus">
                  #{rank}
                </div>
              </div>
            )}
          </div>

          <div className="relative flex flex-col ml-4 flex-grow">
            {/* Title */}
            <h3 className="font-bold text-lg line-clamp-2 leading-[1.1] mb-3" style={{color: 'var(--foreground)'}}>
              {title}
            </h3>

            {/* Genres + Themes Tags - Combine and show first 3 total */}
            {((genres && genres.length > 0) || (themes && themes.length > 0)) && (() => {
              // Extract string values from genres and themes (handle both string arrays and object arrays)
              const genreStrings = genres.map((g: any) => typeof g === 'string' ? g : g?.name).filter(Boolean);
              const themeStrings = themes.map((t: any) => typeof t === 'string' ? t : t?.name).filter(Boolean);
              const allTags = [...genreStrings, ...themeStrings].slice(0, 3);
              
              return allTags.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
                  {allTags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-2.5 py-1 text-xs rounded-full border"
                      style={{
                        borderColor: 'var(--card-border)',
                        background: 'var(--card-background)',
                        color: 'var(--foreground)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Plan to Watch Count - Bottom */}
        <div className="font-bold text-right px-4 pb-4 text-lg mt-auto" style={{color: 'var(--rating-yellow)'}}>
          {members.toLocaleString()} Plan to Watch
        </div>
      </div>
    </Link>
  );
};

export default AnticipatedAnimeCard;