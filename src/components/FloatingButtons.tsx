import { Instagram, ArrowUp, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { CacheService } from "../services/cache";

export function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show scroll-to-top button after scrolling 300px
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const clearCache = () => {
    if (window.confirm('Clear all anime cache? This will reload fresh data from the API.')) {
      setIsClearing(true);
      CacheService.clear(); // Clear all anime-related cache
      
      // Show feedback and reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
      {/* Top row: Scroll to Top + Instagram */}
      <div className="flex items-center gap-3">
        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`scroll-to-top-button flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
            showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="w-6 h-6 text-white" />
        </button>

        {/* Instagram Button */}
        <a
          href="https://instagram.com/topanimeranks"
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-button flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110"
          aria-label="Follow us on Instagram"
          title="Follow @topanimeranks on Instagram"
        >
          <Instagram className="w-6 h-6 text-white" />
        </a>
      </div>

      {/* Bottom row: Clear Cache Button */}
      <button
        onClick={clearCache}
        disabled={isClearing}
        className="clear-cache-button flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50"
        aria-label="Clear cache"
        title="Clear cache and reload"
      >
        <RotateCcw className={`w-5 h-5 text-white ${isClearing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
