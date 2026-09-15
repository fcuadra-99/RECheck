import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { researcherHistoryService } from '../../services/researcherHistoryService';
import type { ProposalSummary, ResearcherHistoryFilters } from '../../types/researcherHistory';
import { 
  Eye, 
  FileText, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  Download,
  TrendingUp,
  Archive,
  Users
} from 'lucide-react';

export default function ResearcherHistory() {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [proposalStatuses, setProposalStatuses] = useState<Record<number, { status: string; isCompleted: boolean }>>({});

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const filters: ResearcherHistoryFilters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        searchTerm: searchTerm || undefined
      };

      const data = await researcherHistoryService.getAllProposals(filters);
      setProposals(data);

      // Fetch detailed status for visible proposals only (to improve performance)
      const statusMap: Record<number, { status: string; isCompleted: boolean }> = {};
      
      // Only fetch for the first page initially
      const proposalsToCheck = data.slice(0, itemsPerPage);
      
      await Promise.all(
        proposalsToCheck.map(async (proposal) => {
          try {
            const history = await researcherHistoryService.getComprehensiveHistory(proposal.proposal_id);
            if (history) {
              // Check if all phases are completed
              const allPhasesCompleted = history.phases.every(p => p.status === 'Completed');
              
              if (allPhasesCompleted) {
                statusMap[proposal.proposal_id] = { status: 'Completed', isCompleted: true };
              } else {
                // Find current phase (first In Progress phase)
                const currentPhase = history.phases.find(p => p.status === 'In Progress');
                if (currentPhase) {
                  statusMap[proposal.proposal_id] = { status: currentPhase.phase_name, isCompleted: false };
                } else {
                  // Use database status as fallback
                  statusMap[proposal.proposal_id] = { status: proposal.current_status, isCompleted: proposal.completed };
                }
              }
            } else {
              // Fallback to database status
              statusMap[proposal.proposal_id] = { status: proposal.current_status, isCompleted: proposal.completed };
            }
          } catch (error) {
            console.error(`Error fetching status for proposal ${proposal.proposal_id}:`, error);
            statusMap[proposal.proposal_id] = { status: proposal.current_status, isCompleted: proposal.completed };
          }
        })
      );
      
      setProposalStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const getStatusBadge = (proposalId: number, fallbackStatus: string) => {
    // Get computed status from the map, or use fallback
    const statusInfo = proposalStatuses[proposalId];
    const status = statusInfo?.status || fallbackStatus;
    const isCompleted = statusInfo?.isCompleted || false;

    // If status is "Completed", show special styling
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }

    const styles: Record<string, string> = {
      'Phase 1: Manuscript Submission': 'bg-blue-100 text-blue-800 border-blue-200',
      'Phase 2: Risk Assessment': 'bg-purple-100 text-purple-800 border-purple-200',
      'Phase 3: Forms Submission': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Phase 4: Deployment Queue': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Phase 5: Documents Review': 'bg-orange-100 text-orange-800 border-orange-200',
      'Phase 6: Data Collection & Reporting': 'bg-teal-100 text-teal-800 border-teal-200',
      'Phase 7: Final Report Submission': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Send Manuscript': 'bg-blue-100 text-blue-800 border-blue-200',
      'Check Manuscript': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Risk Assessment': 'bg-purple-100 text-purple-800 border-purple-200',
      'Send Forms': 'bg-blue-100 text-blue-800 border-blue-200',
      'Forms Check': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Deploy Queue': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Assign Review': 'bg-orange-100 text-orange-800 border-orange-200',
      'Proposal Review': 'bg-amber-100 text-amber-800 border-amber-200',
      'Data Collection': 'bg-green-100 text-green-800 border-green-200',
      'Archive Files': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons: Record<string, React.ReactNode> = {
      'Send Manuscript': <FileText className="w-3 h-3" />,
      'Check Manuscript': <Clock className="w-3 h-3" />,
      'Risk Assessment': <AlertCircle className="w-3 h-3" />,
      'Data Collection': <TrendingUp className="w-3 h-3" />,
      'Archive Files': <Archive className="w-3 h-3" />
    };

    const defaultStyle = 'bg-gray-100 text-gray-800 border-gray-200';
    const defaultIcon = <Clock className="w-3 h-3" />;

    // Shorten phase names for display
    const displayStatus = status.replace('Phase 1: ', '').replace('Phase 2: ', '').replace('Phase 3: ', '')
      .replace('Phase 4: ', '').replace('Phase 5: ', '').replace('Phase 6: ', '').replace('Phase 7: ', '');

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || defaultStyle}`}>
        {icons[status] || defaultIcon}
        {displayStatus}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      'External': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Graduate': 'bg-violet-100 text-violet-800 border-violet-200',
      'Undergraduate': 'bg-sky-100 text-sky-800 border-sky-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles[category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {category}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination
  const totalPages = Math.ceil(proposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = proposals.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Statistics - use computed statuses where available
  const stats = {
    total: proposals.length,
    completed: proposals.filter(p => {
      const statusInfo = proposalStatuses[p.proposal_id];
      return statusInfo ? statusInfo.isCompleted : p.completed;
    }).length,
    inProgress: proposals.filter(p => {
      const statusInfo = proposalStatuses[p.proposal_id];
      return statusInfo ? !statusInfo.isCompleted : !p.completed;
    }).length,
    external: proposals.filter(p => p.category === 'External').length,
    graduate: proposals.filter(p => p.category === 'Graduate').length,
    undergraduate: proposals.filter(p => p.category === 'Undergraduate').length
  };

  const handleExportToExcel = () => {
    try {
      // Map proposals data into a clean structure for the spreadsheet
      const exportData = proposals.map((proposal) => {
        const statusInfo = proposalStatuses[proposal.proposal_id];
        const status = statusInfo?.status || proposal.current_status;
        const isCompleted = statusInfo?.isCompleted || proposal.completed;
        const displayStatus = isCompleted ? 'Completed' : status;

        return {
          'Proposal ID': `#${proposal.proposal_id}`,
          'Protocol Code': proposal.protocol_code || 'N/A',
          'Proposal Title': proposal.proposal_title,
          'Researcher Name': proposal.researcher_name,
          'Category': proposal.category, // External, Graduate, Undergraduate
          'Assigned Reviewers': proposal.reviewer_names && proposal.reviewer_names.length > 0 ? proposal.reviewer_names.join(', ') : 'Unassigned',
          'Current Status': displayStatus,
          'Submission Date': formatDate(proposal.submission_date),
          'Last Updated': formatDate(proposal.last_updated),
        };
      });

      // Create sheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Researcher History');

      // Adjust column widths automatically
      const maxColWidths = [
        { wch: 12 }, // Proposal ID
        { wch: 18 }, // Protocol Code
        { wch: 40 }, // Proposal Title
        { wch: 25 }, // Researcher Name
        { wch: 15 }, // Category
        { wch: 30 }, // Assigned Reviewers
        { wch: 25 }, // Current Status
        { wch: 18 }, // Submission Date
        { wch: 18 }, // Last Updated
      ];
      worksheet['!cols'] = maxColWidths;

      // Write and download file
      XLSX.writeFile(workbook, 'Researcher_History_Report.xlsx');
    } catch (error) {
      console.error('Error exporting researcher history to Excel:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Researcher History</h1>
              <p className="text-gray-600">
                Comprehensive view of all researchers' progress through the research process
              </p>
            </div>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">External</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.external}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Graduate</p>
                  <p className="text-2xl font-bold text-violet-600">{stats.graduate}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Undergrad</p>
                  <p className="text-2xl font-bold text-sky-600">{stats.undergraduate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search researcher or title..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Send Manuscript">Send Manuscript</option>
              <option value="Check Manuscript">Check Manuscript</option>
              <option value="Risk Assessment">Risk Assessment</option>
              <option value="Send Forms">Send Forms</option>
              <option value="Forms Check">Forms Check</option>
              <option value="Deploy Queue">Deploy Queue</option>
              <option value="Assign Review">Assign Review</option>
              <option value="Proposal Review">Proposal Review</option>
              <option value="Data Collection">Data Collection</option>
              <option value="Archive Files">Archive Files</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="External">External</option>
              <option value="Graduate">Graduate</option>
              <option value="Undergraduate">Undergraduate</option>
            </select>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No proposals found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposal ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Protocol Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Researcher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reviewers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((proposal) => (
                      <tr key={proposal.proposal_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            #{proposal.proposal_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {proposal.protocol_code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {proposal.proposal_title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{proposal.researcher_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="max-w-[150px] truncate" title={proposal.reviewer_names?.join(', ') || 'Unassigned'}>
                            {proposal.reviewer_names && proposal.reviewer_names.length > 0 ? (
                              <div className="flex items-center gap-1.5 text-sm text-gray-900">
                                <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{proposal.reviewer_names.join(', ')}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getCategoryBadge(proposal.category)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(proposal.proposal_id, proposal.current_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(proposal.submission_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/chairperson/researcher-history/${proposal.proposal_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View History
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, proposals.length)}</span> of{' '}
                      <span className="font-medium">{proposals.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
