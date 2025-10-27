import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listFinalReports } from '../../services/finalReportService';
import type { FinalReport, FinalReportStatus } from '../../types/finalReport';
import { FileText, Search, RefreshCw, ChevronLeft, ChevronRight, Filter, Eye } from 'lucide-react';
import { supabase } from '../../DB';

interface LocalFinalReport extends FinalReport {}

const statusBadge: Record<FinalReportStatus, string> = {
  'Pending Review': 'bg-gray-100 text-gray-800 border border-gray-300',
  'Under Review': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Requires Revision': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'Approved': 'bg-green-50 text-green-700 border border-green-200',
  'Rejected': 'bg-red-50 text-red-700 border border-red-200',
};

const ManageFinalReports: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<LocalFinalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | FinalReportStatus>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  async function load() {
    setLoading(true);
    const { data } = await listFinalReports({ status: statusFilter, search });
    const reports = (data as any) || [];
    
    // Fetch researcher names for all reports
    if (reports.length > 0) {
      const researcherIds = [...new Set(reports.map((r: any) => r.researcher_id).filter(Boolean))];
      
      if (researcherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, fname, lname')
          .in('id', researcherIds);
        
        if (profiles) {
          // Map researcher names to reports
          const enrichedReports = reports.map((report: any) => {
            const profile = profiles.find((p: any) => p.id === report.researcher_id);
            return {
              ...report,
              researcher_name: profile 
                ? `${profile.fname || ''} ${profile.lname || ''}`.trim() || report.researcher_id
                : report.researcher_id
            };
          });
          setItems(enrichedReports);
        } else {
          setItems(reports);
        }
      } else {
        setItems(reports);
      }
    } else {
      setItems(reports);
    }
    
    setCurrentPage(1); // Reset to first page when data changes
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);

  const filtered = items.filter(i => {
    const term = search.toLowerCase();
    const matches = !term || i.title.toLowerCase().includes(term) || (i.researcher_name || '').toLowerCase().includes(term);
    const statusOk = statusFilter === 'All' || i.status === statusFilter;
    return matches && statusOk;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const getStatusIcon = (status: FinalReportStatus) => {
    switch (status) {
      case 'Approved': return '✓';
      case 'Rejected': return '✗';
      case 'Under Review': return '◷';
      case 'Requires Revision': return '⚠';
      default: return '◯';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Final Report Management</h1>
              <p className="text-gray-600 mt-1">Review and adjudicate final study reports submitted after project completion</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && load()} 
                  placeholder="Search by title or researcher name..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value as any)} 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Requires Revision">Requires Revision</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button 
              onClick={load} 
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Reports</div>
            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="text-sm text-blue-700 mb-1">Pending Review</div>
            <div className="text-2xl font-bold text-blue-900">{items.filter(i => i.status === 'Pending Review').length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <div className="text-sm text-yellow-700 mb-1">Under Review</div>
            <div className="text-2xl font-bold text-yellow-900">{items.filter(i => i.status === 'Under Review').length}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <div className="text-sm text-green-700 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-900">{items.filter(i => i.status === 'Approved').length}</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-4">
            <div className="text-sm text-orange-700 mb-1">Needs Revision</div>
            <div className="text-2xl font-bold text-orange-900">{items.filter(i => i.status === 'Requires Revision').length}</div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header with Results Count */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Final Reports
                {filtered.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({filtered.length} {filtered.length === 1 ? 'result' : 'results'})
                  </span>
                )}
              </h3>
              {totalPages > 1 && (
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Report Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Researcher
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                        <p className="text-gray-500 font-medium">Loading final reports...</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && currentItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium mb-1">No final reports found</p>
                        <p className="text-gray-400 text-sm">
                          {search || statusFilter !== 'All' 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'Final reports will appear here once submitted'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && currentItems.map((fr) => (
                  <tr 
                    key={fr.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/chairperson/final-reports/${fr.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {fr.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            Report #{fr.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {fr.researcher_name || fr.researcher_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(fr.submitted_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(fr.submitted_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge[fr.status]}`}>
                        <span className="text-base leading-none">{getStatusIcon(fr.status)}</span>
                        {fr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {fr.outcome || <span className="text-gray-400">Pending</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chairperson/final-reports/${fr.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filtered.length)}</span> of{' '}
                  <span className="font-medium">{filtered.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageFinalReports;
