import React, { useState, useEffect } from 'react';
import { submitDeviationReport } from '../../services/deviationReportService';
import { FileUploadService, UPLOAD_CONFIGS } from '../../services/fileUploadService';
import useAuth from '@/hooks/useAuth';
import { ClipboardList, CalendarDays, FileText, UploadCloud, AlertCircle } from 'lucide-react';


const deviationTypeOptions = [
  'Informed Consent',
  'Adverse Events',
  'Sample Collection',
  'Confidentiality Breach',
  'Regulatory Compliance',
  'Other'
];

type InvestigatorState = {
  protocolCode: string;
  protocolTitle: string;
  deviationDate: string;
  deviationDescription: string;
  correctiveAction: string;
  rationale: string;
  impact: string;
  reportSubmissionDate: string;
  type: string;
};

const initialInvestigator: InvestigatorState = {
  protocolCode: '',
  protocolTitle: '',
  deviationDate: '',
  deviationDescription: '',
  correctiveAction: '',
  rationale: '',
  impact: '',
  reportSubmissionDate: '',
  type: ''
};

const ErrorMsg: React.FC<{ msg?: string }> = ({ msg }) => (msg ? <span className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{msg}</span> : null);

const DeviationReportForm: React.FC = () => {
  const [investigator, setInvestigator] = useState<InvestigatorState>(initialInvestigator);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
  
  }, [user]);

  const validate = () => {
    const newErrors: Record<string,string> = {};
    if (!investigator.protocolCode) newErrors.protocolCode = 'Required';
    if (!investigator.protocolTitle) newErrors.protocolTitle = 'Required';
    if (!investigator.deviationDate) newErrors.deviationDate = 'Required';
    if (!investigator.deviationDescription) newErrors.deviationDescription = 'Required';
    if (!investigator.rationale) newErrors.rationale = 'Required';
    if (!investigator.impact) newErrors.impact = 'Required';
    if (!investigator.correctiveAction) newErrors.correctiveAction = 'Required';
    if (!investigator.reportSubmissionDate) newErrors.reportSubmissionDate = 'Required';
    if (!investigator.type) newErrors.type = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvestigatorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvestigator(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Upload files using our new service
      const uploadResults = await FileUploadService.uploadFiles(files, UPLOAD_CONFIGS.DEVIATIONS);
      
      // Check for upload errors
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error!);
        setErrors({ ...errors, files: `Upload failed: ${errorMessages.join(', ')}` });
        return;
      }

      // Get successful upload URLs
      const uploadedUrls = uploadResults.map(result => result.url);

  const { error } = await submitDeviationReport({
        protocolTitle: investigator.protocolTitle,
        protocolCode: investigator.protocolCode,
        deviationDate: investigator.deviationDate,
        deviationDescription: investigator.deviationDescription,
        rationale: investigator.rationale,
        impact: investigator.impact,
        correctiveAction: investigator.correctiveAction,
        supportingDocuments: uploadedUrls,
        reportSubmissionDate: investigator.reportSubmissionDate,
        type: investigator.type,
      });
      if (error) {
        alert('Submission failed: ' + error.message);
      } else {
        alert('Deviation report submitted!');
        setInvestigator(initialInvestigator);
        setFiles([]);
      }
    } catch (err: any) {
      alert('Submission failed: ' + (err.message || 'Upload error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 py-10 px-4">
      <form
        className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10 relative"
        onSubmit={handleSubmit}
      >
        <header className="mb-10 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Protocol Deviation Report</h1>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Provide accurate details about the deviation. All fields marked with <span className="text-red-500">*</span> are required.</p>
          </div>
        </header>

        <section className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Study Title <span className="text-red-500">*</span></label>
              <input
                className={`w-full rounded-lg border ${errors.protocolTitle ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm`}
                name="protocolTitle"
                value={investigator.protocolTitle}
                onChange={handleInvestigatorChange}
                placeholder="e.g. Impact of X on Y"
                required
                aria-invalid={!!errors.protocolTitle}
              />
              <ErrorMsg msg={errors.protocolTitle} />
            </div>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Protocol Number <span className="text-red-500">*</span></label>
              <input
                className={`w-full rounded-lg border ${errors.protocolCode ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm`}
                name="protocolCode"
                value={investigator.protocolCode}
                onChange={handleInvestigatorChange}
                placeholder="e.g. PROT-2025-001"
                required
                aria-invalid={!!errors.protocolCode}
              />
              <ErrorMsg msg={errors.protocolCode} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Date of Deviation <span className="text-red-500">*</span></label>
              <div className="relative">
                <CalendarDays className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  className={`w-full rounded-lg border pl-9 ${errors.deviationDate ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm`}
                  name="deviationDate"
                  type="date"
                  value={investigator.deviationDate}
                  onChange={handleInvestigatorChange}
                  required
                  aria-invalid={!!errors.deviationDate}
                />
              </div>
              <ErrorMsg msg={errors.deviationDate} />
            </div>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Submission Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <CalendarDays className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  className={`w-full rounded-lg border pl-9 ${errors.reportSubmissionDate ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm`}
                  name="reportSubmissionDate"
                  type="date"
                  value={investigator.reportSubmissionDate}
                  onChange={handleInvestigatorChange}
                  required
                  aria-invalid={!!errors.reportSubmissionDate}
                />
              </div>
              <ErrorMsg msg={errors.reportSubmissionDate} />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Deviation Type <span className="text-red-500">*</span></label>
            <select
              className={`w-full rounded-lg border ${errors.type ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm`}
              name="type"
              value={investigator.type}
              onChange={(e) => setInvestigator(prev => ({ ...prev, type: e.target.value }))}
              required
              aria-invalid={!!errors.type}
            >
              <option value="">Select deviation type</option>
              {deviationTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <ErrorMsg msg={errors.type} />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Detailed Description <span className="text-red-500">*</span></label>
            <textarea
              className={`w-full rounded-lg border ${errors.deviationDescription ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm min-h-[110px]`}
              name="deviationDescription"
              value={investigator.deviationDescription}
              onChange={handleInvestigatorChange}
              placeholder="Provide a concise, factual description of what occurred."
              required
              aria-invalid={!!errors.deviationDescription}
            />
            <ErrorMsg msg={errors.deviationDescription} />
          </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Rationale <span className="text-red-500">*</span></label>
                <textarea
                  className={`w-full rounded-lg border ${errors.rationale ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm min-h-[90px]`}
                  name="rationale"
                  value={investigator.rationale || ''}
                  onChange={e => setInvestigator({ ...investigator, rationale: e.target.value })}
                  placeholder="Explain why the deviation happened."
                  required
                  aria-invalid={!!errors.rationale}
                />
                <ErrorMsg msg={errors.rationale} />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Impact <span className="text-red-500">*</span></label>
                <textarea
                  className={`w-full rounded-lg border ${errors.impact ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm min-h-[90px]`}
                  name="impact"
                  value={investigator.impact || ''}
                  onChange={e => setInvestigator({ ...investigator, impact: e.target.value })}
                  placeholder="Describe participant / study impact."
                  required
                  aria-invalid={!!errors.impact}
                />
                <ErrorMsg msg={errors.impact} />
              </div>
            </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Proposed Corrective Actions <span className="text-red-500">*</span></label>
            <textarea
              className={`w-full rounded-lg border ${errors.correctiveAction ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm min-h-[90px]`}
              name="correctiveAction"
              value={investigator.correctiveAction}
              onChange={handleInvestigatorChange}
              placeholder="Describe immediate and preventive actions."
              required
              aria-invalid={!!errors.correctiveAction}
            />
            <ErrorMsg msg={errors.correctiveAction} />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">Supporting Documents</label>
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition">
              <UploadCloud className="h-8 w-8 mx-auto text-blue-500 mb-3" />
              <p className="text-sm text-gray-600 mb-2">Drag & drop files here, or click to browse</p>
              <input
                type="file"
                multiple
                className="block mx-auto text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                onChange={e => { if (e.target.files) setFiles(Array.from(e.target.files)); }}
              />
              {files.length > 0 && (
                <ul className="mt-4 text-left text-xs max-h-36 overflow-auto divide-y divide-gray-100 bg-white rounded-md border border-gray-200">
                  {files.map((file, idx) => (
                    <li key={idx} className="px-3 py-2 flex items-center gap-2 text-gray-700">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-gray-400 text-[10px] uppercase tracking-wide">{(file.size / 1024).toFixed(1)} KB</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Submitted By field removed; ownership captured via auth uid server-side */}
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-10" />

        <div className="flex items-center justify-end gap-4">
          <button
            type="reset"
            onClick={() => { setInvestigator(initialInvestigator); setFiles([]); setErrors({}); }}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeviationReportForm;