import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[name];
  }
  return undefined;
};

export const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
export const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. App may not function correctly.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Role = 'teacher' | 'admin' | 'manager';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  name: string;
}
