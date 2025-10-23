export interface WeekData {
  id: string;
  label: string;
  title: string;
  period: string;
  isCurrentWeek: boolean;
}

export const CURRENT_WEEK_NUMBER = 4; // Current active week

export const WEEKS_DATA: WeekData[] = [
  {
    id: 'week1',
    label: 'Week 1',
    title: 'Week 1 - September 29 - October 5, 2025',
    period: 'Aired - September 29 - October 5, 2025',
    isCurrentWeek: false,
  },
  {
    id: 'week2',
    label: 'Week 2',
    title: 'Week 2 - October 6-12, 2025',
    period: 'Aired - October 6-12, 2025',
    isCurrentWeek: false,
  },
  {
    id: 'week3',
    label: 'Week 3',
    title: 'Week 3 - October 13-19, 2025',
    period: 'Aired - October 13-19, 2025',
    isCurrentWeek: false,
  },
  {
    id: 'week4',
    label: 'Week 4',
    title: 'Week 4 - October 20-26, 2025',
    period: 'Airing - October 20-26, 2025',
    isCurrentWeek: true,
  },
];

export const getCurrentWeek = (): WeekData | undefined => {
  return WEEKS_DATA.find(week => week.isCurrentWeek);
};
