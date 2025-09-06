import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ResearcherDeviationReport } from '../../types/deviationReport';

const ResolutionReviews = () => {
    const [resolutions, setResolutions] = useState<ResearcherDeviationReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    const navigate = useNavigate();

    useEffect(() => {
        fetchResolutions();
    }, []);

    const fetchResolutions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('deviation_reports')
                .select('*')
                .in('resolution_status', ['in_progress', 'resolved'])
                .order('resolution_submission_date', { ascending: false });

            if (error) {
                console.error('Error fetching resolutions:', error);
                setResolutions([]);
            } else {
                setResolutions(data || []);
            }
        } catch (err) {
            console.error('Error:', err);
            setResolutions([]);
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = ['All', 'In Progress', 'Resolved'];
    
    const filtered = resolutions.filter(res => {
        const matchesSearch = res.protocol_title.toLowerCase().includes(search.toLowerCase()) ||
                            res.reported_by.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || 
                            (statusFilter === 'In Progress' && res.resolution_status === 'in_progress') ||
                            (statusFilter === 'Resolved' && res.resolution_status === 'resolved');
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [filtered.length, totalPages]);

    const getStatusDisplay = (status: string) => {
        const statusMap = {
            'in_progress': { text: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
            'resolved': { text: 'Resolved', color: 'bg-green-100 text-green-700 border-green-300' }
        };
        return statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-700' };
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-black flex items-center gap-2">
                <span className="inline-block w-2 h-8 bg-pink-600 rounded-full mr-2"></span>
                Resolution Reviews
            </h1>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                <input
                    type="text"
                    className="w-full md:w-1/3 rounded-xl border border-gray-200 px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Search by Title or Researcher"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
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

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-xl bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Study Title</th>
                            <th className="px-4 py-3 text-left font-medium">Researcher</th>
                            <th className="px-4 py-3 text-left font-medium">Severity</th>
                            <th className="px-4 py-3 text-left font-medium">Attachments</th>
                            <th className="px-4 py-3 text-left font-medium">Resolution Status</th>
                            <th className="px-4 py-3 text-left font-medium">Submitted Date</th>
                            <th className="px-4 py-3 text-left font-medium">Days Since</th>
                            <th className="px-4 py-3 text-left font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center text-gray-500 py-8">Loading resolutions...</td></tr>
                        ) : paginated.length === 0 ? (
                            <tr><td colSpan={8} className="text-center text-gray-400 py-8">No resolutions found.</td></tr>
                        ) : (
                            paginated.map((res) => {
                                const statusDisplay = getStatusDisplay(res.resolution_status || '');
                                const daysSince = res.resolution_submission_date 
                                    ? Math.floor((Date.now() - new Date(res.resolution_submission_date).getTime()) / (1000 * 60 * 60 * 24))
                                    : 0;
                                const hasAttachments = res.resolution_supporting_documents && res.resolution_supporting_documents.length > 0;

                                return (
                                    <tr key={res.id} className="even:bg-gray-50 hover:bg-blue-50">
                                        <td className="px-4 py-3 font-medium text-blue-700">{res.protocol_title}</td>
                                        <td className="px-4 py-3">{res.reported_by}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                res.severity === 'Minor' 
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                                    : 'bg-red-100 text-red-700 border border-red-300'
                                            }`}>
                                                {res.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {hasAttachments ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                                        <svg className="w-2 h-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        {res.resolution_supporting_documents?.length || 0}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusDisplay.color}`}>
                                                {statusDisplay.text}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {res.resolution_submission_date 
                                                ? new Date(res.resolution_submission_date).toLocaleDateString()
                                                : '-'
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`font-medium ${daysSince > 7 ? 'text-red-600' : daysSince > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                {daysSince} days
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => navigate(`/staff/resolution-detail/${res.id}`)}
                                                className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-xs"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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
        </div>
    );
};

export default ResolutionReviews;
