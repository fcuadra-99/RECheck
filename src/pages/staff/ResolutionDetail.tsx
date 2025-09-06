import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ResearcherDeviationReport } from '../../types/deviationReport';

const ResolutionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [deviation, setDeviation] = useState<ResearcherDeviationReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [acknowledgment, setAcknowledgment] = useState('');
    const [notification, setNotification] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchDeviation();
    }, [id]);

    const fetchDeviation = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('deviation_reports')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching deviation:', error);
                setDeviation(null);
            } else {
                setDeviation(data);
                // If resolution is in_progress (resubmitted), clear the acknowledgment field for new review
                if (data?.resolution_status === 'in_progress') {
                    setAcknowledgment('');
                } else {
                    setAcknowledgment(data?.staff_acknowledgment || '');
                }
            }
        } catch (err) {
            console.error('Error:', err);
            setDeviation(null);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveResolution = async () => {
        if (!deviation || !acknowledgment.trim()) {
            setNotification('Please provide acknowledgment notes.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('deviation_reports')
                .update({
                    resolution_status: 'resolved',
                    staff_acknowledgment: acknowledgment,
                    staff_acknowledgment_date: new Date().toISOString(),
                })
                .eq('id', deviation.id);

            if (error) {
                setNotification('Failed to approve resolution. Please try again.');
            } else {
                setNotification('Resolution approved successfully!');
                setDeviation(prev => prev ? {
                    ...prev,
                    resolution_status: 'resolved',
                    staff_acknowledgment: acknowledgment,
                    staff_acknowledgment_date: new Date().toISOString(),
                } : null);
                setTimeout(() => navigate(-1), 2000);
            }
        } catch (err) {
            setNotification('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestRevision = async () => {
        if (!deviation || !acknowledgment.trim()) {
            setNotification('Please provide revision notes.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('deviation_reports')
                .update({
                    resolution_status: 'rejected',
                    staff_acknowledgment: acknowledgment,
                    staff_acknowledgment_date: new Date().toISOString(),
                })
                .eq('id', deviation.id);

            if (error) {
                setNotification('Failed to request revision. Please try again.');
            } else {
                setNotification('Revision requested successfully!');
                setDeviation(prev => prev ? {
                    ...prev,
                    resolution_status: 'rejected',
                    staff_acknowledgment: acknowledgment,
                    staff_acknowledgment_date: new Date().toISOString(),
                } : null);
                setTimeout(() => navigate(-1), 2000);
            }
        } catch (err) {
            setNotification('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading resolution details...</div>;
    if (!deviation) return <div className="p-8 text-center text-gray-400">Resolution not found.</div>;

    const isResolved = deviation.resolution_status === 'resolved';
    const isRejected = deviation.resolution_status === 'rejected';

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <button className="mb-6 text-blue-600 hover:underline" onClick={() => navigate(-1)}>&larr; Back</button>

            {/* Notification */}
            {notification && (
                <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                    {notification}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-black flex items-center gap-2">
                        <span className="inline-block w-2 h-8 bg-pink-600 rounded-full mr-2"></span>
                        Resolution Review
                    </h2>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            deviation.severity === 'Minor' 
                                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                : 'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                            {deviation.severity}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            isResolved ? 'bg-green-100 text-green-700 border-green-300' :
                            isRejected ? 'bg-red-100 text-red-700 border-red-300' :
                            'bg-yellow-100 text-yellow-700 border-yellow-300'
                        }`}>
                            {deviation.resolution_status?.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Deviation Overview */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <span className="font-semibold text-gray-700">Project Title: </span>
                        <span className="text-blue-700 font-medium">{deviation.protocol_title}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Researcher: </span>
                        <span>{deviation.reported_by}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Date Reported: </span>
                        <span>{new Date(deviation.report_submission_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Type: </span>
                        <span>{deviation.type}</span>
                    </div>
                </div>

                {/* Original Deviation Details */}
                <div className="mb-8 p-4 border-l-4 border-gray-300 bg-gray-50 rounded-r-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Original Deviation</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="font-semibold text-gray-700">Description: </span>
                            <div className="mt-1 text-gray-800">{deviation.deviation_description}</div>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Rationale: </span>
                            <div className="mt-1 text-gray-800">{deviation.rationale}</div>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Impact: </span>
                            <div className="mt-1 text-gray-800">{deviation.impact}</div>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Proposed Corrective Action: </span>
                            <div className="mt-1 text-gray-800">{deviation.corrective_action}</div>
                        </div>
                    </div>
                </div>

                {/* Staff Feedback Given */}
                <div className="mb-8 p-4 border-l-4 border-blue-300 bg-blue-50 rounded-r-lg">
                    <h3 className="font-semibold text-blue-800 mb-4">Your Feedback Given</h3>
                    <div className="text-blue-800">
                        {deviation.severity === 'Major' 
                            ? (deviation.corrective_action_feedback || 'No feedback provided.')
                            : (deviation.review || 'No feedback provided.')
                        }
                    </div>

                    {/* Major Deviation Requirements */}
                    {deviation.severity === 'Major' && (
                        <div className="mt-4 space-y-2">
                            {deviation.corrective_action_required && (
                                <div>
                                    <span className="font-semibold">Required Changes: </span>
                                    <span>{deviation.corrective_action_required === 'changes' ? 'Changes required' : 'No changes required'}</span>
                                </div>
                            )}
                            {deviation.corrective_action_details && (
                                <div>
                                    <span className="font-semibold">Details: </span>
                                    <span>{deviation.corrective_action_details}</span>
                                </div>
                            )}
                            {deviation.corrective_action_deadline && (
                                <div>
                                    <span className="font-semibold">Deadline: </span>
                                    <span>{new Date(deviation.corrective_action_deadline).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Researcher Resolution Response */}
                <div className="mb-8 p-4 border-l-4 border-green-300 bg-green-50 rounded-r-lg">
                    <h3 className="font-semibold text-green-800 mb-4">Researcher's Resolution Response</h3>
                    
                    {deviation.researcher_response && (
                        <div className="mb-4">
                            <span className="font-semibold text-gray-700">Response to Feedback: </span>
                            <div className="mt-1 p-3 bg-white rounded border text-gray-800">{deviation.researcher_response}</div>
                        </div>
                    )}
                    
                    {deviation.resolution_actions_taken && (
                        <div className="mb-4">
                            <span className="font-semibold text-gray-700">Actions Taken: </span>
                            <div className="mt-1 p-3 bg-white rounded border text-gray-800">{deviation.resolution_actions_taken}</div>
                        </div>
                    )}
                    
                    {deviation.resolution_notes && (
                        <div className="mb-4">
                            <span className="font-semibold text-gray-700">Additional Notes: </span>
                            <div className="mt-1 p-3 bg-white rounded border text-gray-800">{deviation.resolution_notes}</div>
                        </div>
                    )}
                    
                    {/* Supporting Documents */}
                    {deviation.resolution_supporting_documents && deviation.resolution_supporting_documents.length > 0 && (
                        <div className="mb-4">
                            <span className="font-semibold text-gray-700">Supporting Documents: </span>
                            <div className="mt-2 space-y-2">
                                {deviation.resolution_supporting_documents.map((docUrl, index) => {
                                    const fileName = docUrl.split('/').pop() || `Document ${index + 1}`;
                                    const fileExtension = fileName.split('.').pop()?.toLowerCase();
                                    
                                    // Determine file type for appropriate icon/handling
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
                                    const isPdf = fileExtension === 'pdf';
                                    const isDoc = ['doc', 'docx'].includes(fileExtension || '');
                                    
                                    return (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                                            <div className="flex-shrink-0">
                                                {isImage && (
                                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                        <span className="text-blue-600 text-xs font-bold">IMG</span>
                                                    </div>
                                                )}
                                                {isPdf && (
                                                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                                        <span className="text-red-600 text-xs font-bold">PDF</span>
                                                    </div>
                                                )}
                                                {isDoc && (
                                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                        <span className="text-blue-600 text-xs font-bold">DOC</span>
                                                    </div>
                                                )}
                                                {!isImage && !isPdf && !isDoc && (
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                        <span className="text-gray-600 text-xs font-bold">FILE</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-grow">
                                                <div className="text-sm font-medium text-gray-800">{fileName}</div>
                                                <div className="text-xs text-gray-500">
                                                    {fileExtension?.toUpperCase()} file
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {isImage && (
                                                    <button
                                                        onClick={() => setPreviewImage(docUrl)}
                                                        className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                                    >
                                                        Preview
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => window.open(docUrl, '_blank')}
                                                    className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                                                >
                                                    {isImage ? 'Download' : 'Open'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {deviation.resolution_submission_date && (
                        <div className="text-sm text-gray-600">
                            Submitted on: {new Date(deviation.resolution_submission_date).toLocaleDateString()} at {new Date(deviation.resolution_submission_date).toLocaleTimeString()}
                        </div>
                    )}
                </div>

                {/* Staff Acknowledgment Section */}
                <div className="border-t pt-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Staff Review</h3>
                    
                    {(deviation.staff_acknowledgment && deviation.resolution_status !== 'in_progress') ? (
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-700">Your Assessment:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                    isResolved ? 'bg-green-100 text-green-700 border-green-300' :
                                    'bg-red-100 text-red-700 border-red-300'
                                }`}>
                                    {isResolved ? 'APPROVED' : 'REVISION REQUESTED'}
                                </span>
                            </div>
                            <div className="p-3 bg-white rounded border">{deviation.staff_acknowledgment}</div>
                            {deviation.staff_acknowledgment_date && (
                                <div className="text-sm text-gray-500 mt-2">
                                    Reviewed on: {new Date(deviation.staff_acknowledgment_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deviation.resolution_status === 'in_progress' && deviation.staff_acknowledgment && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800 font-medium">Previous Review:</p>
                                    <p className="text-blue-700 text-sm mt-1">{deviation.staff_acknowledgment}</p>
                                    <p className="text-blue-600 text-xs mt-2">
                                        Researcher has resubmitted. Please review the updated response.
                                    </p>
                                </div>
                            )}
                            
                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Assessment Notes <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    rows={4}
                                    value={acknowledgment}
                                    onChange={(e) => setAcknowledgment(e.target.value)}
                                    placeholder="Provide your assessment of the researcher's resolution response..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleRequestRevision}
                                    disabled={submitting || !acknowledgment.trim()}
                                    className="px-6 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Processing...' : 'Request Revision'}
                                </button>
                                <button
                                    onClick={handleApproveResolution}
                                    disabled={submitting || !acknowledgment.trim()}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Processing...' : 'Approve Resolution'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] p-4">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold z-10"
                        >
                            ×
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded text-center text-sm">
                            Click outside to close | Right-click to save image
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResolutionDetail;
