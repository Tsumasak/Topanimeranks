const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export class CacheService {
  static set<T>(key: string, data: T): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
      console.log(`[Cache] Saved: ${key}`);
    } catch (error) {
      console.warn('[Cache] Failed to save to cache:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        console.log(`[Cache] Miss: ${key}`);
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(item);
      const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;

      if (isExpired) {
        console.log(`[Cache] Expired: ${key}`);
        localStorage.removeItem(key);
        return null;
      }

      const ageInHours = ((Date.now() - cacheItem.timestamp) / (1000 * 60 * 60)).toFixed(1);
      console.log(`[Cache] Hit: ${key} (age: ${ageInHours}h)`);
      return cacheItem.data;
    } catch (error) {
      console.warn('[Cache] Failed to read from cache:', error);
      return null;
    }
  }

  static clear(key?: string): void {
    try {
      if (key) {
        localStorage.removeItem(key);
        console.log(`[Cache] Cleared: ${key}`);
      } else {
        // Clear all anime-related cache (all versions)
        const keys = Object.keys(localStorage);
        let clearedCount = 0;
        keys.forEach(k => {
          if (k.startsWith('v') || k.startsWith('jikan_') || k.startsWith('anime_')) {
            localStorage.removeItem(k);
            clearedCount++;
          }
        });
        console.log(`[Cache] Cleared ${clearedCount} anime-related items`);
      }
    } catch (error) {
      console.warn('[Cache] Failed to clear cache:', error);
    }
  }

  static clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }
}
