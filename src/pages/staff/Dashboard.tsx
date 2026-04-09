import { AnnouncementsPage, type StatsLoader } from '@/components/parts/dashboard';
import { supabase } from '@/DB';
import { memo } from 'react';

const staffStatsLoader: StatsLoader = async () => {
  const [totalR, completedR] = await Promise.all([
    supabase.from('proposals').select('proposal_id', { count: 'exact', head: true }),
    supabase.from('final_reports').select('report_id', { count: 'exact', head: true }),
  ]);
  const total = totalR.count ?? 0;
  const completed = completedR.count ?? 0;
  return { total, pending: total - completed, completed };
};

export default memo(function SDashboard({ user, profile }: { user: any; profile: any }) {
  return <AnnouncementsPage user={user} profile={profile} statsLoader={staffStatsLoader} />;
});
