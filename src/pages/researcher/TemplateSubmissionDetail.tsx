import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../DB';
import AttachmentList from '../../components/AttachmentList';
import { TemplateDownloadService } from '../../services/templateDownloadService';
import EthicsStudyProgressReport from '@/components/forms/REC_FO_0019';
import EthicsStudyReportableNegativeEventReport from '@/components/forms/REC_FO_0021';
import EthicsStudyProtocolAmendmentForm from '@/components/forms/REC_FO_0018';
import EthicsContinuingReviewApplicationForm from '@/components/forms/REC_FO_0023';
import EthicsEarlyStudyTerminationApplicationForm from '@/components/forms/REC_FO_0022';
import { ArrowLeft, FileText, Calendar, CheckCircle, XCircle, AlertCircle, Download, Eye } from 'lucide-react';

interface TemplateSubmission {
  id: string;
  template_type: string;
  original_filename: string;
  file_url: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'in_review' | 'under_review' | 'approved' | 'rejected' | 'needs_revision' | 'revision_requested';
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  digital_signature_status: 'signed' | 'unsigned';
  signature_date?: string;
  submission_notes?: string;
  signature_image?: string;
}

export default function TemplateSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<TemplateSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomFormView, setShowCustomFormView] = useState(false);
  const [customFormLoading, setCustomFormLoading] = useState(false);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [printOnViewOpen, setPrintOnViewOpen] = useState(false);
  const isResearcherLocked = Boolean(submission);

  const template = submission ? TemplateDownloadService.getTemplateByName(submission.template_type) : null;
  const isCustomJsonTemplate = Boolean(
    template?.id &&
      ['progress-report', 'new-event-report', 'protocol-amendment', 'continuing-review', 'early-termination'].includes(template.id)
  );

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
        // Fetch researcher's signature
        let signatureImage = '';
        if (data.researcher_id) {
          const { data: signatureData } = await supabase
            .from('user_signatures')
            .select('signature_image')
            .eq('user_id', data.researcher_id)
            .single();
          
          if (signatureData?.signature_image) {
            signatureImage = signatureData.signature_image;
          }
        }

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
          submission_notes: data.description,
          signature_image: signatureImage
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
      in_review: 'bg-sky-100 text-sky-800 border-sky-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      needs_revision: 'bg-orange-100 text-orange-800 border-orange-200',
      revision_requested: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    const icons = {
      pending: <AlertCircle className="w-4 h-4" />,
      in_review: <Eye className="w-4 h-4" />,
      under_review: <Eye className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      needs_revision: <AlertCircle className="w-4 h-4" />,
      revision_requested: <AlertCircle className="w-4 h-4" />
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

  const handleViewSubmission = async () => {
    if (!submission) return;

    if (!isCustomJsonTemplate) {
      window.open(submission.file_url, '_blank');
      return;
    }

    try {
      setCustomFormLoading(true);
      const response = await fetch(submission.file_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch form data: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      setCustomFormData(parsed && typeof parsed === 'object' ? parsed : {});
      setShowCustomFormView(true);
    } catch (error) {
      console.error('Error loading submitted form:', error);
      alert(`Failed to load submitted form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCustomFormLoading(false);
    }
  };

  const handleDownloadSubmission = async () => {
    if (!submission) return;

    try {
      if (!isCustomJsonTemplate) {
        const response = await fetch(submission.file_url);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const fileName = submission.original_filename || 'download';
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
        return;
      }

      const response = await fetch(submission.file_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch form data: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      setCustomFormData(parsed && typeof parsed === 'object' ? parsed : {});
      setPrintOnViewOpen(true);
      setShowCustomFormView(true);
    } catch (error) {
      console.error('Error downloading submission:', error);
      alert(`Failed to download submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (!showCustomFormView || !printOnViewOpen) return;

    const timer = window.setTimeout(() => {
      window.print();
      setPrintOnViewOpen(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [showCustomFormView, printOnViewOpen]);

  useEffect(() => {
    if (showCustomFormView) {
      document.body.classList.add('form-print-active');
    } else {
      document.body.classList.remove('form-print-active');
    }

    return () => {
      document.body.classList.remove('form-print-active');
    };
  }, [showCustomFormView]);

  const renderCustomForm = (formData: Record<string, any> = customFormData) => {
    if (!submission || !template?.id) return null;

    const commonProps = {
      proposalId: 0,
      protocolCode: formData.protocolCodeValue || formData.controlNo || '',
      researcherName: formData.nameResearcher || formData.principalInvestigator || submission.submitted_by,
      proposalTitle: formData.titleOfStudy || formData.studyProtocolTitle || submission.template_type,
      formName: submission.original_filename,
      savedData: formData,
      onSave: undefined,
    };

    if (template.id === 'progress-report') {
      return <EthicsStudyProgressReport {...commonProps} />;
    }

    if (template.id === 'new-event-report') {
      return <EthicsStudyReportableNegativeEventReport {...commonProps} />;
    }

    if (template.id === 'protocol-amendment') {
      return <EthicsStudyProtocolAmendmentForm {...commonProps} />;
    }

    if (template.id === 'continuing-review') {
      return <EthicsContinuingReviewApplicationForm {...commonProps} />;
    }

    if (template.id === 'early-termination') {
      return <EthicsEarlyStudyTerminationApplicationForm {...commonProps} />;
    }

    return null;
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

  if (showCustomFormView && submission) {
    return (
      <div className="min-h-screen bg-gray-100 form-print-root">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Submitted Form View: {submission.template_type}</div>
            <button
              onClick={() => setShowCustomFormView(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Details
            </button>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4 print:py-0 print:px-0 print:bg-white form-print-shell">
          <div className="max-w-7xl mx-auto print:mx-0 print:max-w-none">
            <div style={{ pointerEvents: 'none' }}>
              {renderCustomForm()}
            </div>
          </div>
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
                  onClick={handleViewSubmission}
                  disabled={customFormLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {customFormLoading ? 'Loading...' : isCustomJsonTemplate ? 'View Form' : 'View PDF'}
                </button>
                <button
                  onClick={handleDownloadSubmission}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>

            {isResearcherLocked && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-lg font-medium text-yellow-900 mb-2">Editing Locked</h2>
                <p className="text-sm text-yellow-800">
                  You have already submitted your input. This form is now view-only.
                </p>
              </div>
            )}

            {/* Submission Notes */}
            {submission.submission_notes && submission.status !== 'needs_revision' && (
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
