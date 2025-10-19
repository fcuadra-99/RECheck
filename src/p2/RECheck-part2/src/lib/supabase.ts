import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Running without env configured is allowed in local dev, but be explicit.
  console.warn('Supabase environment variables are not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
    