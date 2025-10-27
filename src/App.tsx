import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import TopEpisodesPage from "./pages/TopEpisodesPage";
import MostAnticipatedPage from "./pages/MostAnticipatedPage";
import { MissingEpisodesPage } from "./pages/MissingEpisodesPage";
import SetupPage from "./pages/SetupPage";
import { FloatingButtons } from "./components/FloatingButtons";
import { Toaster } from "./components/ui/sonner";
import { SetupRequiredBanner } from "./components/SetupRequiredBanner";
import { useSupabaseStatus } from "./hooks/useSupabaseStatus";

function AppContent() {
  const [theme, setTheme] = useState("dark");
  const location = useLocation();
  const navigate = useNavigate();
  const { needsSetup, loading: statusLoading } = useSupabaseStatus();
  
  console.log("[AppContent] Current location:", location.pathname);
  console.log("[AppContent] Needs setup:", needsSetup);
  
  const currentPage: 'home' | 'ranks' | 'anticipated' = 
    location.pathname === '/home' ? 'home' :
    location.pathname === '/most-anticipated-animes' ? 'anticipated' : 'ranks';
  
  const isSetupPage = location.pathname === '/setup';
  const showSetupBanner = needsSetup && !isSetupPage && !statusLoading;

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    // Scroll to top when page changes
    window.scrollTo(0, 0);

    // Update dynamic background based on first anime card image
    const updateBackground = () => {
      const firstAnimeCard = document.querySelector('.anime-card-image img') as HTMLImageElement;
      if (firstAnimeCard && firstAnimeCard.src) {
        document.documentElement.style.setProperty('--bg-image', `url(${firstAnimeCard.src})`);
      }
    };

    // Initial update
    const timer = setTimeout(updateBackground, 500);

    // Update when images load
    const observer = new MutationObserver(updateBackground);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handlePageChange = (page: 'home' | 'ranks' | 'anticipated') => {
    if (page === 'home') {
      navigate('/home');
    } else if (page === 'anticipated') {
      navigate('/most-anticipated-animes');
    } else {
      navigate('/ranks');
    }
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
    <div className="dynamic-background min-h-screen">
      <Header 
        onThemeToggle={toggleTheme} 
        theme={theme} 
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Setup Required Banner - shows on all pages except /setup when tables don't exist */}
      {showSetupBanner && <SetupRequiredBanner />}

      <div className={`dynamic-background-content ${showSetupBanner ? 'pt-44' : 'pt-20'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/ranks" element={<TopEpisodesPage />} />
          <Route path="/most-anticipated-animes" element={<MostAnticipatedPage />} />
          <Route path="/missing-episodes" element={<MissingEpisodesPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>

      <FloatingButtons />
      <Toaster theme={theme as "light" | "dark"} />
    </div>
  );
}

export default function App() {
  console.log("[App] Rendering App component");
  
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
