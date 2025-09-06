import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';


const DeviationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deviation, setDeviation] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [severity, setSeverity] = React.useState('');
  const [showNotif, setShowNotif] = React.useState(false);
  const [notifAnim, setNotifAnim] = React.useState(false);
  const [notifMsg, setNotifMsg] = React.useState('👍');
  const [notifIcon, setNotifIcon] = React.useState('👍');
  const [reviewText, setReviewText] = React.useState('');
  const isReviewed = deviation && deviation.severity && deviation.severity !== '';
  // const [correctiveText, setCorrectiveText] = React.useState('');

  React.useEffect(() => {
    async function fetchDeviation() {
      setLoading(true);
      const { data, error } = await supabase
        .from('deviation_reports')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setDeviation(data);
    setReviewText(data.review || '');
        setSeverity(data.severity || '');
      } else {
        setDeviation(null);
      }
      setLoading(false);
    }
    if (id) fetchDeviation();
  }, [id]);

  const showNotification = (msg: string, icon: string = '👍') => {
    setNotifMsg(msg);
    setNotifIcon(icon);
    setShowNotif(true);
    setTimeout(() => setNotifAnim(true), 10);
  };
  const closeNotif = () => {
    setNotifAnim(false);
    setTimeout(() => setShowNotif(false), 200);
  };


  if (loading) {
    return <div className="p-8">Loading deviation details...</div>;
  }
  if (!deviation) {
    return <div className="p-8">Deviation not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <button className="mb-6 text-blue-600 hover:underline" onClick={() => navigate(-1)}>&larr; Back</button>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="flex flex-col items-center mb-4">
              <img
            src={deviation.imageUrl || 'https://lh4.googleusercontent.com/JyzxNMuihT_BFod_JwF_Y459mT0Whe8820zJ-BxLvkSNrHy4iqgJRoaAq4pUcx9Hj5OHdIur0zIUN668qYcS8sxM3E5RHHcGLKeKCNxtjLUqt6uTKE9-45m4xjgkRDEAGvQUVpX7Jw=w16383'}
              alt="Research"
            className="w-40 h-40 rounded-2xl object-contain border border-gray-200 shadow-sm bg-gray-100 mb-2"
            style={{ minWidth: '160px', maxWidth: '100%', maxHeight: '200px' }}
           />
            <h2 className="text-3xl font-bold text-black flex items-center gap-2 mt-2">
          <span className="inline-block w-2 h-8 bg-pink-600 rounded-full mr-2"></span>
         {deviation.protocol_title || deviation.title}
          </h2>
            </div>
          <div className="text-gray-500 text-lg mb-6 flex items-center justify-between">
            <span>Deviation Details</span>
            {isReviewed && (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-4 py-1 text-sm font-medium border border-green-200">
                Reviewed
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
            <div><span className="font-bold text-gray-700">Protocol Code:</span> {deviation.protocol_code || '-'}</div>
            <div><span className="font-bold text-gray-700">Deviation Date:</span> {deviation.deviation_date || '-'}</div>
            <div><span className="font-bold text-gray-700">Deviation Type:</span> {deviation.type || '-'}</div>
            <div><span className="font-bold text-gray-700">Researcher Name:</span> {deviation.reported_by || deviation.researcher || '-'}</div>
            <div><span className="font-bold text-gray-700">Date Submitted:</span> {deviation.report_submission_date || '-'}</div>
            <div><span className="font-bold text-gray-700">Severity:</span> {deviation.severity || '-'}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-1">Deviation Description</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 min-h-[48px]">{deviation.deviation_description || 'No description provided.'}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-1">Rationale</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 min-h-[32px]">{deviation.rationale || '-'}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-1">Impact</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 min-h-[32px]">{deviation.impact || '-'}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-1">Suggested Corrective Action</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 min-h-[32px]">{deviation.corrective_action || '-'}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-1">Supporting Documents</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800">
              {Array.isArray(deviation.supporting_documents) && deviation.supporting_documents.length > 0 ? (
                <ul className="space-y-2">
                  {deviation.supporting_documents.map((doc: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="text-gray-700">Document {idx + 1}</span>
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">No documents uploaded.</span>
              )}
            </div>
          </div>
          <div className="mb-8">
            <div className="font-semibold text-gray-700 mb-2 flex items-center justify-between">
              <span>Assess Severity</span>
              {isReviewed && <span className="text-xs text-gray-500 font-medium">Editing disabled</span>}
            </div>
            <div className={`flex gap-8 items-center ${isReviewed ? 'opacity-60 pointer-events-none select-none' : ''}`}> 
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="severity"
                  value="Minor"
                  checked={severity === 'Minor'}
                  onChange={() => setSeverity('Minor')}
                  disabled={isReviewed}
                  className="accent-blue-600"
                />
                <span className="text-base">Minor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="severity"
                  value="Major"
                  checked={severity === 'Major'}
                  onChange={() => setSeverity('Major')}
                  disabled={isReviewed}
                  className="accent-red-900"
                />
                <span className="text-base">Major</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-8 mt-8">
            {severity === 'Minor' && (
              <div className={`flex-1 border border-blue-200 rounded-xl p-6 min-h-[120px] bg-blue-50 flex flex-col ${isReviewed ? 'opacity-60' : ''}`}>
                <div className="font-semibold mb-2 text-[18px] text-blue-900 flex items-center justify-between">
                  <span>Deviation Review</span>
                  {isReviewed && <span className="text-xs text-blue-700/70">Locked</span>}
                </div>
                <textarea
                  className="mb-4 text-gray-700 text-base flex-1 whitespace-pre-line bg-white border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                  rows={4}
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Enter deviation review..."
                  disabled={isReviewed}
                />
                {!isReviewed && (
                  <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-fit mt-auto"
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase
                        .from('deviation_reports')
                        .update({ review: reviewText, severity: 'Minor' })
                        .eq('id', deviation.id);
                      setLoading(false);
                      if (!error) {
                        // Mark as reviewed locally to lock UI without refetch
                        setDeviation((prev: any) => prev ? { ...prev, severity: 'Minor', review: reviewText } : prev);
                        setSeverity('Minor');
                        showNotification('Deviation review has been saved and sent to the Researcher', '👍');
                      } else {
                        showNotification('Failed to save review. Please try again.', '❌');
                      }
                    }}
                  >
                    Approve
                  </button>
                )}
              </div>
            )}
            {severity === 'Major' && (
              <div className={`flex-1 border border-red-200 rounded-xl p-6 min-h-[120px] bg-red-50 flex flex-col ${isReviewed ? 'opacity-60' : ''}`}>
                <div className="font-semibold mb-2 text-[18px] text-red-900 flex items-center justify-between">
                  <span>Require Corrective Action</span>
                  {isReviewed && <span className="text-xs text-red-700/70">Locked</span>}
                </div>
                {!isReviewed && (
                  <button
                    className="text-black font-semibold w-fit mt-auto"
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase
                        .from('deviation_reports')
                        .update({ severity: 'Major' })
                        .eq('id', deviation.id);
                      setLoading(false);
                      if (!error) {
                        setDeviation((prev: any) => prev ? { ...prev, severity: 'Major' } : prev);
                        setSeverity('Major');
                        navigate('/staff/corrective-action-request', { state: { deviationId: deviation.id } });
                      } else {
                        showNotification('Failed to update severity. Please try again.', '❌');
                      }
                    }}
                  >
                    Click Here &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
          {isReviewed && (
            <div className="mt-10 p-4 border border-green-200 bg-green-50 rounded-xl text-sm text-green-700 flex items-start gap-3">
              <span className="text-lg">✔️</span>
              <div>
                <div className="font-semibold mb-1">This deviation has already been reviewed.</div>
                <p className="text-green-700/80">Further edits are disabled to preserve the integrity of the recorded assessment.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animated na notification */}
      {showNotif && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black/10 transition-opacity duration-200 ${notifAnim ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl p-10 min-w-[400px] min-h-[180px] flex items-center relative transition-all duration-200 ${notifAnim ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`} style={{ boxShadow: '0 8px 32px 0 rgba(60,60,60,0.12)' }}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={closeNotif}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex items-center gap-4 mx-auto">
              <span className="text-4xl bg-yellow-100 rounded-lg p-3">{notifIcon}</span>
              <span className="font-semibold text-lg">{notifMsg}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviationDetail;
