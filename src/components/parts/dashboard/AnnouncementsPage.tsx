import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/DB';
import {
    Megaphone,
    Paperclip,
    Clock,
    ChevronRight,
    Plus,
    X,
    LayoutDashboard,
    FileText,
    CheckCircle2,
    ChevronLeft,
    Gavel,
    GraduationCap,
    Users,
} from 'lucide-react';
import { ChartLineMulti } from '@/components/parts/dashboard';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Profile = {
    fname: string;
    lname: string;
    email: string;
    org: string;
    avatar: string;
    role: string;
} | null;

export interface DashboardStats {
    total: number;
    pending: number;
    completed: number;
}

export type StatsLoader = () => Promise<DashboardStats>;

export interface AnnouncementsPageProps {
    user: any;
    profile: Profile;
    statsLoader: StatsLoader;
}

// Custom chart data interface - no dependency on external types
interface ProposalChartData {
    month: string;
    External: number;
    Graduate: number;
    Undergraduate: number;
}

export default function AnnouncementsPage({ user, profile, statsLoader }: AnnouncementsPageProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewing, setViewing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        audience: 'all',
    });

    const [totalActions, setTotalActions] = useState(0);

    // Dashboard data
    const [stats, setStats] = useState<DashboardStats>({
        total: 0,
        pending: 0,
        completed: 0,
    });

    // Use our custom chart data type
    const [chartData, setChartData] = useState<ProposalChartData[]>([]);

    // Recent actions (history)
    const [actions, setActions] = useState<any[]>([]);
    const [actionsPage, setActionsPage] = useState(0);
    const [actionsLoading, setActionsLoading] = useState(false);
    const ACTIONS_PER_PAGE = 5;

    const role = profile?.role?.toLowerCase() ?? '';

    const canCreate =
        role === 'chairperson' ||
        role === 'admin assistant' ||
        role === 'admin';

    // ---------------------------------
    // Load Announcements
    // ---------------------------------
    useEffect(() => {
        const loadAnnouncements = async () => {
            if (!profile) {
                setItems([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const audiences: string[] = ['all'];
                if (role === 'researcher') audiences.push('students');
                if (role === 'reviewer' || role === 'chairperson') audiences.push('committee');

                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(200);

                if (error) throw error;

                const visible = (data || []).filter(
                    (a: any) => audiences.includes(a.audience) || a.audience === 'all'
                );
                setItems(visible);
            } catch (err) {
                console.error('Error loading announcements:', err);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        loadAnnouncements();
    }, [profile, role]);

    // ---------------------------------
    // Create new announcement
    // ---------------------------------
    const handleCreate = async () => {
        if (!form.title.trim() || !form.description.trim()) return;
        try {
            const { error } = await supabase.from('announcements').insert([
                {
                    title: form.title,
                    description: form.description,
                    audience: form.audience,
                    created_by_email: profile?.email ?? 'unknown',
                    created_at: new Date().toISOString(),
                },
            ]);
            if (error) throw error;

            setForm({ title: '', description: '', audience: 'all' });
            setCreating(false);

            // reload announcements
            const { data } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });
            setItems(data || []);
        } catch (err) {
            console.error('Error creating announcement:', err);
        }
    };

    // ---------------------------------
    // Load Dashboard (stats + chart) — only for admin/chair/admin assistant
    // ---------------------------------
    useEffect(() => {
        if (!(role === 'chairperson' || role === 'admin assistant' || role === 'admin')) return;

        let mounted = true;

        const loadStatsAndChart = async () => {
            try {
                // Stats counts — delegated to the statsLoader prop
                const loadedStats = await statsLoader();
                if (!mounted) return;

                setStats(loadedStats);

                // Chart data - fetch proposals
                const { data: proposalsData, error: proposalsErr } = await supabase
                    .from('proposals')
                    .select('updated_on, category')
                    .order('updated_on', { ascending: false })
                    .limit(5000);

                if (proposalsErr) throw proposalsErr;

                // Prepare monthly buckets (last 12 months)
                const now = new Date();
                const months: { key: string; label: string; start: Date; end: Date }[] = [];
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
                    const label = d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
                    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
                    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
                    months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label, start, end });
                }

                // Create chart data with the exact structure needed
                const chartDataByMonth: ProposalChartData[] = months.map(m => {
                    const monthProposals = (proposalsData || []).filter((p: any) => {
                        const u = p.updated_on ? new Date(p.updated_on) : null;
                        return u && u >= m.start && u < m.end;
                    });

                    const Undergraduate = monthProposals.filter((p: any) =>
                        p.category?.toLowerCase() === 'undergraduate'
                    ).length;

                    const Graduate = monthProposals.filter((p: any) =>
                        p.category?.toLowerCase() === 'graduate'
                    ).length;

                    const External = monthProposals.filter((p: any) =>
                        p.category?.toLowerCase() === 'external'
                    ).length;

                    return {
                        month: m.label,
                        Undergraduate,
                        Graduate,
                        External
                    };
                });

                setChartData(chartDataByMonth);
            } catch (err) {
                console.error('Error loading dashboard stats/chart:', err);
            }
        };

        loadStatsAndChart();

        return () => {
            mounted = false;
        };
    }, [role, statsLoader]);

    // ---------------------------------
    // Recent Actions pagination (history)
    // ---------------------------------
    useEffect(() => {
        if (!(role === 'chairperson' || role === 'admin assistant' || role === 'admin')) {
            setActions([]);
            return;
        }

        let mounted = true;
        const fetchActions = async () => {
            setActionsLoading(true);
            try {
                const offset = actionsPage * ACTIONS_PER_PAGE;

                const countQuery = supabase
                    .from('history')
                    .select('history_id', { count: 'exact', head: true })
                    .eq('actor', user?.id);

                const dataQuery = supabase
                    .from('history')
                    .select('*')
                    .eq('actor', user?.id)
                    .order('history_date', { ascending: false })
                    .range(offset, offset + ACTIONS_PER_PAGE - 1);

                const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

                if (countRes.error) throw countRes.error;
                if (dataRes.error) throw dataRes.error;

                if (!mounted) return;

                setTotalActions(countRes.count ?? 0);
                setActions(dataRes.data || []);
            } catch (err) {
                console.error('Error loading recent actions:', err);
                setActions([]);
            } finally {
                if (mounted) setActionsLoading(false);
            }
        };

        fetchActions();

        return () => {
            mounted = false;
        };
    }, [role, actionsPage, user?.id]);

    // ---------------------------------
    // Detail view
    // ---------------------------------
    const handleView = (a: any) => setViewing(a);

    // ---------------------------------
    // Helpers
    // ---------------------------------
    const formatDate = (s?: string) => (s ? new Date(s).toLocaleString() : '');

    // Chart wrapper props - no transformation needed since data is already in correct format
    const chartWrapper = useMemo(() => {
        return {
            title: 'Proposals over time',
            desc: 'Submissions grouped by month (last 12 months)',
            data: chartData,
        };
    }, [chartData]);

    // ---------------------------------
    // Render
    // ---------------------------------
    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Viewing detail
    if (viewing) {
        return (
            <div className="p-6">
                <button
                    onClick={() => setViewing(null)}
                    className="mb-4 flex items-center text-primary hover:text-primary/80"
                >
                    <X className="w-4 h-4 mr-1" /> Back to Announcements
                </button>
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-3">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {viewing.title}
                        </h1>
                        <span
                            className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${viewing.audience === 'all'
                                ? 'bg-green-100 text-green-800'
                                : viewing.audience === 'students'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                        >
                            {viewing.audience === 'all'
                                ? 'Everyone'
                                : viewing.audience === 'students'
                                    ? 'Researchers'
                                    : 'Committee'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 wrap-anywhere">
                        {viewing.created_by_email} • {formatDate(viewing.created_at)}
                    </p>
                    <p className="relative text-gray-800 whitespace-pre-line leading-relaxed wrap-anywhere text-ellipsis">
                        {viewing.description}
                    </p>
                    {viewing.attachments && viewing.attachments.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span>
                                {viewing.attachments.length} attachment
                                {viewing.attachments.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main page
    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary shadow-sm">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">Dashboard</h1>
                        <p className="text-sm text-gray-500">Latest news and updates for your role</p>
                    </div>
                </div>

                {canCreate && (
                    <button
                        onClick={() => setCreating(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
                    >
                        <Plus className="w-4 h-4" /> New
                    </button>
                )}
            </div>

            {/* Top dashboard area (only for admin/chair/admin assistant) */}
            {(role === 'chairperson' || role === 'admin assistant' || role === 'admin') && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex-grow">
                    {/* Left: stats cards + chart */}
                    <div className="space-y-4">
                        <div className="w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Total Proposals */}
                                <div className="flex flex-col justify-between rounded-2xl bg-white p-5 border shadow-sm hover:shadow-md transition-all duration-200">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                            <span className="truncate">Total Proposals</span>
                                        </div>
                                        <div className="mt-1 text-3xl font-bold text-gray-900 break-words">
                                            {stats.total}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 sm:mt-3">All submitted proposals</p>
                                </div>

                                {/* Pending */}
                                <div className="flex flex-col justify-between rounded-2xl bg-white p-5 border shadow-sm hover:shadow-md transition-all duration-200">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                            <span className="truncate">Pending</span>
                                        </div>
                                        <div className="mt-1 text-3xl font-bold text-amber-600 break-words">
                                            {stats.pending}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 sm:mt-3">Awaiting review</p>
                                </div>

                                {/* Completed */}
                                <div className="flex flex-col justify-between rounded-2xl bg-white p-5 col-span-2 border shadow-sm hover:shadow-md transition-all duration-200">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span className="truncate">Completed</span>
                                        </div>
                                        <div className="mt-1 text-3xl font-bold text-emerald-600 break-words">
                                            {stats.completed}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 sm:mt-3">Approved final reports</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 h-[425px] shadow-sm border">
                            <ChartLineMulti
                                title={chartWrapper.title}
                                desc={chartWrapper.desc}
                                data={chartWrapper.data}
                            />
                        </div>
                    </div>

                    {/* Right: Recent actions (paginated) */}
                    <aside className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-10 shrink-0">
                            <h3 className="text-sm font-semibold">Recent actions</h3>
                            <div className="text-xs text-gray-500">Showing {ACTIONS_PER_PAGE} per page</div>
                        </div>

                        {/* Scrollable list area */}
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {actionsLoading ? (
                                <div className="text-sm text-gray-500">Loading…</div>
                            ) : actions.length === 0 ? (
                                <div className="text-sm text-gray-400">No recent actions.</div>
                            ) : (
                                actions.map((act: any) => (
                                    <div key={act.history_id} className="rounded-md border px-3 py-2">
                                        <div className="text-sm font-medium text-gray-800">
                                            {act.action ?? act.history_type ?? 'action'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {act.comment ? act.comment.slice(0, 160) : ''}{' '}
                                            {act.comment && act.comment.length > 160 ? '…' : ''}
                                        </div>
                                        <div className="mt-2 flex items-center text-xs text-gray-400 justify-between">
                                            <div>{act.actor ? act.actor : 'system'}</div>
                                            <div>{formatDate(act.history_date)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination footer */}
                        <div className="mt-4 flex items-center justify-between shrink-0">
                            <button
                                onClick={() => setActionsPage(p => Math.max(0, p - 1))}
                                disabled={actionsPage === 0}
                                className="text-sm px-3 py-1 rounded-md border disabled:opacity-50 flex items-center justify-center"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="text-xs text-gray-600">Page {actionsPage + 1} of {Math.ceil(totalActions / ACTIONS_PER_PAGE)}</div>
                            <button
                                onClick={() => setActionsPage(p => p + 1)}
                                disabled={(actionsPage + 1) * ACTIONS_PER_PAGE >= totalActions}
                                className="text-sm px-3 py-1 rounded-md border disabled:opacity-50 flex items-center justify-center"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </aside>
                </section>
            )}

            {/* Create Announcement Popup */}
            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create Announcement</DialogTitle>
                        <DialogDescription>
                            Post a new announcement to researchers, committee, or everyone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter announcement title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Write your announcement details..."
                                className="h-32"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1 w-full">
                            <Label>Audience</Label>
                            <Select
                                value={form.audience}
                                onValueChange={(val) => setForm({ ...form, audience: val })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-500" />
                                            <span>Everyone</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="students">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-amber-500" />
                                            <span>Researchers</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="committee">
                                        <div className="flex items-center gap-2">
                                            <Gavel className="w-4 h-4 text-emerald-500" />
                                            <span>Committee</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreating(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Post</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Announcements feed */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border max-h-[700px] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    Announcements
                </h2>

                {items.length === 0 ? (
                    <div className="text-gray-400">No announcements.</div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {items.map((a) => {
                            const truncatedDescription =
                                a.description && a.description.length > 300
                                    ? a.description.substring(0, 300) + '...'
                                    : a.description ?? '';
                            const isLongDescription = (a.description || '').length > 300;

                            return (
                                <article
                                    key={a.id}
                                    className="p-4 rounded-xl border hover:border-primary/50 transition cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleView(a)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                                            <Megaphone className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <div className="font-semibold text-gray-900">{a.title}</div>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${a.audience === 'all'
                                                        ? 'bg-green-100 text-green-800'
                                                        : a.audience === 'students'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    {a.audience === 'all'
                                                        ? 'Everyone'
                                                        : a.audience === 'students'
                                                            ? 'Researchers'
                                                            : 'Committee'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {a.created_by_email} • {formatDate(a.created_at)}
                                            </div>
                                            <p className="mt-2 text-gray-700 whitespace-pre-line wrap-anywhere">
                                                {truncatedDescription}
                                                {isLongDescription && (
                                                    <span className="text-primary font-medium ml-1">Read more</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
