import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';
import { getActivities, getUpcomingDeadlines } from '@/services/reviewer';
import { FileText, Clock, CheckCircle2 } from 'lucide-react';

type StatCard = { label: string; value: number; icon: React.ElementType; colorClasses: string };

const Stat = ({ label, value, icon: Icon, colorClasses }: StatCard) => (
    <div className="flex-1 p-6 rounded-2xl shadow-md bg-white relative overflow-hidden">
        <div className="flex items-center justify-between">
            <div>
                <div className="text-sm text-gray-500 font-medium tracking-wide">{label}</div>
                <div className="text-3xl font-semibold text-gray-900 mt-2 tabular-nums">{value}</div>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-inner ${colorClasses}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </div>
);

const SDashboard: React.FC = () => {
    const [totalApplications, setTotalApplications] = useState(0);  
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [activities, setActivities] = useState<any[]>([]);
    const [removingIds, setRemovingIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
             
                const { count: total } = await supabase.from('proposals').select('id', { count: 'exact', head: true });
                setTotalApplications(Number(total ?? 0));

         
                const { count: pending } = await supabase.from('reviews').select('id', { count: 'exact', head: true }).neq('status', 'Completed');
                setPendingCount(Number(pending ?? 0));

              
                const { count: approved } = await supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'Approved');
                setApprovedCount(Number(approved ?? 0));

              
                const actsRaw = await getActivities(6);
                const acts = (actsRaw || []).map((r: any) => ({ id: `act-${r.id}`, title: r.title, date: r.date || r.created_at }));

               
                const { data: deviData } = await supabase
                    .from('deviation_reports')
                    .select('id, protocol_title, report_submission_date')
                    .order('report_submission_date', { ascending: false })
                    .limit(6);

                const deviItems = (deviData || []).map((d: any) => ({
                    id: `devi-${d.id}`,
                    title: `Deviation submitted: ${d.protocol_title}`,
                    date: d.report_submission_date,
                    raw: d,
                }));


                const { data: propData } = await supabase
                    .from('proposals')
                    .select('id, title, protocol_title, submitted_at, created_at, status')
                    .order('created_at', { ascending: false })
                    .limit(6);

                const propItems = (propData || []).map((p: any) => ({
                    id: `prop-${p.id}`,
                    title: `Proposal${p.status ? ` (${p.status})` : ''}: ${p.title || p.protocol_title || 'Untitled'}`,
                    date: p.submitted_at || p.created_at,
                    raw: p,
                }));

                const sortedDevi = [...deviItems].sort((a: any, b: any) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
                const sortedProp = [...propItems].sort((a: any, b: any) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
                const sortedActs = [...acts].sort((a: any, b: any) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

                const result: any[] = [];
                let remaining = 6;

                const take = (arr: any[], n: number) => {
                    const taken = arr.slice(0, n);
                    result.push(...taken);
                    remaining -= taken.length;
                };

                take(sortedDevi, 2);
                take(sortedProp, 2);

                if (remaining > 0) {
                    let pool = [...sortedDevi, ...sortedProp, ...sortedActs].sort((a: any, b: any) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
                    const existingIds = new Set(result.map((r: any) => r.id));
                    pool = pool.filter((item: any) => !existingIds.has(item.id));
                    result.push(...pool.slice(0, remaining));
                }

                setActivities(result);
                const dls = await getUpcomingDeadlines(6);
                setDeadlines(dls || []);
            } catch (err) {
                console.error('Error loading staff dashboard', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const { user } = useAuth();
    const displayName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'Staff';

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold">Welcome, {displayName}</h1>
                    <p className="text-sm text-gray-500">Overview of current applications and pending actions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="Total Applications" value={totalApplications} icon={FileText} colorClasses="bg-blue-50 text-blue-600 ring-1 ring-blue-200" />
                <Stat label="Applications Pending Review" value={pendingCount} icon={Clock} colorClasses="bg-yellow-50 text-yellow-600 ring-1 ring-yellow-200" />
                <Stat label="Studies Approved" value={approvedCount} icon={CheckCircle2} colorClasses="bg-green-50 text-green-600 ring-1 ring-green-200" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Recent Activities</h2>
                        <span className="text-sm text-gray-500">Latest events</span>
                    </div>
                            {loading ? (
                                <div className="text-gray-500">Loading...</div>
                            ) : activities.length === 0 ? (
                                <div className="text-gray-400">No recent activities.</div>
                            ) : (
                                <>
                                <ul className="space-y-3">
                                    {(() => {
                                        const start = (currentPage - 1) * pageSize;
                                        const visible = activities.slice(start, start + pageSize);
                                        return visible.map((a: any) => {
                                            const isRemoving = removingIds.includes(a.id);
                                            return (
                                                <li
                                                    key={a.id}
                                                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transform transition-all duration-300 ${isRemoving ? 'opacity-0 translate-x-6' : 'opacity-100 translate-x-0'}`}>
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold">📄</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{a.title}</div>
                                                        <div className="text-sm text-gray-500">{new Date(a.date || a.created_at || '').toLocaleString()}</div>
                                                    </div>
                                                    <button
                                                        aria-label="Remove"
                                                        className="text-gray-400 hover:text-red-500 p-1 rounded"
                                                        onClick={() => {
                                                            setRemovingIds(prev => [...prev, a.id]);
                                                            setTimeout(() => {
                                                                setActivities(prev => prev.filter((it: any) => it.id !== a.id));
                                                                setRemovingIds(prev => prev.filter(id => id !== a.id));
                                                            }, 300);
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                </li>
                                            );
                                        });
                                    })()}
                                </ul>

                                {/* Pagination controls */}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-500">Showing {(Math.min(activities.length, currentPage * pageSize) - (currentPage - 1) * pageSize)} of {activities.length}</div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={`px-3 py-1 rounded border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >Prev</button>
                                        <div className="text-sm text-gray-600">{currentPage} / {Math.max(1, Math.ceil(activities.length / pageSize))}</div>
                                        <button
                                            className={`px-3 py-1 rounded border ${currentPage >= Math.ceil(activities.length / pageSize) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(activities.length / pageSize), p + 1))}
                                            disabled={currentPage >= Math.ceil(activities.length / pageSize)}
                                        >Next</button>
                                    </div>
                                </div>
                                </>
                            )}
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Pending Actions</h2>
                        <span className="text-sm text-gray-500">Upcoming deadlines</span>
                    </div>
                    {loading ? (
                        <div className="text-gray-500">Loading...</div>
                    ) : deadlines.length === 0 ? (
                        <div className="text-gray-400">No pending actions.</div>
                    ) : (
                        <ul className="space-y-3">
                            {deadlines.map((d: any) => (
                                <li key={d.id} className="p-3 rounded-lg hover:bg-gray-50 flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-semibold">⏰</div>
                                    <div className="flex-1">
                                        <div className="font-medium">{d.title}</div>
                                        <div className="text-sm text-gray-500">Due: {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : d.due}</div>
                                    </div>
                                    <div>
                                        <button className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm">View</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SDashboard;