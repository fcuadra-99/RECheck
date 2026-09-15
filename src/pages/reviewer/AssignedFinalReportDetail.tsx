import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, Eye, FileText } from 'lucide-react';
import { supabase } from '@/DB';
import { getFinalReport, getFinalReportAssignments, submitAssignedFinalReportUpdate, type FinalReportAssignment } from '@/services/finalReportService';
import type { FinalReport } from '@/types/finalReport';
import PDFFormFiller from '@/components/PDFFormFiller';
import FinalReportForm from '@/components/forms/FinalReportForm';
import { useTemplateFields } from '@/hooks/useTemplateFields';

export default function AssignedFinalReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isStaffRoute = location.pathname.startsWith('/staff/');
  const actorLabel = isStaffRoute ? 'Admin Assistant' : 'Reviewer';
  const baseRoute = isStaffRoute ? '/staff/final-reports' : '/reviewer/final-reports';

  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [assignment, setAssignment] = useState<FinalReportAssignment | null>(null);

  const [showPdfFiller, setShowPdfFiller] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [finalReportFormData, setFinalReportFormData] = useState<Record<string, any>>({});
  const [initialFormData, setInitialFormData] = useState<Record<string, any>>({});
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [showPrintFormView, setShowPrintFormView] = useState(false);
  const [printOnViewOpen, setPrintOnViewOpen] = useState(false);

  const { fields: predefinedFields } = useTemplateFields('protocol-final-report');

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id || '';

        const { data } = await getFinalReport(id);
        if (!data) {
          setReport(null);
          setLoadError('Unable to load final report. You may not have permission yet.');
          return;
        }

        const assignmentResult = await getFinalReportAssignments(id);
        if (!assignmentResult.success) {
          setReport(null);
          setLoadError(assignmentResult.error || 'Unable to load assignment details.');
          return;
        }

        const myAssignment = (assignmentResult.assignments || []).find((item) => item.assignee_id === userId) || null;
        if (!userId || !myAssignment) {
          setReport(null);
          setLoadError('This final report is not assigned to your account.');
          return;
        }

        setAssignment(myAssignment);
        setLoadError('');

        setReport(data as FinalReport);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!showPrintFormView || !printOnViewOpen) return;

    const timer = window.setTimeout(() => {
      window.print();
      setPrintOnViewOpen(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [showPrintFormView, printOnViewOpen]);

  useEffect(() => {
    if (showPrintFormView) {
      document.body.classList.add('form-print-active');
    } else {
      document.body.classList.remove('form-print-active');
    }

    return () => {
      document.body.classList.remove('form-print-active');
    };
  }, [showPrintFormView]);

  const handleDownloadAttachment = async (filePath: string) => {
    const fileName = filePath.split('/').pop() || 'Document';
    const isJsonFinalReport = fileName.toLowerCase().endsWith('.json');

    if (!isJsonFinalReport) {
      const publicUrl = await getPublicUrl(filePath);
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from('storage').download(filePath);
      if (error || !data) {
        throw new Error(error?.message || 'Failed to download file.');
      }
      const text = await data.text();
      const parsed = JSON.parse(text);
      const formData = parsed && typeof parsed === 'object' ? parsed : {};
      setFinalReportFormData(formData);
      setPrintOnViewOpen(true);
      setShowPrintFormView(true);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const latestAttachmentPath = useMemo(() => {
    if (!report?.attachments || report.attachments.length === 0) return '';
    return report.attachments[report.attachments.length - 1];
  }, [report]);

  const sharedFormPath = useMemo(() => {
    if (!report?.attachments || report.attachments.length === 0) return '';

    const metadataPath = report?.metadata?.sharedFormPath;
    if (typeof metadataPath === 'string' && metadataPath.trim()) {
      return metadataPath;
    }

    const jsonAttachments = report.attachments.filter((path) => path.toLowerCase().endsWith('.json'));
    if (jsonAttachments.length === 0) return '';

    const researcherScoped = jsonAttachments.find((path) =>
      path.toLowerCase().startsWith(`final-reports/${(report.researcher_id || '').toLowerCase()}/`)
    );

    return researcherScoped || jsonAttachments[0];
  }, [report]);

  const mySubmission = useMemo(() => {
    if (!assignment || assignment.status !== 'submitted') return null;
    return {
      submittedAt: assignment.submitted_at,
    };
  }, [assignment]);

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPublicUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('storage').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const refreshReport = async () => {
    if (!id) return;
    const { data } = await getFinalReport(id);
    if (data) {
      setReport(data as FinalReport);
    }
  };

  const handleOpenAttachment = async (filePath: string) => {
    const fileName = filePath.split('/').pop() || 'Document';
    const isJsonFinalReport = fileName.toLowerCase().endsWith('.json');

    if (isJsonFinalReport) {
      const targetFormPath = sharedFormPath || filePath;
      const metadataFormData = report?.metadata?.staffSharedFormData;

      if (metadataFormData && typeof metadataFormData === 'object') {
        setFinalReportFormData(metadataFormData as Record<string, any>);
        setInitialFormData(metadataFormData as Record<string, any>);
        setSelectedFilePath(targetFormPath);
        setShowFormFiller(true);
        return;
      }

      const { data, error } = await supabase.storage.from('storage').download(targetFormPath);
      if (error || !data) {
        alert('Failed to load form data.');
        return;
      }
      const text = await data.text();
      const parsed = JSON.parse(text);
      const formData = parsed && typeof parsed === 'object' ? parsed : {};
      setFinalReportFormData(formData);
      setInitialFormData(formData);
      setSelectedFilePath(targetFormPath);
      setShowFormFiller(true);
      return;
    }

    const publicUrl = await getPublicUrl(filePath);
    setPdfUrl(`${publicUrl}?v=${Date.now()}`);
    setSelectedFilePath(filePath);
    setShowPdfFiller(true);
  };

  const handleSavePdf = async (pdfBytes: Uint8Array) => {
    void pdfBytes;
    alert('Please submit your assessment through the shared JSON final report form. PDF submissions are disabled for assigned staff.');
  };

  const handleSaveFinalReportForm = async () => {
    if (!selectedFilePath || !sharedFormPath) {
      alert('Please open a form first before submitting.');
      return;
    }

    if (mySubmission) {
      alert('You have already submitted your review.');
      return;
    }

    try {
      setSaving(true);

      // Always merge with the latest remote JSON so one assignee does not clobber another's changes.
      const { data, error } = await supabase.storage.from('storage').download(sharedFormPath);
      if (error || !data) {
        throw new Error('Failed to load the latest form before submit.');
      }

      const latestText = await data.text();
      const latestRemote = latestText ? JSON.parse(latestText) : {};
      const latestObject = latestRemote && typeof latestRemote === 'object' ? latestRemote : {};

      const changedKeys = Object.keys(finalReportFormData).filter((key) => {
        const currentValue = finalReportFormData[key];
        const initialValue = initialFormData[key];
        return JSON.stringify(currentValue) !== JSON.stringify(initialValue);
      });

      const mergedData: Record<string, any> = { ...latestObject };
      for (const key of changedKeys) {
        mergedData[key] = finalReportFormData[key];
      }

      const json = JSON.stringify(mergedData, null, 2);
      const originalName = sharedFormPath.split('/').pop() || 'final-report.json';
      const file = new File([new Blob([json], { type: 'application/json' })], originalName, {
        type: 'application/json',
        lastModified: Date.now()
      });

      const result = await submitAssignedFinalReportUpdate(report!.id, file, '', sharedFormPath, mergedData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit update');
      }

      alert(`${actorLabel} update submitted successfully.`);
      setShowFormFiller(false);
      await refreshReport();
    } catch (error) {
      alert(`Failed to submit update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading assigned final report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Final Report Not Available</h1>
          {loadError && <p className="text-sm text-red-700 mb-4">{loadError}</p>}
          <button
            onClick={() => navigate(baseRoute)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assigned Final Reports
          </button>
        </div>
      </div>
    );
  }

  if (showPdfFiller && pdfUrl) {
    return (
      <PDFFormFiller
        templateUrl={pdfUrl}
        templateName="Protocol Final Report"
        onSave={handleSavePdf}
        onCancel={() => setShowPdfFiller(false)}
        predefinedFields={predefinedFields}
      />
    );
  }

  if (showPrintFormView) {
    return (
      <div className="min-h-screen bg-gray-100 form-print-root">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Final Report View</div>
            <button
              onClick={() => setShowPrintFormView(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Details
            </button>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4 print:py-0 print:px-0 print:bg-white form-print-shell">
          <div className="max-w-7xl mx-auto print:mx-0 print:max-w-none">
            <div style={{ pointerEvents: 'none' }}>
              <FinalReportForm savedData={finalReportFormData} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showFormFiller) {
    const isSubmitted = Boolean(mySubmission);
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">{actorLabel} Input: Final Report Form</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFormFiller(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              {!isSubmitted && (
                <button
                  onClick={handleSaveFinalReportForm}
                  disabled={saving}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {saving ? 'Submitting...' : `Submit ${actorLabel} Update`}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="py-6 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">
            <div style={isSubmitted ? { pointerEvents: 'none' } : undefined}>
              <FinalReportForm
                savedData={finalReportFormData}
                onSave={(patch) => {
                  const next = patch.form && typeof patch.form === 'object'
                    ? patch.form
                    : { ...finalReportFormData, ...patch };
                  setFinalReportFormData(next);
                }}
              />
            </div>
          </div>
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
          Back to Assigned Final Reports
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="mt-2 text-gray-600">Provide {actorLabel.toLowerCase()} input for this assigned final report.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Researcher</p>
                <p className="text-sm text-gray-600">{report.researcher_name || report.researcher_id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Submitted Date</p>
                <p className="text-sm text-gray-600">{formatDate(report.submitted_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Submitted Documents</h2>
          {!report.attachments || report.attachments.length === 0 ? (
            <p className="text-sm text-gray-600">No attachments available.</p>
          ) : (
            <div className="space-y-2">
              {report.attachments.map((filePath, index) => {
                const fileName = filePath.split('/').pop() || `Document ${index + 1}`;
                const isSelected = selectedFilePath === filePath || (!selectedFilePath && latestAttachmentPath === filePath);
                return (
                  <div key={filePath + index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">{fileName}</span>
                      {isSelected && <span className="text-xs text-blue-600">(current)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAttachment(filePath)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Open
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

        {mySubmission && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Your {actorLabel.toLowerCase()} update was submitted on {formatDate(mySubmission.submittedAt)}.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
