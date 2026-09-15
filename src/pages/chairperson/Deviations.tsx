import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../DB';
import { Search, Filter, Eye, FileText, Calendar, Clock, AlertTriangle, CheckCircle, User } from 'lucide-react';


export type Deviation = {
  id: string;
  title: string;
  researcher: string;
  dateReported: string;
  type: string;
  severity: string;
  status: string;
};

// Map DB row to UI row
function mapDeviation(row: any): Deviation {
  const hasSeverity = row.severity && row.severity !== '';
  return {
    id: row.id,
    title: row.protocol_title,
    researcher: row.reported_by,
    dateReported: row.report_submission_date,
    type: row.type || '-',
    severity: hasSeverity ? row.severity : '-',
    status: hasSeverity ? 'Reviewed' : 'Pending / View',
  };
}

const PAGE_SIZE = 5;

const SDeviations = () => {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [typeOptions, setTypeOptions] = useState<string[]>(['All']);
  const navigate = useNavigate();

  const fetchDeviations = useCallback(async () => {
    const { data, error } = await supabase.from('deviation_reports').select('*').order('created_at', { ascending: false });
    if (error) {
      setDeviations([]);
      setTypeOptions(['All']);
    } else {
      setDeviations(data.map(mapDeviation));
      const uniqueTypes = Array.from(new Set(data.map((row: any) => row.type).filter((t: string) => t && t !== '')));
      setTypeOptions(['All', ...uniqueTypes]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDeviations();
  }, [fetchDeviations]);

  // Refetch when window regains focus (user returns from detail page)
  useEffect(() => {
    const onFocus = () => fetchDeviations();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchDeviations]);

  // Real-time subscription to update severity/status instantly
  useEffect(() => {
    const channel = supabase
      .channel('deviation_reports_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deviation_reports' }, (payload: any) => {
        setDeviations(prev => {
          const idx = prev.findIndex(d => d.id === payload.new.id);
            if (idx === -1) return prev; // not in current page yet
            const updatedRow = mapDeviation(payload.new);
            const next = [...prev];
            next[idx] = updatedRow;
            return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);


  const severityOptions = ['All', '-', 'Minor', 'Major',];
  const statusOptions = ['All', 'Pending / View', 'Reviewed'];

  // Filter para sa deviations
  const filtered = deviations.filter(dev => {
    const matchesSearch = dev.title.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || dev.severity === severityFilter;
    const matchesType = typeFilter === 'All' || dev.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || dev.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

  useEffect(() => {
    // Reset to page 1 if filters/search change and current page is out of range
    if (page > totalPages) setPage(1);
  }, [filtered.length, totalPages]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Deviation Reports</h1>
          <p className="mt-2 text-gray-600">
            Review and manage deviation reports submitted by researchers
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Severity Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {severityOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt === 'All' ? 'All Severities' : opt === '-' ? 'Unassigned' : opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
        {/* Deviations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Deviation Reports ({filtered.length})
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading deviations...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No deviations found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {search || severityFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'All'
                          ? 'Try adjusting your filters to see more results.'
                          : 'No deviation reports have been submitted yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((dev) => (
                    <tr key={dev.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {dev.title}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <User className="w-4 h-4 mr-1" />
                              <span>{dev.researcher}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {dev.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                          dev.severity === 'Minor' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : dev.severity === 'Major'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {dev.severity === 'Minor' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : dev.severity === 'Major' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {dev.severity === '-' ? 'Unassigned' : dev.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {new Date(dev.dateReported).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/chairperson/deviations/${dev.id}`)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {dev.status === 'Reviewed' ? 'View' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center py-6">
          <button
            className={`px-2 py-1 rounded-full mx-2 text-gray-400 hover:text-gray-600 focus:outline-none ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handlePrev}
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
            onClick={handleNext}
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

export default SDeviations;