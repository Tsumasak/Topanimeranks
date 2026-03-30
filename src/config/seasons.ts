import { getCurrentSeason, SeasonName, getNextSeason } from '../utils/seasons';

export interface SeasonData {
  id: string;
  label: string;
  title: string;
  period: string;
  year: number;
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

function generateAnticipatedSeasons(): SeasonData[] {
  const seasons: SeasonData[] = [];
  const currentSeason = getCurrentSeason();
  
  let iter = getNextSeason(currentSeason.name, currentSeason.year);
  
  for (let i = 0; i < 3; i++) {
    seasons.push({
      id: `${iter.season.toLowerCase()}${iter.year}`,
      label: `${iter.season} ${iter.year}`,
      title: `${iter.season} ${iter.year}`,
      period: getSeasonPeriod(iter.season, iter.year),
      year: iter.year,
    });
    iter = getNextSeason(iter.season, iter.year);
  }
  
  seasons.push({
    id: 'later',
    label: 'Later',
    title: 'Later',
    period: `${iter.season} ${iter.year} and Beyond`,
    year: iter.year,
  });
  
  return seasons;
}

export const SEASONS_DATA: SeasonData[] = generateAnticipatedSeasons();