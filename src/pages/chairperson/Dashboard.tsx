import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';
import { getActivities, getUpcomingDeadlines } from '@/services/reviewer';
import { FileText, Clock, CheckCircle2, AlertTriangle, Sparkles, X, ArrowUpRight } from 'lucide-react';

type StatCard = {
    label: string;
    value: number;
    icon: React.ElementType;
    accent: string;
    description: string;
    iconClasses: string;
};

type ActivityItem = {
    id: string;
    title: string;
    date?: string | null;
    raw?: unknown;
    type: 'deviation' | 'proposal' | 'activity';
};

type DeadlineItem = {
    id: string;
    title: string;
    dueDate?: string | null;
    due?: string | null;
    due_at?: string | null;
    status?: string | null;
    category?: string | null;
    description?: string | null;
    [key: string]: unknown;
};

const valueFormatter = new Intl.NumberFormat('en-US');

const formatDateTime = (value?: string | null) => {
    if (!value) return 'Date unavailable';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
    return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const formatDateOnly = (value?: string | null) => {
    if (!value) return 'Date unavailable';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
    return parsed.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

const LoadingSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div className="space-y-3">
        {Array.from({ length: lines }).map((_, idx) => (
            <div key={idx} className="h-16 rounded-2xl border border-slate-100 bg-slate-100/80 animate-pulse" />
        ))}
    </div>
);

const Stat: React.FC<StatCard> = ({ label, value, icon: Icon, accent, description, iconClasses }) => (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
        <div className="relative flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-white/60 ${iconClasses}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900 tabular-nums">{valueFormatter.format(value)}</p>
            </div>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
    </div>
);

const getActivityMeta = (type: ActivityItem['type']) => {
    switch (type) {
        case 'deviation':
            return {
                label: 'Deviation report',
                Icon: AlertTriangle,
                iconClasses: 'bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/20',
                chipClasses: 'border border-rose-100 bg-rose-50 text-rose-600',
            };
        case 'proposal':
            return {
                label: 'Proposal update',
                Icon: FileText,
                iconClasses: 'bg-indigo-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20',
                chipClasses: 'border border-indigo-100 bg-indigo-50 text-indigo-600',
            };
        default:
            return {
                label: 'Committee activity',
                Icon: Sparkles,
                iconClasses: 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20',
                chipClasses: 'border border-amber-100 bg-amber-50 text-amber-600',
            };
    }
};

const extractDeadlineDate = (deadline: DeadlineItem) => deadline?.dueDate || deadline?.due || deadline?.due_at || null;

const SDashboard: React.FC = () => {
    const [totalApplications, setTotalApplications] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [removingIds, setRemovingIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { count: total } = await supabase.from('proposals').select('id', { count: 'exact', head: true });
                setTotalApplications(Number(total ?? 0));

                const { count: pending } = await supabase
                    .from('reviews')
                    .select('id', { count: 'exact', head: true })
                    .neq('status', 'Completed');
                setPendingCount(Number(pending ?? 0));

                const { count: approved } = await supabase
                    .from('proposals')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Approved');
                setApprovedCount(Number(approved ?? 0));

                const actsRaw = await getActivities(6);
                const acts: ActivityItem[] = (actsRaw || []).map((r: any) => ({
                    id: `act-${r.id}`,
                    title: r.title,
                    date: r.date || r.created_at,
                    raw: r,
                    type: 'activity',
                }));

                const { data: deviData } = await supabase
                    .from('deviation_reports')
                    .select('id, protocol_title, report_submission_date')
                    .order('report_submission_date', { ascending: false })
                    .limit(6);

                const deviItems: ActivityItem[] = (deviData || []).map((d: any) => ({
                    id: `devi-${d.id}`,
                    title: `Deviation submitted: ${d.protocol_title}`,
                    date: d.report_submission_date,
                    raw: d,
                    type: 'deviation',
                }));

                const { data: propData } = await supabase
                    .from('proposals')
                    .select('id, title, protocol_title, submitted_at, created_at, status')
                    .order('created_at', { ascending: false })
                    .limit(6);

                const propItems: ActivityItem[] = (propData || []).map((p: any) => ({
                    id: `prop-${p.id}`,
                    title: `Proposal${p.status ? ` (${p.status})` : ''}: ${p.title || p.protocol_title || 'Untitled'}`,
                    date: p.submitted_at || p.created_at,
                    raw: p,
                    type: 'proposal',
                }));

                const sortedDevi = [...deviItems].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
                const sortedProp = [...propItems].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
                const sortedActs = [...acts].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

                const result: ActivityItem[] = [];
                let remaining = 6;

                const take = (arr: ActivityItem[], n: number) => {
                    const taken = arr.slice(0, n);
                    result.push(...taken);
                    remaining -= taken.length;
                };

                take(sortedDevi, 2);
                take(sortedProp, 2);

                if (remaining > 0) {
                    let pool: ActivityItem[] = [...sortedDevi, ...sortedProp, ...sortedActs].sort(
                        (a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
                    );
                    const existingIds = new Set(result.map(r => r.id));
                    pool = pool.filter(item => !existingIds.has(item.id));
                    result.push(...pool.slice(0, remaining));
                }

                setActivities(result);
                const dls = await getUpcomingDeadlines(6);
                setDeadlines((dls || []) as DeadlineItem[]);
            } catch (err) {
                console.error('Error loading chairperson dashboard', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        setCurrentPage(prev => {
            const maxPage = Math.max(1, Math.ceil(activities.length / pageSize));
            return Math.min(prev, maxPage);
        });
    }, [activities.length]);

    const { user } = useAuth();
    const displayName =
        (user as any)?.user_metadata?.full_name ||
        (user as any)?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        'Chairperson';

    const stats: StatCard[] = [
        {
            label: 'Total applications',
            value: totalApplications,
            icon: FileText,
            accent: 'from-sky-100 via-white to-transparent',
            description: 'Submitted across all research programs',
            iconClasses: 'bg-sky-500/10 text-sky-600 ring-sky-500/20',
        },
        {
            label: 'Waiting for review',
            value: pendingCount,
            icon: Clock,
            accent: 'from-amber-100 via-white to-transparent',
            description: 'Actions needed from the committee',
            iconClasses: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
        },
        {
            label: 'Studies approved',
            value: approvedCount,
            icon: CheckCircle2,
            accent: 'from-emerald-100 via-white to-transparent',
            description: 'Protocols cleared for implementation',
            iconClasses: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
        },
    ];

    const totalPages = Math.max(1, Math.ceil(activities.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(activities.length, startIndex + pageSize);
    const visibleActivities = activities.slice(startIndex, endIndex);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10">
            <div className="mx-auto max-w-6xl space-y-8 px-6">
                <header className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Chairperson dashboard</p>
                            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Welcome back, {displayName}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Monitor the committee&apos;s throughput, follow recent actions, and stay ahead of upcoming deadlines at a glance.
                            </p>
                        </div>
                     
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {stats.map(stat => (
                        <Stat key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2 space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Recent activities</h2>
                                <p className="text-sm text-slate-500">The latest protocol movements and committee actions.</p>
                            </div>
                            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">Updated moments ago</span>
                        </div>

                        {loading ? (
                            <LoadingSkeleton lines={3} />
                        ) : activities.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-400">
                                No recent activities. New submissions and reports will appear here.
                            </div>
                        ) : (
                            <>
                                <ul className="space-y-4">
                                    {visibleActivities.map(activity => {
                                        const meta = getActivityMeta(activity.type);
                                        const isRemoving = removingIds.includes(activity.id);

                                        return (
                                            <li
                                                key={activity.id}
                                                className={`flex items-start gap-4 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm transition-all duration-300 ease-out hover:border-slate-200 hover:shadow-md ${
                                                    isRemoving ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
                                                }`}
                                            >
                                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${meta.iconClasses}`}>
                                                    <meta.Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.chipClasses}`}>{meta.label}</span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-slate-500">{formatDateTime(activity.date)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    aria-label="Dismiss activity"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:border-slate-200 hover:text-rose-500"
                                                    onClick={() => {
                                                        setRemovingIds(prev => [...prev, activity.id]);
                                                        setTimeout(() => {
                                                            setActivities(prev => prev.filter(item => item.id !== activity.id));
                                                            setRemovingIds(prev => prev.filter(id => id !== activity.id));
                                                        }, 280);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-slate-500">
                                    <span>
                                        Showing {activities.length === 0 ? 0 : startIndex + 1}–{endIndex} of {activities.length} updates
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Prev
                                        </button>
                                        <span className="text-xs font-semibold text-slate-500">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage >= totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>

                    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Pending actions</h2>
                                <p className="text-sm text-slate-500">Upcoming milestones that need attention.</p>
                            </div>
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">Deadline tracker</span>
                        </div>

                        {loading ? (
                            <LoadingSkeleton lines={2} />
                        ) : deadlines.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-400">
                                No pending actions right now. You&apos;ll be notified when new deadlines arrive.
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {deadlines.map(deadline => {
                                    const dueDate = extractDeadlineDate(deadline);
                                    const metaLabel = deadline.status || deadline.category;

                                    return (
                                        <li
                                            key={deadline.id}
                                            className="rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md"
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{deadline.title}</p>
                                                        <p className="mt-1 text-sm text-slate-500">Due {formatDateOnly(dueDate)}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                                                    >
                                                        View
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                {metaLabel && (
                                                    <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                                                        {metaLabel}
                                                    </span>
                                                )}
                                                {deadline.description && (
                                                    <p className="text-xs text-slate-500">{deadline.description}</p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SDashboard;