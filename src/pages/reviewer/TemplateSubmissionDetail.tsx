import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, Eye, FileText } from 'lucide-react';
import PDFFormFiller from '@/components/PDFFormFiller';
import { supabase } from '@/DB';
import { TemplateDownloadService } from '@/services/templateDownloadService';
import { TemplateSubmissionService } from '@/services/templateSubmissionService';
import { useTemplateFields } from '@/hooks/useTemplateFields';
import EthicsStudyProgressReport from '@/components/forms/REC_FO_0019';
import EthicsStudyReportableNegativeEventReport from '@/components/forms/REC_FO_0021';
import EthicsStudyProtocolNonComplianceReport from '@/components/forms/REC_FO_0020';
import EthicsStudyProtocolAmendmentForm from '@/components/forms/REC_FO_0018';
import EthicsContinuingReviewApplicationForm from '@/components/forms/REC_FO_0023';
import EthicsEarlyStudyTerminationApplicationForm from '@/components/forms/REC_FO_0022';

interface TemplateSubmissionView {
  id: string;
  templateType: string;
  fileName: string;
  fileUrl: string;
  submittedBy: string;
  submittedAt: string;
  status: string;
  metadata?: {
    assignedReviewerIds?: string[];
    assignedReviewerRoles?: Record<string, 'primary_1' | 'primary_2'>;
    reviewerSubmissions?: Record<string, {
      reviewerId: string;
      reviewerName: string;
      fileUrl: string;
      fileName: string;
      comments?: string;
      submittedAt: string;
    }>;
  };
}

export default function ReviewerTemplateSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isStaffRoute = location.pathname.startsWith('/staff/');
  const actorLabel = isStaffRoute ? 'Admin Assistant' : 'Reviewer';
  const baseRoute = isStaffRoute ? '/staff/template-submissions' : '/reviewer/template-submissions';

  const [submission, setSubmission] = useState<TemplateSubmissionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewerId, setReviewerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewerComments, setReviewerComments] = useState('');

  const [showPdfFiller, setShowPdfFiller] = useState(false);
  const [showCustomFormView, setShowCustomFormView] = useState(false);
  const [showCustomFormFiller, setShowCustomFormFiller] = useState(false);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [customFormLoading, setCustomFormLoading] = useState(false);

  const template = submission ? TemplateDownloadService.getTemplateByName(submission.templateType) : null;
  const isCustomJsonTemplate = Boolean(
    template?.id &&
      ['progress-report', 'new-event-report', 'non-compliance-report', 'protocol-amendment', 'continuing-review', 'early-termination'].includes(template.id)
  );

  const { fields: predefinedFields } = useTemplateFields(template?.id || null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        const currentReviewerId = authData.user?.id || '';
        setReviewerId(currentReviewerId);

        const { data, error } = await supabase
          .from('template_submissions')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setSubmission(null);
          return;
        }

        const assignedReviewerIds = (data.metadata?.assignedReviewerIds || []) as string[];
        if (!currentReviewerId || !assignedReviewerIds.includes(currentReviewerId)) {
          setSubmission(null);
          return;
        }

        setSubmission({
          id: data.id,
          templateType: data.template_name,
          fileName: data.file_name,
          fileUrl: data.file_url,
          submittedBy: data.researcher_name,
          submittedAt: data.submission_date || data.created_at,
          status: data.status,
          metadata: data.metadata || {}
        });

        const existing = data.metadata?.reviewerSubmissions?.[currentReviewerId];
        if (existing?.comments) {
          setReviewerComments(existing.comments);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const reviewerSubmission = useMemo(() => {
    if (!submission || !reviewerId) return null;
    const reviewerSubmissions = submission.metadata?.reviewerSubmissions || {};
    return reviewerSubmissions[reviewerId] || null;
  }, [submission, reviewerId]);

  const isReviewerAlreadySubmitted = Boolean(reviewerSubmission);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssignedRoleLabel = () => {
    if (!submission || !reviewerId) return '-';
    const role = submission.metadata?.assignedReviewerRoles?.[reviewerId];
    if (role === 'primary_1') return 'Primary Reviewer 1';
    if (role === 'primary_2') return 'Primary Reviewer 2';
    return '-';
  };

  const handleViewSubmission = async () => {
    if (!submission) return;

    if (!isCustomJsonTemplate) {
      window.open(submission.fileUrl, '_blank');
      return;
    }

    try {
      setCustomFormLoading(true);
      const response = await fetch(submission.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch form data: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      setCustomFormData(parsed && typeof parsed === 'object' ? parsed : {});
      setShowCustomFormView(true);
    } catch (error) {
      alert(`Failed to load submitted form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCustomFormLoading(false);
    }
  };

  const handleOpenFill = async () => {
    if (!submission) return;

    if (!isCustomJsonTemplate) {
      setShowPdfFiller(true);
      return;
    }

    try {
      setCustomFormLoading(true);
      const response = await fetch(submission.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch form data: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      setCustomFormData(parsed && typeof parsed === 'object' ? parsed : {});
      setShowCustomFormFiller(true);
    } catch (error) {
      alert(`Failed to load form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCustomFormLoading(false);
    }
  };

  const refreshSubmission = async () => {
    if (!id) return;

    const { data } = await supabase
      .from('template_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (!data) return;

    setSubmission({
      id: data.id,
      templateType: data.template_name,
      fileName: data.file_name,
      fileUrl: data.file_url,
      submittedBy: data.researcher_name,
      submittedAt: data.submission_date || data.created_at,
      status: data.status,
      metadata: data.metadata || {}
    });
  };

  const submitReviewerFile = async (file: File) => {
    if (!submission) return;

    try {
      setSaving(true);
      const service = new TemplateSubmissionService();
      const result = await service.submitReviewerUpdate(submission.id, file, reviewerComments);
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit reviewer update');
      }

      alert(`${actorLabel} update submitted. Chairperson can now review your updated form.`);
      setShowPdfFiller(false);
      setShowCustomFormFiller(false);
      await refreshSubmission();
    } catch (error) {
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePdf = async (pdfBytes: Uint8Array) => {
    const blob = new Blob([new Uint8Array(Array.from(pdfBytes))], { type: 'application/pdf' });
    const file = new File([blob], `${submission?.templateType || 'template'}_reviewer_${Date.now()}.pdf`, {
      type: 'application/pdf',
      lastModified: Date.now()
    });

    await submitReviewerFile(file);
  };

  const handleSaveCustomForm = async () => {
    const json = JSON.stringify(customFormData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], `${submission?.templateType || 'template'}_reviewer_${Date.now()}.json`, {
      type: 'application/json',
      lastModified: Date.now()
    });

    await submitReviewerFile(file);
  };

  const renderCustomForm = () => {
    if (!submission || !template?.id) return null;

    const commonProps = {
      proposalId: 0,
      protocolCode: customFormData.protocolCodeValue || customFormData.controlNo || '',
      researcherName: customFormData.nameResearcher || customFormData.principalInvestigator || submission.submittedBy,
      proposalTitle: customFormData.titleOfStudy || customFormData.studyProtocolTitle || submission.templateType,
      formName: submission.fileName,
      savedData: customFormData,
      onSave: (patch: Record<string, any>) => setCustomFormData((prev) => ({ ...prev, ...patch }))
    };

    if (template.id === 'progress-report') {
      return <EthicsStudyProgressReport {...commonProps} />;
    }

    if (template.id === 'new-event-report') {
      return <EthicsStudyReportableNegativeEventReport {...commonProps} />;
    }

    if (template.id === 'non-compliance-report') {
      return <EthicsStudyProtocolNonComplianceReport {...commonProps} />;
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
        <span className="ml-3 text-gray-600">Loading assigned form...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Not Available</h1>
          <button
            onClick={() => navigate(baseRoute)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assigned Forms
          </button>
        </div>
      </div>
    );
  }

  if (showPdfFiller) {
    return (
      <PDFFormFiller
        templateUrl={submission.fileUrl}
        templateName={submission.templateType}
        onSave={handleSavePdf}
        onCancel={() => setShowPdfFiller(false)}
        predefinedFields={predefinedFields}
      />
    );
  }

  if (showCustomFormView) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Submitted Form View: {submission.templateType}</div>
            <button
              onClick={() => setShowCustomFormView(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Details
            </button>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">
            <div style={{ pointerEvents: 'none' }}>{renderCustomForm()}</div>
          </div>
        </div>
      </div>
    );
  }

  if (showCustomFormFiller) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">{actorLabel} Input: {submission.templateType}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomFormFiller(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomForm}
                disabled={saving}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? 'Submitting...' : `Submit ${actorLabel} Update`}
              </button>
            </div>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">{renderCustomForm()}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(baseRoute)}
          className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assigned Forms
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{submission.templateType}</h1>
          <p className="mt-2 text-gray-600">Provide {actorLabel.toLowerCase()} input for this assigned form.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Submitted By</p>
                <p className="text-sm text-gray-600">{submission.submittedBy}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Submission Date</p>
                <p className="text-sm text-gray-600">{formatDate(submission.submittedAt)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Assigned Role</p>
                <p className="text-sm text-gray-600">{getAssignedRoleLabel()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{actorLabel} Actions</h2>

          <div className="mb-4">
            <label htmlFor="reviewer-comments" className="block text-sm font-medium text-gray-700 mb-2">
              {actorLabel} Comments (optional)
            </label>
            <textarea
              id="reviewer-comments"
              rows={4}
              value={reviewerComments}
              onChange={(e) => setReviewerComments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes for chairperson..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleOpenFill}
              disabled={customFormLoading || saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              <Eye className="w-4 h-4 mr-2" />
              {customFormLoading ? 'Loading...' : `Fill ${actorLabel} Section`}
            </button>

            <button
              onClick={handleViewSubmission}
              disabled={customFormLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              {isCustomJsonTemplate ? 'View Form' : 'View PDF'}
            </button>

            <a
              href={submission.fileUrl}
              download={submission.fileName}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Current File
            </a>
          </div>

          {isReviewerAlreadySubmitted && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Your {actorLabel.toLowerCase()} update was submitted on {formatDate(reviewerSubmission?.submittedAt)}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
