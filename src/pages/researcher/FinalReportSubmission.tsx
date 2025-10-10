import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { listFinalReports, createFinalReportDraft } from '../../services/finalReportService';
import type { FinalReport } from '../../types/finalReport';
import { Eye, FileText, Calendar, CheckCircle, Clock, AlertCircle, Plus, X } from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  submission_code?: string;
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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: '1', label: 'Upload your final report (PDF)', file: null, required: true },
    { id: '2', label: 'Upload signed consent form', file: null, required: true },
    { id: '3', label: 'Upload participant information sheet', file: null, required: false },
    { id: '4', label: 'Upload data analysis documents', file: null, required: false },
    { id: '5', label: 'Upload any additional supporting documents', file: null, required: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

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

  async function loadSubmissions() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    // Fetch researcher's submissions that are approved (eligible for final report)
    const { data } = await supabase
      .from('submissions')
      .select('id, title, submission_code')
      .eq('researcher_id', user.user.id)
      .eq('status', 'Approved')
      .order('created_at', { ascending: false });
    setSubmissions((data as any) || []);
  }

  useEffect(() => {
    loadReports();
    loadSubmissions();
  }, []);

  const handleDocumentFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments(prev => 
        prev.map(doc => doc.id === docId ? { ...doc, file: e.target.files![0] } : doc)
      );
    }
  };

  async function handleSubmit() {
    if (!selectedSubmission || !reportTitle.trim()) {
      alert('Please select a submission and provide a title.');
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
            .from('research-files')
            .upload(filePath, doc.file);
          if (!uploadError) {
            attachmentPaths.push(filePath);
          }
        }
      }

      // Create final report
      await createFinalReportDraft({
        submission_id: selectedSubmission,
        title: reportTitle,
        attachments: attachmentPaths,
      });
      
      alert('Final report submitted successfully!');
      setShowSubmissionForm(false);
      setSelectedSubmission('');
      setReportTitle('');
      setDocuments([
        { id: '1', label: 'Upload your final report (PDF)', file: null, required: true },
        { id: '2', label: 'Upload signed consent form', file: null, required: true },
        { id: '3', label: 'Upload participant information sheet', file: null, required: false },
        { id: '4', label: 'Upload data analysis documents', file: null, required: false },
        { id: '5', label: 'Upload any additional supporting documents', file: null, required: false },
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

  // Show submission form if toggled
  if (showSubmissionForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setShowSubmissionForm(false)}
              className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2"
            >
              ← Back to submissions
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Submission for Final Report</h1>
            <p className="mt-2 text-gray-500">
              Upload your final report form and Signed ICF to complete the REC process.
            </p>
        
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
            {/* Step 1: Select Submission */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Select Research Project</h2>
              <select
                value={selectedSubmission}
                onChange={(e) => {
                  setSelectedSubmission(e.target.value);
                  const selected = submissions.find(s => s.id === e.target.value);
                  if (selected) {
                    setReportTitle(`Final Report: ${selected.title}`);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an approved submission...</option>
                {submissions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.submission_code ? `[${sub.submission_code}] ` : ''}{sub.title}
                  </option>
                ))}
              </select>
              {submissions.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No approved submissions found. Final reports can only be submitted for approved research projects.
                </p>
              )}
            </div>

            {/* Step 2: Upload Documents */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Upload your documents</h2>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Confirm your submission</h2>
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  By clicking 'Submit', you confirm that you have read and understood the guidelines for research submission and agree to abide by the rules and regulations set forth by the University's Research Ethics Committee.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedSubmission}
                  className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
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
            onClick={() => setShowSubmissionForm(true)}
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
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge[report.status]}`}>
                          {statusIcon[report.status]}
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {report.attachments?.length || 0} file(s)
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {report.outcome || '-'}
                        </div>
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
