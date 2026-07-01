import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../DB';
import { assignFinalReportToStaff, getAssignableFinalReportStaff, getFinalReport, getFinalReportAssignments, updateFinalReport, type AssignableStaffProfile, type FinalReportAssignment } from '../../services/finalReportService';
import type { FinalReport, FinalReportStatus } from '../../types/finalReport';
import { ArrowLeft, FileText, Calendar, User, Download, Eye, CheckCircle, Clock, AlertCircle, Save, Award } from 'lucide-react';
import PDFFormFiller from '../../components/PDFFormFiller';
import { TemplateDownloadService } from '../../services/templateDownloadService';
import { useTemplateFields } from '@/hooks/useTemplateFields';
import FinalReportForm from '@/components/forms/FinalReportForm';
import UndergradFinalEndorsement from '@/components/forms/UndergradFinalEndorsement';
import PreFinalEndorsement from '@/components/forms/PreFinalEndorsement';

const statusBadge: Record<FinalReportStatus, string> = {
  'Pending Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
  'Requires Revision': 'bg-orange-100 text-orange-800 border-orange-200',
  'Approved': 'bg-green-100 text-green-800 border-green-200',
  'Rejected': 'bg-red-100 text-red-800 border-red-200',
};

const statusIcon: Record<FinalReportStatus, React.ReactNode> = {
  'Pending Review': <Clock className="w-4 h-4" />,
  'Under Review': <Eye className="w-4 h-4" />,
  'Requires Revision': <AlertCircle className="w-4 h-4" />,
  'Approved': <CheckCircle className="w-4 h-4" />,
  'Rejected': <AlertCircle className="w-4 h-4" />,
};

interface ProposalDetails {
  proposal_title: string;
  category: string;
  description: string;
  researcher_full_name: string;
  researcher_email: string;
  review_type: string;
  updated_on: string;
  protocol_id?: string | null;
}

const FinalReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<FinalReport | null>(null);
  const [proposalDetails, setProposalDetails] = useState<ProposalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<FinalReportStatus | undefined>(undefined);
  const [editOutcome, setEditOutcome] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfName, setSelectedPdfName] = useState<string>('');
  const [activeAttachmentPath, setActiveAttachmentPath] = useState<string | null>(null);
  const [showPdfFiller, setShowPdfFiller] = useState(false);
  const [showFinalReportFormFiller, setShowFinalReportFormFiller] = useState(false);
  const [showFinalReportFormView, setShowFinalReportFormView] = useState(false);
  const [finalReportFormData, setFinalReportFormData] = useState<Record<string, any>>({});
  const [finalReportFormLoading, setFinalReportFormLoading] = useState(false);
  const [printOnFormViewOpen, setPrintOnFormViewOpen] = useState(false);
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  const [assignableStaff, setAssignableStaff] = useState<AssignableStaffProfile[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [reportAssignments, setReportAssignments] = useState<FinalReportAssignment[]>([]);
  
  // Load predefined fields based on selected PDF
  const template = selectedPdfName ? TemplateDownloadService.getTemplateByName(selectedPdfName) : null;
  const { fields: predefinedFields, loading: fieldsLoading } = useTemplateFields(template?.id || null);

  
  // Debug logging
  console.log('🔍 Chairperson FinalReportDetail - selectedPdfName:', selectedPdfName, 'template:', template?.id, 'fields:', predefinedFields?.length, 'loading:', fieldsLoading);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  };

  useEffect(() => {
    if (id) {
      loadReport();
      loadAssignableStaff();
    }
  }, [id]);

  useEffect(() => {
    if (assignableStaff.length === 0) return;
    const validIds = new Set(assignableStaff.map((staff) => staff.id));
    setSelectedStaffIds((prev) => prev.filter((staffId) => validIds.has(staffId)));
  }, [assignableStaff]);

  useEffect(() => {
    if (!showFinalReportFormView || !printOnFormViewOpen) return;

    const timer = window.setTimeout(() => {
      window.print();
      setPrintOnFormViewOpen(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [showFinalReportFormView, printOnFormViewOpen]);

  useEffect(() => {
    if (showCertificatePreview) {
      document.body.classList.add('form-print-active');
    } else {
      document.body.classList.remove('form-print-active');
    }
    return () => {
      document.body.classList.remove('form-print-active');
    };
  }, [showCertificatePreview]);

  useEffect(() => {
    if (showFinalReportFormView) {
      document.body.classList.add('form-print-active');
    } else {
      document.body.classList.remove('form-print-active');
    }

    return () => {
      document.body.classList.remove('form-print-active');
    };
  }, [showFinalReportFormView]);

  async function loadAssignableStaff() {
    const result = await getAssignableFinalReportStaff();
    if (result.success) {
      setAssignableStaff(result.staff || []);
    }
  }

  async function loadReport() {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data: reportData } = await getFinalReport(id);
      if (reportData) {
        setReport(reportData as FinalReport);
        setEditStatus(reportData.status);
        setEditOutcome(reportData.outcome || '');
        setEditRemarks(reportData.remarks || '');

        const assignmentResult = await getFinalReportAssignments(reportData.id);
        if (assignmentResult.success) {
          setReportAssignments(assignmentResult.assignments || []);
          setSelectedStaffIds((assignmentResult.assignments || []).map((assignment) => assignment.assignee_id).slice(0, 4));
        } else {
          setReportAssignments([]);
          setSelectedStaffIds([]);
        }

        // Load proposal details
        if (reportData.proposal_date) {
          const { data: proposalData } = await supabase
            .from('proposals')
            .select('proposal_title, category, description, researcher_full_name, researcher_email, review_type, updated_on, protocol_id')
            .eq('date', reportData.proposal_date)
            .single();
          
          if (proposalData) {
            setProposalDetails(proposalData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load final report details');
    } finally {
      setLoading(false);
    }
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffIds((prev) => {
      if (prev.includes(staffId)) {
        return prev.filter((id) => id !== staffId);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, staffId];
    });
  }

  async function handleAssignStaff() {
    if (!report) return;

    if (report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision') {
      toast.error('Reviewers cannot be assigned to a finalized or revision-pending report.');
      return;
    }

    if (selectedStaffIds.length < 1 || selectedStaffIds.length > 4) {
      toast.warning('Please select 1 to 4 staff members.');
      return;
    }

    const loadingId = toast.loading('Passing to selected staff...');
    try {
      setAssigningStaff(true);
      const result = await assignFinalReportToStaff(report.id, selectedStaffIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign staff');
      }
      toast.success('Final report passed to assigned staff successfully.', { id: loadingId });
      await loadReport();
    } catch (error) {
      console.error('Error assigning final report staff:', error);
      toast.error(`Failed to assign staff: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
    } finally {
      setAssigningStaff(false);
    }
  }

  async function handleSave() {
    if (!report) return;
    
    // Prevent editing if report is already approved, rejected, or requires revision
    if (report.status === 'Approved' || report.status === 'Rejected') {
      toast.warning('This report has already been finalized and cannot be edited.');
      return;
    }
    
    // Prevent editing if the current status is "Requires Revision" and it's not a resubmission
    // The chairperson can only edit again when researcher resubmits (status changes back to "Pending Review")
    if (report.status === 'Requires Revision') {
      toast.warning('This report is awaiting revision from the researcher. You can only edit it after they resubmit.');
      return;
    }

    // Type validation for editStatus - only allow specific statuses
    const validStatuses: FinalReportStatus[] = ['Pending Review', 'Requires Revision', 'Approved', 'Rejected'];
    if (!validStatuses.includes(editStatus as FinalReportStatus)) {
      toast.error('Invalid status selected');
      return;
    }
    
    setSaving(true);
    const loadingId = toast.loading('Saving changes...');
    try {
      const newStatus = editStatus as FinalReportStatus;
      await updateFinalReport({
        id: report.id,
        status: newStatus,
        outcome: editOutcome,
        remarks: editRemarks,
      });
      
      // If status is being changed to Approved, show success message with certificate info
      if (newStatus === 'Approved') {
        toast.success('Final report approved! A certificate is now available for the researcher.', { id: loadingId });
      } else if (newStatus === 'Rejected') {
        toast.success('Final report rejected. The researcher will be notified of the decision.', { id: loadingId });
      } else if (newStatus === 'Requires Revision') {
        toast.success('Final report sent back for revision. The researcher will be able to resubmit.', { id: loadingId });
      } else {
        toast.success('Final report updated successfully!', { id: loadingId });
      }
      
      loadReport();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update final report', { id: loadingId });
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadAttachment(filePath: string) {
    try {
      const fileName = filePath.split('/').pop() || 'download';
      const isFinalReportJson = fileName.toLowerCase().endsWith('.json');

      if (isFinalReportJson) {
        const metadataFormData = report?.metadata?.staffSharedFormData;
        if (metadataFormData && typeof metadataFormData === 'object') {
          setFinalReportFormData(metadataFormData as Record<string, any>);
          setSelectedPdfName(fileName);
          setPrintOnFormViewOpen(true);
          setShowFinalReportFormView(true);
          return;
        }

        const { data } = await supabase.storage
          .from('storage')
          .download(filePath);

        if (!data) {
          throw new Error('Unable to load form file');
        }

        setFinalReportFormLoading(true);
        const text = await data.text();
        const parsed = JSON.parse(text);
        setFinalReportFormData(parsed && typeof parsed === 'object' ? parsed : {});
        setSelectedPdfName(fileName);
        setPrintOnFormViewOpen(true);
        setShowFinalReportFormView(true);
        return;
      }

      const { data, error } = await supabase.storage
        .from('storage')
        .download(filePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setFinalReportFormLoading(false);
    }
  }

  async function handleOpenPdfFiller(filePath: string) {
    try {
      const { data } = await supabase.storage
        .from('storage')
        .getPublicUrl(filePath);
      
      if (data.publicUrl) {
        setSelectedPdfUrl(`${data.publicUrl}?v=${Date.now()}`);
        setActiveAttachmentPath(filePath);
        // For final reports, use the template name to load predefined fields
        // Check if this is a final report by looking at the report title
        const templateName = report?.title.includes('Final Report') 
          ? 'Protocol Final Report' 
          : (filePath.split('/').pop() || 'document.pdf');
        setSelectedPdfName(templateName);
        setShowPdfFiller(true);
        
        console.log('Opening PDF with template name:', templateName);
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF for editing');
    }
  }

  async function handleOpenFinalReportForm(filePath: string) {
    try {
      const metadataFormData = report?.metadata?.staffSharedFormData;
      const sharedFormPath = typeof report?.metadata?.sharedFormPath === 'string'
        ? report?.metadata?.sharedFormPath
        : '';
      const shouldUseMetadata =
        !!metadataFormData &&
        typeof metadataFormData === 'object' &&
        !!sharedFormPath &&
        sharedFormPath === filePath;

      if (shouldUseMetadata) {
        setFinalReportFormData(metadataFormData as Record<string, any>);
        setActiveAttachmentPath(sharedFormPath);
        setSelectedPdfName(sharedFormPath.split('/').pop() || 'final-report-filled.json');
        setShowFinalReportFormFiller(true);
        return;
      }

      const { data } = await supabase.storage
        .from('storage')
        .download(filePath);

      if (!data) {
        throw new Error('Unable to load form file');
      }

      setFinalReportFormLoading(true);
      const text = await data.text();
      const parsed = JSON.parse(text);
      setFinalReportFormData(parsed && typeof parsed === 'object' ? parsed : {});
      setActiveAttachmentPath(filePath);
      setSelectedPdfName(filePath.split('/').pop() || 'final-report-filled.json');
      setShowFinalReportFormFiller(true);
    } catch (error) {
      console.error('Error opening final report form:', error);
      toast.error(`Failed to open final report form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFinalReportFormLoading(false);
    }
  }

  async function handleSaveFinalReportForm() {
    if (!report) return;
    if (report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision') {
      toast.error('This report is finalized and the form cannot be edited.');
      return;
    }

    if (!activeAttachmentPath || !activeAttachmentPath.toLowerCase().endsWith('.json')) {
      toast.error('No original final report form selected to update.');
      return;
    }

    const loadingId = toast.loading('Saving reviewed form...');
    try {
      const json = JSON.stringify(finalReportFormData, null, 2);
      const jsonBlob = new Blob([json], { type: 'application/json' });

      // Keep storage sync as best-effort; chairperson + assigned pages now read metadata first.
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(activeAttachmentPath, jsonBlob, {
          contentType: 'application/json',
          upsert: true,
        });

      const existingAttachments = report.attachments || [];
      const updatedAttachments = existingAttachments.includes(activeAttachmentPath)
        ? existingAttachments
        : [...existingAttachments, activeAttachmentPath];

      const baseUpdatePayload: Record<string, any> = {
        attachments: updatedAttachments,
        last_updated_at: new Date().toISOString(),
      };

      let updateError: any = null;

      const { error: updateWithMetadataError } = await supabase
        .from('final_reports')
        .update({
          ...baseUpdatePayload,
          metadata: {
            ...(report.metadata || {}),
            sharedFormPath: activeAttachmentPath,
            staffSharedFormData: finalReportFormData,
          },
        })
        .eq('id', report.id);

      if (updateWithMetadataError) {
        const message = (updateWithMetadataError.message || '').toLowerCase();
        const metadataColumnMissing = message.includes('metadata') && message.includes('does not exist');

        if (metadataColumnMissing) {
          const { error: fallbackUpdateError } = await supabase
            .from('final_reports')
            .update(baseUpdatePayload)
            .eq('id', report.id);

          updateError = fallbackUpdateError;
        } else {
          updateError = updateWithMetadataError;
        }
      }

      if (updateError) throw updateError;

      if (uploadError) {
        toast.warning(`Reviewed form saved (DB). Storage sync warning: ${getErrorMessage(uploadError)}`, { id: loadingId });
      } else {
        toast.success('Reviewed form saved successfully!', { id: loadingId });
      }
      setShowFinalReportFormFiller(false);
      loadReport();
    } catch (error) {
      console.error('Error saving reviewed form:', error);
      toast.error(`Failed to save reviewed form: ${getErrorMessage(error)}`, { id: loadingId });
    }
  }

  async function handlePdfSave(pdfBytes: Uint8Array, formData: Record<string, string | boolean>) {
    if (!report) return;
    if (report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision') {
      toast.error('This report is finalized and the PDF cannot be edited.');
      return;
    }

    console.log('Chairperson filled PDF:', formData);
    console.log('PDF size:', pdfBytes.length, 'bytes');
    
    if (!activeAttachmentPath || !activeAttachmentPath.toLowerCase().endsWith('.pdf')) {
      toast.error('No original PDF selected to update.');
      return;
    }

    const loadingId = toast.loading('Saving filled PDF...');
    try {
      // Convert PDF bytes to File
      const pdfArray = Array.from(pdfBytes);
      const pdfBlob = new Blob([new Uint8Array(pdfArray)], { type: 'application/pdf' });
      
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(activeAttachmentPath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) throw uploadError;

      const existingAttachments = report.attachments || [];
      const updatedAttachments = existingAttachments.includes(activeAttachmentPath)
        ? existingAttachments
        : [...existingAttachments, activeAttachmentPath];
      
      const { error: updateError } = await supabase
        .from('final_reports')
        .update({ 
          attachments: updatedAttachments,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (updateError) throw updateError;

      toast.success('Filled PDF saved successfully!', { id: loadingId });
      setShowPdfFiller(false);
      loadReport(); // Refresh the report data
    } catch (error) {
      console.error('Error saving filled PDF:', error);
      toast.error(`Failed to save filled PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingId });
    }
  }
  
  async function handleGenerateCertificate() {
    if (!report) return;
    setShowCertificatePreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  }
  
  function handlePreviewCertificate() {
    setShowCertificatePreview(true);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading final report details...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Final report not found</p>
          <button
            onClick={() => navigate('/chairperson/final-reports')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Final Reports
          </button>
        </div>
      </div>
    );
  }

  // If PDF filler is open, show it fullscreen
  if (showPdfFiller && selectedPdfUrl) {
    // Show loading state while fields are loading for protocol-final-report template
    if (fieldsLoading && selectedPdfName === 'Protocol Final Report') {
      return (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading template fields...</p>
          </div>
        </div>
      );
    }
    
    return (
      <PDFFormFiller
        templateUrl={selectedPdfUrl}
        templateName={selectedPdfName}
        onSave={handlePdfSave}
        onCancel={() => setShowPdfFiller(false)}
        predefinedFields={predefinedFields}
      />
    );
  }

  if (showFinalReportFormFiller) {
    const isCompleted = report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision';
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {finalReportFormLoading ? 'Loading Form...' : `Fill and Review: ${selectedPdfName}`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFinalReportFormFiller(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              {!isCompleted && (
                <button
                  onClick={handleSaveFinalReportForm}
                  disabled={finalReportFormLoading}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                >
                  Save Reviewed Form
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">
            {finalReportFormLoading ? (
              <div className="text-center py-10 text-gray-600">Loading form data...</div>
            ) : (
              <div style={isCompleted ? { pointerEvents: 'none' } : undefined}>
                <FinalReportForm
                  savedData={finalReportFormData}
                  onSave={(patch) => setFinalReportFormData((prev) => ({ ...prev, ...patch }))}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showFinalReportFormView) {
    return (
      <div className="min-h-screen bg-gray-100 form-print-root">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {finalReportFormLoading ? 'Loading Form Preview...' : `Final Report Preview: ${selectedPdfName}`}
            </div>
            <button
              onClick={() => setShowFinalReportFormView(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Details
            </button>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4 print:py-0 print:px-0 print:bg-white form-print-shell">
          <div className="max-w-7xl mx-auto print:mx-0 print:max-w-none">
            {finalReportFormLoading ? (
              <div className="text-center py-10 text-gray-600">Loading form data...</div>
            ) : (
              <div style={{ pointerEvents: 'none' }}>
                <FinalReportForm savedData={finalReportFormData} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showCertificatePreview && report && proposalDetails) {
    const isUndergrad = proposalDetails.category === 'Undergraduate';
    const isGraduate = proposalDetails.category === 'Graduate';
    
    const endorsementData = {
      date: new Date(report.last_updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      name: proposalDetails.researcher_full_name || report.researcher_name || '',
      affiliation: 'University of the Immaculate Conception\nBonifacio Street, Davao City',
      title: proposalDetails.proposal_title || report.title || '',
      protocolCode: proposalDetails.protocol_id || '',
      salutation: 'Ms./Mr. :',
      receiptDate: new Date(report.submitted_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    };

    return (
      <div className="min-h-screen bg-gray-100 form-print-root">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Certificate Preview: {report.title}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Print / Download PDF
              </button>
              <button
                onClick={() => setShowCertificatePreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Details
              </button>
            </div>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4 print:py-0 print:px-0 print:bg-white form-print-shell">
          <div className="max-w-7xl mx-auto print:mx-0 print:max-w-none">
            {isUndergrad && (
              <UndergradFinalEndorsement initialData={endorsementData} isReadOnly={true} />
            )}
            {isGraduate && (
              <PreFinalEndorsement initialData={endorsementData} isReadOnly={true} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/chairperson/final-reports')}
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Final Reports
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{report.title}</h1>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusBadge[report.status]}`}>
              {statusIcon[report.status]}
              {report.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Report Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Information */}
            {proposalDetails && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Related Proposal
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Proposal Title</label>
                    <p className="text-gray-900">{proposalDetails.proposal_title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <p className="text-gray-900">{proposalDetails.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Review Type</label>
                      <p className="text-gray-900">{proposalDetails.review_type}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-600 text-sm">{proposalDetails.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Researcher Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Researcher Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{proposalDetails?.researcher_full_name || report.researcher_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{proposalDetails?.researcher_email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Submission Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Timeline
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Submitted At</label>
                  <p className="text-gray-900">{formatDate(report.submitted_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900">{formatDate(report.last_updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Submitted Documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Submitted Documents ({report.attachments?.length || 0})
              </h2>
              {!report.attachments || report.attachments.length === 0 ? (
                <p className="text-gray-500 text-sm">No documents attached</p>
              ) : (
                <div className="space-y-2">
                  {report.attachments.map((filePath, index) => {
                    const fileName = filePath.split('/').pop() || 'Document';
                    const isPdf = fileName.toLowerCase().endsWith('.pdf');
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-700 font-medium">{fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isPdf && (
                            <button
                              onClick={() => handleOpenFinalReportForm(filePath)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              {report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision' ? 'View Form' : 'Fill & Review'}
                            </button>
                          )}
                          {isPdf && (
                            <button
                              onClick={() => {
                                if (report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision') {
                                  const { data } = supabase.storage.from('storage').getPublicUrl(filePath);
                                  if (data?.publicUrl) window.open(data.publicUrl, '_blank');
                                } else {
                                  handleOpenPdfFiller(filePath);
                                }
                              }}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              {report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision' ? 'View PDF' : 'Fill & Review'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadAttachment(filePath)}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Certificate Section - Only shown when approved */}
            {report.status === 'Approved' && proposalDetails && proposalDetails.category !== 'External' && (
              <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  {proposalDetails.category === 'Undergraduate' ? 'Endorsement for Final Defense' : 'Endorsement for Pre-final Defense'}
                </h2>
                <div className="flex flex-col items-center justify-center py-6 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center mb-6">
                    <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Research Ethics Committee</h3>
                    <p className="text-sm text-gray-600 mt-1">Official Endorsement</p>
                  </div>
                  
                  <div className="w-full max-w-md text-center">
                    <p className="text-gray-700 mb-4">
                      This endorsement confirms that the study titled 
                      <span className="font-medium"> "{proposalDetails.proposal_title || report.title}"</span> has officially been approved and released for defense.
                    </p>
                    
                    <p className="text-sm text-gray-600 mb-6">
                      Researcher: {proposalDetails.researcher_full_name || report.researcher_name}<br />
                      Approval Date: {new Date(report.last_updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    <div className="mt-6 flex justify-center space-x-4">
                      <button 
                        onClick={handleGenerateCertificate}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download / Print
                      </button>
                      <button 
                        onClick={handlePreviewCertificate}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Review Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pass to Assigned Staff</h2>
              <p className="text-xs text-gray-600 mb-3">Select 1 to 4 reviewers or admin assistants.</p>

              <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-200 rounded p-2 mb-3">
                {assignableStaff.length === 0 ? (
                  <p className="text-xs text-gray-500">No assignable staff found.</p>
                ) : (
                  assignableStaff.map((staff) => {
                    const isAssignDisabled = report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision';
                    return (
                      <label key={staff.id} className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(staff.id)}
                          onChange={() => toggleStaffSelection(staff.id)}
                          disabled={isAssignDisabled || (!selectedStaffIds.includes(staff.id) && selectedStaffIds.length >= 4)}
                        />
                        <span>
                          <span className="block font-medium text-gray-900">{staff.name}</span>
                          <span className="block text-xs text-gray-500">
                            {staff.email}{staff.role ? ` • ${staff.role}` : ''}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <button
                onClick={handleAssignStaff}
                disabled={assigningStaff || selectedStaffIds.length < 1 || report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision'}
                className="w-full px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition mb-6"
              >
                {assigningStaff ? 'Passing...' : 'Pass to Selected Staff'}
              </button>

              {(report.status === 'Approved' || report.status === 'Rejected' || report.status === 'Requires Revision') && (
                <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800 font-medium">
                  {report.status === 'Approved'
                    ? 'This report is approved. Reviewers cannot be assigned.'
                    : report.status === 'Rejected'
                    ? 'This report is rejected. Reviewers cannot be assigned.'
                    : 'This report is awaiting revision from researcher. Reviewers cannot be assigned.'}
                </div>
              )}

              {reportAssignments.length > 0 && (
                <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded p-2">
                  <p className="text-xs text-indigo-900 font-medium">
                    Assigned: {reportAssignments.length} staff member{reportAssignments.length > 1 ? 's' : ''}
                  </p>
                  {reportAssignments[0]?.assigned_at && (
                    <p className="text-xs text-indigo-700">{formatDate(reportAssignments[0].assigned_at)}</p>
                  )}
                </div>
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Update</h2>
              
              {/* Show review form for chairperson while report is still in active review */}
              {report.status === 'Pending Review' || report.status === 'Under Review' ? (
                <div className="space-y-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as FinalReportStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="Requires Revision">Requires Revision</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Outcome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outcome / Decision Summary
                    </label>
                    <textarea
                      value={editOutcome}
                      onChange={(e) => setEditOutcome(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Provide a summary of your decision or feedback..."
                    />
                  </div>

                  {/* Internal Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Internal Remarks
                      <span className="text-xs text-gray-500 ml-2">(Not visible to researcher)</span>
                    </label>
                    <textarea
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Internal notes for committee tracking..."
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <div>
                  {/* Display for Approved/Rejected/Requires Revision reports */}
                  <div className={`p-4 rounded-lg ${
                    report.status === 'Approved' ? 'bg-green-50 border border-green-200' : 
                    report.status === 'Rejected' ? 'bg-red-50 border border-red-200' :
                    report.status === 'Requires Revision' ? 'bg-orange-50 border border-orange-200' : ''
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {report.status === 'Approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {report.status === 'Rejected' && <AlertCircle className="w-5 h-5 text-red-600" />}
                      {report.status === 'Requires Revision' && <AlertCircle className="w-5 h-5 text-orange-600" />}
                      <p className={`font-medium ${
                        report.status === 'Approved' ? 'text-green-800' : 
                        report.status === 'Rejected' ? 'text-red-800' :
                        report.status === 'Requires Revision' ? 'text-orange-800' : ''
                      }`}>
                        Status: {report.status}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {report.status === 'Approved' 
                        ? "This report has been approved and cannot be edited further. A certificate has been generated for the researcher."
                        : report.status === 'Rejected'
                        ? "This report has been rejected and cannot be edited further."
                        : "This report is awaiting revision from the researcher. You can review it again once they resubmit."}
                    </p>
                    {/* Current Outcome Display */}
                    {report.outcome && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Decision Summary
                        </label>
                        <div className="p-3 bg-white rounded-lg text-sm text-gray-700 border border-gray-200">
                          {report.outcome}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Always show the current outcome for reference if it exists */}
              {report.outcome && (report.status === 'Pending Review' || report.status === 'Under Review') && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Outcome
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {report.outcome}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalReportDetail;
