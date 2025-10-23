import { Menu, X, Sun, Moon, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { CacheService } from "../services/cache";
import { toast } from "sonner@2.0.3";

interface HeaderProps {
  onThemeToggle?: () => void;
  theme?: string;
  currentPage?: 'ranks' | 'anticipated';
  onPageChange?: (page: 'ranks' | 'anticipated') => void;
}

export function Header({ onThemeToggle, theme, currentPage = 'ranks', onPageChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleClearCache = () => {
    CacheService.clear();
    toast.success('Cache cleared successfully! Refresh the page to load fresh data.');
    closeMobileMenu();
  };

  const getTooltip = () => {
    return theme === 'dark'
      ? 'Switch to light theme'
      : 'Switch to dark theme';
  };

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
      <header className="theme-header">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => onPageChange?.('ranks')}
            className="text-xl theme-nav-link"
          >
            Anime Ranks
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="space-x-4">
              <button 
                onClick={() => onPageChange?.('ranks')}
                className={`theme-nav-link transition-colors ${currentPage === 'ranks' ? 'font-bold' : ''}`}
              >
                Top Episodes
              </button>
              <button 
                onClick={() => onPageChange?.('anticipated')}
                className={`theme-nav-link transition-colors ${currentPage === 'anticipated' ? 'font-bold' : ''}`}
              >
                Most Anticipated
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
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden mobile-menu-container">
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
            📺 Top Episodes
          </button>
          <button 
            onClick={() => {
              onPageChange?.('anticipated');
              closeMobileMenu();
            }}
            className={`mobile-menu-link ${currentPage === 'anticipated' ? 'font-bold' : ''}`}
          >
            ⭐ Most Anticipated
          </button>
          
          <div className="mobile-menu-divider"></div>
          
          <button 
            onClick={handleClearCache}
            className="mobile-menu-link"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Clear Cache
            </span>
          </button>
        </nav>
        
        <div className="mobile-menu-footer">
          <button
            onClick={() => {
              onThemeToggle?.();
            }}
            className="mobile-menu-button theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
