import { useState } from 'react';
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

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const syncSeason = async (season: string, year: number) => {
    setSyncing(prev => ({ ...prev, [season]: true }));
    
    addLog(`Starting sync for ${season} ${year}...`, 'info');
    addLog('This may take 5-15 minutes. Please wait...', 'warning');
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/server/make-server-c1d1bfd8/sync-past/${season}/${year}?key=sync2025`;
      
      addLog('Making request to server...', 'info');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ SUCCESS: ${data.message}`, 'success');
        addLog(`Total Animes: ${data.totalAnimes}`, 'success');
        addLog(`Total Episodes: ${data.totalEpisodes}`, 'success');
        addLog(`Inserted Episodes: ${data.insertedEpisodes}`, 'success');
      } else {
        addLog(`❌ ERROR: ${data.error || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      addLog(`❌ FETCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSyncing(prev => ({ ...prev, [season]: false }));
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="bg-white rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[600px] w-full">
        <h1 className="text-[#333] mb-2.5 text-[28px]">🔄 Sync Past Seasons</h1>
        <p className="text-[#666] mb-7 text-[14px]">Populate episodes from 2025 seasons (Winter, Spring, Summer)</p>
        
        <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[15px] mb-7">
          <button
            onClick={() => syncSeason('winter', 2025)}
            disabled={syncing.winter}
            className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.6)] active:translate-y-0 disabled:bg-[#ccc] disabled:cursor-not-allowed disabled:shadow-none"
          >
            {syncing.winter ? '⏳ Syncing...' : '❄️ Winter 2025'}
          </button>
          
          <button
            onClick={() => syncSeason('spring', 2025)}
            disabled={syncing.spring}
            className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.6)] active:translate-y-0 disabled:bg-[#ccc] disabled:cursor-not-allowed disabled:shadow-none"
          >
            {syncing.spring ? '⏳ Syncing...' : '🌸 Spring 2025'}
          </button>
          
          <button
            onClick={() => syncSeason('summer', 2025)}
            disabled={syncing.summer}
            className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.6)] active:translate-y-0 disabled:bg-[#ccc] disabled:cursor-not-allowed disabled:shadow-none"
          >
            {syncing.summer ? '⏳ Syncing...' : '☀️ Summer 2025'}
          </button>
        </div>
        
        <div className="bg-[#f5f5f5] rounded-xl p-5 max-h-[400px] overflow-y-auto font-['Courier_New',monospace] text-[13px] leading-relaxed text-[#333]">
          {logs.map((log, index) => (
            <div key={index} className={`mb-2 pb-1.5 border-b border-[#e0e0e0] last:border-b-0 ${getLogColor(log.type)} font-semibold`}>
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
