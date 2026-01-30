import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import Union from "../imports/Union";
import { SearchBar } from "./SearchBar";
import { MobileSearchButton } from "./MobileSearchButton";

interface HeaderProps {
  onThemeToggle?: () => void;
  theme?: string;
  currentPage?: 'home' | 'ranks' | 'anticipated' | 'season';
  onPageChange?: (page: 'home' | 'ranks' | 'anticipated' | 'season') => void;
}

export function Header({ onThemeToggle, theme, currentPage = 'ranks', onPageChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isMobileGenresOpen, setIsMobileGenresOpen] = useState(false);
  const navigate = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getTooltip = () => {
    return theme === 'dark'
      ? 'Switch to light theme'
      : 'Switch to dark theme';
  };

  // Genre data sorted by anime count
  const genres = [
    { name: 'Fantasy', count: 408, path: '/ranks/fantasy' },
    { name: 'Action', count: 369, path: '/ranks/action' },
    { name: 'Comedy', count: 296, path: '/ranks/comedy' },
    { name: 'Adventure', count: 226, path: '/ranks/adventure' },
    { name: 'Romance', count: 197, path: '/ranks/romance' },
    { name: 'Drama', count: 167, path: '/ranks/drama' },
    { name: 'Sci-Fi', count: 117, path: '/ranks/sci-fi' },
    { name: 'Supernatural', count: 99, path: '/ranks/supernatural' },
    { name: 'Mystery', count: 72, path: '/ranks/mystery' },
    { name: 'Suspense', count: 47, path: '/ranks/suspense' },
    { name: 'Slice of Life', count: 43, path: '/ranks/slice-of-life' },
    { name: 'Sports', count: 38, path: '/ranks/sports' },
    { name: 'Horror', count: 19, path: '/ranks/horror' },
  ];

  // Split genres into two columns: first 7 and last 6
  const leftColumnGenres = genres.slice(0, 7);
  const rightColumnGenres = genres.slice(7);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="theme-header fixed top-0 left-0 right-0 z-50">
        <nav className="container mx-auto flex justify-between items-center px-[24px] py-[16px]">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center justify-start logo-button hover:opacity-80 transition-opacity outline-none focus:outline-none"
          >
            <div className="h-[40px] md:h-[50px]">
              <Union />
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onPageChange?.('ranks')}
                className="theme-nav-link transition-colors outline-none focus:outline-none"
              >
                Weekly Anime Episodes
              </button>
              <div className="h-5 w-px opacity-30" style={{ backgroundColor: 'var(--foreground)' }} />
              <button 
                onClick={() => onPageChange?.('season')}
                className="theme-nav-link transition-colors outline-none focus:outline-none"
              >
                Top Animes
              </button>
              <div className="h-5 w-px opacity-30" style={{ backgroundColor: 'var(--foreground)' }} />
              
              {/* Anime Genres Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsGenreDropdownOpen(true)}
                onMouseLeave={() => setIsGenreDropdownOpen(false)}
              >
                <button 
                  className="theme-nav-link transition-colors flex items-center gap-1 h-full py-4 outline-none focus:outline-none"
                >
                  Anime Genres
                </button>
                
                {/* Dropdown Menu */}
                {isGenreDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 rounded-lg shadow-xl border overflow-hidden"
                    style={{
                      backgroundColor: 'var(--card-background)',
                      borderColor: 'var(--card-border)',
                      minWidth: '400px',
                      zIndex: 9999,
                    }}
                  >
                    <div className="grid grid-cols-2 gap-2 p-4">
                      {/* Left Column (7 genres) */}
                      <div className="space-y-1">
                        {leftColumnGenres.map((genre) => (
                          <button
                            key={genre.name}
                            onClick={() => {
                              navigate(genre.path);
                              setIsGenreDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-yellow-500/20 text-sm outline-none focus:outline-none"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {genre.name} <span className="opacity-50">({genre.count})</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Right Column (6 genres) */}
                      <div className="space-y-1">
                        {rightColumnGenres.map((genre) => (
                          <button
                            key={genre.name}
                            onClick={() => {
                              navigate(genre.path);
                              setIsGenreDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-yellow-500/20 text-sm outline-none focus:outline-none"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {genre.name} <span className="opacity-50">({genre.count})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="h-5 w-px opacity-30" style={{ backgroundColor: 'var(--foreground)' }} />
              <button 
                onClick={() => onPageChange?.('anticipated')}
                className="theme-nav-link transition-colors outline-none focus:outline-none"
              >
                Most Anticipated Animes
              </button>
            </div>
            <button
              onClick={onThemeToggle}
              className="theme-toggle flex items-center justify-center w-10 h-10 rounded-md"
              title={getTooltip()}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            {/* Search Bar - moved to the right */}
            <div className="w-80">
              <SearchBar />
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden mobile-menu-container flex items-center gap-2">
            {/* Mobile Search Button */}
            <MobileSearchButton />
            
            <button
              onClick={toggleMobileMenu}
              className="theme-toggle flex items-center justify-center w-10 h-10 rounded-md"
              aria-label="Toggle mobile menu"
            >
              <div className="hamburger-icon">
                <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}></div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''} mobile-menu-container`}>
        <div className="mobile-menu-header">
          <h3 className="text-lg" style={{color: 'var(--foreground)'}}>Menu</h3>
          <button
            onClick={closeMobileMenu}
            className="close-button"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        
        <nav className="mobile-menu-nav">
          <button 
            onClick={() => {
              onPageChange?.('ranks');
              closeMobileMenu();
            }}
            className={`mobile-menu-link ${currentPage === 'ranks' ? 'font-bold' : ''}`}
          >
            📺 Weekly Anime Episodes
          </button>
          <button 
            onClick={() => {
              onPageChange?.('season');
              closeMobileMenu();
            }}
            className={`mobile-menu-link ${currentPage === 'season' ? 'font-bold' : ''}`}
          >
            🏆 Top Season Animes
          </button>
          
          {/* Anime Genres Section */}
          <button 
            onClick={() => setIsMobileGenresOpen(!isMobileGenresOpen)}
            className="mobile-menu-link flex items-center justify-between"
          >
            <span>🎭 Anime Genres</span>
          </button>
          
          {/* Genres Sub-menu */}
          {isMobileGenresOpen && (
            <div className="pl-6 space-y-1 py-2">
              {genres.map((genre) => (
                <button
                  key={genre.name}
                  onClick={() => {
                    navigate(genre.path);
                    closeMobileMenu();
                  }}
                  className="mobile-menu-link text-sm opacity-80"
                  style={{ color: 'var(--foreground)' }}
                >
                  {genre.name} <span className="opacity-50">({genre.count})</span>
                </button>
              ))}
            </div>
          )}
          
          <button 
            onClick={() => {
              onPageChange?.('anticipated');
              closeMobileMenu();
            }}
            className={`mobile-menu-link ${currentPage === 'anticipated' ? 'font-bold' : ''}`}
          >
            ⭐ Most Anticipated Animes
          </button>
        </nav>
        
        <div className="mobile-menu-footer">
          <div className="flex items-center justify-between px-[24px]">
            <a 
              href="https://www.instagram.com/topanimeranks" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            
            <a 
              href="https://x.com/topanimeranks" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="X (Twitter)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            
            <a 
              href="https://www.threads.com/@topanimeranks" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Threads"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 192 192">
                <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/>
              </svg>
            </a>
            
            <div className="h-5 w-px bg-current opacity-30" />
            
            <button
              onClick={() => {
                onThemeToggle?.();
              }}
              className="flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}