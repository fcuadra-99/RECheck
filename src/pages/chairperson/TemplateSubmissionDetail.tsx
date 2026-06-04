import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../DB';
import { TemplateSubmissionService, type ReviewerProfile } from '../../services/templateSubmissionService';
import PDFFormFiller from '../../components/PDFFormFiller';
import EthicsStudyProgressReport from '@/components/forms/REC_FO_0019';
import EthicsStudyReportableNegativeEventReport from '@/components/forms/REC_FO_0021';
import EthicsStudyProtocolNonComplianceReport from '@/components/forms/REC_FO_0020';
import EthicsStudyProtocolAmendmentForm from '@/components/forms/REC_FO_0018';
import EthicsContinuingReviewApplicationForm from '@/components/forms/REC_FO_0023';
import EthicsEarlyStudyTerminationApplicationForm from '@/components/forms/REC_FO_0022';
import { TemplateDownloadService } from '../../services/templateDownloadService';
import { useTemplateFields } from '@/hooks/useTemplateFields';
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
  Edit3
} from 'lucide-react';

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
  metadata?: {
    assignedReviewerIds?: string[];
    assignedReviewerRoles?: Record<string, 'primary_1' | 'primary_2' | 'secretariat'>;
    assignedByName?: string;
    assignedAt?: string;
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

type ReviewerRole = 'primary_1' | 'primary_2' | 'secretariat';

export default function TemplateSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submission, setSubmission] = useState<TemplateSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'needs_revision'>('approved');
  const [showPdfFiller, setShowPdfFiller] = useState(false);
  const [showCustomFormFiller, setShowCustomFormFiller] = useState(false);
  const [showCustomFormView, setShowCustomFormView] = useState(false);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [customFormLoading, setCustomFormLoading] = useState(false);
  const [printOnViewOpen, setPrintOnViewOpen] = useState(false);
  const [reviewers, setReviewers] = useState<ReviewerProfile[]>([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [selectedReviewerRoles, setSelectedReviewerRoles] = useState<Record<string, ReviewerRole>>({});
  const [assigningReviewers, setAssigningReviewers] = useState(false);
  const [terminationInfo, setTerminationInfo] = useState<{ protocolCode: string; proposalTitle: string } | null>(null);
  const [terminationInfoLoading, setTerminationInfoLoading] = useState(false);
  const [terminatingProposal, setTerminatingProposal] = useState(false);
  
  // Get template ID for loading predefined fields
  const template = submission ? TemplateDownloadService.getTemplateByName(submission.template_type) : null;
  const isCustomJsonTemplate = Boolean(
    template?.id &&
      ['progress-report', 'new-event-report', 'non-compliance-report', 'protocol-amendment', 'continuing-review', 'early-termination'].includes(template.id)
  );
  const isEarlyTerminationTemplate = template?.id === 'early-termination';
  const isStaffInputSubmitted = Boolean(
    submission?.original_filename?.toLowerCase().includes('_reviewed.') ||
      submission?.status === 'approved' ||
      submission?.status === 'rejected' ||
      submission?.status === 'needs_revision'
  );
  const isReviewComplete = Boolean(submission && (
    submission.status === 'approved' ||
    submission.status === 'rejected' ||
    submission.status === 'needs_revision'
  ));
  const { fields: predefinedFields } = useTemplateFields(template?.id || null);
  const autoOpenView = searchParams.get('view') === '1';

  useEffect(() => {
    fetchSubmission();
    fetchReviewers();
  }, [id]);

  const loadTerminationInfo = async () => {
    if (!submission) return null;
    if (terminationInfo) return terminationInfo;

    try {
      setTerminationInfoLoading(true);
      const response = await fetch(submission.file_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch form data: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      const protocolCode = String(
        parsed?.controlNo || parsed?.staffControlNo || parsed?.protocolCodeValue || parsed?.protocolCode || ''
      ).trim();
      const proposalTitle = String(parsed?.studyProtocolTitle || parsed?.titleOfStudy || '').trim();

      if (!protocolCode || !proposalTitle) {
        throw new Error('Missing protocol code or study protocol title in the submitted form.');
      }

      const info = { protocolCode, proposalTitle };
      setTerminationInfo(info);
      return info;
    } catch (error) {
      console.error('Error loading termination info:', error);
      return null;
    } finally {
      setTerminationInfoLoading(false);
    }
  };

  const fetchReviewers = async () => {
    const templateService = new TemplateSubmissionService();
    const result = await templateService.getReviewerProfiles();
    if (result.success) {
      setReviewers(result.reviewers || []);
      if ((result.reviewers || []).length === 0) {
        console.warn('No reviewer profiles available for assignment.');
      }
    } else {
      console.error('Failed to fetch reviewer profiles:', result.error);
    }
  };

  const fetchSubmission = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch real data from database
      const { data, error } = await supabase
        .from('template_submissions')
        .select('*')
        .eq('id', id)
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
          signature_image: signatureImage,
          metadata: data.metadata || {}
        };

        setSubmission(transformedSubmission);
        setSelectedReviewerIds((data.metadata?.assignedReviewerIds || []).slice(0, 4));
        setSelectedReviewerRoles((data.metadata?.assignedReviewerRoles || {}) as Record<string, ReviewerRole>);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!submission) return;
    
    try {
      setReviewing(true);
      
      // Get current user info
      const { data: user } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.user?.id)
        .single();
      
      // Update the database
      const { error } = await supabase
        .from('template_submissions')
        .update({
          status: reviewDecision,
          review_comments: reviewNotes,
          reviewer_id: user.user?.id,
          reviewer_name: userProfile?.name || user.user?.email || 'Chairperson',
          review_date: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) {
        console.error('Error updating submission:', error);
        toast.error('Failed to submit review. Please try again.');
        return;
      }
      
      // Update local state
      setSubmission(prev => prev ? {
        ...prev,
        status: reviewDecision,
        reviewer_notes: reviewNotes,
        reviewed_by: userProfile?.name || user.user?.email || 'Chairperson',
        reviewed_at: new Date().toISOString()
      } : null);

      toast.success(`Submission reviewed successfully! Status updated to ${reviewDecision}.`);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  const toggleReviewerSelection = (reviewerId: string) => {
    setSelectedReviewerIds((prev) => {
      if (prev.includes(reviewerId)) {
        setSelectedReviewerRoles((roles) => {
          const next = { ...roles };
          delete next[reviewerId];
          return next;
        });
        return prev.filter((id) => id !== reviewerId);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, reviewerId];
    });
  };

  const updateReviewerRole = (reviewerId: string, role: ReviewerRole | '') => {
    setSelectedReviewerRoles((prev) => {
      const next = { ...prev };
      if (!role) {
        delete next[reviewerId];
      } else {
        next[reviewerId] = role;
      }
      return next;
    });
  };

  const getReviewerRoleLabel = (role?: ReviewerRole) => {
    if (role === 'primary_1') return 'Primary Reviewer 1';
    if (role === 'primary_2') return 'Primary Reviewer 2';
    if (role === 'secretariat') return 'Secretariat Staff';
    return 'Unassigned';
  };

  const getReviewerName = (reviewerId: string) => {
    const reviewer = reviewers.find((item) => item.id === reviewerId);
    return reviewer?.name || reviewerId;
  };

  const handleAssignReviewers = async () => {
    if (!submission) return;

    if (isReviewComplete) {
      toast.error('Review is already complete. Reviewers cannot be assigned.');
      return;
    }

    if (selectedReviewerIds.length < 1 || selectedReviewerIds.length > 4) {
      toast.error('Please select 1 to 4 staff members.');
      return;
    }

    const activeRoles = selectedReviewerIds
      .map((id) => selectedReviewerRoles[id])
      .filter(Boolean) as ReviewerRole[];
    const uniqueRoles = new Set(activeRoles);
    if (activeRoles.length !== uniqueRoles.size) {
      toast.error('Assigned roles must be unique.');
      return;
    }

    const rolesForSelected = Object.fromEntries(
      selectedReviewerIds
        .filter((id) => selectedReviewerRoles[id])
        .map((id) => [id, selectedReviewerRoles[id]])
    ) as Record<string, ReviewerRole>;

    const loadingId = toast.loading('Assigning reviewers...');
    try {
      setAssigningReviewers(true);
      const templateService = new TemplateSubmissionService();
      const result = await templateService.assignReviewers(submission.id, selectedReviewerIds, rolesForSelected);

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign reviewers');
      }

      toast.success('Submission successfully passed to reviewers.', { id: loadingId });
      await fetchSubmission();
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      toast.error(`Failed to assign reviewers: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
    } finally {
      setAssigningReviewers(false);
    }
  };

  const handleFillPdf = async () => {
    if (!submission) return;

    if (isStaffInputSubmitted) {
      toast.error('Staff input has already been submitted. Editing is locked.');
      return;
    }

    if (isCustomJsonTemplate) {
      try {
        setCustomFormLoading(true);
        const response = await fetch(submission.file_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch form data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const parsed = JSON.parse(text);
        setCustomFormData(parsed && typeof parsed === 'object' ? parsed : {});
        setShowCustomFormFiller(true);
      } catch (error) {
        console.error('Error loading custom form data:', error);
        toast.error(`Failed to load form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setCustomFormLoading(false);
      }
      return;
    }

    setShowPdfFiller(true);
  };

  const handleCancelPdfFiller = () => {
    setShowPdfFiller(false);
  };

  const handleCancelCustomFormFiller = () => {
    setShowCustomFormFiller(false);
  };

  const handleCustomFormPatch = (patch: Record<string, any>) => {
    setCustomFormData((prev) => ({ ...prev, ...patch }));
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
      toast.error(`Failed to load submitted form: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      toast.error(`Failed to download submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  useEffect(() => {
    if (!autoOpenView || !submission || loading || showCustomFormView || customFormLoading) return;
    handleViewSubmission();
  }, [autoOpenView, submission, loading, showCustomFormView]);

  useEffect(() => {
    if (!showCustomFormView || !autoOpenView || !id) return;
    navigate(`/chairperson/template-submissions/${id}`, { replace: true });
  }, [showCustomFormView, autoOpenView, id, navigate]);

  useEffect(() => {
    if (!submission || !isEarlyTerminationTemplate || submission.status !== 'approved') return;
    if (terminationInfoLoading || terminationInfo) return;
    loadTerminationInfo();
  }, [submission, isEarlyTerminationTemplate, terminationInfoLoading, terminationInfo]);

  const handleTerminateProposal = async () => {
    if (!submission) return;

    const info = terminationInfo || (await loadTerminationInfo());
    if (!info) {
      toast.error('Unable to locate protocol code or proposal title from the submitted form.');
      return;
    }

    const confirmed = window.confirm(
      `Terminate the proposal with Protocol ${info.protocolCode} and title "${info.proposalTitle}"? This will archive the proposal.`
    );
    if (!confirmed) return;

    const loadingId = toast.loading('Terminating proposal...');
    try {
      setTerminatingProposal(true);
      const templateService = new TemplateSubmissionService();
      const result = await templateService.terminateProposalForEarlyTermination({
        submissionId: submission.id,
        protocolCode: info.protocolCode,
        proposalTitle: info.proposalTitle
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to terminate proposal');
      }

      const updatedCount = result.updatedCount ?? 0;
      const alreadyArchivedCount = result.alreadyArchivedCount ?? 0;
      toast.success(
        `Termination complete. Updated ${updatedCount} proposal(s). Already archived: ${alreadyArchivedCount}.`,
        { id: loadingId }
      );
    } catch (error) {
      console.error('Error terminating proposal:', error);
      toast.error(`Failed to terminate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
    } finally {
      setTerminatingProposal(false);
    }
  };

  const handleSaveCustomForm = async () => {
    if (!submission) return;

    if (isStaffInputSubmitted) {
      toast.error('Staff input has already been submitted. Editing is locked.');
      return;
    }

    const loadingId = toast.loading('Saving reviewed form data...');
    try {
      const json = JSON.stringify(customFormData, null, 2);
      const jsonBlob = new Blob([json], { type: 'application/json' });
      const reviewedFile = new File([jsonBlob], `${submission.template_type}_reviewed.json`, {
        type: 'application/json',
        lastModified: Date.now(),
      });

      const fileName = `${id}/reviewed_${Date.now()}.json`;
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(fileName, reviewedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('template_submissions')
        .update({
          file_url: urlData.publicUrl,
          file_name: reviewedFile.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Form data reviewed and saved successfully!', { id: loadingId });
      setShowCustomFormFiller(false);
      fetchSubmission();
    } catch (error) {
      console.error('Error saving custom form:', error);
      toast.error(`Failed to save form data: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
    }
  };

  const renderCustomForm = (
    formData: Record<string, any> = customFormData,
    onSave: (patch: Record<string, any>) => void = handleCustomFormPatch,
  ) => {
    if (!submission || !template?.id) return null;

    const commonProps = {
      proposalId: 0,
      protocolCode: formData.protocolCodeValue || formData.controlNo || '',
      researcherName: formData.nameResearcher || formData.principalInvestigator || submission.submitted_by,
      proposalTitle: formData.titleOfStudy || formData.studyProtocolTitle || submission.template_type,
      formName: submission.original_filename,
      savedData: formData,
      onSave,
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

  const handleSavePdf = async (pdfBytes: Uint8Array, formData: Record<string, string | boolean>) => {
    if (isStaffInputSubmitted) {
      toast.error('Staff input has already been submitted. Editing is locked.');
      return;
    }

    console.log('Chairperson filled PDF:', formData);
    console.log('PDF size:', pdfBytes.length, 'bytes');
    
    const loadingId = toast.loading('Saving filled PDF...');
    try {
      // Convert PDF bytes to File
      const pdfArray = Array.from(pdfBytes);
      const pdfBlob = new Blob([new Uint8Array(pdfArray)], { type: 'application/pdf' });
      const pdfFile = new File(
        [pdfBlob],
        `${submission?.template_type}_reviewed.pdf`,
        { type: 'application/pdf', lastModified: Date.now() }
      );

      // Upload the reviewed PDF back to storage
      const fileName = `${id}/reviewed_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(fileName);

      // Update the submission with the new file URL
      const { error: updateError } = await supabase
        .from('template_submissions')
        .update({ 
          file_url: urlData.publicUrl,
          file_name: pdfFile.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('PDF filled and saved successfully!', { id: loadingId });
      setShowPdfFiller(false);
      fetchSubmission(); // Refresh the submission data
    } catch (error) {
      console.error('Error saving filled PDF:', error);
      toast.error(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
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
            onClick={() => navigate('/chairperson/template-submissions')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  // Show PDF Form Filler if requested
  if (showPdfFiller && submission) {
    return (
      <PDFFormFiller
        templateUrl={submission.file_url}
        templateName={submission.template_type}
        onSave={handleSavePdf}
        onCancel={handleCancelPdfFiller}
        predefinedFields={predefinedFields}
      />
    );
  }

  if (showCustomFormView && submission) {
    return (
      <div className="min-h-screen bg-gray-100 form-print-root">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Submitted Form View: {submission.template_type}</div>
            <button
              onClick={() => {
                setShowCustomFormView(false);
                if (id) {
                  navigate(`/chairperson/template-submissions/${id}`, { replace: true });
                }
              }}
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

  if (showCustomFormFiller && submission) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Fill and Review: {submission.template_type}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelCustomFormFiller}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomForm}
                disabled={isStaffInputSubmitted}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Reviewed Form
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
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/chairperson/template-submissions')}
            className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{submission.template_type}</h1>
              <p className="mt-2 text-gray-600">Review and assess this form submission</p>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Template Type</p>
                    <p className="text-sm text-gray-600">{submission.template_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submitted By</p>
                    <p className="text-sm text-gray-600">{submission.submitted_by}</p>
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
                  onClick={handleFillPdf}
                  disabled={customFormLoading || isStaffInputSubmitted}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {customFormLoading ? 'Loading...' : isStaffInputSubmitted ? 'Already Submitted' : 'Fill & Review'}
                </button>

                <button
                  onClick={handleViewSubmission}
                  disabled={customFormLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {customFormLoading ? 'Loading...' : isCustomJsonTemplate ? 'View File' : 'View PDF'}
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

            {/* Submission Notes */}
            {submission.submission_notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Submission Notes</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.submission_notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Review Actions */}
          <div className="space-y-6">
            {/* Review Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h4 className="text-base font-medium text-gray-900 mb-3">Pass to Assigned Staff</h4>
              <p className="text-xs text-gray-600 mb-3">Select 1 to 4 reviewers or admin assistants for this submission.</p>
              <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-200 rounded p-2 mb-3">
                {reviewers.length === 0 ? (
                  <p className="text-xs text-gray-500">No reviewers found.</p>
                ) : (
                  reviewers.map((reviewer) => (
                    <label key={reviewer.id} className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedReviewerIds.includes(reviewer.id)}
                        onChange={() => toggleReviewerSelection(reviewer.id)}
                        disabled={isReviewComplete || (!selectedReviewerIds.includes(reviewer.id) && selectedReviewerIds.length >= 4)}
                      />
                      <span>
                        <span className="block font-medium text-gray-900">{reviewer.name}</span>
                        <span className="block text-xs text-gray-500">
                          {reviewer.email}{reviewer.role ? ` • ${reviewer.role}` : ''}
                        </span>
                        {selectedReviewerIds.includes(reviewer.id) && (
                          <span className="mt-1 block">
                            <select
                              value={selectedReviewerRoles[reviewer.id] || ''}
                              onChange={(e) => updateReviewerRole(reviewer.id, e.target.value as ReviewerRole | '')}
                              disabled={isReviewComplete}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select role</option>
                              <option value="primary_1">Primary Reviewer 1</option>
                              <option value="primary_2">Primary Reviewer 2</option>
                              <option value="secretariat">Secretariat Staff</option>
                            </select>
                          </span>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <button
                onClick={handleAssignReviewers}
                disabled={assigningReviewers || selectedReviewerIds.length < 1 || isReviewComplete}
                className="w-full px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition"
              >
                {assigningReviewers ? 'Passing...' : 'Pass to Selected Staff'}
              </button>

              {isReviewComplete && (
                <div className="mt-3 rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800 font-medium">
                  This submission review is complete ({submission.status.replace('_', ' ')}). Assigned reviewers cannot be updated.
                </div>
              )}

              {submission.metadata?.assignedReviewerIds && submission.metadata.assignedReviewerIds.length > 0 && (
                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded p-2">
                  <p className="text-xs text-indigo-900 font-medium">
                    Assigned: {submission.metadata.assignedReviewerIds.length} reviewer{submission.metadata.assignedReviewerIds.length > 1 ? 's' : ''}
                  </p>
                  {submission.metadata?.assignedReviewerRoles && Object.keys(submission.metadata.assignedReviewerRoles).length > 0 && (
                    <div className="mt-1 text-xs text-indigo-700">
                      {submission.metadata.assignedReviewerIds.map((reviewerId) => (
                        <div key={reviewerId}>
                          {getReviewerName(reviewerId)}: {getReviewerRoleLabel(submission.metadata?.assignedReviewerRoles?.[reviewerId])}
                        </div>
                      ))}
                    </div>
                  )}
                  {submission.metadata.assignedAt && (
                    <p className="text-xs text-indigo-700">{formatDate(submission.metadata.assignedAt)}</p>
                  )}
                </div>
              )}
            </div>

            {isEarlyTerminationTemplate && submission.status === 'approved' && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h4 className="text-base font-medium text-gray-900 mb-2">Terminate Proposal</h4>
                <p className="text-xs text-gray-600">
                  This archives the proposal that matches the protocol code and title from the approved termination form.
                </p>
                <div className="mt-3 text-xs text-gray-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Protocol Code</span>
                    <span className="font-mono">
                      {terminationInfoLoading ? 'Loading...' : terminationInfo?.protocolCode || 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Proposal Title</span>
                    <span className="text-right max-w-[190px] truncate">
                      {terminationInfoLoading ? 'Loading...' : terminationInfo?.proposalTitle || 'Unavailable'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleTerminateProposal}
                  disabled={terminationInfoLoading || terminatingProposal}
                  className="mt-4 w-full px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 transition"
                >
                  {terminatingProposal ? 'Terminating...' : 'Terminate Proposal'}
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              {submission.status === 'pending' || submission.status === 'under_review' || submission.status === 'in_review' ? (
                <>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Review Decision</h4>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value as any)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="approved">Approve</option>
                    <option value="needs_revision">Needs Revision</option>
                    <option value="rejected">Reject</option>
                  </select>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Review notes (optional)"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-3"
                  />
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewing}
                    className="w-full px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition"
                  >
                    {reviewing ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </div>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Review Complete</h4>
                  <div className="space-y-2">
                    <div>{getStatusBadge(submission.status)}</div>
                    {submission.reviewed_by && <div className="text-xs text-gray-500">Reviewed by {submission.reviewed_by}</div>}
                    {submission.reviewed_at && <div className="text-xs text-gray-500">{formatDate(submission.reviewed_at)}</div>}
                    {submission.reviewer_notes && <div className="bg-gray-50 rounded p-2 text-xs text-gray-700 whitespace-pre-wrap">{submission.reviewer_notes}</div>}
                  </div>
                </>
              )}
            </div>

            {/* Quick Stats - minimalist */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h4 className="text-base font-medium text-gray-900 mb-3">Quick Info</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Submission ID</span>
                  <span className="font-mono text-gray-900">{submission.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">File Size</span>
                  <span className="text-gray-900">2.3 MB</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Pages</span>
                  <span className="text-gray-900">15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
