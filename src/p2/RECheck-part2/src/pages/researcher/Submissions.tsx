import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuth from '@/hooks/useAuth';
import { Search, Filter, Eye, FileText, Calendar, Clock, AlertTriangle, CheckCircle, User, AlertCircle } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Deviation Reports</h1>
                    <p className="mt-2 text-gray-600">
                        Track and manage your submitted deviation reports and their status
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                {typeOptions.map(opt => (
                                    <option key={opt} value={opt}>
                                        {opt === 'All' ? 'All Types' : opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt} value={opt}>
                                        {opt === 'All' ? 'All Statuses' : opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                {/* Submissions Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            My Submissions ({filtered.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Study Information
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type & Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Severity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Review Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Resolution
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="ml-3 text-gray-600">Loading submissions...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {search || typeFilter !== 'All' || statusFilter !== 'All'
                                                    ? 'Try adjusting your filters to see more results.'
                                                    : 'You have not submitted any deviation reports yet.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((sub) => {
                                        const resolutionStatus = getResolutionStatusDisplay(sub);
                                        const actionNeeded = getActionNeeded(sub);
                                        
                                        return (
                                            <tr key={sub.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FileText className="w-8 h-8 text-blue-600 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {sub.protocol_title}
                                                            </div>
                                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                                <User className="w-4 h-4 mr-1" />
                                                                <span>{sub.reported_by}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-1">
                                                            {sub.type}
                                                        </span>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            <span>
                                                                {new Date(sub.report_submission_date).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                                                        sub.severity === 'Minor' 
                                                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                                            : sub.severity === 'Major'
                                                            ? 'bg-red-100 text-red-800 border-red-200'
                                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                                    }`}>
                                                        {sub.severity === 'Minor' ? (
                                                            <CheckCircle className="w-3 h-3" />
                                                        ) : sub.severity === 'Major' ? (
                                                            <AlertTriangle className="w-3 h-3" />
                                                        ) : (
                                                            <Clock className="w-3 h-3" />
                                                        )}
                                                        {sub.severity || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                                                        sub.severity && sub.severity !== '' 
                                                            ? 'bg-green-100 text-green-800 border-green-200'
                                                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                    }`}>
                                                        {sub.severity && sub.severity !== '' ? (
                                                            <CheckCircle className="w-3 h-3" />
                                                        ) : (
                                                            <Clock className="w-3 h-3" />
                                                        )}
                                                        {sub.severity && sub.severity !== '' ? 'Reviewed' : 'Pending Review'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {resolutionStatus ? (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${resolutionStatus.color}`}>
                                                            {resolutionStatus.text === 'Resolved' ? (
                                                                <CheckCircle className="w-3 h-3" />
                                                            ) : resolutionStatus.text === 'In Progress' ? (
                                                                <Clock className="w-3 h-3" />
                                                            ) : (
                                                                <AlertCircle className="w-3 h-3" />
                                                            )}
                                                            {resolutionStatus.text}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Not applicable</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {sub.severity && sub.severity !== '' ? (
                                                        <button
                                                            className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
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
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            {actionNeeded}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">No action available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Pagination Controls */}
                <div className="flex justify-center items-center py-6">
                    <button
                        className={`px-2 py-1 rounded-full mx-2 text-gray-400 hover:text-gray-600 focus:outline-none ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                    >
                        {'<'}
                    </button>
                    <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-medium text-base select-none">
                        {page}
                    </span>
                    <button
                        className={`px-2 py-1 rounded-full mx-2 text-gray-400 hover:text-gray-600 focus:outline-none ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Next page"
                    >
                        {'>'}
                    </button>
                </div>

                {/* Feedback Modal */}
                {selectedFeedback && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 min-w-[350px] max-w-lg relative mx-4">
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
                                onClick={() => setSelectedFeedback(null)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                            <div className="flex items-center mb-4">
                                <FileText className="w-6 h-6 text-blue-600 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Deviation Review Feedback</h3>
                            </div>
                            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                                {selectedFeedback.review}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RSubmissions;