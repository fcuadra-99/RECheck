import React, { useState, useEffect } from 'react';
import { submitDeviationReport } from '../../services/deviationReportService';
import { FileUploadService, UPLOAD_CONFIGS } from '../../services/fileUploadService';
import useAuth from '@/hooks/useAuth';
import { ClipboardList, CalendarDays, FileText, UploadCloud, AlertCircle } from 'lucide-react';
import DigitalSignaturePad from '../../components/DigitalSignaturePad';
// ...existing code...


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
  ethicalClearanceEffectivity: string;
  studySite: string;
  telephone: string;
  mobile: string;
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
  ethicalClearanceEffectivity: '',
  studySite: '',
  telephone: '',
  mobile: '',
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
  const [submittedReportId, setSubmittedReportId] = useState<string>('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
  
  }, [user]);

  const validate = () => {
    const newErrors: Record<string,string> = {};
    if (!investigator.protocolCode) newErrors.protocolCode = 'Required';
    if (!investigator.protocolTitle) newErrors.protocolTitle = 'Required';
    if (!investigator.ethicalClearanceEffectivity) newErrors.ethicalClearanceEffectivity = 'Required';
    if (!investigator.studySite) newErrors.studySite = 'Required';
    if (!investigator.telephone) newErrors.telephone = 'Required';
    if (!investigator.mobile) newErrors.mobile = 'Required';
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

      const { data, error } = await submitDeviationReport({
        protocolTitle: investigator.protocolTitle,
        protocolCode: investigator.protocolCode,
        ethicalClearanceEffectivity: investigator.ethicalClearanceEffectivity,
        studySite: investigator.studySite,
        telephone: investigator.telephone,
        mobile: investigator.mobile,
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
      } else if (data && data.length > 0) {
        // Report submitted successfully, now show signature pad
        console.log('Submitted report data:', data[0]); // Debug log
        const reportId = data[0].id;
        console.log('Report ID:', reportId); // Debug log
        
        // ...existing code...
        
        setSubmittedReportId(reportId);
        setShowSignaturePad(true);
      } else {
        console.error('No data returned from submission'); // Debug log
        alert('Submission failed: No data returned');
      }
    } catch (err: any) {
      alert('Submission failed: ' + (err.message || 'Upload error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureComplete = (success: boolean) => {
    if (success) {
      alert('Deviation report submitted and signed successfully!');
      setInvestigator(initialInvestigator);
      setFiles([]);
      setShowSignaturePad(false);
      setSubmittedReportId('');
    } else {
      alert('Failed to apply signature. Please try again.');
    }
  };

  // If researcher cancels signature, return to deviation form with previous data
  const handleSignatureCancel = () => {
    setShowSignaturePad(false);
    // Do not reset form, just go back to the form view
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-gray-100 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {showSignaturePad ? (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 px-10 py-12 animate-fade-in">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-blue-800 mb-3 tracking-tight">Complete Your Submission</h1>
              <p className="text-lg text-gray-600">Your deviation report has been submitted successfully.<br />Please sign to complete the process. <span className="text-red-500 font-semibold">Signature is required.</span></p>
            </div>
            <DigitalSignaturePad
              deviationReportId={submittedReportId}
              userRole="researcher"
              onSignatureComplete={handleSignatureComplete}
              onCancel={handleSignatureCancel}
            />
          </div>
        ) : (
          <form
            className="bg-white rounded-3xl shadow-xl border border-gray-200 px-10 py-12 animate-fade-in"
            onSubmit={handleSubmit}
          >
            <header className="mb-12 flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-blue-600/10 text-blue-700 flex items-center justify-center shadow-sm">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-blue-800 tracking-tight mb-1">Protocol Deviation Report</h1>
                <p className="text-base text-gray-500 leading-relaxed">Provide accurate details about the deviation. All fields marked with <span className="text-red-500">*</span> are required.</p>
              </div>
            </header>

            <div className="space-y-10">
              {/* Section: Study Details */}
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-500" /> Study Details</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Study Title <span className="text-red-500">*</span></label>
                    <input
                      className={`w-full rounded-xl border-2 ${errors.protocolTitle ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Protocol Number <span className="text-red-500">*</span></label>
                    <input
                      className={`w-full rounded-xl border-2 ${errors.protocolCode ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
                      name="protocolCode"
                      value={investigator.protocolCode}
                      onChange={handleInvestigatorChange}
                      placeholder="e.g. PROT-2025-001"
                      required
                      aria-invalid={!!errors.protocolCode}
                    />
                    <ErrorMsg msg={errors.protocolCode} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ethical Clearance Effectivity Period <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <CalendarDays className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        className={`w-full rounded-xl border-2 pl-10 ${errors.ethicalClearanceEffectivity ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
                        name="ethicalClearanceEffectivity"
                        type="date"
                        value={investigator.ethicalClearanceEffectivity}
                        onChange={handleInvestigatorChange}
                        required
                        aria-invalid={!!errors.ethicalClearanceEffectivity}
                      />
                    </div>
                    <ErrorMsg msg={errors.ethicalClearanceEffectivity} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Study Site <span className="text-red-500">*</span></label>
                    <input
                      className={`w-full rounded-xl border-2 ${errors.studySite ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
                      name="studySite"
                      value={investigator.studySite}
                      onChange={handleInvestigatorChange}
                      placeholder="e.g. University Medical Center"
                      required
                      aria-invalid={!!errors.studySite}
                    />
                    <ErrorMsg msg={errors.studySite} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telephone <span className="text-red-500">*</span></label>
                    <input
                      className={`w-full rounded-xl border-2 ${errors.telephone ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
                      name="telephone"
                      type="tel"
                      value={investigator.telephone}
                      onChange={handleInvestigatorChange}
                      placeholder="e.g. (123) 456-7890"
                      required
                      aria-invalid={!!errors.telephone}
                    />
                    <ErrorMsg msg={errors.telephone} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile <span className="text-red-500">*</span></label>
                    <input
                      className={`w-full rounded-xl border-2 ${errors.mobile ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
                      name="mobile"
                      type="tel"
                      value={investigator.mobile}
                      onChange={handleInvestigatorChange}
                      placeholder="e.g. (123) 456-7890"
                      required
                      aria-invalid={!!errors.mobile}
                    />
                    <ErrorMsg msg={errors.mobile} />
                  </div>
                </div>
              </section>

              {/* Section: Dates */}
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-500" /> Dates</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Deviation <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <CalendarDays className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        className={`w-full rounded-xl border-2 pl-10 ${errors.deviationDate ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Submission Date <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <CalendarDays className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        className={`w-full rounded-xl border-2 pl-10 ${errors.reportSubmissionDate ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
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
              </section>

              {/* Section: Deviation Details */}
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-blue-500" /> Deviation Details</h2>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deviation Type <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full rounded-xl border-2 ${errors.type ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all`}
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description <span className="text-red-500">*</span></label>
                  <textarea
                    className={`w-full rounded-xl border-2 ${errors.deviationDescription ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base min-h-[110px] transition-all`}
                    name="deviationDescription"
                    value={investigator.deviationDescription}
                    onChange={handleInvestigatorChange}
                    placeholder="Provide a concise, factual description of what occurred."
                    required
                    aria-invalid={!!errors.deviationDescription}
                  />
                  <ErrorMsg msg={errors.deviationDescription} />
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rationale <span className="text-red-500">*</span></label>
                    <textarea
                      className={`w-full rounded-xl border-2 ${errors.rationale ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base min-h-[90px] transition-all`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Impact <span className="text-red-500">*</span></label>
                    <textarea
                      className={`w-full rounded-xl border-2 ${errors.impact ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base min-h-[90px] transition-all`}
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Corrective Actions <span className="text-red-500">*</span></label>
                  <textarea
                    className={`w-full rounded-xl border-2 ${errors.correctiveAction ? 'border-red-400' : 'border-gray-200'} bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base min-h-[90px] transition-all`}
                    name="correctiveAction"
                    value={investigator.correctiveAction}
                    onChange={handleInvestigatorChange}
                    placeholder="Describe immediate and preventive actions."
                    required
                    aria-invalid={!!errors.correctiveAction}
                  />
                  <ErrorMsg msg={errors.correctiveAction} />
                </div>
              </section>

              {/* Section: Supporting Documents */}
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2"><UploadCloud className="h-5 w-5 text-blue-500" /> Supporting Documents</h2>
                <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <UploadCloud className="h-10 w-10 mx-auto text-blue-500 mb-4" />
                  <p className="text-base text-gray-600 mb-3">Drag & drop files here, or click to browse</p>
                  <input
                    type="file"
                    multiple
                    className="block mx-auto text-base text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-base file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    onChange={e => { if (e.target.files) setFiles(Array.from(e.target.files)); }}
                  />
                  {files.length > 0 && (
                    <ul className="mt-5 text-left text-sm max-h-36 overflow-auto divide-y divide-gray-100 bg-white rounded-md border border-gray-200 shadow-sm">
                      {files.map((file, idx) => (
                        <li key={idx} className="px-4 py-2 flex items-center gap-3 text-gray-700">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">{(file.size / 1024).toFixed(1)} KB</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12" />

            <div className="flex items-center justify-end gap-4 mt-8">
              <button
                type="reset"
                onClick={() => { setInvestigator(initialInvestigator); setFiles([]); setErrors({}); }}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 text-base font-medium hover:bg-gray-100 transition-all shadow-sm"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white text-base font-semibold shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DeviationReportForm;