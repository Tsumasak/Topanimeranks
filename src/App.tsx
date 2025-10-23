import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import WeekControl from "./components/WeekControl";
import SeasonControl from "./components/SeasonControl";
import { FloatingButtons } from "./components/FloatingButtons";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [currentPage, setCurrentPage] = useState<'ranks' | 'anticipated'>('ranks');

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handlePageChange = (page: 'ranks' | 'anticipated') => {
    setCurrentPage(page);
  };

  /* const animeData: Anime[] = [
    {
      id: 1,
      rank: 1,
      title: "Attack on Titan: The Final Season",
      subtitle: "TV | 87 Episodes | 2023",
      rating: 9.2,
      imageUrl: "https://images.unsplash.com/photo-1709675577960-0b1e7ba55347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdHRhY2slMjB0aXRhbiUyMGFuaW1lfGVufDF8fHx8MTc2MTI0NDQyOXww&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Action", "Drama"],
      themes: ["Military", "Survival"],
      positionChange: 2,
    },
    {
      id: 2,
      rank: 2,
      title: "Demon Slayer: Kimetsu no Yaiba",
      subtitle: "TV | 63 Episodes | 2023",
      rating: 9.0,
      imageUrl: "https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW1vbiUyMHNsYXllciUyMGFuaW1lfGVufDF8fHx8MTc2MTIxODY0NXww&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Action", "Fantasy"],
      themes: ["Historical", "Demons"],
      positionChange: -1,
    },
    {
      id: 3,
      rank: 3,
      title: "One Piece",
      subtitle: "TV | 1000+ Episodes | 2023",
      rating: 8.9,
      imageUrl: "https://images.unsplash.com/photo-1667419674822-1a9195436f1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmUlMjBwaWVjZSUyMGFuaW1lfGVufDF8fHx8MTc2MTIwMjA2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Adventure", "Fantasy"],
      themes: ["Pirates"],
      positionChange: 0,
    },
    {
      id: 4,
      rank: 4,
      title: "Naruto Shippuden",
      subtitle: "TV | 500 Episodes | 2017",
      rating: 8.8,
      imageUrl: "https://images.unsplash.com/photo-1594007759138-855170ec8dc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXJ1dG8lMjBhbmltZXxlbnwxfHx8fDE3NjEyMDIwNjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Action", "Adventure"],
      themes: ["Martial Arts"],
      positionChange: 3,
    },
    {
      id: 5,
      rank: 5,
      title: "My Hero Academia Season 6",
      subtitle: "TV | 138 Episodes | 2023",
      rating: 8.7,
      imageUrl: "https://images.unsplash.com/photo-1668119064420-fb738fb05e32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteSUyMGhlcm8lMjBhY2FkZW1pYXxlbnwxfHx8fDE3NjEyNDQ0Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Action"],
      themes: ["School", "Super Power"],
      positionChange: -2,
    },
    {
      id: 6,
      rank: 6,
      title: "Jujutsu Kaisen",
      subtitle: "TV | 47 Episodes | 2023",
      rating: 8.8,
      imageUrl: "https://images.unsplash.com/photo-1668119064420-fb738fb05e32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGNoYXJhY3RlcnxlbnwxfHx8fDE3NjExNTA1MzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Action", "Fantasy"],
      themes: ["School"],
      positionChange: 1,
    },
    {
      id: 7,
      rank: 7,
      title: "Fullmetal Alchemist: Brotherhood",
      subtitle: "TV | 64 Episodes | 2010",
      rating: 9.3,
      imageUrl: "https://images.unsplash.com/photo-1594007759138-855170ec8dc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXJ1dG8lMjBhbmltZXxlbnwxfHx8fDE3NjEyMDIwNjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Action", "Fantasy"],
      themes: ["Military"],
      positionChange: undefined,
    },
    {
      id: 8,
      rank: 8,
      title: "Death Note",
      subtitle: "TV | 37 Episodes | 2007",
      rating: 9.0,
      imageUrl: "https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW1vbiUyMHNsYXllciUyMGFuaW1lfGVufDF8fHx8MTc2MTIxODY0NXww&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Mystery", "Thriller"],
      themes: ["Psychological"],
      positionChange: 0,
    },
    {
      id: 9,
      rank: 9,
      title: "Hunter x Hunter",
      subtitle: "TV | 148 Episodes | 2014",
      rating: 9.1,
      imageUrl: "https://images.unsplash.com/photo-1667419674822-1a9195436f1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmUlMjBwaWVjZSUyMGFuaW1lfGVufDF8fHx8MTc2MTIwMjA2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      animeType: "TV",
      demographics: ["Shounen"],
      genres: ["Action", "Adventure"],
      themes: ["Super Power"],
      positionChange: -3,
    },
  ]; */

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Header 
        onThemeToggle={toggleTheme} 
        theme={theme} 
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {currentPage === 'ranks' ? <WeekControl /> : <SeasonControl />}

      <FloatingButtons />
      <Toaster theme={theme as "light" | "dark"} />

      {/* Footer */}
      <footer className="theme-card border-t mt-16" style={{ borderColor: 'var(--card-border)' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl mb-4">Top Anime Ranks</h3>
              <p className="opacity-70">
                Your ultimate destination for discovering and ranking the best
                anime series of all time.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-4">Quick Links</h3>
              <ul className="space-y-2 opacity-70">
                <li>
                  <a href="#" className="theme-nav-link">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="theme-nav-link">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="theme-nav-link">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="theme-nav-link">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 theme-rating rounded-full flex items-center justify-center hover:theme-card-hover transition-colors"
                >
                  <span className="text-xl">𝕏</span>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 theme-rating rounded-full flex items-center justify-center hover:theme-card-hover transition-colors"
                >
                  <span className="text-xl">📘</span>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 theme-rating rounded-full flex items-center justify-center hover:theme-card-hover transition-colors"
                >
                  <span className="text-xl">📷</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 text-center opacity-70" style={{ borderColor: 'var(--card-border)' }}>
            <p>© 2025 Top Anime Ranks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
