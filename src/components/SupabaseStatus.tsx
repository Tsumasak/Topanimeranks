import { useState, useEffect } from 'react';
import { SupabaseService, SyncStatus } from '../services/supabase';
import { Database, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

/**
 * Component to display Supabase sync status
 * Shows last sync time and allows manual sync trigger
 */
export const SupabaseStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadSyncStatus();
    // Refresh every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    const status = await SupabaseService.getSyncStatus();
    setSyncStatus(status);
  };

  const handleManualSync = async (syncType: 'weekly_episodes' | 'season_rankings' | 'anticipated') => {
    setSyncing(syncType);
    try {
      await SupabaseService.triggerManualSync(syncType);
      // Wait a bit then reload status
      setTimeout(loadSyncStatus, 2000);
    } catch (error) {
      console.error('Manual sync error:', error);
    } finally {
      setSyncing(null);
    }
  };

  const formatSyncType = (type: string) => {
    const map: Record<string, string> = {
      weekly_episodes: 'Weekly Episodes',
      season_rankings: 'Season Rankings',
      anticipated: 'Anticipated Animes',
    };
    return map[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!SupabaseService.isConfigured()) {
    return (
      <div 
        className="p-4 rounded-lg border mb-4"
        style={{
          backgroundColor: 'var(--card-background)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" style={{ color: 'var(--foreground)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              Supabase not configured - using Jikan API directly
            </p>
          </div>
          <a
            href="/setup"
            className="px-4 py-2 rounded text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
            }}
          >
            🚀 Setup Supabase
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 rounded-lg border mb-4"
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
            Supabase Cache Status
          </h3>
        </div>
        <button
          onClick={loadSyncStatus}
          disabled={loading}
          className="p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--foreground)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {syncStatus.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm opacity-50" style={{ color: 'var(--foreground)' }}>
              No sync data available yet
            </p>
            <a
              href="/setup"
              className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
              }}
            >
              ⚙️ Run Initial Setup
            </a>
          </div>
        ) : (
          syncStatus.map((status) => (
            <div 
              key={status.syncType}
              className="flex items-center justify-between p-2 rounded"
              style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center gap-2 flex-1">
                {getStatusIcon(status.status)}
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {formatSyncType(status.syncType)}
                  </p>
                  <div className="flex items-center gap-3 text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
                    <span>{status.itemsSynced} items</span>
                    <span>{formatDuration(status.durationMs)}</span>
                    <span>{formatTime(status.createdAt)}</span>
                  </div>
                  {status.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{status.errorMessage}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleManualSync(status.syncType as any)}
                disabled={syncing !== null}
                className="px-3 py-1 text-xs rounded transition-opacity hover:opacity-70 disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                }}
              >
                {syncing === status.syncType ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  'Sync Now'
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <p className="text-xs mt-3 opacity-50" style={{ color: 'var(--foreground)' }}>
        Auto-sync runs every 10 minutes
      </p>
    </div>
  );
};
