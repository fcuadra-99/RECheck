import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Eye, FileText, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ResearcherDeviationReport } from '../../types/deviationReport';

const ResolutionReviews = () => {
    const [resolutions, setResolutions] = useState<ResearcherDeviationReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;
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
    // Only 5 items per page for cleaner pagination

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
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Resolution Reviews</h1>
                    <p className="mt-2 text-gray-600">
                        Review and manage deviation report resolutions from researchers
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by title or researcher..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Resolutions Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Resolution Reviews ({filtered.length})
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
                                        Severity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Attachments
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timeline
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
                                                <span className="ml-3 text-gray-600">Loading resolutions...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No resolutions found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {search || statusFilter !== 'All'
                                                    ? 'Try adjusting your filters to see more results.'
                                                    : 'No resolution reviews are available at this time.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((res) => {
                                        const statusDisplay = getStatusDisplay(res.resolution_status || '');
                                        const daysSince = res.resolution_submission_date 
                                            ? Math.floor((Date.now() - new Date(res.resolution_submission_date).getTime()) / (1000 * 60 * 60 * 24))
                                            : 0;
                                        const hasAttachments = res.resolution_supporting_documents && res.resolution_supporting_documents.length > 0;

                                        return (
                                            <tr key={res.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FileText className="w-8 h-8 text-blue-600 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {res.protocol_title}
                                                            </div>
                                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                                <span className="mr-2">By {res.reported_by}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                                                        res.severity === 'Minor' 
                                                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                                            : 'bg-red-100 text-red-800 border-red-200'
                                                    }`}>
                                                        {res.severity === 'Minor' ? 
                                                            <CheckCircle className="w-3 h-3" /> : 
                                                            <AlertTriangle className="w-3 h-3" />
                                                        }
                                                        {res.severity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {hasAttachments ? (
                                                        <div className="flex items-center text-blue-600">
                                                            <FileText className="w-4 h-4 mr-1" />
                                                            <span className="text-sm font-medium">
                                                                {res.resolution_supporting_documents?.length || 0} files
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">No attachments</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusDisplay.color}`}>
                                                        {res.resolution_status === 'resolved' ? 
                                                            <CheckCircle className="w-3 h-3" /> : 
                                                            <Clock className="w-3 h-3" />
                                                        }
                                                        {statusDisplay.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm text-gray-900">
                                                                {res.resolution_submission_date 
                                                                    ? new Date(res.resolution_submission_date).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })
                                                                    : '-'
                                                                }
                                                            </div>
                                                            <div className={`text-xs font-medium ${daysSince > 7 ? 'text-red-600' : daysSince > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {daysSince} days ago
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => navigate(`/chairperson/resolution-detail/${res.id}`)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
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
            </div>
        </div>
    );
};

export default ResolutionReviews;
