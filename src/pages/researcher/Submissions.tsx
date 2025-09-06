import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuth from '@/hooks/useAuth';
import type { ResearcherDeviationReport } from '../../types/deviationReport';

const RSubmissions = () => {
    const [submissions, setSubmissions] = useState<ResearcherDeviationReport[]>([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<{ id: string; review: string } | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;
    const [typeOptions, setTypeOptions] = useState<string[]>(['All']);

    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
      
        const fetch = async () => {
            try {
                const email = user?.email;
                if (!email) {
                    setSubmissions([]);
                    setTypeOptions(['All']);
                    setLoading(false);
                    return;
                }

               
                const candidates: string[] = [email];
                const metaAny: any = (user as any)?.user_metadata;
                if (metaAny) {
                    if (metaAny.full_name) candidates.push(metaAny.full_name);
                    if (metaAny.name) candidates.push(metaAny.name);
                }
                const localPart = email.split('@')[0];
                if (localPart) candidates.push(localPart);

                const { data, error } = await supabase
                    .from('deviation_reports')
                    .select('*')
                    .in('reported_by', candidates)
                    .order('report_submission_date', { ascending: false });

                if (error) {
                    console.error('Error fetching researcher submissions', error);
                    setSubmissions([]);
                } else {
                    console.debug('Initial fetch result count:', (data || []).length, 'candidates:', candidates);
                    let rows = data || [];

                   
                    if ((!rows || rows.length === 0)) {
                        console.debug('No rows found with .in(); fetching all reports as fallback');
                        const { data: allData, error: allErr } = await supabase.from('deviation_reports').select('*').order('report_submission_date', { ascending: false });
                        if (allErr) {
                            console.error('Error fetching all deviation reports for fallback', allErr);
                            rows = [];
                        } else {
                            const lowerCandidates = candidates.map(c => c.toLowerCase());
                            rows = (allData || []).filter((r: any) => {
                                const rep = (r.reported_by || '').toString().toLowerCase();
                                return lowerCandidates.some(c => rep.includes(c));
                            });
                            console.debug('Fallback filtered rows count:', rows.length);
                        }
                    }

                    setSubmissions(rows || []);
                    const uniqueTypes = Array.from(new Set((rows || []).map((row: any) => row.type).filter((t: string) => t && t !== '')));
                    setTypeOptions(['All', ...uniqueTypes]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [user]);

   
    const statusOptions = ['All', 'Pending / View', 'Reviewed'];
    const filtered = submissions.filter(sub => {
        const matchesSearch = sub.protocol_title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || (sub.severity && sub.severity !== '' ? 'Reviewed' : 'Pending / View') === statusFilter;
        const matchesType = typeFilter === 'All' || sub.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [filtered.length, totalPages]);

    // Helper to determine if feedback exists
    const hasFeedback = (sub: any) => {
        if (sub.severity === 'Major') {
            return sub.corrective_action_feedback && sub.corrective_action_feedback.trim() !== '';
        }
        return sub.review && sub.review.trim() !== '';
    };

    // Helper to get resolution status display
    const getResolutionStatusDisplay = (sub: any) => {
        if (!sub.resolution_status) return null;
        
        const statusMap: { [key: string]: { text: string; color: string } } = {
            'pending': { text: 'Pending', color: 'text-gray-600 bg-gray-100 border-gray-300' },
            'in_progress': { text: 'In Progress', color: 'text-yellow-700 bg-yellow-100 border-yellow-300' },
            'resolved': { text: 'Resolved', color: 'text-green-700 bg-green-100 border-green-300' },
            'rejected': { text: 'Rejected', color: 'text-red-700 bg-red-100 border-red-300' }
        };
        
        return statusMap[sub.resolution_status] || statusMap['pending'];
    };

    // Helper to determine action needed
    const getActionNeeded = (sub: any) => {
        if (!sub.severity || sub.severity === '') return null;
        
        if (sub.resolution_status === 'resolved') return 'Completed';
        if (sub.resolution_status === 'in_progress') return 'Review Response';
        if (hasFeedback(sub) && (!sub.resolution_status || sub.resolution_status === 'pending')) {
            return 'Action Required';
        }
        return 'View Feedback';
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-2 md:px-6">
            <h1 className="text-[30px] font-medium p-4">Deviation Submitted</h1>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 mb-4">
                <input
                    type="text"
                    className="w-full md:w-1/3 rounded-xl border border-gray-200 px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Search Deviation by Title"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                    <select
                        className="rounded-full px-4 py-1 border border-gray-200 bg-white text-sm"
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                    >
                        {typeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <select
                        className="rounded-full px-4 py-1 border border-gray-200 bg-white text-sm"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto mt-6">
                <table className="min-w-full text-sm border rounded-xl bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Study/Proposal Title</th>
                            <th className="px-4 py-3 text-left font-medium">Researcher</th>
                            <th className="px-4 py-3 text-left font-medium">Date Reported</th>
                            <th className="px-4 py-3 text-left font-medium">Type</th>
                            <th className="px-4 py-3 text-left font-medium">Severity</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Resolution</th>
                            <th className="px-4 py-3 text-left font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center text-gray-500 py-8">Loading submissions...</td></tr>
                        ) : paginated.length === 0 ? (
                            <tr><td colSpan={8} className="text-center text-gray-400 py-8">No submissions found.</td></tr>
                        ) : (
                            paginated.map((sub) => {
                                const resolutionStatus = getResolutionStatusDisplay(sub);
                                const actionNeeded = getActionNeeded(sub);
                                
                                return (
                                    <tr key={sub.id} className="even:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-blue-700 cursor-pointer hover:underline">{sub.protocol_title}</td>
                                        <td className="px-4 py-3">{sub.reported_by}</td>
                                        <td className="px-4 py-3 text-blue-700/80 font-medium">{new Date(sub.report_submission_date).toISOString().slice(0, 10)}</td>
                                        <td className="px-4 py-3 font-semibold"><span className="bg-gray-100 px-2 py-1 rounded-md">{sub.type}</span></td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold bg-gray-100
                                                    ${sub.severity === 'Minor' ? 'border border-blue-500 text-blue-700' : ''}
                                                    ${sub.severity === 'Major' ? 'border border-red-500 text-red-700' : ''}
                                                `}
                                            >
                                                {sub.severity || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-5 py-2 rounded-lg font-semibold border transition text-sm focus:outline-none bg-white text-blue-700 border-blue-400 whitespace-nowrap`}>{sub.severity && sub.severity !== '' ? 'Reviewed' : 'Pending / View'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {resolutionStatus ? (
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${resolutionStatus.color}`}>
                                                    {resolutionStatus.text}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {sub.severity && sub.severity !== '' ? (
                                                <button
                                                    className={`px-3 py-1 rounded font-semibold transition text-xs border ${
                                                        actionNeeded === 'Action Required' 
                                                            ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' 
                                                            : actionNeeded === 'Review Response'
                                                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
                                                            : actionNeeded === 'Completed'
                                                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                                            : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                                                    }`}
                                                    onClick={() => navigate(`/researcher/feedback/${sub.id}`)}
                                                >
                                                    {actionNeeded}
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination controls */}
            <div className="flex justify-center items-center gap-4 mt-8">
                <button
                    className="text-gray-400 text-xl px-2 py-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                >
                    {'<'}
                </button>
                <span className="bg-gray-200 text-gray-700 rounded-full px-4 py-1 font-semibold text-lg">{page}</span>
                <button
                    className="text-gray-400 text-xl px-2 py-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                >
                    {'>'}
                </button>
            </div>

            {/* Feedback Modal */}
            {selectedFeedback && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[350px] max-w-lg relative">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setSelectedFeedback(null)}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <div className="font-bold text-lg mb-2 text-blue-700">Deviation Review Feedback</div>
                        <div className="text-gray-700 whitespace-pre-line">{selectedFeedback.review}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RSubmissions;