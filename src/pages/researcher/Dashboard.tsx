
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ResearcherDeviationReport } from '../../types/deviationReport';
import { getResearcherNotifications } from '../../services/notificationService';
import useAuth from '@/hooks/useAuth';
import type { Notification } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';


const RDashboard = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<ResearcherDeviationReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]); // raw notifications
    const [reviewedNotifs, setReviewedNotifs] = useState<any[]>([]); // deviations reviewed
    const [announcementActs, setAnnouncementActs] = useState<any[]>([]); // announcements
    const [activities, setActivities] = useState<any[]>([]); // merged activities
    const [removingIds, setRemovingIds] = useState<string[]>([]);
    const [notifLoading, setNotifLoading] = useState(true);

    const handleRemoveActivity = (id: string) => {
        setRemovingIds(prev => [...prev, id]);
        setTimeout(() => {
            setActivities(prev => prev.filter(a => a.id !== id));
            setRemovingIds(prev => prev.filter(r => r !== id));
        }, 300);
    };

    const { user } = useAuth();

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            const email = user?.email;
            if (!email) {
                setSubmissions([]);
                setReviewedNotifs([]);
                setLoading(false);
            } else {
               
                const candidates: string[] = [email];
                const metaAny: any = (user as any)?.user_metadata;
                if (metaAny) {
                    if (metaAny.full_name) candidates.push(metaAny.full_name);
                    if (metaAny.name) candidates.push(metaAny.name);
                }
                const localPart = email.split('@')[0];
                if (localPart) candidates.push(localPart);

                const { data } = await supabase
                    .from('deviation_reports')
                    .select('*')
                    .in('reported_by', candidates)
                    .order('report_submission_date', { ascending: false });

                let rows = data || [];
                if ((!rows || rows.length === 0)) {
                    // fallback: fetch all and filter client-side
                    const { data: allData, error: allErr } = await supabase.from('deviation_reports').select('*').order('report_submission_date', { ascending: false });
                    if (!allErr) {
                        const lowerCandidates = candidates.map(c => c.toLowerCase());
                        rows = (allData || []).filter((r: any) => {
                            const rep = (r.reported_by || '').toString().toLowerCase();
                            return lowerCandidates.some(c => rep.includes(c));
                        });
                    } else {
                        console.error('Error fetching deviation_reports for dashboard fallback', allErr);
                        rows = [];
                    }
                }

                setSubmissions(rows || []);
                const reviewed = (rows || []).filter((d: any) => d.severity && d.severity !== '').map((d: any) => ({
                    id: `reviewed-${d.id}`,
                    type: 'reviewed',
                    title: 'Deviation Reviewed',
                    description: `Your Deviation "${d.protocol_title}" has been reviewed.`,
                    date: d.reviewed_at || d.updated_at || d.report_submission_date
                }));
                setReviewedNotifs(reviewed);
                setLoading(false);
            }

           
            setNotifLoading(true);
            try {
                const { data: notifData, error: notifErr } = await getResearcherNotifications();
                if (notifErr) {
                    console.error('Error fetching notifications', notifErr);
                    setNotifications([]);
                } else {
                    const allNotifs = notifData || [];
                    if (!user?.email) {
                        setNotifications([]);
                    } else {
                        const lowerEmail = user.email.toLowerCase();
                        const filtered = allNotifs.filter((n: any) => {
                            if (!n) return false;
                            if (n.broadcast) return true;
                            if (n.recipient && typeof n.recipient === 'string' && n.recipient.toLowerCase() === lowerEmail) return true;
                            if (Array.isArray(n.recipient) && n.recipient.map((r: string) => r.toLowerCase()).includes(lowerEmail)) return true;
                            return false;
                        });
                        setNotifications(filtered);
                    }
                }

                // Fetch announcements (mirror reviewer design)
                const { data: annData, error: annErr } = await supabase
                    .from('announcements')
                    .select('id, title, created_at, audience')
                    .order('created_at', { ascending: false })
                    .limit(6);
                if (annErr) {
                    console.error('Error fetching announcements for researcher dashboard:', annErr);
                    setAnnouncementActs([]);
                } else {
                    // Optionally filter by audience if column exists (e.g., 'all' or includes 'researcher')
                    const annActs = (annData || []).filter((a: any) => {
                        if (!a) return false;
                        if (!a.audience) return true;
                        if (Array.isArray(a.audience)) return a.audience.includes('researcher') || a.audience.includes('all');
                        if (typeof a.audience === 'string') {
                            const aud = a.audience.toLowerCase();
                            return aud === 'all' || aud.includes('research');
                        }
                        return true;
                    }).map((a: any) => ({
                        id: `anno-${a.id}`,
                        type: 'announcement',
                        title: `Announcement: ${a.title}`,
                        date: a.created_at
                    }));
                    setAnnouncementActs(annActs);
                }

                // Transform reviewed deviations already in state & notifications into unified activities
                // reviewedNotifs already built earlier
                // Build notification activities (merged later in effect)
                // (No-op: we rely on notifications state in merge effect)
            } catch (e) {
                console.error('Error loading researcher notifications & announcements', e);
            } finally {
                setNotifLoading(false);
            }
        };

        load();
    }, [user]);

    // After announcements / notifications / reviewedNotifs states change, recompute merged activities
    useEffect(() => {
        const merged = [...reviewedNotifs, ...announcementActs, ...notifications.map((n: any, i: number) => ({
            id: n.id || `notif-${i}`,
            type: n.type || 'notification',
            title: n.title || n.message || 'Notification',
            date: n.date || n.created_at || new Date().toISOString()
        }))].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setActivities(merged);
    }, [reviewedNotifs, announcementActs, notifications]);

    // (placeholder function removed)

    // Derived stats for quick overview cards
    const stats = useMemo(() => {
        const total = submissions.length;
        const reviewed = submissions.filter(s => s.severity && s.severity !== '').length;
        const pending = total - reviewed;
        return [
            { label: 'Total Submissions', value: total, color: 'from-pink-500 to-pink-600' },
            { label: 'Reviewed', value: reviewed, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Pending', value: pending, color: 'from-amber-500 to-amber-600' },
        ];
    }, [submissions]);

    const relativeTime = (date: any) => {
        if (!date) return '';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return '';
        }
    };

    // Derive display name from user metadata or email
    const displayName = useMemo(() => {
        const meta: any = (user as any)?.user_metadata || {};
        const raw = meta.full_name || meta.name || user?.email?.split('@')[0] || 'Researcher';
        // For email local part, replace separators with spaces and title case
        const cleaned = raw.replace(/[._-]+/g, ' ').trim();
    return cleaned.replace(/\b\w+/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1));
    }, [user]);

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            {/* Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">{displayName}</h1>
                    <p className="text-sm text-gray-600 max-w-xl">Overview of your deviation submissions, review progress and latest system updates.</p>
                </div>
                <div className="flex gap-4">
                    {stats.map(s => (
                        <div key={s.label} className="min-w-[140px] rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">{s.label}</div>
                            <div className="text-xl font-semibold text-gray-900 mt-1">{s.value}</div>
                        </div>
                    ))}
                </div>
            </header>

            {/* My Submissions */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg text-gray-900">My Submissions</h2>
                    <button onClick={() => navigate('/researcher/submissions')} className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900">
                        View all
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                    </button>
                </div>
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="w-full overflow-x-auto max-h-[26rem]">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading submissions...</div>
                        ) : submissions.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No submissions yet. Start by creating a new deviation report.</div>
                        ) : (
                            <table className="w-full text-left text-sm min-w-[680px]">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide">ID</th>
                                        <th className="px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Project Title</th>
                                        <th className="px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                                        <th className="px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((sub, idx) => (
                                        <tr key={sub.id} className={`group transition ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100/60`}> 
                                            <td className="px-5 py-3 font-mono text-[11px] text-gray-600 align-top">{sub.id}</td>
                                            <td className="px-5 py-3 align-top">
                                                <span className="text-gray-800 group-hover:text-gray-900 font-medium leading-snug line-clamp-2">{sub.protocol_title}</span>
                                            </td>
                                            <td className="px-5 py-3 align-top">
                                                {sub.severity && sub.severity !== '' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2.5 py-1 text-[11px] font-medium">Reviewed
                                                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10l3 3 7-7" /></svg>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-[11px] font-medium">Pending
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6l4 2" /></svg>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-gray-600 align-top whitespace-nowrap">{new Date(sub.report_submission_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                <div className="mt-4 md:hidden">
                    <button className="w-full px-5 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-sm" onClick={() => navigate('/researcher/submissions')}>View all submissions</button>
                </div>
            </div>

            {/* Recent Activities (announcements + reviewed deviations + other notifications) */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-lg text-gray-900">Recent Activities</h2>
                    <span className="text-[11px] font-medium text-gray-500">Latest updates</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {notifLoading && (
                        <div className="text-gray-500 text-sm">Loading activities...</div>
                    )}
                    {!notifLoading && activities.length === 0 && (
                        <div className="text-gray-500 text-sm">No recent activities.</div>
                    )}
                    {activities.map((act) => {
                        const isRemoving = removingIds.includes(act.id);
                        return (
                            <div
                                key={act.id}
                                className={`flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm transition-all duration-300 ${isRemoving ? 'opacity-0 translate-x-6' : 'opacity-100 translate-x-0'} hover:bg-gray-50`}
                            >
                                <span className={`flex-none w-7 h-7 rounded-md flex items-center justify-center text-sm bg-gray-100 text-gray-600`}> 
                                    {act.type === 'announcement' ? '📣' : act.type === 'reviewed' ? '✔️' : '🔔'}
                                </span>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800 text-sm leading-snug truncate">{act.title}</div>
                                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                        <span>{relativeTime(act.date)}</span>
                                        <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                                        <span>{new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>
                                <button
                                    aria-label="Remove"
                                    className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                    onClick={() => handleRemoveActivity(act.id)}
                                >
                                    &times;
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs">📢</span>
                        Announcements & Updates
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Policy changes, review guidelines and other system notices relevant to your work.</p>
                    <div>
                        <button onClick={() => navigate('/announcements')} className="text-xs font-medium text-gray-700 hover:text-gray-900 inline-flex items-center gap-1">
                            View announcements
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs">📘</span>
                        Research Ethics Committee
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Learn about oversight processes, compliance and how reviews ensure ethical integrity.</p>
                    <div>
                        <button className="text-xs font-medium text-gray-700 hover:text-gray-900 inline-flex items-center gap-1">
                            Learn more
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RDashboard;