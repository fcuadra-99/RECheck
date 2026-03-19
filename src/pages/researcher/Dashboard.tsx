import { AnnouncementsPage, type StatsLoader } from '@/components/parts/dashboard';
import { supabase } from '@/DB';

const researcherStatsLoader: StatsLoader = async () => {
    const totalQ = supabase.from('proposals').select('proposal_id', { count: 'exact', head: true });
    const pendingQ = supabase.from('proposals').select('proposal_id', { count: 'exact', head: true }).eq('status', 'pending');
    const completedQ = supabase.from('proposals').select('proposal_id', { count: 'exact', head: true }).eq('status', 'completed');
    const [totalR, pendingR, completedR] = await Promise.all([totalQ, pendingQ, completedQ]);
    return { total: totalR.count ?? 0, pending: pendingR.count ?? 0, completed: completedR.count ?? 0 };
};

export default function RDashboard({ user, profile }: { user: any; profile: any }) {
    return <AnnouncementsPage user={user} profile={profile} statsLoader={researcherStatsLoader} />;
}
