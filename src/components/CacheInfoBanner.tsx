import { Info, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function CacheInfoBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('cache-info-dismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('cache-info-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      className="relative w-full px-6 py-4 mb-6 rounded-lg border-2"
      style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <Info className="h-6 w-6 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              Loading from MyAnimeList API
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Slow Mode
            </span>
          </div>
          
          <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
            Your database is empty, so data is being fetched directly from the MyAnimeList API (slower). 
            To enable <strong className="text-blue-400">instant loading ⚡</strong>, you need to populate the Supabase database.
          </p>
          
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/📊_COMO_POPULAR_O_BANCO.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: 'var(--foreground)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
              }}
            >
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm">How to Enable Fast Mode</span>
            </a>
            
            <button
              onClick={handleDismiss}
              className="text-sm px-3 py-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--foreground)', opacity: 0.6 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
