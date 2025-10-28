import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('kv_store_c1d1bfd8').select('key').limit(1);
      if (error) {
        setStatus('disconnected');
      } else {
        setStatus('connected');
      }
    } catch (error) {
      setStatus('disconnected');
    }
  };

  if (status === 'checking') {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg shadow-lg z-50">
        Checking Supabase connection...
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="fixed top-4 right-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg z-50">
        ⚠️ Supabase disconnected
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg shadow-lg z-50">
      ✓ Supabase connected
    </div>
  );
}
