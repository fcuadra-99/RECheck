
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
        <div className="max-w-6xl mx-auto py-12 px-6">
            {/* Header */}
            <header className="mb-12 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Researcher Dashboard
                    </div>
                    <div>
                        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-3">{displayName}</h1>
                        <p className="text-base text-gray-500 max-w-xl leading-relaxed">Overview of your deviation submissions, review progress and latest system updates.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {stats.map(s => (
                        <div key={s.label} 
                            className={`min-w-[160px] rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${s.color.includes('emerald') ? 'bg-gradient-to-br from-emerald-50 to-white' : s.color.includes('amber') ? 'bg-gradient-to-br from-amber-50 to-white' : 'bg-gradient-to-br from-pink-50 to-white'}`}>
                            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">{s.label}</div>
                            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                        </div>
                    ))}
                </div>
            </header>

            {/* My Submissions */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-xl text-gray-900">My Submissions</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{submissions.length} Total</span>
                    </div>
                    <button 
                        onClick={() => navigate('/researcher/submissions')} 
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-sm font-medium">
                        View all
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                    </button>
                </div>
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="w-full overflow-x-auto max-h-[28rem] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="flex items-center gap-3 text-gray-500">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    <span>Loading submissions...</span>
                                </div>
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                        <path d="M12 5v14M5 12h14"/>
                                    </svg>
                                </div>
                                <p className="text-gray-500 mb-2">No submissions yet</p>
                                <span className="text-sm text-gray-400">Start by creating a new deviation report</span>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm min-w-[680px]">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Project Title</th>
                                        <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {submissions.map((sub) => (
                                        <tr key={sub.id} className="group transition-colors hover:bg-gray-50/80"> 
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-gray-500">{sub.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900 group-hover:text-gray-950 font-medium leading-relaxed line-clamp-2 max-w-md">
                                                    {sub.protocol_title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {sub.severity && sub.severity !== '' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 px-3 py-1 text-xs font-medium">
                                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M5 10l3 3 7-7" />
                                                        </svg>
                                                        Reviewed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-600/10 px-3 py-1 text-xs font-medium">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 6v6l4 2" />
                                                        </svg>
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-500 text-sm whitespace-nowrap">
                                                    {new Date(sub.report_submission_date).toLocaleDateString(undefined, { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                            </td>
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
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-xl text-gray-900">Recent Activities</h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Live Updates
                        </div>
                    </div>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {notifLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                                <span>Loading activities...</span>
                            </div>
                        </div>
                    )}
                    {!notifLoading && activities.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <p className="text-gray-500">No recent activities</p>
                        </div>
                    )}
                    {activities.map((act) => {
                        const isRemoving = removingIds.includes(act.id);
                        let iconBg = 'bg-gray-100';
                        let icon = '🔔';
                        
                        if (act.type === 'announcement') {
                            iconBg = 'bg-blue-50 text-blue-600';
                            icon = '📣';
                        } else if (act.type === 'reviewed') {
                            iconBg = 'bg-emerald-50 text-emerald-600';
                            icon = '✔️';
                        }
                        
                        return (
                            <div
                                key={act.id}
                                className={`group flex items-start gap-4 bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm transition-all duration-300 
                                ${isRemoving ? 'opacity-0 translate-x-6' : 'opacity-100 translate-x-0'} 
                                hover:shadow-md hover:border-gray-200`}
                            >
                                <span className={`flex-none w-9 h-9 rounded-full flex items-center justify-center text-base ${iconBg}`}> 
                                    {icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm leading-relaxed mb-1 line-clamp-2">{act.title}</div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="font-medium">{relativeTime(act.date)}</span>
                                        <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                                        <span>{new Date(act.date).toLocaleDateString(undefined, { 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                </div>
                                <button
                                    aria-label="Remove"
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-all duration-200"
                                    onClick={() => handleRemoveActivity(act.id)}
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4l8 8m0-8l-8 8"/>
                                    </svg>
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
              
            </div>
        </div>
    );
};

export default RDashboard;