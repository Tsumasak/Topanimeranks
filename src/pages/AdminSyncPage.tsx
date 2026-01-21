import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

export default function AdminSyncPage() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { message: 'Ready to sync. Click a season button to start.', type: 'info', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Ref for logs container to enable auto-scroll
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Detect theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const syncSeason = async (season: string, year: number) => {
    setSyncing(prev => ({ ...prev, [season]: true }));
    
    addLog(`Starting sync for ${season} ${year}...`, 'info');
    addLog('⚡ Fetching directly from Jikan API (10 pages max)...', 'info');
    
    try {
      const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
      const MAX_PAGES = 10; // ✅ Aumentado de 3 para 10 páginas (250 animes)
      
      // Fetch animes from Jikan API
      let allAnimes: any[] = [];
      for (let page = 1; page <= MAX_PAGES; page++) {
        addLog(`📄 Fetching page ${page}/${MAX_PAGES}...`, 'info');
        
        const url = `${JIKAN_BASE_URL}/seasons/${year}/${season}?page=${page}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          addLog(`❌ Erro ao buscar página ${page}: ${response.status}`, 'error');
          break;
        }
        
        const data = await response.json();
        
        if (!data || !data.data || data.data.length === 0) {
          addLog(`⚠️ No data for page ${page}, stopping`, 'warning');
          break;
        }
        
        allAnimes = allAnimes.concat(data.data);
        addLog(`✅ Page ${page}: ${data.data.length} animes. Total: ${allAnimes.length}`, 'success');
        
        // Rate limit delay (Jikan allows 3 req/sec)
        if (page < MAX_PAGES) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
      
      // Filter by 5k+ members
      const filtered = allAnimes.filter(anime => anime.members >= 5000);
      addLog(`✅ After filtering (5k+ members): ${filtered.length} animes`, 'success');
      
      if (filtered.length === 0) {
        addLog(`⚠️ No animes found with 5k+ members`, 'warning');
        return;
      }
      
      // ✅ CRITICAL FIX: Remove duplicates before sending to backend
      const uniqueAnimes = Array.from(
        new Map(filtered.map(anime => [anime.mal_id, anime])).values()
      );
      
      if (uniqueAnimes.length < filtered.length) {
        addLog(`⚠️ Removed ${filtered.length - uniqueAnimes.length} duplicate animes`, 'warning');
      }
      
      // Prepare data for Supabase
      const seasonAnimes = uniqueAnimes.map(anime => ({
        anime_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        image_url: anime.images?.jpg?.large_image_url,
        anime_score: anime.score,
        scored_by: anime.scored_by,
        members: anime.members,
        favorites: anime.favorites,
        popularity: anime.popularity,
        rank: anime.rank,
        type: anime.type,
        status: anime.status,
        rating: anime.rating,
        source: anime.source,
        episodes: anime.episodes,
        aired_from: anime.aired?.from,
        aired_to: anime.aired?.to,
        duration: anime.duration,
        demographics: anime.demographics || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        studios: anime.studios || [],
        synopsis: anime.synopsis,
        season: season,
        year: year,
      }));
      
      // Save to Supabase via edge function
      addLog(`💾 Saving ${seasonAnimes.length} animes to database...`, 'info');
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/save-season-batch`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          animes: seasonAnimes,
          season: season,
          year: year
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        addLog(`❌ Save failed: ${data.error}`, 'error');
        return;
      }
      
      addLog(`✅ COMPLETE: ${data.inserted} inserted, ${data.updated} updated`, 'success');
      
      // ✅ FETCH PICTURES: Now fetch pictures for all saved animes (in parallel batches)
      addLog(`\n🖼️ Fetching pictures for ${uniqueAnimes.length} animes...`, 'info');
      
      let picturesFetched = 0;
      let picturesSkipped = 0;
      
      // Helper: Fetch with retry on 429
      const fetchWithRetry = async (url: string, maxRetries = 3): Promise<Response> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const response = await fetch(url);
          
          if (response.status === 429) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff: 2s, 4s, 8s
            console.warn(`⏳ Rate limit hit for ${url}. Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          return response;
        }
        
        // Final attempt after all retries
        return await fetch(url);
      };
      
      // Process in batches of 2 to respect rate limit (more conservative)
      const PICTURES_BATCH_SIZE = 2; // Reduced from 3 to 2
      for (let i = 0; i < uniqueAnimes.length; i += PICTURES_BATCH_SIZE) {
        const batch = uniqueAnimes.slice(i, i + PICTURES_BATCH_SIZE);
        
        const promises = batch.map(async (anime) => {
          try {
            const picturesUrl = `https://api.jikan.moe/v4/anime/${anime.mal_id}/pictures`;
            const picturesResponse = await fetchWithRetry(picturesUrl);
            
            if (!picturesResponse.ok) {
              console.error(`❌ Failed to fetch pictures for ${anime.mal_id}: ${picturesResponse.status}`);
              return { success: false, anime_id: anime.mal_id, error: `HTTP ${picturesResponse.status}` };
            }
            
            const picturesData = await picturesResponse.json();
            
            if (picturesData && picturesData.data && Array.isArray(picturesData.data)) {
              const pictures = picturesData.data.map((p: any) => ({
                jpg: p.jpg,
                webp: p.webp,
              }));
              
              if (pictures.length === 0) {
                console.warn(`⚠️ Anime ${anime.mal_id} has empty pictures array`);
                return { success: false, anime_id: anime.mal_id, error: 'Empty pictures' };
              }
              
              // Update via backend
              const updateUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/update-anime-pictures`;
              const updateResponse = await fetch(updateUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  anime_id: anime.mal_id,
                  season,
                  year,
                  pictures
                })
              });
              
              if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.error(`❌ Failed to update pictures for ${anime.mal_id}:`, errorData);
                return { success: false, anime_id: anime.mal_id, error: errorData.error || 'Update failed' };
              }
              
              const updateData = await updateResponse.json();
              if (!updateData.success) {
                console.error(`❌ Backend returned error for ${anime.mal_id}:`, updateData);
                return { success: false, anime_id: anime.mal_id, error: updateData.error };
              }
              
              console.log(`✅ Pictures saved for ${anime.mal_id}: ${pictures.length} images`);
              return { success: true, anime_id: anime.mal_id };
            }
            
            console.warn(`⚠️ No pictures data for ${anime.mal_id}`);
            return { success: false, anime_id: anime.mal_id, error: 'No pictures data' };
          } catch (error) {
            console.error(`❌ Exception fetching pictures for ${anime.mal_id}:`, error);
            return { success: false, anime_id: anime.mal_id, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        });
        
        const results = await Promise.all(promises);
        picturesFetched += results.filter(r => r.success).length;
        picturesSkipped += results.filter(r => !r.success).length;
        
        if ((i + PICTURES_BATCH_SIZE) % 15 === 0) {
          addLog(`📸 Progress: ${Math.min(i + PICTURES_BATCH_SIZE, uniqueAnimes.length)}/${uniqueAnimes.length} animes (${picturesFetched} with pictures)`, 'info');
        }
        
        // Rate limiting: Wait 1.5s between batches (more conservative)
        if (i + PICTURES_BATCH_SIZE < uniqueAnimes.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      addLog(`✅ Pictures sync complete: ${picturesFetched} animes updated, ${picturesSkipped} skipped`, 'success');
      addLog(`📊 NOTE: Only ${MAX_PAGES} pages synced. Run again to sync more pages.`, 'warning');
      
    } catch (error) {
      addLog(`❌ FETCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSyncing(prev => ({ ...prev, [season]: false }));
    }
  };

  const populateWeeklyEpisodes = async (season: string, year: number) => {
    const key = `populate_${season}_${year}`;
    setSyncing(prev => ({ ...prev, [key]: true }));
    
    addLog(`🎬 Populating weekly_episodes for ${season} ${year}...`, 'info');
    
    try {
      // ✅ FIXED: Use sync-past-anime-data for past years (2023, 2024)
      // Use insert-weekly-episodes only for current season (Winter 2026)
      const currentYear = 2026;
      const currentSeason = 'winter';
      
      const isPastData = year < currentYear || (year === currentYear && season !== currentSeason);
      
      if (isPastData) {
        // Use sync-past-anime-data for historical data
        addLog(`📜 Using sync-past-anime-data for historical data (${season} ${year})...`, 'warning');
        
        const url = `https://${projectId}.supabase.co/functions/v1/sync-past-anime-data/${season}/${year}?key=sync2025&mode=episodes`;
        
        addLog(`📡 Calling sync-past-anime-data with mode=episodes...`, 'info');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const contentType = response.headers.get('content-type');
        addLog(`Response status: ${response.status}`, 'info');
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          addLog(`❌ Response is not JSON. First 200 chars: ${text.substring(0, 200)}`, 'error');
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          addLog(`✅ SUCCESS: Episodes synced for ${season} ${year}!`, 'success');
          addLog(`📊 Animes Processed: ${data.animesProcessed || 0}`, 'success');
          addLog(`📊 Episodes Inserted: ${data.episodesInserted || 0}`, 'success');
          addLog(`📊 Episodes Updated: ${data.episodesUpdated || 0}`, 'success');
        } else {
          addLog(`❌ ERROR: ${data.error || 'Unknown error'}`, 'error');
        }
      } else {
        // Use insert-weekly-episodes for current season only
        addLog(`⏳ Calling insert-weekly-episodes for current season...`, 'warning');
        
        const url = `https://${projectId}.supabase.co/functions/v1/insert-weekly-episodes`;
        
        addLog('📡 Calling insert-weekly-episodes...', 'info');
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Empty body - function will auto-detect current week
          })
        });
        
        const contentType = response.headers.get('content-type');
        addLog(`Response status: ${response.status}`, 'info');
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          addLog(`❌ Response is not JSON. First 200 chars: ${text.substring(0, 200)}`, 'error');
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          addLog(`✅ SUCCESS: Weekly episodes inserted!`, 'success');
          addLog(`📊 Total Inserted: ${data.totalItemsCreated || 0}`, 'success');
          addLog(`📅 Weeks Processed: ${data.weeksProcessed?.join(', ') || 'None'}`, 'info');
        } else {
          addLog(`❌ ERROR: ${data.error || 'Unknown error'}`, 'error');
        }
      }
      
    } catch (error) {
      addLog(`❌ FETCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSyncing(prev => ({ ...prev, [key]: false }));
    }
  };

  // ============================================
  // SYNC ALL SEASONS FOR A FULL YEAR
  // ============================================
  const syncFullYear = async (year: number) => {
    const key = `sync_year_${year}`;
    setSyncing(prev => ({ ...prev, [key]: true }));
    
    addLog(`\n🎯 Starting FULL YEAR sync for ${year}...`, 'info');
    addLog(`📅 Will sync 4 seasons: Winter, Spring, Summer, Fall`, 'info');
    
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    
    for (const season of seasons) {
      addLog(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
      addLog(`📊 Syncing ${season.toUpperCase()} ${year}...`, 'info');
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
      
      await syncSeason(season, year);
      
      // Delay between seasons to avoid rate limiting (5 seconds)
      if (season !== 'fall') {
        addLog(`⏳ Waiting 5 seconds before next season...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    addLog(`\n🎉 FULL YEAR SYNC COMPLETE for ${year}!`, 'success');
    setSyncing(prev => ({ ...prev, [key]: false }));
  };

  // ============================================
  // POPULATE WEEKLY EPISODES FOR A FULL YEAR
  // ============================================
  const populateFullYear = async (year: number) => {
    const key = `populate_year_${year}`;
    setSyncing(prev => ({ ...prev, [key]: true }));
    
    addLog(`\n🎯 Starting FULL YEAR episode population for ${year}...`, 'info');
    addLog(`📅 Will populate 4 seasons: Winter, Spring, Summer, Fall`, 'info');
    
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    
    for (const season of seasons) {
      addLog(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
      addLog(`🎬 Populating ${season.toUpperCase()} ${year}...`, 'info');
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
      
      await populateWeeklyEpisodes(season, year);
      
      // Delay between seasons
      if (season !== 'fall') {
        addLog(`⏳ Waiting 2 seconds before next season...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    addLog(`\n🎉 FULL YEAR POPULATION COMPLETE for ${year}!`, 'success');
    setSyncing(prev => ({ ...prev, [key]: false }));
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return isDark ? 'text-green-400' : 'text-green-600';
      case 'error': return isDark ? 'text-red-400' : 'text-red-600';
      case 'warning': return isDark ? 'text-orange-400' : 'text-orange-600';
      default: return isDark ? 'text-blue-400' : 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[700px] w-full">
        <h1 className="text-gray-900 dark:text-gray-100 mb-2.5 text-[28px]">🔄 Sync Seasons</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-7 text-[14px]">Populate episodes and rankings from seasons</p>
        
        {/* Sync Season Rankings Buttons */}
        <div className="mb-4">
          <h2 className="text-gray-800 dark:text-gray-200 text-[18px] font-semibold mb-3">📊 Sync Season Rankings</h2>
          
          {/* Current Season (2025/2026) */}
          <div className="mb-3">
            <p className="text-gray-600 dark:text-gray-400 text-[13px] mb-2">Current Season</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[15px]">
              <button
                onClick={() => syncSeason('fall', 2025)}
                disabled={syncing.fall}
                className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.fall ? '⏳ Syncing...' : '🍂 Fall 2025'}
              </button>
              
              <button
                onClick={() => syncSeason('winter', 2026)}
                disabled={syncing.winter}
                className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.winter ? '⏳ Syncing...' : '❄️ Winter 2026'}
              </button>
            </div>
          </div>

          {/* Full Year Sync */}
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-[13px] mb-2">Full Year Sync (4 seasons)</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[15px]">
              <button
                onClick={() => syncFullYear(2024)}
                disabled={syncing.sync_year_2024}
                className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(16,185,129,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.sync_year_2024 ? '⏳ Syncing...' : '📅 2024'}
              </button>
              
              <button
                onClick={() => syncFullYear(2023)}
                disabled={syncing.sync_year_2023}
                className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(16,185,129,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.sync_year_2023 ? '⏳ Syncing...' : '📅 2023'}
              </button>
            </div>
          </div>
        </div>

        {/* Populate Weekly Episodes Buttons */}
        <div className="mb-7">
          <h2 className="text-gray-800 dark:text-gray-200 text-[18px] font-semibold mb-3">🎬 Populate Weekly Episodes</h2>
          
          {/* Current Season (2025/2026) */}
          <div className="mb-3">
            <p className="text-gray-600 dark:text-gray-400 text-[13px] mb-2">Current Season</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[15px]">
              <button
                onClick={() => populateWeeklyEpisodes('fall', 2025)}
                disabled={syncing.populate_fall_2025}
                className="bg-gradient-to-br from-[#f59e0b] to-[#ef4444] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(245,158,11,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.populate_fall_2025 ? '⏳ Populating...' : '🎬 Fall 2025'}
              </button>
              
              <button
                onClick={() => populateWeeklyEpisodes('winter', 2026)}
                disabled={syncing.populate_winter_2026}
                className="bg-gradient-to-br from-[#f59e0b] to-[#ef4444] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(245,158,11,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.populate_winter_2026 ? '⏳ Populating...' : '🎬 Winter 2026'}
              </button>
            </div>
          </div>

          {/* Full Year Population */}
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-[13px] mb-2">Full Year Population (4 seasons)</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[15px]">
              <button
                onClick={() => populateFullYear(2024)}
                disabled={syncing.populate_year_2024}
                className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(139,92,246,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.populate_year_2024 ? '⏳ Populating...' : '📅 2024'}
              </button>
              
              <button
                onClick={() => populateFullYear(2023)}
                disabled={syncing.populate_year_2023}
                className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(139,92,246,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.6)] active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing.populate_year_2023 ? '⏳ Populating...' : '📅 2023'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-5 max-h-[400px] overflow-y-auto font-['Courier_New',monospace] text-[13px] leading-relaxed">
          {logs.map((log, index) => (
            <div key={index} className={`mb-2 pb-1.5 border-b border-gray-300 dark:border-gray-700 last:border-b-0 ${getLogColor(log.type)} font-semibold`}>
              [{log.timestamp}] {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}