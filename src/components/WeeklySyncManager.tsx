import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SyncStatus {
  week: number;
  status: 'pending' | 'syncing' | 'success' | 'error';
  message?: string;
  episodeCount?: number;
}

export function WeeklySyncManager() {
  const [syncing, setSyncing] = useState(false);
  const [weekStatuses, setWeekStatuses] = useState<SyncStatus[]>([
    { week: 1, status: 'pending' },
    { week: 2, status: 'pending' },
    { week: 3, status: 'pending' },
    { week: 4, status: 'pending' },
    { week: 5, status: 'pending' },
  ]);

  const updateWeekStatus = (week: number, updates: Partial<SyncStatus>) => {
    setWeekStatuses(prev => 
      prev.map(ws => ws.week === week ? { ...ws, ...updates } : ws)
    );
  };

  const syncWeek = async (week: number): Promise<boolean> => {
    updateWeekStatus(week, { status: 'syncing', message: 'Fetching from Jikan API...' });

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/sync-anime-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            sync_type: 'weekly_episodes',
            week_number: week,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Response is not JSON: ${errorText.substring(0, 100)}`);
      }

      const result = await response.json();
      
      updateWeekStatus(week, {
        status: 'success',
        message: `✅ ${result.itemsSynced || 0} episodes synced`,
        episodeCount: result.itemsSynced || 0,
      });

      return true;
    } catch (error) {
      console.error(`Error syncing week ${week}:`, error);
      updateWeekStatus(week, {
        status: 'error',
        message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return false;
    }
  };

  const syncAllWeeks = async () => {
    setSyncing(true);

    // Reset all statuses
    setWeekStatuses(prev => prev.map(ws => ({ ...ws, status: 'pending' as const, message: undefined })));

    for (let week = 1; week <= 5; week++) {
      const success = await syncWeek(week);
      
      // Wait 3 seconds between weeks to respect Jikan API rate limits
      if (week < 5) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // If a week fails, continue to next one (don't stop)
      if (!success) {
        console.warn(`Week ${week} failed, continuing...`);
      }
    }

    setSyncing(false);
  };

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      case 'syncing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const totalSuccess = weekStatuses.filter(ws => ws.status === 'success').length;
  const totalEpisodes = weekStatuses.reduce((sum, ws) => sum + (ws.episodeCount || 0), 0);

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Weekly Episodes Sync Manager</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Populate the database with episodes from Jikan API
            </p>
          </div>
          <Button
            onClick={syncAllWeeks}
            disabled={syncing}
            size="lg"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync All Weeks (1-5)'
            )}
          </Button>
        </div>

        {/* Progress Summary */}
        {(syncing || totalSuccess > 0) && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">
                Progress: {totalSuccess}/5 weeks completed
              </span>
            </div>
            {totalEpisodes > 0 && (
              <p className="text-sm text-muted-foreground">
                Total episodes synced: <strong>{totalEpisodes}</strong>
              </p>
            )}
          </div>
        )}

        {/* Week Status List */}
        <div className="space-y-2">
          {weekStatuses.map(({ week, status, message }) => (
            <div
              key={week}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              {getStatusIcon(status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Week {week}</span>
                  {status === 'syncing' && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Please wait...
                    </span>
                  )}
                </div>
                {message && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>This process takes <strong>~15-20 seconds per week</strong> (rate limits)</li>
            <li><strong>Week 5</strong> (current week) may have fewer episodes</li>
            <li>Only animes with <strong>5000+ MAL members</strong> are included</li>
            <li>After initial sync, cron job updates automatically every 10 minutes</li>
            <li><strong>Don't close this tab</strong> until sync completes</li>
          </ul>
        </div>

        {/* Success Message */}
        {!syncing && totalSuccess === 5 && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  🎉 All weeks synced successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Reload the page to see the episodes. The system will now update automatically.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}