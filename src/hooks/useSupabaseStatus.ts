import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface SupabaseStatus {
  tablesExist: boolean;
  loading: boolean;
  error: string | null;
  needsSetup: boolean;
}

export function useSupabaseStatus() {
  const [status, setStatus] = useState<SupabaseStatus>({
    tablesExist: false,
    loading: true,
    error: null,
    needsSetup: true,
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/sync-status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Tables exist and working
        setStatus({
          tablesExist: true,
          loading: false,
          error: null,
          needsSetup: false,
        });
      } else if (data.error?.includes("Could not find the table")) {
        // Tables don't exist - needs manual setup
        setStatus({
          tablesExist: false,
          loading: false,
          error: "Tables need to be created",
          needsSetup: true,
        });
      } else {
        // Other error
        setStatus({
          tablesExist: false,
          loading: false,
          error: data.error || "Unknown error",
          needsSetup: true,
        });
      }
    } catch (error) {
      console.error('Error checking Supabase status:', error);
      setStatus({
        tablesExist: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check status',
        needsSetup: true,
      });
    }
  };

  return { ...status, refetch: checkStatus };
}
