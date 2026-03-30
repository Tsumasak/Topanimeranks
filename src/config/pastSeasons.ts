import { getCurrentSeason, SeasonName, getNextSeason } from '../utils/seasons';

export interface PastSeasonData {
  id: string;
  label: string;
  title: string;
  period: string;
  year: number;
  season: string;
}

function getSeasonPeriod(season: SeasonName, year: number): string {
  switch (season) {
    case 'Winter': return `January - March ${year}`;
    case 'Spring': return `April - June ${year}`;
    case 'Summer': return `July - September ${year}`;
    case 'Fall': return `October - December ${year}`;
  }
  return '';
}

function generatePastSeasons(): PastSeasonData[] {
  const seasons: PastSeasonData[] = [];
  const currentSeason = getCurrentSeason();
  
  let iterSeason: SeasonName = 'Winter';
  let iterYear = 2025;
  let maxIters = 50; 
  
  while (maxIters-- > 0) {
    seasons.push({
      id: `${iterSeason.toLowerCase()}${iterYear}`,
      label: `${iterSeason} ${iterYear}`,
      title: `${iterSeason} ${iterYear}`,
      period: getSeasonPeriod(iterSeason, iterYear),
      year: iterYear,
      season: iterSeason.toLowerCase(),
    });
    
    if (iterSeason === currentSeason.name && iterYear === currentSeason.year) {
      break;
    }
    
    const next = getNextSeason(iterSeason, iterYear);
    iterSeason = next.season;
    iterYear = next.year;
  }
  
  return seasons;
}

export const PAST_SEASONS_DATA: PastSeasonData[] = generatePastSeasons();