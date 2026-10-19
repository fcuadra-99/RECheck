import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Eye, FileText } from 'lucide-react';
import { TemplateSubmissionService, type TemplateSubmission } from '@/services/templateSubmissionService';
import { supabase } from '@/DB';

export default function ReviewerTemplateSubmissions() {
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewerId, setReviewerId] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const isStaffRoute = location.pathname.startsWith('/staff/');
  const actorLabel = isStaffRoute ? 'Admin Assistant' : 'Reviewer';
  const detailBaseRoute = isStaffRoute ? '/staff/template-submissions' : '/reviewer/template-submissions';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData.user?.id || '';
        setReviewerId(currentUserId);

        const service = new TemplateSubmissionService();
        const result = await service.getAssignedSubmissionsForReviewer();
        if (result.success) {
          setSubmissions(result.submissions || []);
        } else {
          setSubmissions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    return submissions.filter((submission) => submission.status === statusFilter);
  }, [statusFilter, submissions]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_review: 'bg-sky-100 text-sky-800 border-sky-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      revision_requested: 'bg-orange-100 text-orange-800 border-orange-200',
      needs_revision: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    const icons: Record<string, ReactNode> = {
      pending: <Clock className="w-3 h-3" />,
      in_review: <Eye className="w-3 h-3" />,
      under_review: <Eye className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <Clock className="w-3 h-3" />,
      revision_requested: <Clock className="w-3 h-3" />,
      needs_revision: <Clock className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {icons[status] || <Clock className="w-3 h-3" />}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasReviewerSubmitted = (submission: TemplateSubmission) => {
    if (!reviewerId) return false;
    const reviewerSubmissions = (submission.metadata as any)?.reviewerSubmissions || {};
    return Boolean(reviewerSubmissions[reviewerId]);
  };

  const getAssignedRoleLabel = (submission: TemplateSubmission) => {
    if (!reviewerId) return '-';
    const role = (submission.metadata as any)?.assignedReviewerRoles?.[reviewerId] as string | undefined;
    if (role === 'primary_1') return 'Primary Reviewer 1';
    if (role === 'primary_2') return 'Primary Reviewer 2';
    if (role === 'secretariat') return 'Secretariat Staff';
    return '-';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assigned Post Approval Forms</h1>
          <p className="mt-2 text-gray-600">Review forms assigned by chairperson and submit your {actorLabel.toLowerCase()} updates.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="review-status-filter">
            Filter by Status
          </label>
          <select
            id="review-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_revision">Needs Revision</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Assigned Submissions ({filteredSubmissions.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Researcher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">My Update</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">Loading assigned forms...</td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned forms yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Forms assigned by chairperson will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{submission.template_name}</div>
                            <div className="text-sm text-gray-500">{submission.file_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{submission.researcher_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(submission.submission_date || submission.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(submission.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getAssignedRoleLabel(submission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasReviewerSubmitted(submission) ? (
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
                          onClick={() => navigate(`${detailBaseRoute}/${submission.id}`)}
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
