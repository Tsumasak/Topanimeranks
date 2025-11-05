export interface SeasonData {
  id: string;
  label: string;
  title: string;
  period: string;
  year: number;
}

export const SEASONS_DATA: SeasonData[] = [
  {
    id: 'winter2026',
    label: 'Winter 2026',
    title: 'Winter 2026',
    period: 'January - March 2026',
    year: 2026,
  },
  {
    id: 'spring2026',
    label: 'Spring 2026',
    title: 'Spring 2026',
    period: 'April - June 2026',
    year: 2026,
  },
  {
    id: 'later',
    label: 'Later',
    title: 'Later',
    period: 'Summer 2026 and Beyond',
    year: 2026,
  },
];
