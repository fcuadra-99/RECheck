import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../DB';
import DigitalSignaturePad from '../../components/DigitalSignaturePad';
import SignatureDisplay from '../../components/SignatureDisplay';

export default function CorrectiveActionRequest() {
  const [requiredChange, setRequiredChange] = useState('changes');
  const [additionalDocs, setAdditionalDocs] = useState('none');
  const [deviationFeedback, setDeviationFeedback] = useState('');
  const [requiredChangesText, setRequiredChangesText] = useState('');
  const [additionalDocsText, setAdditionalDocsText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Try to get deviation id from query param or state
  const deviationId = location.state?.deviationId || new URLSearchParams(location.search).get('id');

  const handleSubmitReview = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deviationId) {
      setNotif('No deviation selected.');
      return;
    }

    // Validate required fields
    if (!deviationFeedback.trim()) {
      setNotif('Deviation Feedback is required.');
      return;
    }

    if (requiredChange === 'changes' && !requiredChangesText.trim()) {
      setNotif('Please specify the required changes.');
      return;
    }

    if (additionalDocs === 'docs' && !additionalDocsText.trim()) {
      setNotif('Please specify the additional documents needed.');
      return;
    }

    if (!deadline) {
      setNotif('Return deadline is required.');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('deviation_reports')
      .update({
        corrective_action_feedback: deviationFeedback,
        corrective_action_required: requiredChange,
        corrective_action_details: requiredChangesText,
        corrective_action_docs: additionalDocs,
        corrective_action_docs_details: additionalDocsText,
        corrective_action_deadline: deadline,
        severity: 'Major',
        status: 'Reviewed',
      })
      .eq('id', deviationId);
    setLoading(false);
    if (!error) {
      setShowSignaturePad(true);
      setNotif('Review submitted! Please sign to complete the process.');
    } else {
      setNotif('Failed to submit corrective action.');
    }
  };

  const handleSignatureComplete = (success: boolean) => {
    if (success) {
      setNotif('Review completed and signed successfully!');
      setTimeout(() => navigate(-1), 1500);
    } else {
      setNotif('Failed to apply signature. Please try again.');
    }
  };

  const handleSignatureCancel = () => {
    setShowSignaturePad(false);
    setNotif('Review submitted without signature. You can sign it later.');
    setTimeout(() => navigate(-1), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-150"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>

          <div className="text-left ml-6 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Request Corrective Action</h1>
            <p className="text-sm text-gray-500 mt-1">Review the deviation and specify clear corrective measures.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {showSignaturePad ? (
            // Stage 2: Chairperson Signature Process
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">Complete your review</h2>
                <p className="text-sm text-gray-500 mt-1">Your review has been submitted. Please sign below to finalize.</p>
              </div>

              {/* Show existing signatures */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <SignatureDisplay deviationReportId={deviationId} />
              </div>

              {/* Chairperson signature pad */}
              <div className="rounded-lg p-4 border border-gray-100">
                <DigitalSignaturePad
                  deviationReportId={deviationId}
                  userRole="chairperson"
                  onSignatureComplete={handleSignatureComplete}
                  onCancel={handleSignatureCancel}
                />
              </div>
            </div>
          ) : (
            // Review Form
            <div className="p-8">
              <div className="space-y-6">
                {/* Deviation Feedback Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deviation Feedback <span className="text-gray-400 text-xs">(required)</span></label>
                  <textarea
                    className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 resize-none"
                    placeholder="Provide detailed feedback on the deviation..."
                    rows={4}
                    value={deviationFeedback}
                    onChange={e => setDeviationFeedback(e.target.value)}
                  />
                </div>

                {/* Required Changes Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Required Changes</label>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-gray-700">
                      <input
                        type="radio"
                        id="changes-required"
                        name="requiredChange"
                        checked={requiredChange === 'changes'}
                        onChange={() => setRequiredChange('changes')}
                        className="form-radio text-indigo-600 h-4 w-4"
                      />
                      <span className="text-sm">Changes required</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-gray-700">
                      <input
                        type="radio"
                        id="no-changes"
                        name="requiredChange"
                        checked={requiredChange === 'none'}
                        onChange={() => setRequiredChange('none')}
                        className="form-radio text-indigo-600 h-4 w-4"
                      />
                      <span className="text-sm">No changes required</span>
                    </label>
                  </div>
                  <textarea
                    className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 resize-none"
                    placeholder={requiredChange === 'changes' ? "Specify required changes in detail... (required)" : "Specify required changes in detail..."}
                    rows={3}
                    value={requiredChangesText}
                    onChange={e => setRequiredChangesText(e.target.value)}
                    required={requiredChange === 'changes'}
                  />
                </div>

                {/* Additional Documents Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Documents</label>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-gray-700">
                      <input
                        type="radio"
                        id="docs-required"
                        name="additionalDocs"
                        checked={additionalDocs === 'docs'}
                        onChange={() => setAdditionalDocs('docs')}
                        className="form-radio text-indigo-600 h-4 w-4"
                      />
                      <span className="text-sm">Documents required</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-gray-700">
                      <input
                        type="radio"
                        id="no-docs"
                        name="additionalDocs"
                        checked={additionalDocs === 'none'}
                        onChange={() => setAdditionalDocs('none')}
                        className="form-radio text-indigo-600 h-4 w-4"
                      />
                      <span className="text-sm">No documents required</span>
                    </label>
                  </div>
                  <textarea
                    className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 resize-none"
                    placeholder={additionalDocs === 'docs' ? "List any additional documents needed... (required)" : "List any additional documents needed..."}
                    rows={3}
                    value={additionalDocsText}
                    onChange={e => setAdditionalDocsText(e.target.value)}
                    required={additionalDocs === 'docs'}
                  />
                </div>

                {/* Deadline Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Return deadline <span className="text-red-500">*</span></label>
                  <div className="mt-2 relative inline-block w-full sm:w-56">
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={loading}
                    onClick={handleSubmitReview}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Submitting...</span>
                      </>
                    ) : (
                      <span className="text-sm">Submit Review</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Notification */}
          {notif && (
            <div className="mx-8 mb-8">
              <div className="bg-white border border-gray-100 rounded-md p-3 shadow-sm">
                <p className="text-sm text-gray-800">{notif}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
