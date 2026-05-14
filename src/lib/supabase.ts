import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

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
