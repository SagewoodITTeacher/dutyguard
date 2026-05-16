import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Safe access to environment variables across Vite and Node
const getEnvVar = (name: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    // @ts-ignore
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Create client only if we have credentials, or a dummy client that will fail gracefully
export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '')

// Export type for better TypeScript support
export type SupabaseClient = typeof supabase
