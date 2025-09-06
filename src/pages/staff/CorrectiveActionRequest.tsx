import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';


export default function CorrectiveActionRequest() {
  const [requiredChange, setRequiredChange] = useState('changes');
  const [additionalDocs, setAdditionalDocs] = useState('none');
  const [deviationFeedback, setDeviationFeedback] = useState('');
  const [requiredChangesText, setRequiredChangesText] = useState('');
  const [additionalDocsText, setAdditionalDocsText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  // Try to get deviation id from query param or state
  const deviationId = location.state?.deviationId || new URLSearchParams(location.search).get('id');

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-2">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <button className="mb-6 text-blue-600 hover:underline" onClick={() => navigate(-1)}>&larr; Back</button>
          <h1 className="text-3xl font-bold mb-8 text-black flex items-center gap-2">
            <span className="inline-block w-2 h-8 bg-pink-600 rounded-full mr-2"></span>
            Request Corrective Action
          </h1>
          <div className="mb-8">
            <div className="font-semibold text-gray-700 mb-2">Deviation Feedback</div>
            <textarea
              className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-gray-800 mb-6 w-full min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter deviation feedback..."
              value={deviationFeedback}
              onChange={e => setDeviationFeedback(e.target.value)}
            />
            <div className="font-semibold text-gray-700 mb-2">Required Changes</div>
            <div className="mb-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={requiredChange === 'changes'} onChange={() => setRequiredChange('changes')} className="accent-blue-600" />
                <span>Changes required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={requiredChange === 'none'} onChange={() => setRequiredChange('none')} className="accent-blue-600" />
                <span>No changes required</span>
              </label>
            </div>
            <textarea
              className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-gray-800 mb-6 w-full min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter required changes..."
              value={requiredChangesText}
              onChange={e => setRequiredChangesText(e.target.value)}
            />
            <div className="font-semibold text-gray-700 mb-2">Additional Documents</div>
            <div className="mb-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={additionalDocs === 'docs'} onChange={() => setAdditionalDocs('docs')} className="accent-blue-600" />
                <span>Documents required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={additionalDocs === 'none'} onChange={() => setAdditionalDocs('none')} className="accent-blue-600" />
                <span>No documents required</span>
              </label>
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-4 mt-4 min-h-[80px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter additional documents..."
              value={additionalDocsText}
              onChange={e => setAdditionalDocsText(e.target.value)}
            />
            <div className="font-semibold text-gray-700 mt-6 mb-2">Return Deadline</div>
            <input
              type="date"
              className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600 font-medium w-fit border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              className="bg-blue-600 px-8 py-2 rounded-lg font-semibold text-white hover:bg-blue-700 text-lg shadow"
              disabled={loading}
              onClick={async (e) => {
                e.preventDefault();
                if (!deviationId) {
                  setNotif('No deviation selected.');
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
                  setNotif('Corrective action submitted!');
                  setTimeout(() => navigate(-1), 1200);
                } else {
                  setNotif('Failed to submit corrective action.');
                }
              }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          {notif && <div className="mt-4 text-center text-blue-700 font-semibold">{notif}</div>}
        </div>
      </div>
    </div>
  );
}
