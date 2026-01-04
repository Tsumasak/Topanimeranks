export interface WeekData {
  id: string;
  label: string;
  title: string;
  period: string;
  isCurrentWeek: boolean;
  startDate: Date;
  endDate: Date;
}

// ============================================
// WINTER 2026 CONFIGURATION
// ============================================
// Week 1: January 1-4, 2026 (Wednesday - Saturday) - 4 days
// Week 2: January 5-11, 2026 (Sunday - Saturday) - 7 days
// Week 3+: Standard Monday-Sunday weeks

// Today is January 4, 2026 (Saturday) - Week 1
// A full season has 12-13 weeks
// NOTE: CURRENT_WEEK_NUMBER is only used as a fallback.
// The actual "current week" is auto-detected by the server based on which week has 5+ episodes with scores.
export const CURRENT_WEEK_NUMBER = 1;
export const TOTAL_WEEKS = 13; // Full anime season

// Helper to calculate week dates for Winter 2026
const getWeekDates = (weekNumber: number) => {
  if (weekNumber === 1) {
    // Week 1: January 1-4, 2026 (partial week)
    return {
      startDate: new Date(Date.UTC(2026, 0, 1)), // January 1, 2026
      endDate: new Date(Date.UTC(2026, 0, 4))     // January 4, 2026
    };
  } else if (weekNumber === 2) {
    // Week 2: January 5-11, 2026 (Sunday - Saturday)
    return {
      startDate: new Date(Date.UTC(2026, 0, 5)),  // January 5, 2026
      endDate: new Date(Date.UTC(2026, 0, 11))     // January 11, 2026
    };
  } else {
    // Week 3+: Standard Monday-Sunday weeks
    // Week 3 starts on Monday, January 12, 2026
    const week3StartDate = new Date(Date.UTC(2026, 0, 12)); // January 12, 2026 (Monday)
    const startDate = new Date(week3StartDate);
    startDate.setUTCDate(week3StartDate.getUTCDate() + (weekNumber - 3) * 7);
    
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6); // Sunday
    
    return { startDate, endDate };
  }
};

// Format date as "Month DD"
const formatDate = (date: Date) => {
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = date.getUTCDate();
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
    title: `Week ${weekNumber} - ${formatDate(startDate)} - ${formatDate(endDate)}, 2026`,
    period: `${isCurrentWeek ? 'Airing' : 'Aired'} - ${formatDate(startDate)} - ${formatDate(endDate)}, 2026`,
    isCurrentWeek,
    startDate,
    endDate,
  };
});

export const getCurrentWeek = (): WeekData | undefined => {
  return WEEKS_DATA.find(week => week.isCurrentWeek);
};

// Get week number from a date (Winter 2026 logic)
export const getWeekNumberFromDate = (date: Date): number => {
  const inputDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  
  // Week 1: January 1-4, 2026
  const week1Start = new Date(Date.UTC(2026, 0, 1));
  const week1End = new Date(Date.UTC(2026, 0, 4));
  
  if (inputDate >= week1Start && inputDate <= week1End) {
    return 1;
  }
  
  // Week 2: January 5-11, 2026
  const week2Start = new Date(Date.UTC(2026, 0, 5));
  const week2End = new Date(Date.UTC(2026, 0, 11));
  
  if (inputDate >= week2Start && inputDate <= week2End) {
    return 2;
  }
  
  // Week 3+: Standard Monday-Sunday weeks starting January 12, 2026
  const week3Start = new Date(Date.UTC(2026, 0, 12));
  
  if (inputDate < week3Start) {
    return 1; // Before season start
  }
  
  const diffTime = inputDate.getTime() - week3Start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 3; // +3 because we start at week 3
};
