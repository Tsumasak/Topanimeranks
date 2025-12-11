export interface PastSeasonData {
  id: string;
  label: string;
  title: string;
  period: string;
  year: number;
  season: string;
}

export const PAST_SEASONS_DATA: PastSeasonData[] = [
  {
    id: 'winter2025',
    label: 'Winter 2025',
    title: 'Winter 2025',
    period: 'January - March 2025',
    year: 2025,
    season: 'winter',
  },
  {
    id: 'spring2025',
    label: 'Spring 2025',
    title: 'Spring 2025',
    period: 'April - June 2025',
    year: 2025,
    season: 'spring',
  },
  {
    id: 'summer2025',
    label: 'Summer 2025',
    title: 'Summer 2025',
    period: 'July - September 2025',
    year: 2025,
    season: 'summer',
  },
  {
    id: 'fall2025',
    label: 'Fall 2025',
    title: 'Fall 2025',
    period: 'October - December 2025',
    year: 2025,
    season: 'fall',
  },
];
