import type { User } from '@supabase/supabase-js';
export default function useAuth(): {
    user: User | null;
    loading: boolean;
};
