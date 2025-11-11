import { Instagram, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

export function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
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
        href="https://www.instagram.com/topanimeranks"
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-button flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110"
        aria-label="Follow us on Instagram"
        title="Follow @topanimeranks on Instagram"
      >
        <Instagram className="w-6 h-6 text-white" />
      </a>
    </div>
  );
}
