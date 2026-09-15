import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Eye, FileText } from 'lucide-react';
import { getAssignedFinalReportsForCurrentStaff } from '@/services/finalReportService';
import type { FinalReport } from '@/types/finalReport';
import type { FinalReportAssignment } from '@/services/finalReportService';

export default function AssignedFinalReports() {
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [assignments, setAssignments] = useState<FinalReportAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | string>('All');
  const navigate = useNavigate();
  const location = useLocation();

  const isStaffRoute = location.pathname.startsWith('/staff/');
  const actorLabel = isStaffRoute ? 'Admin Assistant' : 'Reviewer';
  const detailBaseRoute = isStaffRoute ? '/staff/final-reports' : '/reviewer/final-reports';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getAssignedFinalReportsForCurrentStaff();
        if (result.success) {
          setReports((result.reports || []) as FinalReport[]);
          setAssignments((result.assignments || []) as FinalReportAssignment[]);
          setFetchError('');
        } else {
          setReports([]);
          setAssignments([]);
          setFetchError(result.error || 'Failed to load assigned final reports.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredReports = useMemo(() => {
    if (statusFilter === 'All') return reports;
    return reports.filter((report) => report.status === statusFilter);
  }, [statusFilter, reports]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Pending Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
      'Requires Revision': 'bg-orange-100 text-orange-800 border-orange-200',
      Approved: 'bg-green-100 text-green-800 border-green-200',
      Rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const hasSubmitted = (report: FinalReport) => {
    const assignment = assignments.find((item) => item.final_report_id === report.id);
    return assignment?.status === 'submitted';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assigned Final Reports</h1>
          <p className="mt-2 text-gray-600">Process final reports assigned by chairperson and submit your {actorLabel.toLowerCase()} updates.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {fetchError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="final-report-status-filter">
            Filter by Status
          </label>
          <select
            id="final-report-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Requires Revision">Requires Revision</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Assigned Reports ({filteredReports.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Researcher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">My Update</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">Loading assigned final reports...</td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned final reports yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Reports assigned by chairperson will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.title}</div>
                            <div className="text-sm text-gray-500">{report.attachments?.length || 0} attachment(s)</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{report.researcher_name || report.researcher_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(report.submitted_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasSubmitted(report) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`${detailBaseRoute}/${report.id}`)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
