import { supabase } from '../lib/supabase';

export async function getResearcherNotifications() {
    
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}
