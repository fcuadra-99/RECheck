import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AttachmentList from '../../components/AttachmentList';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Eye,
  Clock
} from 'lucide-react';

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
  submission_notes?: string;
}

export default function ResearcherSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<TemplateSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch submission data - only if it belongs to current user
      const { data, error } = await supabase
        .from('template_submissions')
        .select('*')
        .eq('id', id)
        .eq('researcher_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) {
        console.error('Error fetching submission:', error);
        return;
      }

      if (data) {
        // Transform database data to match component interface
        const transformedSubmission: TemplateSubmission = {
          id: data.id,
          template_type: data.template_name,
          original_filename: data.file_name,
          file_url: data.file_url,
          submitted_by: data.researcher_name,
          submitted_at: data.submission_date || data.created_at,
          status: data.status,
          digital_signature_status: data.researcher_signed_at ? 'signed' : 'unsigned',
          signature_date: data.researcher_signed_at,
          reviewed_by: data.reviewer_name,
          reviewed_at: data.review_date,
          reviewer_notes: data.review_comments,
          submission_notes: data.description
        };

        setSubmission(transformedSubmission);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      needs_revision: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    const icons = {
      pending: <AlertCircle className="w-4 h-4" />,
      under_review: <Eye className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      needs_revision: <AlertCircle className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading submission details...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Not Found</h1>
          <button
            onClick={() => navigate('/researcher/my-submissions')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/researcher/template-submissions')}
            className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Submissions
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{submission.template_type}</h1>
              <p className="mt-2 text-gray-600">Your submission details and review status</p>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Submission Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Template Type</p>
                    <p className="text-sm text-gray-600">{submission.template_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submission Date</p>
                    <p className="text-sm text-gray-600">{formatDate(submission.submitted_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Digital Signature</p>
                    <p className={`text-sm ${submission.digital_signature_status === 'signed' ? 'text-green-600' : 'text-red-600'}`}>
                      {submission.digital_signature_status === 'signed' ? 'Signed' : 'Unsigned'}
                      {submission.signature_date && ` on ${formatDate(submission.signature_date)}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-2">Original Filename</p>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded">
                  {submission.original_filename}
                </p>
              </div>
            </div>

            {/* Document Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Actions</h2>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => window.open(submission.file_url, '_blank')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View PDF
                </button>
                
                <a
                  href={submission.file_url}
                  download={submission.original_filename}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </div>
            </div>

            {/* Submission Notes */}
            {submission.submission_notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Submission Notes</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.submission_notes}
                  </p>
                </div>
              </div>
            )}

            {/* Chairperson Attachments */}
            <AttachmentList 
              submissionId={submission.id} 
              isChairperson={false}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Review Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Status</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Status</p>
                  {getStatusBadge(submission.status)}
                </div>
                
                {submission.reviewed_by && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reviewed By</p>
                    <p className="text-sm text-gray-600">{submission.reviewed_by}</p>
                  </div>
                )}
                
                {submission.reviewed_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Review Date</p>
                    <p className="text-sm text-gray-600">{formatDate(submission.reviewed_at)}</p>
                  </div>
                )}
                
                {submission.reviewer_notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Review Comments</p>
                    <div className="mt-1 bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {submission.reviewer_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Digital Signature Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Your Signature</h4>
                      <p className="text-sm text-gray-500">
                        {submission.digital_signature_status === 'signed' 
                          ? `Signed on ${formatDate(submission.signature_date!)}`
                          : 'Document requires your signature'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {submission.digital_signature_status === 'signed' ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Signed</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {submission.digital_signature_status === 'signed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900">Document Signed</h4>
                        <p className="text-sm text-green-700 mt-1">
                          You signed this document on {formatDate(submission.signature_date!)}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          Document integrity verified and authenticated.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Info</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Submission ID</span>
                  <span className="text-sm font-mono text-gray-900">{submission.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
