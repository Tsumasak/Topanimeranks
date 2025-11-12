import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

// Global singleton instance - only create once across entire app
// Using globalThis to ensure only one instance even with hot module reloading
declare global {
  var __supabaseClient: ReturnType<typeof createSupabaseClient> | undefined;
}

function getSupabaseClient() {
  // Return existing global instance if already created
  if (globalThis.__supabaseClient) {
    return globalThis.__supabaseClient;
  }

  // Create new instance only if it doesn't exist
  globalThis.__supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: undefined, // Explicitly disable storage to avoid GoTrueClient warnings
      storageKey: undefined, // Also disable storage key
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  });

  return globalThis.__supabaseClient;
}

// Export both the function and the client instance
export const createClient = getSupabaseClient;
export const supabase = getSupabaseClient();