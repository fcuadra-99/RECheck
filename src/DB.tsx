import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,       // ✅ keep session in localStorage
      autoRefreshToken: true,     // ✅ refresh tokens automatically
      detectSessionInUrl: true,   // ✅ required for magic links / oauth
    },
  }
);