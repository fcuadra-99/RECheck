import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../DB';
import { getFinalReport, updateFinalReport } from '../../services/finalReportService';
import type { FinalReport, FinalReportStatus } from '../../types/finalReport';
import { ArrowLeft, FileText, Calendar, User, Download, Eye, CheckCircle, Clock, AlertCircle, Save, Award } from 'lucide-react';
import PDFFormFiller from '../../components/PDFFormFiller';
import { TemplateDownloadService } from '../../services/templateDownloadService';
import { useTemplateFields } from '@/hooks/useTemplateFields';

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
  const [showPdfFiller, setShowPdfFiller] = useState(false);
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  
  // Load predefined fields based on selected PDF
  const template = selectedPdfName ? TemplateDownloadService.getTemplateByName(selectedPdfName) : null;
  const { fields: predefinedFields, loading: fieldsLoading } = useTemplateFields(template?.id || null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  console.log (certificateUrl, showCertificatePreview);
  
  // Debug logging
  console.log('🔍 Chairperson FinalReportDetail - selectedPdfName:', selectedPdfName, 'template:', template?.id, 'fields:', predefinedFields?.length, 'loading:', fieldsLoading);
  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

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

        // Load proposal details
        if (reportData.proposal_date) {
          const { data: proposalData } = await supabase
            .from('proposals')
            .select('proposal_title, category, description, researcher_full_name, researcher_email, review_type, updated_on')
            .eq('date', reportData.proposal_date)
            .single();
          
          if (proposalData) {
            setProposalDetails(proposalData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Failed to load final report details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!report) return;
    
    // Prevent editing if report is already approved, rejected, or requires revision
    if (report.status === 'Approved' || report.status === 'Rejected') {
      alert('This report has already been finalized and cannot be edited.');
      return;
    }
    
    // Prevent editing if the current status is "Requires Revision" and it's not a resubmission
    // The chairperson can only edit again when researcher resubmits (status changes back to "Pending Review")
    if (report.status === 'Requires Revision') {
      alert('This report is awaiting revision from the researcher. You can only edit it after they resubmit.');
      return;
    }

    // Type validation for editStatus - only allow specific statuses
    const validStatuses: FinalReportStatus[] = ['Pending Review', 'Requires Revision', 'Approved'];
    if (!validStatuses.includes(editStatus as FinalReportStatus)) {
      alert('Invalid status selected');
      return;
    }
    
    setSaving(true);
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
        alert('Final report approved! A certificate is now available for the researcher.');
      } else if (newStatus === 'Requires Revision') {
        alert('Final report sent back for revision. The researcher will be able to resubmit.');
      } else {
        alert('Final report updated successfully!');
      }
      
      loadReport();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update final report');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadAttachment(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from('storage')
        .download(filePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop() || 'download';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  }

  async function handleOpenPdfFiller(filePath: string) {
    try {
      const { data } = await supabase.storage
        .from('storage')
        .getPublicUrl(filePath);
      
      if (data.publicUrl) {
        setSelectedPdfUrl(data.publicUrl);
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
      alert('Failed to open PDF for editing');
    }
  }

  async function handlePdfSave(pdfBytes: Uint8Array, formData: Record<string, string | boolean>) {
    console.log('Chairperson filled PDF:', formData);
    console.log('PDF size:', pdfBytes.length, 'bytes');
    
    try {
      if (!report) return;

      // Convert PDF bytes to File
      const pdfArray = Array.from(pdfBytes);
      const pdfBlob = new Blob([new Uint8Array(pdfArray)], { type: 'application/pdf' });
      const pdfFile = new File(
        [pdfBlob],
        `${selectedPdfName.replace('.pdf', '')}_reviewed.pdf`,
        { type: 'application/pdf', lastModified: Date.now() }
      );

      // Upload the reviewed PDF back to storage
      const timestamp = Date.now();
      const fileName = `final-reports/reviewed/${report.id}/filled_${timestamp}_${selectedPdfName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(fileName, pdfFile, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) throw uploadError;

      // Update the report's attachments array to include the new filled PDF
      const updatedAttachments = [...(report.attachments || []), fileName];
      
      const { error: updateError } = await supabase
        .from('final_reports')
        .update({ 
          attachments: updatedAttachments,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (updateError) throw updateError;

      alert('Filled PDF saved successfully!');
      setShowPdfFiller(false);
      loadReport(); // Refresh the report data
    } catch (error) {
      console.error('Error saving filled PDF:', error);
      alert(`Failed to save filled PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async function handleGenerateCertificate() {
    if (!report) return;
    
    try {
      // This is a placeholder function for generating a certificate
      // In a real implementation, you would create a PDF certificate here
      // For now, we'll just simulate the process
      
      const timestamp = Date.now();
      const certificateName = `certificate_of_approval_${report.id}_${timestamp}.pdf`;
      
      // Show loading state
      alert('Generating certificate...');
      
      // In a real implementation, you would create and upload a PDF here
      // For now, we'll simulate a delay
      setTimeout(() => {
        // Show success message
        alert(`Certificate "${certificateName}" generated successfully!`);
        
        // Preview functionality could be implemented by setting the URL to the generated certificate
        setShowCertificatePreview(true);
        setCertificateUrl(`/sample-certificate.pdf?id=${report.id}&name=${encodeURIComponent(certificateName)}`);
      }, 1500);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  function handlePreviewCertificate() {
    setShowCertificatePreview(true);
    // In a real implementation, you would load the certificate preview here
    alert('Certificate preview would appear here. This is a placeholder for the actual certificate preview functionality.');
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
              <p className="mt-2 text-sm text-gray-500">Report ID: {report.id}</p>
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
                <div>
                  <label className="text-sm font-medium text-gray-700">Researcher ID</label>
                  <p className="text-gray-600 text-sm font-mono">{report.researcher_id}</p>
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
                          {isPdf && (
                            <button
                              onClick={() => handleOpenPdfFiller(filePath)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Fill & Review
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
            {report.status === 'Approved' && (
              <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Certificate of Completion
                </h2>
                <div className="flex flex-col items-center justify-center py-6 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center mb-6">
                    <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Research Ethics Committee</h3>
                    <p className="text-sm text-gray-600 mt-1">Certificate of Approval</p>
                  </div>
                  
                  <div className="w-full max-w-md text-center">
                    <p className="text-gray-700 mb-4">
                      This certificate confirms that the final report for the research project titled 
                      <span className="font-medium"> {report.title}</span> has been reviewed and approved by the Ethics Committee.
                    </p>
                    
                    <p className="text-sm text-gray-600 mb-6">
                      Researcher: {proposalDetails?.researcher_full_name || report.researcher_name}<br />
                      Approval Date: {new Date().toLocaleDateString('en-US', {
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
                        Generate & Download
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Update</h2>
              
              {/* Show review form only for pending status */}
              {report.status === 'Pending Review' ? (
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
              {report.outcome && report.status === 'Pending Review' && (
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
