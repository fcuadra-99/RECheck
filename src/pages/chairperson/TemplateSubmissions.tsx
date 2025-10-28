import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../DB';
import { TemplateSubmissionService } from '../../services/templateSubmissionService';
import { Eye, FileText, Calendar, User, CheckCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';

interface TemplateSubmission {
  id: string;
  template_type: string;
  original_filename: string;
  file_url: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_revision';
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  digital_signature_status: 'signed' | 'unsigned';
  signature_date?: string;
}

export default function TemplateSubmissions() {
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>('all');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Chairperson fetching submissions...');
      
      // Debug: Check current user and role
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user for chairperson view:', user);
      
      if (user) {
        // Check user's role from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log('Database query result - data:', userData);
        console.log('Database query result - error:', userError);
      }
      
      // DEBUGGING: Try direct supabase query first
      console.log('🔍 Testing direct supabase query...');
      const { data: directData, error: directError } = await supabase
        .from('template_submissions')
        .select('*');
      
      console.log('🔍 Direct query result:', { directData, directError });
      console.log('🔍 Direct data length:', directData?.length);
      
      // Test with count to see if there are any records at all
      const { count, error: countError } = await supabase
        .from('template_submissions')
        .select('*', { count: 'exact', head: true });
      
      console.log('🔍 Total count in table:', count);
      console.log('🔍 Count error:', countError);
      
      // Use the proper service method for chairperson to get all submissions
      const templateService = new TemplateSubmissionService();
      const result = await templateService.getAllSubmissions({
        status: statusFilter === 'all' ? undefined : statusFilter
      });

      if (!result.success) {
        console.error('Error fetching submissions:', result.error);
        setSubmissions([]);
        return;
      }

      const data = result.submissions || [];
      console.log('Fetched submissions from service:', data);
      console.log('Data length:', data.length);
      
      if (data && data.length > 0) {
        // Transform service data to match component interface
        const transformedData: TemplateSubmission[] = data.map((item: any) => ({
          id: item.id,
          template_type: item.template_name,
          original_filename: item.file_name,
          file_url: item.file_url,
          submitted_by: item.researcher_name,
          submitted_at: item.submission_date || item.created_at,
          status: item.status,
          digital_signature_status: item.researcher_signed_at ? 'signed' : 'unsigned',
          signature_date: item.researcher_signed_at,
          reviewed_by: item.reviewer_name,
          reviewed_at: item.review_date || item.review_comments,
          reviewer_notes: item.review_comments
        }));
        
        console.log('Transformed data for chairperson view:', transformedData);
        setSubmissions(transformedData);
      } else {
        console.log('No submissions found');
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error in fetchSubmissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      needs_revision: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      under_review: <Eye className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <AlertCircle className="w-3 h-3" />,
      needs_revision: <AlertCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.template_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesType = templateTypeFilter === 'all' || submission.template_type === templateTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / itemsPerPage));
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, templateTypeFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const templateTypes = [
    'Protocol Final Report',
    'Progress Report',
    'Report of New Event (RNE)',
    'Protocol Amendment',
    'Continuing Review Application',
    'Early Study Termination'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading forms submission...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forms Submission</h1>
          <p className="mt-2 text-gray-600">
            Review and assess form submissions from researchers
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
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_revision">Needs Revision</option>
              </select>
            </div>

            {/* Template Type Filter */}
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={templateTypeFilter}
                onChange={(e) => setTemplateTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Template Types</option>
                {templateTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Submissions ({filteredSubmissions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.template_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.original_filename}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{submission.submitted_by}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {formatDate(submission.submitted_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/chairperson/template-submissions/${submission.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Link>
                        <button
                          onClick={() => window.open(submission.file_url, '_blank')}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedSubmissions.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' || templateTypeFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No forms submissions have been received yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-center items-center py-6">
          <button
            className={`px-2 py-1 rounded-full mx-2 text-gray-400 hover:text-gray-600 focus:outline-none ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            {'<'}
          </button>
          <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-medium text-base select-none">
            {currentPage}
          </span>
          <button
            className={`px-2 py-1 rounded-full mx-2 text-gray-400 hover:text-gray-600 focus:outline-none ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            {'>'}
          </button>
        </div>
      </div>
    </div>
  );
}
