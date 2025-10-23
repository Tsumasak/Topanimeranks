export interface AnticipatedAnime {
  id: number;
  rank: number;
  title: string;
  members: number;
  imageUrl: string;
  season: string;
  year: number;
  genres?: string[];
  themes?: string[];
}

export const fall2025Animes: AnticipatedAnime[] = [
  {
    id: 1,
    rank: 1,
    title: "Demon Slayer: Infinity Castle Arc",
    members: 450000,
    imageUrl: "https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW1vbiUyMHNsYXllciUyMGFuaW1lfGVufDF8fHx8MTc2MTIxODY0NXww&ixlib=rb-4.1.0&q=80&w=1080",
    season: "Fall",
    year: 2025,
    genres: ["Action", "Fantasy"],
    themes: ["Historical", "Demons"],
  },
  {
    id: 2,
    rank: 2,
    title: "Jujutsu Kaisen Season 3",
    members: 420000,
    imageUrl: "https://images.unsplash.com/photo-1668119064420-fb738fb05e32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGNoYXJhY3RlcnxlbnwxfHx8fDE3NjExNTA1MzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    season: "Fall",
    year: 2025,
    genres: ["Action", "Fantasy"],
    themes: ["School", "Curses"],
  },
  {
    id: 3,
    rank: 3,
    title: "Chainsaw Man Season 2",
    members: 380000,
    imageUrl: "https://images.unsplash.com/photo-1611457194403-d3aca4cf9d11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGRhcmt8ZW58MXx8fHwxNzYxMjQ2Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    season: "Fall",
    year: 2025,
    genres: ["Action", "Horror"],
    themes: ["Gore", "Devils"],
  },
  {
    id: 4,
    rank: 4,
    title: "My Hero Academia Season 8",
    members: 350000,
    imageUrl: "https://images.unsplash.com/photo-1760189450577-326c0fdfd5d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGFjdGlvbnxlbnwxfHx8fDE3NjEyNDY2ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    season: "Fall",
    year: 2025,
    genres: ["Action"],
    themes: ["School", "Super Power"],
  },
  {
    id: 5,
    rank: 5,
    title: "The Eminence in Shadow Season 3",
    members: 280000,
    imageUrl: "https://images.unsplash.com/photo-1581132285926-a4c91a76ef14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGZhbnRhc3l8ZW58MXx8fHwxNzYxMTk2OTQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    season: "Fall",
    year: 2025,
    genres: ["Action", "Comedy"],
    themes: ["Isekai", "Reincarnation"],
  },
  {
    id: 6,
    rank: 6,
    title: "Blue Lock Season 3",
    members: 260000,
    imageUrl: "https://images.unsplash.com/photo-1755756383664-af3cf523242b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMHNjaG9vbHxlbnwxfHx8fDE3NjEyNDY2ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    season: "Fall",
    year: 2025,
    genres: ["Sports"],
    themes: ["Team Sports", "School"],
  },
];
