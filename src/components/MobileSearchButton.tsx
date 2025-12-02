import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { SearchBar } from './SearchBar';

export function MobileSearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Search Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
        aria-label="Search"
      >
        <Search className="size-5 text-[var(--text-primary)]" />
      </button>

      {/* Full-screen Search Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-[var(--bg-primary)] z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-[var(--card-border)]">
            <SearchBar isMobile onClose={() => setIsOpen(false)} />
            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
              aria-label="Close search"
            >
              <X className="size-5 text-[var(--text-primary)]" />
            </button>
          </div>

          {/* Optional: Recent searches or suggestions */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[var(--text-tertiary)] text-sm text-center mt-8">
              Type at least 3 characters to search
            </div>
          </div>
        </div>
      )}
    </>
  );
}
