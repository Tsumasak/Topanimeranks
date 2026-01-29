import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function AdminPanel() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePopulateGenreRankings = async () => {
    setIsPopulating(true);
    setError(null);
    setResult(null);

    try {
      console.log('[AdminPanel] 🚀 Starting to populate genre_rankings table...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/populate-genre-rankings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[AdminPanel] ✅ Success!', data);
        setResult(data);
      } else {
        console.error('[AdminPanel] ❌ Error:', data);
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('[AdminPanel] ❌ Exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to populate table');
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="min-h-screen pt-[72px] pb-12 px-6">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

        {/* Populate Genre Rankings Card */}
        <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📊 Populate Genre Rankings Table</h2>
          
          <p className="text-[var(--foreground)]/70 mb-4">
            This will populate the <code className="bg-[var(--background)] px-2 py-1 rounded">genre_rankings</code> table
            from <code className="bg-[var(--background)] px-2 py-1 rounded">season_rankings</code> for optimized genre queries.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm">
              <strong>⚠️ Important:</strong> Make sure you've already created the <code>genre_rankings</code> table
              in Supabase SQL Editor. See <code>/PERFORMANCE_OPTIMIZATION.md</code> for the SQL script.
            </p>
          </div>

          <button
            onClick={handlePopulateGenreRankings}
            disabled={isPopulating}
            className="px-6 py-3 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPopulating ? (
              <span className="flex items-center gap-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                Populating... (this may take 1-2 minutes)
              </span>
            ) : (
              'Populate Genre Rankings Table'
            )}
          </button>

          {/* Success Result */}
          {result && (
            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-green-500 mb-2">✅ Success!</h3>
              <div className="text-sm space-y-1">
                <p><strong>Message:</strong> {result.message}</p>
                <p><strong>Animes Processed:</strong> {result.processed}</p>
                <p><strong>Rows Inserted/Updated:</strong> {result.inserted}</p>
                <p><strong>Total Rows:</strong> {result.totalRows}</p>
              </div>
            </div>
          )}

          {/* Error Result */}
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-500 mb-2">❌ Error</h3>
              <p className="text-sm">{error}</p>
              
              {error.includes('relation "genre_rankings" does not exist') && (
                <div className="mt-3 text-sm">
                  <p className="font-semibold">Solution:</p>
                  <p>You need to create the table first. Run the SQL from <code>/PERFORMANCE_OPTIMIZATION.md</code> in Supabase SQL Editor.</p>
                </div>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {isPopulating && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-500 mb-2">⏳ In Progress...</h3>
              <p className="text-sm">
                This process may take 1-2 minutes. Please wait...
              </p>
              <div className="mt-2 text-xs text-[var(--foreground)]/60">
                <p>• Fetching all animes from season_rankings</p>
                <p>• Exploding animes by genre</p>
                <p>• Upserting into genre_rankings (batches of 500)</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">ℹ️ When to Re-populate?</h3>
          <ul className="text-sm text-[var(--foreground)]/70 space-y-2 list-disc list-inside">
            <li>After syncing new anime data (new seasons)</li>
            <li>After updating anime scores</li>
            <li>After correcting data errors</li>
            <li>When genre rankings seem outdated</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
            <h4 className="font-semibold mb-2">Expected Performance:</h4>
            <div className="text-sm text-[var(--foreground)]/70 space-y-1">
              <p>• <strong>Before:</strong> ~1000ms query time (season_rankings)</p>
              <p>• <strong>After:</strong> ~50ms query time (genre_rankings)</p>
              <p>• <strong>Improvement:</strong> 20x faster! 🚀</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
