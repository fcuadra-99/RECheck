import { useState, } from 'react';
import { BookOpen } from 'lucide-react';
import PDFFormFiller from '../../components/PDFFormFiller';
import { TemplateDownloadService } from '../../services/templateDownloadService';
import { TemplateSubmissionService } from '../../services/templateSubmissionService';
import { useTemplateFields } from '@/hooks/useTemplateFields';
import EthicsStudyProgressReport from '@/components/forms/REC_FO_0019';
import EthicsStudyReportableNegativeEventReport from '@/components/forms/REC_FO_0021';
import EthicsStudyProtocolNonComplianceReport from '@/components/forms/REC_FO_0020';
import EthicsStudyProtocolAmendmentForm from '@/components/forms/REC_FO_0018';
import EthicsContinuingReviewApplicationForm from '@/components/forms/REC_FO_0023';
import EthicsEarlyStudyTerminationApplicationForm from '@/components/forms/REC_FO_0022';


export default function FormsTemplates() {
  const [selectedAction, setSelectedAction] = useState<'fill-online' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [progressReportData, setProgressReportData] = useState<Record<string, any>>({});
  const [newEventReportData, setNewEventReportData] = useState<Record<string, any>>({});
  const [nonComplianceReportData, setNonComplianceReportData] = useState<Record<string, any>>({});
  const [protocolAmendmentData, setProtocolAmendmentData] = useState<Record<string, any>>({});
  const [continuingReviewData, setContinuingReviewData] = useState<Record<string, any>>({});
  const [earlyTerminationData, setEarlyTerminationData] = useState<Record<string, any>>({});
  
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

  // haandleTemplateUploadComplete removed as upload functionality is no longer needed

  const handleCancel = () => {
    setSelectedAction(null);
    setSelectedTemplate('');
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

  const handleProgressReportSubmit = async () => {
    if (!selectedTemplate || !templateDetails) return;

    try {
      const json = JSON.stringify(progressReportData, null, 2);
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
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };

      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);

      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
        setSelectedAction(null);
        setSelectedTemplate('');
        setProgressReportData({});
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
    } catch (error) {
      console.error('Error submitting progress report form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNewEventReportSubmit = async () => {
    if (!selectedTemplate || !templateDetails) return;

    try {
      const json = JSON.stringify(newEventReportData, null, 2);
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
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };

      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);

      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
        setSelectedAction(null);
        setSelectedTemplate('');
        setNewEventReportData({});
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
    } catch (error) {
      console.error('Error submitting reportable negative event form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNonComplianceReportSubmit = async () => {
    if (!selectedTemplate || !templateDetails) return;

    try {
      const json = JSON.stringify(nonComplianceReportData, null, 2);
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
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };

      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);

      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
        setSelectedAction(null);
        setSelectedTemplate('');
        setNonComplianceReportData({});
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
    } catch (error) {
      console.error('Error submitting non-compliance report form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleProtocolAmendmentSubmit = async () => {
    if (!selectedTemplate || !templateDetails) return;

    try {
      const json = JSON.stringify(protocolAmendmentData, null, 2);
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
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };

      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);

      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
        setSelectedAction(null);
        setSelectedTemplate('');
        setProtocolAmendmentData({});
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
    } catch (error) {
      console.error('Error submitting protocol amendment form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleContinuingReviewSubmit = async () => {
    if (!selectedTemplate || !templateDetails) return;

    try {
      const json = JSON.stringify(continuingReviewData, null, 2);
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
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };

      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);

      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
        setSelectedAction(null);
        setSelectedTemplate('');
        setContinuingReviewData({});
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
    } catch (error) {
      console.error('Error submitting continuing review form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEarlyTerminationSubmit = async () => {
    if (!selectedTemplate || !templateDetails) return;

    try {
      const json = JSON.stringify(earlyTerminationData, null, 2);
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
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };

      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);

      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
        setSelectedAction(null);
        setSelectedTemplate('');
        setEarlyTerminationData({});
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
    } catch (error) {
      console.error('Error submitting early termination form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);
      
      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
      
      // Reset view to go back to forms list
      setSelectedAction(null);
      setSelectedTemplate('');
      
      console.log('=== handleFormSave completed ===');
    } catch (error) {
      console.error('Error in handleFormSave:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                proposalId={0}
                formName="Progress_Report_Template.pdf"
                savedData={progressReportData}
                onSave={handleProgressReportSave}
                proposalTitle={selectedTemplate}
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
                proposalId={0}
                formName="Report_New_Event_Template.pdf"
                savedData={newEventReportData}
                onSave={handleNewEventReportSave}
                proposalTitle={selectedTemplate}
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
                proposalId={0}
                formName="Non_Compliance_Report_Template.pdf"
                savedData={nonComplianceReportData}
                onSave={handleNonComplianceReportSave}
                proposalTitle={selectedTemplate}
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
                proposalId={0}
                formName="Protocol_Amendment_Template.pdf"
                savedData={protocolAmendmentData}
                onSave={handleProtocolAmendmentSave}
                proposalTitle={selectedTemplate}
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
                proposalId={0}
                formName="Continuing_Review_Template.pdf"
                savedData={continuingReviewData}
                onSave={handleContinuingReviewSave}
                proposalTitle={selectedTemplate}
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
                proposalId={0}
                formName="Early_Termination_Template.pdf"
                savedData={earlyTerminationData}
                onSave={handleEarlyTerminationSave}
                proposalTitle={selectedTemplate}
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
                  onChange={(e) => setSelectedTemplate(e.target.value)}
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
