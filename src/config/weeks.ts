import { getCurrentSeason } from '../utils/seasons';

export interface WeekData {
  id: string;
  label: string;
  title: string;
  period: string;
  isCurrentWeek: boolean;
  startDate: Date;
  endDate: Date;
}

export const TOTAL_WEEKS = 13;
export const CURRENT_WEEK_NUMBER = 1;

const formatDate = (date: Date) => {
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = date.getUTCDate();
  return `${month} ${day}`;
};

const getSeasonBaseDates = () => {
  const seasonInfo = getCurrentSeason();
  const seasonStart = new Date(Date.UTC(seasonInfo.year, seasonInfo.startDate.getUTCMonth(), seasonInfo.startDate.getUTCDate()));
  
  return { seasonStart, currentYear: seasonInfo.year };
};

const getWeekDates = (weekNumber: number, seasonStart: Date) => {
  const dayOfWeek = seasonStart.getUTCDay(); // 0 = Sunday
  const daysToFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const firstSunday = new Date(seasonStart);
  firstSunday.setUTCDate(seasonStart.getUTCDate() + daysToFirstSunday);
  
  if (weekNumber === 1) {
    return { startDate: seasonStart, endDate: firstSunday };
  }
  
  const startDate = new Date(firstSunday);
  startDate.setUTCDate(firstSunday.getUTCDate() + 1 + (weekNumber - 2) * 7);
  
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  
  return { startDate, endDate };
};

function generateWeeksData(): WeekData[] {
  const { seasonStart, currentYear } = getSeasonBaseDates();
  
  return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
    const weekNumber = i + 1;
    const { startDate, endDate } = getWeekDates(weekNumber, seasonStart);
    const isCurrentWeek = weekNumber === CURRENT_WEEK_NUMBER;
    
    return {
      id: `week${weekNumber}`,
      label: `Week ${weekNumber}`,
      title: `Week ${weekNumber} - ${formatDate(startDate)} - ${formatDate(endDate)}, ${currentYear}`,
      period: `${isCurrentWeek ? 'Airing' : 'Aired'} - ${formatDate(startDate)} - ${formatDate(endDate)}, ${currentYear}`,
      isCurrentWeek,
      startDate,
      endDate,
    };
  });
}

export const WEEKS_DATA: WeekData[] = generateWeeksData();

/**
 * Generate weeks data for any specific season
 */
export function generateWeeksDataForSeason(seasonYear: number, startDateStr: string): WeekData[] {
  const seasonStart = new Date(startDateStr);
  
  return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
    const weekNumber = i + 1;
    const { startDate, endDate } = getWeekDates(weekNumber, seasonStart);
    
    return {
      id: `week${weekNumber}`,
      label: `Week ${weekNumber}`,
      title: `Week ${weekNumber} - ${formatDate(startDate)} - ${formatDate(endDate)}, ${seasonYear}`,
      period: `Aired - ${formatDate(startDate)} - ${formatDate(endDate)}, ${seasonYear}`,
      isCurrentWeek: false,
      startDate,
      endDate,
    };
  });
}

export const getCurrentWeek = (): WeekData | undefined => {
  return WEEKS_DATA.find(week => week.isCurrentWeek);
};

export const getWeekNumberFromDate = (date: Date): number => {
  const { seasonStart } = getSeasonBaseDates();
  const inputDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  
  if (inputDate < seasonStart) {
    return 1;
  }
  
  const dayOfWeek = seasonStart.getUTCDay();
  const daysToFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const firstSunday = new Date(seasonStart);
  firstSunday.setUTCDate(seasonStart.getUTCDate() + daysToFirstSunday);
  
  if (inputDate <= firstSunday) {
    return 1;
  }
  
  const firstMonday = new Date(firstSunday);
  firstMonday.setUTCDate(firstSunday.getUTCDate() + 1);
  
  const diffTime = inputDate.getTime() - firstMonday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 2;
  
  return Math.min(Math.max(1, weekNumber), TOTAL_WEEKS);
};
