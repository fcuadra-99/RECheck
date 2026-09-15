import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import PDFFormFiller from '../../components/PDFFormFiller';
import { TemplateDownloadService } from '../../services/templateDownloadService';
import { TemplateSubmissionService } from '../../services/templateSubmissionService';
import { useTemplateFields } from '@/hooks/useTemplateFields';
import { supabase } from '@/DB';
import useAuth from '@/hooks/useAuth';
import type { ProposalOption } from '@/components/forms/FormViewer';
import EthicsStudyProgressReport from '@/components/forms/REC_FO_0019';
import EthicsStudyReportableNegativeEventReport from '@/components/forms/REC_FO_0021';
import EthicsStudyProtocolNonComplianceReport from '@/components/forms/REC_FO_0020';
import EthicsStudyProtocolAmendmentForm from '@/components/forms/REC_FO_0018';
import EthicsContinuingReviewApplicationForm from '@/components/forms/REC_FO_0023';
import EthicsEarlyStudyTerminationApplicationForm from '@/components/forms/REC_FO_0022';


export default function FormsTemplates() {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<'fill-online' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [proposalOptions, setProposalOptions] = useState<ProposalOption[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [progressReportData, setProgressReportData] = useState<Record<string, any>>({});
  const [newEventReportData, setNewEventReportData] = useState<Record<string, any>>({});
  const [nonComplianceReportData, setNonComplianceReportData] = useState<Record<string, any>>({});
  const [protocolAmendmentData, setProtocolAmendmentData] = useState<Record<string, any>>({});
  const [continuingReviewData, setContinuingReviewData] = useState<Record<string, any>>({});
  const [earlyTerminationData, setEarlyTerminationData] = useState<Record<string, any>>({});
  const [existingSubmissions, setExistingSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!user?.id) {
        setExistingSubmissions([]);
        return;
      }
      try {
        const templateService = new TemplateSubmissionService();
        const result = await templateService.getResearcherSubmissions(user.id);
        if (result.success) {
          const subs = result.submissions || [];
          const resolvedSubs = await Promise.all(subs.map(async (sub) => {
            if (sub.metadata?.proposal_id) {
              return {
                ...sub,
                proposalId: Number(sub.metadata.proposal_id)
              };
            }
            if (sub.file_name.endsWith('.json')) {
              try {
                const res = await fetch(sub.file_url);
                if (res.ok) {
                  const parsed = await res.json();
                  const parsedProposalId = parsed.proposalId;
                  if (parsedProposalId) {
                    return {
                      ...sub,
                      proposalId: Number(parsedProposalId)
                    };
                  }
                  const protocolCode = parsed.controlNo || parsed.staffControlNo || parsed.protocolCodeValue || parsed.protocolCode;
                  const title = parsed.studyProtocolTitle || parsed.titleOfStudy;
                  return {
                    ...sub,
                    protocolCode,
                    title
                  };
                }
              } catch (e) {
                console.error('Error fetching fallback JSON:', e);
              }
            }
            return sub;
          }));
          setExistingSubmissions(resolvedSubs);
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
      }
    };

    loadSubmissions();
  }, [user?.id, selectedAction]);

  const filteredProposalOptions = proposalOptions.filter(option => {
    const isSubmitted = existingSubmissions.some(sub => {
      if (sub.template_name !== selectedTemplate) return false;
      if (sub.proposalId !== undefined) {
        return sub.proposalId === option.id;
      }
      if (sub.protocolCode && option.protocolCode) {
        return sub.protocolCode.trim().toLowerCase() === option.protocolCode.trim().toLowerCase();
      }
      if (sub.title && option.title) {
        return sub.title.trim().toLowerCase() === option.title.trim().toLowerCase();
      }
      return false;
    });
    return !isSubmitted;
  });

  useEffect(() => {
    const loadProposals = async () => {
      if (!user?.id) {
        setProposalOptions([]);
        setSelectedProposalId(null);
        return;
      }


      const { data, error } = await supabase
        .from('proposals')
        .select('proposal_id, proposal_title, protocol_id, status, date')
        .eq('researcher', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to load proposals:', error);
        setProposalOptions([]);
        setSelectedProposalId(null);
        return;
      }

      const options: ProposalOption[] = (data || [])
        .filter((proposal) => !!proposal.protocol_id)
        .map((proposal) => ({
          id: proposal.proposal_id,
          title: proposal.proposal_title,
          protocolCode: proposal.protocol_id,
        }));

      setProposalOptions(options);
      setSelectedProposalId((current) => {
        if (options.length === 0) return null;
        if (current && !options.find((p) => p.id === current)) return null;
        return current;
      });
    };

    loadProposals();
  }, [user?.id]);
  
  // Get template details and load predefined fields
  const templateDetails = selectedTemplate 
    ? TemplateDownloadService.getUploadableTemplates().find(t => t.name === selectedTemplate)
    : null;
  const { fields: predefinedFields } = useTemplateFields(templateDetails?.id || null);
  const isProgressReportTemplate = templateDetails?.id === 'progress-report';
  const isNewEventReportTemplate = templateDetails?.id === 'new-event-report';
  const isNonComplianceReportTemplate = templateDetails?.id === 'non-compliance-report';
  const isProtocolAmendmentTemplate = templateDetails?.id === 'protocol-amendment';
  const isContinuingReviewTemplate = templateDetails?.id === 'continuing-review';
  const isEarlyTerminationTemplate = templateDetails?.id === 'early-termination';

  const selectedProposal = proposalOptions.find((proposal) => proposal.id === selectedProposalId) || null;

  // haandleTemplateUploadComplete removed as upload functionality is no longer needed

  const handleCancel = () => {
    setSelectedAction(null);
    setSelectedTemplate('');
    setSelectedProposalId(null);
    setProgressReportData({});
    setNewEventReportData({});
    setNonComplianceReportData({});
    setProtocolAmendmentData({});
    setContinuingReviewData({});
    setEarlyTerminationData({});
  };

  const handleProgressReportSave = (patch: Record<string, any>) => {
    setProgressReportData((prev) => ({ ...prev, ...patch }));
  };

  const handleNewEventReportSave = (patch: Record<string, any>) => {
    setNewEventReportData((prev) => ({ ...prev, ...patch }));
  };

  const handleNonComplianceReportSave = (patch: Record<string, any>) => {
    setNonComplianceReportData((prev) => ({ ...prev, ...patch }));
  };

  const handleProtocolAmendmentSave = (patch: Record<string, any>) => {
    setProtocolAmendmentData((prev) => ({ ...prev, ...patch }));
  };

  const handleContinuingReviewSave = (patch: Record<string, any>) => {
    setContinuingReviewData((prev) => ({ ...prev, ...patch }));
  };

  const handleEarlyTerminationSave = (patch: Record<string, any>) => {
    setEarlyTerminationData((prev) => ({ ...prev, ...patch }));
  };

  const submitOnlineForm = async (
    formData: Record<string, any>,
    clearFormData: () => void,
    errorLogMessage: string
  ) => {
    if (!selectedTemplate || !templateDetails) return;

    if (!selectedProposalId) {
      toast.error('Please select a proposal first.');
      return;
    }

    const alreadySubmitted = existingSubmissions.some(sub => 
      sub.template_name === selectedTemplate && 
      (sub.proposalId === selectedProposalId || 
       (sub.protocolCode && selectedProposal?.protocolCode && sub.protocolCode.trim().toLowerCase() === selectedProposal.protocolCode.trim().toLowerCase()) ||
       (sub.title && selectedProposal?.title && sub.title.trim().toLowerCase() === selectedProposal.title.trim().toLowerCase()))
    );

    if (alreadySubmitted) {
      toast.error(`A ${selectedTemplate} has already been submitted for this proposal.`);
      return;
    }

    const loadingId = toast.loading('Submitting form...');
    try {
      const json = JSON.stringify(formData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const file = new File(
        [blob],
        `${selectedTemplate.replace(/\s+/g, '_')}_filled.json`,
        { type: 'application/json', lastModified: Date.now() }
      );

      const submissionData = {
        submission_title: `${selectedTemplate} Submission`,
        template_name: selectedTemplate,
        template_category: templateDetails.category,
        file,
        description: `Completed form data for ${selectedTemplate}`,
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        metadata: {
          proposal_id: selectedProposalId
        }
      };

      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);

      if (result.success) {
        toast.success('Form submitted successfully! Your submission will be reviewed.', { id: loadingId });
        setSelectedAction(null);
        setSelectedTemplate('');
        setSelectedProposalId(null);
        clearFormData();
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
    } catch (error) {
      console.error(errorLogMessage, error);
      toast.error(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
    }
  };

  const handleProgressReportSubmit = () => 
    submitOnlineForm(progressReportData, () => setProgressReportData({}), 'Error submitting progress report form:');

  const handleNewEventReportSubmit = () => 
    submitOnlineForm(newEventReportData, () => setNewEventReportData({}), 'Error submitting reportable negative event form:');

  const handleNonComplianceReportSubmit = () => 
    submitOnlineForm(nonComplianceReportData, () => setNonComplianceReportData({}), 'Error submitting non-compliance report form:');

  const handleProtocolAmendmentSubmit = () => 
    submitOnlineForm(protocolAmendmentData, () => setProtocolAmendmentData({}), 'Error submitting protocol amendment form:');

  const handleContinuingReviewSubmit = () => 
    submitOnlineForm(continuingReviewData, () => setContinuingReviewData({}), 'Error submitting continuing review form:');

  const handleEarlyTerminationSubmit = () => 
    submitOnlineForm(earlyTerminationData, () => setEarlyTerminationData({}), 'Error submitting early termination form:');

  const handleFormSave = async (pdfBytes: Uint8Array, formData: Record<string, string | boolean>) => {
    console.log('=== handleFormSave called ===');
    console.log('Form filled and saved:', formData);
    console.log('PDF size:', pdfBytes.length, 'bytes');
    
    try {
      // Convert the PDF bytes to a File object - handle type safely by using Array.from
      const pdfArray = Array.from(pdfBytes);
      const pdfBlob = new Blob([new Uint8Array(pdfArray)], { type: 'application/pdf' });
      const pdfFile = new File(
        [pdfBlob], 
        `${selectedTemplate}_filled.pdf`, 
        { type: 'application/pdf', lastModified: Date.now() }
      );
      
      // Prepare the submission data
      // Find template by finding the template with matching name
      const allTemplates = TemplateDownloadService.getAllTemplates();
      const templateDetails = allTemplates.find(t => t.name === selectedTemplate);
      
      const submissionData = {
        submission_title: `${selectedTemplate} Submission`,
        template_name: selectedTemplate,
        template_category: templateDetails?.category || 'general',
        file: pdfFile,
        description: `Completed form for ${selectedTemplate}`,
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };
      
      // Submit the form
      const loadingId = toast.loading('Submitting form...');
      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);
      
      if (result.success) {
        toast.success('Form submitted successfully! Your submission will be reviewed.', { id: loadingId });
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
      
      // Reset view to go back to forms list
      setSelectedAction(null);
      setSelectedTemplate('');
      
      console.log('=== handleFormSave completed ===');
    } catch (error) {
      console.error('Error in handleFormSave:', error);
      toast.error(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fill Form Online View
  if (selectedAction === 'fill-online' && selectedTemplate && templateDetails) {
    console.log('Loading template:', templateDetails);

    if (isProgressReportTemplate) {
      return (
        <div className="min-h-screen bg-gray-100 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{templateDetails.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleProgressReportSubmit}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Submit Form
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-md border border-gray-300 bg-white shadow-sm">
              <EthicsStudyProgressReport
                proposalId={selectedProposal?.id ?? 0}
                formName="Progress_Report_Template.pdf"
                savedData={progressReportData}
                onSave={handleProgressReportSave}
                proposalTitle={selectedProposal?.title || ''}
                protocolCode={selectedProposal?.protocolCode || null}
                proposalOptions={filteredProposalOptions}
                selectedProposalId={selectedProposalId}
                onSelectProposal={setSelectedProposalId}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isNewEventReportTemplate) {
      return (
        <div className="min-h-screen bg-gray-100 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{templateDetails.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleNewEventReportSubmit}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Submit Form
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-md border border-gray-300 bg-white shadow-sm">
              <EthicsStudyReportableNegativeEventReport
                proposalId={selectedProposal?.id ?? 0}
                formName="Report_New_Event_Template.pdf"
                savedData={newEventReportData}
                onSave={handleNewEventReportSave}
                proposalTitle={selectedProposal?.title || ''}
                protocolCode={selectedProposal?.protocolCode || null}
                proposalOptions={filteredProposalOptions}
                selectedProposalId={selectedProposalId}
                onSelectProposal={setSelectedProposalId}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isNonComplianceReportTemplate) {
      return (
        <div className="min-h-screen bg-gray-100 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{templateDetails.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleNonComplianceReportSubmit}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Submit Form
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-md border border-gray-300 bg-white shadow-sm">
              <EthicsStudyProtocolNonComplianceReport
                proposalId={selectedProposal?.id ?? 0}
                formName="Non_Compliance_Report_Template.pdf"
                savedData={nonComplianceReportData}
                onSave={handleNonComplianceReportSave}
                proposalTitle={selectedProposal?.title || ''}
                protocolCode={selectedProposal?.protocolCode || null}
                proposalOptions={filteredProposalOptions}
                selectedProposalId={selectedProposalId}
                onSelectProposal={setSelectedProposalId}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isProtocolAmendmentTemplate) {
      return (
        <div className="min-h-screen bg-gray-100 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{templateDetails.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleProtocolAmendmentSubmit}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Submit Form
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-md border border-gray-300 bg-white shadow-sm">
              <EthicsStudyProtocolAmendmentForm
                proposalId={selectedProposal?.id ?? 0}
                formName="Protocol_Amendment_Template.pdf"
                savedData={protocolAmendmentData}
                onSave={handleProtocolAmendmentSave}
                proposalTitle={selectedProposal?.title || ''}
                protocolCode={selectedProposal?.protocolCode || null}
                proposalOptions={filteredProposalOptions}
                selectedProposalId={selectedProposalId}
                onSelectProposal={setSelectedProposalId}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isContinuingReviewTemplate) {
      return (
        <div className="min-h-screen bg-gray-100 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{templateDetails.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleContinuingReviewSubmit}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Submit Form
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-md border border-gray-300 bg-white shadow-sm">
              <EthicsContinuingReviewApplicationForm
                proposalId={selectedProposal?.id ?? 0}
                formName="Continuing_Review_Template.pdf"
                savedData={continuingReviewData}
                onSave={handleContinuingReviewSave}
                proposalTitle={selectedProposal?.title || ''}
                protocolCode={selectedProposal?.protocolCode || null}
                proposalOptions={filteredProposalOptions}
                selectedProposalId={selectedProposalId}
                onSelectProposal={setSelectedProposalId}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isEarlyTerminationTemplate) {
      return (
        <div className="min-h-screen bg-gray-100 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{templateDetails.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleEarlyTerminationSubmit}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Submit Form
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-md border border-gray-300 bg-white shadow-sm">
              <EthicsEarlyStudyTerminationApplicationForm
                proposalId={selectedProposal?.id ?? 0}
                formName="Early_Termination_Template.pdf"
                savedData={earlyTerminationData}
                onSave={handleEarlyTerminationSave}
                proposalTitle={selectedProposal?.title || ''}
                protocolCode={selectedProposal?.protocolCode || null}
                proposalOptions={filteredProposalOptions}
                selectedProposalId={selectedProposalId}
                onSelectProposal={setSelectedProposalId}
              />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <PDFFormFiller
        templateUrl={templateDetails.templateUrl}
        templateName={templateDetails.name}
        onSave={handleFormSave}
        onCancel={handleCancel}
        predefinedFields={predefinedFields}
      />
    );
  }

  // Upload functionality removed as it's been replaced by the fill-online submission

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {!selectedAction && (
          <>
            {/* Header Section */}
            <div className="mb-16">
              <div className="inline-block mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Post Approval Forms</span>
                </div>
              </div>
              <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
               Post Approval Forms
              </h1>
         
            </div>

            {/* Main Form Selection */}
            <div className="space-y-6 mb-16">
              <div>
                <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-3">
                  Select Form Template
                </label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setSelectedProposalId(null);
                  }}
                  className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                >
                  <option value="">Choose a form...</option>
                  {TemplateDownloadService.getUploadableTemplates().map((template) => (
                    <option key={template.id} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>


              <button
                onClick={() => selectedTemplate && setSelectedAction('fill-online')}
                disabled={!selectedTemplate}
                className="w-full px-6 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {selectedTemplate ? 'Continue to Form' : 'Select a form to continue'}
              </button>
            </div>

            {/* Info Section */}
            <div className="border-t border-gray-200 pt-12">
              <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Select Form</h3>
                    <p className="text-sm text-gray-600">Choose the form template you need to complete</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Fill Information</h3>
                    <p className="text-sm text-gray-600">Complete the form fields directly in your browser</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Submit</h3>
                    <p className="text-sm text-gray-600">Save and submit your completed form for review</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Download functionality has been removed */}
      </div>
    </div>
  );
}
