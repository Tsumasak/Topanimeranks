import { useState } from 'react';
import { Trash2, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { CacheService } from '../services/cache';

interface CacheClearerProps {
  weekNumber?: number; // If provided, shows clear button for specific week
  compact?: boolean;
}

export function CacheClearer({ weekNumber, compact = false }: CacheClearerProps) {
  const [cleared, setCleared] = useState(false);

  const handleClearCache = () => {
    if (weekNumber) {
      // Clear specific week cache
      const cacheKeys = [
        `v7_manual_episodes_anime_week_${weekNumber}`,
        `v6_anime_week_${weekNumber}`, // Old version
      ];
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`[Cache] Cleared cache for Week ${weekNumber}`);
    } else {
      // Clear all cache
      CacheService.clearAll();
      console.log('[Cache] Cleared all cache');
    }
    
    setCleared(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (compact) {
    return (
      <Button
        onClick={handleClearCache}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={cleared}
      >
        {cleared ? (
          <>
            <CheckCircle size={16} />
            Reloading...
          </>
        ) : (
          <>
            <Trash2 size={16} />
            Clear Cache
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleClearCache}
        variant="outline"
        className="gap-2 shadow-lg"
        disabled={cleared}
      >
        {cleared ? (
          <>
            <CheckCircle size={16} />
            Cache Cleared! Reloading...
          </>
        ) : (
          <>
            <Trash2 size={16} />
            {weekNumber ? `Clear Week ${weekNumber} Cache` : 'Clear All Cache'}
          </>
        )}
      </Button>
    </div>
  );
}
