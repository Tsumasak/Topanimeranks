import { AlertCircle, Database, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

export function EmptyDataAlert() {
  const supabaseUrl = 'https://supabase.com/dashboard/project/kgiuycrbdctbbuvtlyro/sql/new';

  return (
    <div className="max-w-2xl mx-auto my-12">
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-4">
            <Database className="w-12 h-12 text-yellow-600 dark:text-yellow-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-3">Database Not Populated</h2>
        
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          The weekly episodes database is empty. Run the sync command in Supabase SQL Editor to populate the database.
        </p>

        <div className="bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6 text-left">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-2">How to populate the database:</p>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Open Supabase SQL Editor (button below)</li>
                <li>Copy and paste this SQL command:</li>
              </ol>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm mb-4">
            <code className="text-green-600 dark:text-green-400">
              SELECT sync_all_weeks();
            </code>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This command will:</p>
              <ul className="space-y-1">
                <li>✓ Sync all 5 weeks automatically</li>
                <li>✓ Fetch episodes from Jikan API (MAL)</li>
                <li>✓ Filter animes with 5000+ members</li>
                <li>✓ Save everything to the database</li>
                <li>✓ Takes about 2-5 minutes total</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => window.open(supabaseUrl, '_blank')}
          size="lg"
          className="gap-2"
        >
          <Database className="w-4 h-4" />
          Open Supabase SQL Editor
          <ExternalLink className="w-4 h-4" />
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          One-time setup. After sync, you can enable automatic updates via cron jobs.
        </p>
      </div>
    </div>
  );
}
