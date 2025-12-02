import { useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * Silent migration checker - only logs to console once per session
 * Does NOT show any visual alerts to avoid annoying users
 */
export function MigrationAlert() {
  useEffect(() => {
    // Check if we already checked in this session
    const sessionKey = 'migration_check_done_session';
    if (sessionStorage.getItem(sessionKey) === 'true') {
      return;
    }

    // Check migration status from server
    const checkMigrationStatus = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/migration-status`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }

        const result = await response.json();

        // If the endpoint fails or migration is needed, show instructions
        if (!result.success || result.migrationNeeded) {
          // Only show detailed instructions once per session
          console.group('📋 Database Migration Available');
          console.log('A migration is available to improve performance.');
          console.log('Current status: Week dates are calculated on-the-fly (works fine)');
          console.log('');
          console.log('To apply the migration (optional):');
          console.log('1. Open Supabase Dashboard → Database → SQL Editor');
          console.log('2. Run this SQL:');
          console.log('');
          console.log(`
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS week_start_date DATE,
ADD COLUMN IF NOT EXISTS week_end_date DATE;

UPDATE weekly_episodes
SET 
  week_start_date = DATE '2025-09-29' + ((week_number - 1) * 7),
  week_end_date = DATE '2025-09-29' + ((week_number - 1) * 7) + 6
WHERE week_start_date IS NULL OR week_end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_weekly_episodes_dates ON weekly_episodes(week_start_date, week_end_date);
          `);
          console.log('');
          console.log('📄 Or copy from: /supabase/QUICK_FIX_DATES.sql');
          console.groupEnd();

          // Mark as checked for this session
          sessionStorage.setItem(sessionKey, 'true');
        } else {
          console.log('[Migration] ✅ All migrations applied');
          // Mark as checked for this session
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch (error) {
        // Silent fail - don't bother the user
        console.log('[Migration] Could not check status (this is fine)');
        // Mark as checked even on error to avoid repeated failed attempts
        sessionStorage.setItem(sessionKey, 'true');
      }
    };

    // Check after a delay to not interfere with initial page load
    const timeoutId = setTimeout(checkMigrationStatus, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  // This component is invisible - it only checks and logs
  return null;
}