import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Overview
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Request Corrective Action</h1>
            <p className="text-slate-600">Review deviation and specify required corrective measures</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 backdrop-blur-sm">
          {showSignaturePad ? (
            // Stage 2: Chairperson Signature Process
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Review</h2>
                <p className="text-slate-600">Your review has been submitted. Please sign to complete the process.</p>
              </div>
              
              {/* Show existing signatures */}
              <div className="mb-8 p-6 bg-slate-50 rounded-2xl">
                <SignatureDisplay deviationReportId={deviationId} />
              </div>
              
              {/* Chairperson signature pad */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
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
              <div className="space-y-8">
                {/* Deviation Feedback Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    Deviation Feedback
                    <span className="text-slate-500 font-normal ml-1">(Required)</span>
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Provide detailed feedback on the deviation..."
                    rows={4}
                    value={deviationFeedback}
                    onChange={e => setDeviationFeedback(e.target.value)}
                  />
                </div>

                {/* Required Changes Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-900">Required Changes</label>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        id="changes-required"
                        name="requiredChange"
                        checked={requiredChange === 'changes'} 
                        onChange={() => setRequiredChange('changes')} 
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor="changes-required" className="text-slate-700 font-medium cursor-pointer">
                        Changes required
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        id="no-changes"
                        name="requiredChange"
                        checked={requiredChange === 'none'} 
                        onChange={() => setRequiredChange('none')} 
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor="no-changes" className="text-slate-700 font-medium cursor-pointer">
                        No changes required
                      </label>
                    </div>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder={requiredChange === 'changes' ? "Specify the required changes in detail... (Required)" : "Specify the required changes in detail..."}
                    rows={3}
                    value={requiredChangesText}
                    onChange={e => setRequiredChangesText(e.target.value)}
                    required={requiredChange === 'changes'}
                  />
                </div>

                {/* Additional Documents Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-900">Additional Documents</label>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        id="docs-required"
                        name="additionalDocs"
                        checked={additionalDocs === 'docs'} 
                        onChange={() => setAdditionalDocs('docs')} 
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor="docs-required" className="text-slate-700 font-medium cursor-pointer">
                        Documents required
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        id="no-docs"
                        name="additionalDocs"
                        checked={additionalDocs === 'none'} 
                        onChange={() => setAdditionalDocs('none')} 
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor="no-docs" className="text-slate-700 font-medium cursor-pointer">
                        No documents required
                      </label>
                    </div>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder={additionalDocs === 'docs' ? "List any additional documents needed... (Required)" : "List any additional documents needed..."}
                    rows={3}
                    value={additionalDocsText}
                    onChange={e => setAdditionalDocsText(e.target.value)}
                    required={additionalDocs === 'docs'}
                  />
                </div>

                {/* Deadline Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    Return Deadline
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="px-4 py-3 pr-12 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full sm:w-auto"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-slate-200">
                  <button
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={loading}
                    onClick={handleSubmitReview}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Notification */}
          {notif && (
            <div className="mx-8 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-800 font-medium">{notif}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
