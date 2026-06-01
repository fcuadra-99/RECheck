import React, { useEffect, useState } from 'react';
import { supabase } from '../../DB';
import { listFinalReports, createFinalReportDraft } from '../../services/finalReportService';
import type { FinalReport } from '../../types/finalReport';
import { 
  Eye, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  X, 
  ArrowLeft, 
  Download,
  Edit3,
  Award
} from 'lucide-react';
import FinalReportForm from '@/components/forms/FinalReportForm';
import UndergradFinalEndorsement from '@/components/forms/UndergradFinalEndorsement';
import PreFinalEndorsement from '@/components/forms/PreFinalEndorsement';

interface Proposal {
  date: string;
  proposal_title: string;
  status: string;
  review_type: string;
  researcher: string;
  category: string;
  description: string;
  updated_on: string;
  researcher_email: string;
  researcher_full_name: string;
  reviewer: string;
}

interface DocumentUpload {
  id: string;
  label: string;
  file: File | null;
  required: boolean;
}

const statusBadge: Record<string, string> = {
  'Pending Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
  'Requires Revision': 'bg-orange-100 text-orange-800 border-orange-200',
  'Approved': 'bg-green-100 text-green-800 border-green-200',
  'Rejected': 'bg-red-100 text-red-800 border-red-200',
};

const statusIcon: Record<string, React.ReactNode> = {
  'Pending Review': <Clock className="w-3 h-3" />,
  'Under Review': <Eye className="w-3 h-3" />,
  'Requires Revision': <AlertCircle className="w-3 h-3" />,
  'Approved': <CheckCircle className="w-3 h-3" />,
  'Rejected': <AlertCircle className="w-3 h-3" />,
};

const FinalReportSubmission: React.FC = () => {
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | string>('All');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FinalReport | null>(null);
  const [revisingReport, setRevisingReport] = useState<FinalReport | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: '1', label: 'Upload your final report (PDF)', file: null, required: true },
    { id: '2', label: 'Upload signed consent form', file: null, required: true },
    { id: '3', label: 'Upload any additional supporting documents', file: null, required: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [showFinalReportForm, setShowFinalReportForm] = useState(false);
  const [currentFillingDocId, setCurrentFillingDocId] = useState<string | null>(null);
  const [finalReportData, setFinalReportData] = useState<Record<string, any>>({});
  const [showFinalReportPreview, setShowFinalReportPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [printOnPreviewOpen, setPrintOnPreviewOpen] = useState(false);
  const [selectedProposalDetails, setSelectedProposalDetails] = useState<any>(null);
  const [proposalDetailsLoading, setProposalDetailsLoading] = useState(false);
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);

  useEffect(() => {
    async function fetchProposalDetails() {
      if (!selectedReport?.proposal_date) {
        setSelectedProposalDetails(null);
        return;
      }
      setProposalDetailsLoading(true);
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('date', selectedReport.proposal_date)
          .single();
        if (!error && data) {
          setSelectedProposalDetails(data);
        } else {
          setSelectedProposalDetails(null);
        }
      } catch (err) {
        console.error('Error fetching proposal details:', err);
        setSelectedProposalDetails(null);
      } finally {
        setProposalDetailsLoading(false);
      }
    }
    fetchProposalDetails();
  }, [selectedReport?.id]);

  async function loadReports() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setReports([]);
      setLoading(false);
      return;
    }
    const { data } = await listFinalReports({});
    // Filter by current researcher
    const filtered = ((data as any) || []).filter((r: FinalReport) => r.researcher_id === user.user.id);
    setReports(filtered);
    setLoading(false);
  }
  
  function handlePreviewCertificate() {
    setShowCertificatePreview(true);
  }
  
  function handleDownloadCertificate(reportTitle: string) {
    setShowCertificatePreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  }

  async function loadProposals() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    // Fetch researcher's proposals that are in Data Collection status (eligible for final report)
    const { data } = await supabase
      .from('proposals')
      .select('*')
      .eq('researcher', user.user.id)
      .eq('status', 'Data Collection')
      .order('updated_on', { ascending: false });
    setProposals((data as any) || []);
  }

  useEffect(() => {
    loadReports();
    loadProposals();
  }, []);

  useEffect(() => {
    if (!showFinalReportPreview || !printOnPreviewOpen) return;

    const timer = window.setTimeout(() => {
      window.print();
      setPrintOnPreviewOpen(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [showFinalReportPreview, printOnPreviewOpen]);

  useEffect(() => {
    if (showFinalReportPreview) {
      document.body.classList.add('form-print-active');
    } else {
      document.body.classList.remove('form-print-active');
    }

    return () => {
      document.body.classList.remove('form-print-active');
    };
  }, [showFinalReportPreview]);

  const handleDocumentFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments(prev => 
        prev.map(doc => doc.id === docId ? { ...doc, file: e.target.files![0] } : doc)
      );
    }
  };

  const handleUseTemplate = (docId: string) => {
    setCurrentFillingDocId(docId);
    setShowFinalReportForm(true);
  };

  const handleFinalReportFormSave = async () => {
    if (!currentFillingDocId) return;
    const json = JSON.stringify(finalReportData, null, 2);
    const jsonBlob = new Blob([json], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], 'final-report-filled.json', { type: 'application/json' });
    
    setDocuments(prev => 
      prev.map(doc => doc.id === currentFillingDocId ? { ...doc, file: jsonFile } : doc)
    );
    
    setShowFinalReportForm(false);
    setCurrentFillingDocId(null);
    alert('Template filled successfully! You can now submit your form.');
  };

  async function handleSubmit() {
    if (!revisingReport && (!selectedProposal || !reportTitle.trim())) {
      alert('Please select a proposal and provide a title.');
      return;
    }

    // Check required documents
    const missingRequired = documents.filter(doc => doc.required && !doc.file);
    if (missingRequired.length > 0) {
      alert('Please upload all required documents (marked with *).');
      return;
    }

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const attachmentPaths: string[] = [];

      // Upload all document files
      for (const doc of documents) {
        if (doc.file) {
          const fileName = `${Date.now()}-${doc.file.name}`;
          const filePath = `final-reports/${user.user?.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('storage')
            .upload(filePath, doc.file);
          if (!uploadError) {
            attachmentPaths.push(filePath);
          }
        }
      }

      if (revisingReport) {
        // Update existing report with revised documents
        const updatedAttachments = [...(revisingReport.attachments || []), ...attachmentPaths];
        
        const { error: updateError } = await supabase
          .from('final_reports')
          .update({
            attachments: updatedAttachments,
            status: 'Pending Review',
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', revisingReport.id);

        if (updateError) throw updateError;
        
        alert('Revised documents submitted successfully! Your report is now pending review.');
      } else {
        // Create new final report
        await createFinalReportDraft({
          proposal_date: selectedProposal,
          title: reportTitle,
          attachments: attachmentPaths,
        });
        
        alert('Final report submitted successfully!');
      }
      
      setShowSubmissionForm(false);
      setRevisingReport(null);
      setSelectedProposal('');
      setReportTitle('');
      setDocuments([
        { id: '1', label: 'Upload your final report (PDF)', file: null, required: true },
        { id: '2', label: 'Upload signed consent form', file: null, required: true },
        { id: '3', label: 'Upload any additional supporting documents', file: null, required: false },
      ]);
      loadReports();
    } catch (err) {
      console.error(err);
      alert('Error submitting final report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredReports = reports.filter(r => {
    if (statusFilter === 'All') return true;
    return r.status === statusFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  async function handleViewAttachment(filePath: string) {
    try {
      const fileName = filePath.split('/').pop() || 'Document';
      const isFinalReportJson = fileName.toLowerCase().endsWith('.json') && fileName.toLowerCase().includes('final-report');

      const { data } = await supabase.storage
        .from('storage')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Unable to resolve file URL');
      }

      if (!isFinalReportJson) {
        window.open(data.publicUrl, '_blank');
        return;
      }

      setPreviewLoading(true);
      setPreviewTitle(fileName);

      const response = await fetch(data.publicUrl);
      if (!response.ok) {
        throw new Error(`Failed to load form: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      setFinalReportData(parsed && typeof parsed === 'object' ? parsed : {});
      setShowFinalReportPreview(true);
    } catch (error) {
      console.error('Error viewing attachment:', error);
      alert(`Failed to view attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDownloadAttachment(filePath: string) {
    try {
      const fileName = filePath.split('/').pop() || 'Document';
      const isFinalReportJson = fileName.toLowerCase().endsWith('.json') && fileName.toLowerCase().includes('final-report');

      if (!isFinalReportJson) {
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
        return;
      }

      const { data } = await supabase.storage
        .from('storage')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Unable to resolve file URL');
      }

      setPreviewLoading(true);
      setPreviewTitle(fileName);

      const response = await fetch(data.publicUrl);
      if (!response.ok) {
        throw new Error(`Failed to load form: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      setFinalReportData(parsed && typeof parsed === 'object' ? parsed : {});
      setPrintOnPreviewOpen(true);
      setShowFinalReportPreview(true);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert(`Failed to download attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPreviewLoading(false);
    }
  }

  // Show Final Report React Form if using template (check this FIRST before submission form)
  if (showFinalReportForm) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Fill Final Report Form</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowFinalReportForm(false);
                  setCurrentFillingDocId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalReportFormSave}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Form
              </button>
            </div>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">
            <FinalReportForm
              savedData={finalReportData}
              onSave={(patch) => setFinalReportData((prev) => ({ ...prev, ...patch }))}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showFinalReportPreview) {
    return (
      <div className="min-h-screen bg-gray-100 form-print-root">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {previewLoading ? 'Loading Form Preview...' : `Final Report Preview: ${previewTitle}`}
            </div>
            <button
              onClick={() => setShowFinalReportPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Details
            </button>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4 print:py-0 print:px-0 print:bg-white form-print-shell">
          <div className="max-w-7xl mx-auto print:mx-0 print:max-w-none">
            {previewLoading ? (
              <div className="text-center py-10 text-gray-600">Loading form data...</div>
            ) : (
              <div style={{ pointerEvents: 'none' }}>
                <FinalReportForm savedData={finalReportData} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showCertificatePreview && selectedReport && selectedProposalDetails) {
    const isUndergrad = selectedProposalDetails.category === 'Undergraduate';
    const isGraduate = selectedProposalDetails.category === 'Graduate';
    
    const endorsementData = {
      date: new Date(selectedReport.last_updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      name: selectedProposalDetails.researcher_full_name || selectedReport.researcher_name || '',
      affiliation: 'University of the Immaculate Conception\nBonifacio Street, Davao City',
      title: selectedProposalDetails.proposal_title || selectedReport.title || '',
      protocolCode: selectedProposalDetails.protocol_id || '',
      salutation: 'Ms./Mr. :',
      receiptDate: new Date(selectedReport.submitted_at).toLocaleDateString('en-US', {
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
              Certificate Preview: {selectedReport.title}
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

  // Show submission form if toggled
  if (showSubmissionForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => {
                setShowSubmissionForm(false);
                setRevisingReport(null);
              }}
              className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2"
            >
              ← Back to submissions
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {revisingReport ? 'Submit Revised Documents' : 'Submission for Final Report'}
            </h1>
            <p className="mt-2 text-gray-500">
              {revisingReport 
                ? 'Upload your revised documents based on chairperson feedback.'
                : 'Upload your final report form and Signed ICF to complete the REC process.'
              }
            </p>
            {revisingReport && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Revising: {revisingReport.title}</p>
                    {revisingReport.outcome && (
                      <p className="text-sm text-orange-800 mt-1">
                        <span className="font-medium">Chairperson's feedback:</span> {revisingReport.outcome}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
            {/* Step 1: Select Proposal (only shown when creating new report) */}
            {!revisingReport && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Select Research Project</h2>
                <select
                  value={selectedProposal}
                  onChange={(e) => {
                    setSelectedProposal(e.target.value);
                    const selected = proposals.find(p => p.date === e.target.value);
                    if (selected) {
                      setReportTitle(`Final Report: ${selected.proposal_title}`);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose an approved proposal...</option>
                  {proposals.map((proposal) => (
                    <option key={proposal.date} value={proposal.date}>
                      [{proposal.category}] {proposal.proposal_title}
                    </option>
                  ))}
                </select>
                {proposals.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No proposals in data collection phase found. Final reports can only be submitted for proposals currently in data collection.
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Upload Documents */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {revisingReport ? 'Step 1: Upload your revised documents' : 'Step 2: Upload your documents'}
              </h2>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {doc.label}
                        {doc.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.file ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600 max-w-[200px] truncate">{doc.file.name}</span>
                          <button
                            onClick={() => setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, file: null } : d))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Show "Use Template" button only for the first document (final report PDF) */}
                          {doc.id === '1' && (
                            <button
                              onClick={() => handleUseTemplate(doc.id)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Use Template
                            </button>
                          )}
                          <label className="cursor-pointer">
                            <span className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors inline-block text-sm font-medium">
                              Choose file
                            </span>
                            <input
                              type="file"
                              onChange={(e) => handleDocumentFileChange(doc.id, e)}
                              className="hidden"
                              accept=".pdf,.doc,.docx"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium text-blue-900">Please ensure that your documents are in PDF format.</p>
                
                </div>
              </div>
            </div>

            {/* Step 3: Confirm Submission */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {revisingReport ? 'Step 2: Confirm your revision' : 'Step 3: Confirm your submission'}
              </h2>
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  By clicking 'Submit', you confirm that you have read and understood the guidelines for research submission and agree to abide by the rules and regulations set forth by the University's Research Ethics Committee.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || (!revisingReport && !selectedProposal)}
                  className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-sm"
                >
                  {submitting ? 'Submitting...' : (revisingReport ? 'Submit Revision' : 'Submit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail view for a selected report
  if (selectedReport) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedReport(null)}
              className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{selectedReport.title}</h1>
                <p className="mt-2 text-sm text-gray-500">Report ID: {selectedReport.id}</p>
              </div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusBadge[selectedReport.status]}`}>
                {statusIcon[selectedReport.status]}
                {selectedReport.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Report Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Submission Timeline */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Timeline
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted At</label>
                    <p className="text-gray-900">{formatDate(selectedReport.submitted_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-gray-900">{formatDate(selectedReport.last_updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Submitted Documents */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Submitted Documents ({selectedReport.attachments?.length || 0})
                </h2>
                {!selectedReport.attachments || selectedReport.attachments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents attached</p>
                ) : (
                  <div className="space-y-2">
                    {selectedReport.attachments.map((filePath, index) => {
                      const fileName = filePath.split('/').pop() || 'Document';
                      const isReviewed = filePath.includes('reviewed') || filePath.includes('filled');
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isReviewed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`w-5 h-5 ${isReviewed ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-sm text-gray-700 font-medium">
                              {fileName}
                              {isReviewed && <span className="ml-2 text-xs text-green-600">(Reviewed by chairperson)</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewAttachment(filePath)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
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
            </div>

            {/* Right Column - Review Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Status</h2>
                
                {selectedReport.status === 'Approved' && (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800">Your final report has been approved by the chairperson.</p>
                    </div>
                    
                    {/* Certificate of Completion */}
                    {selectedProposalDetails && selectedProposalDetails.category !== 'External' && (
                      <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-green-200 certificate-section">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Award className="w-5 h-5 text-green-600" />
                          {selectedProposalDetails.category === 'Undergraduate' ? 'Endorsement for Final Defense' : 'Endorsement for Pre-final Defense'}
                        </h3>
                        <div className="flex flex-col items-center justify-center py-6 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                          <div className="text-center mb-6">
                            <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Research Ethics Committee</h3>
                            <p className="text-sm text-gray-600 mt-1">Official Endorsement</p>
                          </div>
                          
                          <div className="w-full max-w-md text-center">
                            <p className="text-gray-700 mb-4">
                              This endorsement confirms that your study titled 
                              <span className="font-medium"> "{selectedProposalDetails.proposal_title || selectedReport.title}"</span> has officially been approved and released for your defense.
                            </p>
                            
                            <p className="text-sm text-gray-600 mb-6">
                              Approval Date: {formatDate(selectedReport.last_updated_at)}
                            </p>

                            <div className="mt-6 flex justify-center space-x-4">
                              <button 
                                onClick={() => handleDownloadCertificate(selectedReport.title)}
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
                  </>
                )}

                {selectedReport.status === 'Requires Revision' && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-orange-800">Your final report requires revisions. Please review the chairperson's feedback below.</p>
                  </div>
                )}

                {selectedReport.status === 'Pending Review' ? (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">Your final report is awaiting review by the chairperson.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge[selectedReport.status]}`}>
                        {statusIcon[selectedReport.status]}
                        {selectedReport.status}
                      </span>
                    </div>

                    {selectedReport.outcome && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Chairperson's Decision</h3>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                          {selectedReport.outcome}
                        </div>
                      </div>
                    )}

                    {selectedReport.reviewer_id && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Reviewed by Chairperson</p>
                        <p className="text-xs text-gray-500">Last updated: {formatDate(selectedReport.last_updated_at)}</p>
                      </div>
                    )}

                    {selectedReport.status === 'Requires Revision' && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setRevisingReport(selectedReport);
                            setShowSubmissionForm(true);
                            setSelectedReport(null);
                          }}
                          className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                        >
                          Submit Revised Documents
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Final Report Submissions</h1>
            <p className="mt-2 text-gray-600">
              Submit and track final study reports for your approved research projects
            </p>
          </div>
          <button
            onClick={() => {
              setRevisingReport(null);
              setShowSubmissionForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Final Report
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status</h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Under Review">Under Review</option>
                <option value="Requires Revision">Requires Revision</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{filteredReports.length}</span> final reports found
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading final reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No final reports found</p>
              <p className="text-sm text-gray-500">
                {statusFilter !== 'All'
                  ? 'Try adjusting your filters'
                  : 'Submit your first final report to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attachments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outcome
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {report.title}
                            </div>
                            <div className="text-xs text-gray-500">ID: {report.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(report.submitted_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge[report.status]}`}>
                            {statusIcon[report.status]}
                            {report.status}
                          </span>
                          {report.status === 'Approved' && (
                            <span title="Certificate Available" className="text-green-600">
                              <Award className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {report.attachments?.length || 0} file(s)
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {report.outcome || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(report.status === 'Approved' || report.status === 'Requires Revision') && (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View details
                            </button>
                            {report.status === 'Approved' && (
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  // Scroll to certificate section after a short delay
                                  setTimeout(() => {
                                    document.querySelector('.certificate-section')?.scrollIntoView({ 
                                      behavior: 'smooth',
                                      block: 'start'
                                    });
                                  }, 100);
                                }}
                                className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                              >
                                <Award className="w-4 h-4" />
                                View certificate
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalReportSubmission;
