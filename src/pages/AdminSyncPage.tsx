import { useState, useEffect } from 'react';
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
    addLog('This may take 5-15 minutes. Please wait...', 'warning');
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/sync-season/${season}/${year}`;
      
      addLog('Making request to server...', 'info');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      addLog(`Response status: ${response.status}`, 'info');
      addLog(`Response Content-Type: ${contentType}`, 'info');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        addLog(`❌ Response is not JSON. First 200 chars: ${text.substring(0, 200)}`, 'error');
        return;
      }
      
      // Parse JSON
      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ SUCCESS: ${season} ${year} sync completed!`, 'success');
        addLog(`Total Found: ${data.total || 0}`, 'info');
        addLog(`✅ Inserted: ${data.inserted || 0}`, 'success');
        addLog(`🔄 Updated: ${data.updated || 0}`, 'success');
        addLog(`⏭️  Skipped: ${data.skipped || 0}`, 'warning');
        addLog(`🗑️  Deleted: ${data.deleted || 0}`, data.deleted > 0 ? 'warning' : 'info');
        addLog(`❌ Errors: ${data.errors || 0}`, data.errors > 0 ? 'error' : 'info');
      } else {
        addLog(`❌ ERROR: ${data.error || 'Unknown error'}`, 'error');
      }
      
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
    addLog('⏳ This will fetch and insert ALL episodes. May take 15-30 minutes...', 'warning');
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/populate-season?season=${season}&year=${year}&key=populate123`;
      
      addLog('📡 Calling populate endpoint...', 'info');
      
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
        addLog(`✅ SUCCESS: Weekly episodes populated!`, 'success');
        addLog(`📊 Episodes Inserted: ${data.episodesInserted || 0}`, 'success');
        addLog(`📅 Weeks Processed: ${data.weeksProcessed?.join(', ') || 'None'}`, 'info');
        addLog(`🎬 Season: ${data.season} ${data.year}`, 'info');
      } else {
        addLog(`❌ ERROR: ${data.error || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      addLog(`❌ FETCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSyncing(prev => ({ ...prev, [key]: false }));
    }
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

        {/* Populate Weekly Episodes Buttons */}
        <div className="mb-7">
          <h2 className="text-gray-800 dark:text-gray-200 text-[18px] font-semibold mb-3">🎬 Populate Weekly Episodes</h2>
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
        
        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-5 max-h-[400px] overflow-y-auto font-['Courier_New',monospace] text-[13px] leading-relaxed">
          {logs.map((log, index) => (
            <div key={index} className={`mb-2 pb-1.5 border-b border-gray-300 dark:border-gray-700 last:border-b-0 ${getLogColor(log.type)} font-semibold`}>
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}