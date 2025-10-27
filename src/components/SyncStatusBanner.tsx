import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { SupabaseService } from '../services/supabase';

interface SyncState {
  hasData: boolean;
  lastSync?: string;
  isSyncing: boolean;
  error?: string;
}

export function SyncStatusBanner() {
  const [syncState, setSyncState] = useState<SyncState>({
    hasData: false,
    isSyncing: false,
  });

  const checkSyncStatus = async () => {
    try {
      const status = await SupabaseService.getSyncStatus();
      
      if (status.length > 0) {
        setSyncState({
          hasData: true,
          lastSync: status[0].createdAt,
          isSyncing: false,
        });
      } else {
        setSyncState({
          hasData: false,
          isSyncing: false,
        });
      }
    } catch (error) {
      console.error('[SyncStatusBanner] Error checking sync status:', error);
      setSyncState({
        hasData: false,
        isSyncing: false,
        error: 'Failed to check sync status',
      });
    }
  };

  const triggerSync = async () => {
    setSyncState(prev => ({ ...prev, isSyncing: true, error: undefined }));
    
    try {
      console.log('[SyncStatusBanner] Triggering manual sync...');
      
      // Trigger all sync types
      await Promise.all([
        SupabaseService.triggerManualSync('weekly_episodes'),
        SupabaseService.triggerManualSync('season_rankings'),
        SupabaseService.triggerManualSync('anticipated'),
      ]);
      
      console.log('[SyncStatusBanner] ✓ Sync completed successfully');
      
      // Wait 2 seconds then check status
      setTimeout(() => {
        checkSyncStatus();
      }, 2000);
    } catch (error) {
      console.error('[SyncStatusBanner] Sync error:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  };

  useEffect(() => {
    checkSyncStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkSyncStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Don't show banner if data exists and no error
  if (syncState.hasData && !syncState.error) {
    return null;
  }

  return (
    <div className="mb-6">
      <Alert variant={syncState.error ? "destructive" : "default"}>
        {syncState.isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : syncState.error ? (
          <XCircle className="h-4 w-4" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        
        <AlertTitle>
          {syncState.isSyncing 
            ? 'Syncing data from MyAnimeList...' 
            : syncState.error 
            ? 'Sync Error' 
            : 'Initial Sync Required'}
        </AlertTitle>
        
        <AlertDescription className="flex items-center justify-between">
          <span>
            {syncState.isSyncing 
              ? 'This may take 1-2 minutes. Data will be cached for future visits.' 
              : syncState.error 
              ? `Error: ${syncState.error}` 
              : 'Click "Sync Now" to fetch anime data from MyAnimeList. This only needs to be done once - data will auto-update every 10 minutes.'}
          </span>
          
          {!syncState.isSyncing && (
            <Button 
              onClick={triggerSync}
              size="sm"
              variant={syncState.error ? "destructive" : "default"}
              className="ml-4 whitespace-nowrap"
              disabled={syncState.isSyncing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {syncState.error ? 'Retry Sync' : 'Sync Now'}
            </Button>
          )}
        </AlertDescription>
      </Alert>
      
      {syncState.lastSync && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Last synced: {new Date(syncState.lastSync).toLocaleString()}
        </div>
      )}
    </div>
  );
}
