import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

export default function AdminCharactersSyncPage() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { message: 'Ready to sync characters. Choose an option to start.', type: 'info', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [customAnimeId, setCustomAnimeId] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('winter');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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

  const syncCharacters = async (mode: 'id' | 'season', animeId?: string, season?: string, year?: number) => {
    const key = mode === 'id' ? `sync_chars_id` : `sync_chars_season`;
    if (!animeId && mode === 'id') {
      addLog(`❌ Por favor, digite o ID do Anime`, 'error');
      return;
    }
    if (mode === 'season' && (!season || !year)) {
      addLog(`❌ Selecione season e ano`, 'error');
      return;
    }
    
    setSyncing(prev => ({ ...prev, [key]: true }));
    addLog(`\n👥 Forçando Fila de Personagens (${mode === 'id' ? `Anime ${animeId}` : `${season} ${year}`})...`, 'info');
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/sync-anime-characters`;
      let continueSyncing = true;
      let totalProcessed = 0;
      let totalCreated = 0;
      
      addLog(`\n👥 Forçando Fila de Personagens (${mode === 'id' ? `Anime ${animeId}` : `${season} ${year}`})...`, 'info');

      while (continueSyncing) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mode === 'id' ? { anime_id: parseInt(animeId!) } : { season, year })
        });
        
        const data = await response.json();
        
        if (data.success || data.animes_processed !== undefined) {
          totalProcessed += (data.animes_processed || 0);
          totalCreated += (data.items_created || 0);
          
          if (data.animes_processed === 0) {
            addLog(`✅ Fila esvaziada! Nenhum anime restante.`, 'success');
            continueSyncing = false;
          } else {
             // Only auto-loop if it's processing a season
             if (mode === 'season') {
                const pendentes = data.pending_count || 0;
                addLog(`⚙️ Processados lote de ${data.animes_processed} animes... Restam ${pendentes} pendentes na fila.`, 'warning');
                if (pendentes > 0) {
                   await new Promise(r => setTimeout(r, 2000)); // Espera 2 segs antes do próximo trigger
                } else {
                   continueSyncing = false;
                }
             } else {
                continueSyncing = false;
             }
          }
        } else {
          addLog(`❌ ERROR: ${data.error || 'Unknown error'}`, 'error');
          continueSyncing = false;
        }
      }

      if (totalProcessed > 0) {
         addLog(`🎉 SYNC CONCLUÍDO: ${totalProcessed} animes processados. ${totalCreated} relacionamentos criados iniciais (fotos depois).`, 'success');
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
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[700px] w-full">
        <h1 className="text-gray-900 dark:text-gray-100 mb-2.5 text-[28px]">👥 Sync Characters</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-7 text-[14px]">Force a fila de sincronização de biografias e vozes de personagens.</p>
        
        {/* Characters Sync Block */}
        <div className="mb-7">
          <div className="space-y-6">
             {/* BY ID */}
             <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 font-semibold text-[15px] mb-3">
                  Sincronizar Personagens de um Anime Específico
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customAnimeId}
                    onChange={(e) => setCustomAnimeId(e.target.value)}
                    placeholder="Ex: 52991 (ID do Jikan)"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-[#10b981]"
                  />
                  <button
                    onClick={() => syncCharacters('id', customAnimeId)}
                    disabled={syncing.sync_chars_id || !customAnimeId}
                    className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white border-none py-[10px] px-6 rounded-xl font-semibold cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
                  >
                    {syncing.sync_chars_id ? '⏳...' : 'Sync ID'}
                  </button>
                </div>
             </div>

             {/* BY SEASON AND YEAR */}
             <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 font-semibold text-[15px] mb-3">
                  Forçar Fila de Personagens por Season
                </p>
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-[#10b981] cursor-pointer"
                  >
                    <option value="winter">❄️ Winter</option>
                    <option value="spring">🌸 Spring</option>
                    <option value="summer">☀️ Summer</option>
                    <option value="fall">🍂 Fall</option>
                  </select>

                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="Ano"
                    className="w-[120px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-[#10b981]"
                  />
                </div>

                <button
                   onClick={() => syncCharacters('season', undefined, selectedSeason, parseInt(selectedYear))}
                   disabled={syncing.sync_chars_season || !selectedYear}
                   className="w-full bg-gradient-to-br from-[#10b981] to-[#059669] text-white border-none py-[15px] px-5 rounded-xl text-base font-semibold cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                   {syncing.sync_chars_season ? '⏳ Montando fila e parseando (Aguarde)...' : `Extrair Personagens de ${selectedSeason.toUpperCase()} ${selectedYear}`}
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
