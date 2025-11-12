export interface WeekData {
  id: string;
  label: string;
  title: string;
  period: string;
  isCurrentWeek: boolean;
  startDate: Date;
  endDate: Date;
}

// Week 1 started on September 29, 2025 (Monday)
// Today is October 27, 2025 (Monday) - Week 5 Day 1
// A full season has 12-13 weeks
// NOTE: CURRENT_WEEK_NUMBER is only used as a fallback.
// The actual "current week" is auto-detected by the server based on which week has 5+ episodes with scores.
export const CURRENT_WEEK_NUMBER = 5;
export const TOTAL_WEEKS = 13; // Full anime season

// Helper to calculate Monday of a week
const getWeekDates = (weekNumber: number) => {
  // Week 1 starts on September 29, 2025 (Monday)
  const baseDate = new Date(Date.UTC(2025, 8, 29)); // Month is 0-indexed (8 = September), using UTC
  const startDate = new Date(baseDate);
  startDate.setUTCDate(baseDate.getUTCDate() + (weekNumber - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6); // Sunday
  
  return { startDate, endDate };
};

// Format date as "Month DD"
const formatDate = (date: Date) => {
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  return `${month} ${day}`;
};

// Generate weeks data for full season (13 weeks)
export const WEEKS_DATA: WeekData[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
  const weekNumber = i + 1;
  const { startDate, endDate } = getWeekDates(weekNumber);
  const isCurrentWeek = weekNumber === CURRENT_WEEK_NUMBER;
  
  return {
    id: `week${weekNumber}`,
    label: `Week ${weekNumber}`,
    title: `Week ${weekNumber} - ${formatDate(startDate)} - ${formatDate(endDate)}, 2025`,
    period: `${isCurrentWeek ? 'Airing' : 'Aired'} - ${formatDate(startDate)} - ${formatDate(endDate)}, 2025`,
    isCurrentWeek,
    startDate,
    endDate,
  };
});

export const getCurrentWeek = (): WeekData | undefined => {
  return WEEKS_DATA.find(week => week.isCurrentWeek);
};

// Get week number from a date
export const getWeekNumberFromDate = (date: Date): number => {
  const baseDate = new Date(Date.UTC(2025, 8, 29)); // Week 1 start, using UTC
  const diffTime = date.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
};