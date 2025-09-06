import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FileUploadService, UPLOAD_CONFIGS } from '../../services/fileUploadService';
import type { ResearcherDeviationReport } from '../../types/deviationReport';

const FeedbackDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [deviation, setDeviation] = useState<ResearcherDeviationReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [submittingResolution, setSubmittingResolution] = useState(false);
    const [showResolutionForm, setShowResolutionForm] = useState(false);
    
    // Resolution form fields
    const [researcherResponse, setResearcherResponse] = useState('');
    const [resolutionActionsTaken, setResolutionActionsTaken] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [notification, setNotification] = useState('');
    
    // File upload states
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [fileUploadError, setFileUploadError] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        supabase
            .from('deviation_reports')
            .select('*')
            .eq('id', id)
            .single()
            .then(({ data }) => {
                console.log('Deviation data:', data); // Debug log
                setDeviation(data || null);
                if (data) {
                    // Pre-populate form if resolution already exists
                    setResearcherResponse(data.researcher_response || '');
                    setResolutionActionsTaken(data.resolution_actions_taken || '');
                    setResolutionNotes(data.resolution_notes || '');
                    setUploadedFiles(data.resolution_supporting_documents || []);
                }
                setLoading(false);
            });
    }, [id]);

    const canResolve = deviation && deviation.severity && deviation.severity.trim() !== '' &&
        (deviation.resolution_status === undefined || 
         deviation.resolution_status === null ||
         deviation.resolution_status === 'pending' || 
         deviation.resolution_status === 'rejected') &&
        (deviation.review?.trim() || deviation.corrective_action_feedback?.trim());

    // Debug log
    console.log('Can resolve check:', {
        hasDeviation: !!deviation,
        hasSeverity: !!(deviation?.severity && deviation.severity.trim() !== ''),
        resolutionStatus: deviation?.resolution_status,
        hasReview: !!(deviation?.review?.trim()),
        hasCorrectiveActionFeedback: !!(deviation?.corrective_action_feedback?.trim()),
        canResolve
    });

    const isResolved = deviation?.resolution_status === 'resolved';
    const isInProgress = deviation?.resolution_status === 'in_progress';
    const requiresDocuments = deviation?.severity === 'Major' && deviation?.corrective_action_docs === 'docs';

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploadingFiles(true);
        setFileUploadError('');

        try {
            const fileArray = Array.from(files);
            const uploadResults = await FileUploadService.uploadFiles(fileArray, {
                ...UPLOAD_CONFIGS.DEVIATIONS,
                folder: `deviations/resolutions/${deviation?.id}`
            });

            const successfulUploads = uploadResults.filter(result => !result.error);
            const failedUploads = uploadResults.filter(result => result.error);

            if (failedUploads.length > 0) {
                setFileUploadError(`Failed to upload ${failedUploads.length} file(s): ${failedUploads.map(f => f.error).join(', ')}`);
            }

            if (successfulUploads.length > 0) {
                const newUrls = successfulUploads.map(result => result.url);
                setUploadedFiles(prev => [...prev, ...newUrls]);
                setNotification(`Successfully uploaded ${successfulUploads.length} file(s)`);
                setTimeout(() => setNotification(''), 3000);
            }
        } catch (error) {
            setFileUploadError('File upload failed. Please try again.');
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleRemoveFile = (urlToRemove: string) => {
        setUploadedFiles(prev => prev.filter(url => url !== urlToRemove));
    };

    const handleSubmitResolution = async () => {
        if (!deviation || !researcherResponse.trim() || !resolutionActionsTaken.trim()) {
            setNotification('Please fill in all required fields.');
            return;
        }

        // Validate required documents for major deviations
        if (requiresDocuments && uploadedFiles.length === 0) {
            setNotification('Additional documents are required for this major deviation.');
            return;
        }

        setSubmittingResolution(true);
        try {
            const { error } = await supabase
                .from('deviation_reports')
                .update({
                    resolution_status: 'in_progress',
                    researcher_response: researcherResponse,
                    resolution_actions_taken: resolutionActionsTaken,
                    resolution_notes: resolutionNotes,
                    resolution_supporting_documents: uploadedFiles,
                    resolution_submission_date: new Date().toISOString(),
                })
                .eq('id', deviation.id);

            if (error) {
                setNotification('Failed to submit resolution. Please try again.');
            } else {
                setNotification('Resolution submitted successfully!');
                setDeviation(prev => prev ? {
                    ...prev,
                    resolution_status: 'in_progress',
                    researcher_response: researcherResponse,
                    resolution_actions_taken: resolutionActionsTaken,
                    resolution_notes: resolutionNotes,
                    resolution_supporting_documents: uploadedFiles,
                    resolution_submission_date: new Date().toISOString(),
                } : null);
                setShowResolutionForm(false);
                setTimeout(() => setNotification(''), 3000);
            }
        } catch (err) {
            setNotification('An error occurred. Please try again.');
        } finally {
            setSubmittingResolution(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading feedback details...</div>;
    if (!deviation) return <div className="p-8 text-center text-gray-400">Feedback not found.</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <button className="mb-6 text-blue-600 hover:underline" onClick={() => navigate(-1)}>&larr; Back</button>
            
            {/* Notification */}
            {notification && (
                <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                    {notification}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                    Feedback Details
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 bg-gray-100 ${deviation.severity === 'Minor' ? 'border border-blue-500 text-blue-700' : ''} ${deviation.severity === 'Major' ? 'border border-red-500 text-red-700' : ''}`}>{deviation.severity || '-'}</span>
                    {isResolved && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 border border-green-500 text-green-700">
                            Resolved
                        </span>
                    )}
                    {isInProgress && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 border border-yellow-500 text-yellow-700">
                            In Progress
                        </span>
                    )}
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="mb-4">
                        <span className="font-semibold text-gray-700">Project Title: </span>
                        <span className="text-blue-700 font-medium">{deviation.protocol_title}</span>
                    </div>
                    <div className="mb-4">
                        <span className="font-semibold text-gray-700">Researcher: </span>
                        <span>{deviation.reported_by}</span>
                    </div>
                    <div className="mb-4">
                        <span className="font-semibold text-gray-700">Date Reported: </span>
                        <span>{new Date(deviation.report_submission_date).toISOString().slice(0, 10)}</span>
                    </div>
                    <div className="mb-4">
                        <span className="font-semibold text-gray-700">Type: </span>
                        <span>{deviation.type}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <span className="font-semibold text-gray-700">Deviation Description: </span>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border">{deviation.deviation_description}</div>
                </div>
                <div className="mb-4">
                    <span className="font-semibold text-gray-700">Rationale: </span>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border">{deviation.rationale}</div>
                </div>
                <div className="mb-4">
                    <span className="font-semibold text-gray-700">Impact: </span>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border">{deviation.impact}</div>
                </div>
                <div className="mb-4">
                    <span className="font-semibold text-gray-700">Suggested Corrective Action: </span>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border">{deviation.corrective_action}</div>
                </div>
                
                {/* Staff Feedback Section */}
                <div className="mb-6 p-4 border-l-4 border-blue-300 bg-blue-50 rounded-r-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Staff Feedback/Review</h3>
                    <div className={`p-4 rounded-lg whitespace-pre-line ${deviation.severity === 'Major' ? 'bg-red-50 text-red-700 font-semibold' : 'bg-white text-gray-800'}`}>
                        {deviation.severity === 'Major'
                            ? (deviation.corrective_action_feedback || 'No corrective action feedback provided.')
                            : (deviation.review || 'No feedback provided.')}
                    </div>
                </div>

                {/* Major Deviation Details */}
                {deviation.severity === 'Major' && (
                    <div className="mb-6 p-4 border-l-4 border-red-400 bg-red-50 rounded-r-lg">
                        <h3 className="font-semibold text-red-800 mb-4">Corrective Action Requirements</h3>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <span className="font-semibold text-gray-700">Required Changes: </span>
                                <span className="text-red-700 font-semibold">{deviation.corrective_action_required === 'changes' ? 'Changes required' : deviation.corrective_action_required === 'none' ? 'No changes required' : '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Additional Documents: </span>
                                <span className="text-red-700 font-semibold">{deviation.corrective_action_docs === 'docs' ? 'Documents required' : deviation.corrective_action_docs === 'none' ? 'No documents required' : '-'}</span>
                            </div>
                        </div>

                        {deviation.corrective_action_details && (
                            <div className="mb-4">
                                <span className="font-semibold text-gray-700">Required Changes Details: </span>
                                <div className="mt-1 p-3 bg-white rounded-lg border text-red-700 font-semibold">{deviation.corrective_action_details}</div>
                            </div>
                        )}

                        {deviation.corrective_action_docs_details && (
                            <div className="mb-4">
                                <span className="font-semibold text-gray-700">Additional Documents Details: </span>
                                <div className="mt-1 p-3 bg-white rounded-lg border text-red-700 font-semibold">{deviation.corrective_action_docs_details}</div>
                            </div>
                        )}

                        {deviation.corrective_action_deadline && (
                            <div className="mb-4">
                                <span className="font-semibold text-gray-700">Return Deadline: </span>
                                <span className="text-red-700 font-semibold">{new Date(deviation.corrective_action_deadline).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                )}

                    {/* Resolution Section */}
                    <div className="mt-8 border-t pt-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Resolution Actions</h3>
                        
                        {/* Document requirement notice for major deviations */}
                        {requiresDocuments && !isResolved && (
                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <h4 className="font-semibold text-amber-800">Additional Documents Required</h4>
                                        <p className="text-sm text-amber-700 mt-1">
                                            This major deviation requires you to upload additional supporting documents as part of your resolution. 
                                            Please refer to the corrective action requirements above for specific document details.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}                    {/* Show existing resolution if any */}
                    {deviation.resolution_status && (
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-700">Your Response</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    isResolved ? 'bg-green-100 text-green-700' : 
                                    isInProgress ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {deviation.resolution_status?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            
                            {deviation.researcher_response && (
                                <div className="mb-3">
                                    <span className="font-semibold text-gray-700">Response to Feedback: </span>
                                    <div className="mt-1 p-3 bg-white rounded border">{deviation.researcher_response}</div>
                                </div>
                            )}
                            
                            {deviation.resolution_actions_taken && (
                                <div className="mb-3">
                                    <span className="font-semibold text-gray-700">Actions Taken: </span>
                                    <div className="mt-1 p-3 bg-white rounded border">{deviation.resolution_actions_taken}</div>
                                </div>
                            )}
                            
                            {deviation.resolution_notes && (
                                <div className="mb-3">
                                    <span className="font-semibold text-gray-700">Additional Notes: </span>
                                    <div className="mt-1 p-3 bg-white rounded border">{deviation.resolution_notes}</div>
                                </div>
                            )}
                            
                            {deviation.resolution_supporting_documents && deviation.resolution_supporting_documents.length > 0 && (
                                <div className="mb-3">
                                    <span className="font-semibold text-gray-700">Supporting Documents: </span>
                                    <div className="mt-2 space-y-2">
                                        {deviation.resolution_supporting_documents.map((url, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                <a 
                                                    href={url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Document {index + 1}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {deviation.resolution_submission_date && (
                                <div className="text-sm text-gray-500">
                                    Submitted on: {new Date(deviation.resolution_submission_date).toLocaleDateString()}
                                </div>
                            )}

                            {deviation.staff_acknowledgment && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                                    <span className="font-semibold text-green-700">Staff Acknowledgment: </span>
                                    <div className="text-green-700">{deviation.staff_acknowledgment}</div>
                                    {deviation.staff_acknowledgment_date && (
                                        <div className="text-sm text-green-600 mt-1">
                                            Acknowledged on: {new Date(deviation.staff_acknowledgment_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resolution Form or Action Buttons */}
                    {canResolve && (
                        <>
                            {!showResolutionForm ? (
                                <div className="text-center">
                                    <button
                                        onClick={() => setShowResolutionForm(true)}
                                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                                    >
                                        {deviation.resolution_status ? 'Update Resolution' : 'Resolve Deviation'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2">
                                            Response to Staff Feedback <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                                            rows={4}
                                            value={researcherResponse}
                                            onChange={(e) => setResearcherResponse(e.target.value)}
                                            placeholder="Acknowledge the staff feedback and explain your understanding of the requirements..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2">
                                            Actions Taken to Resolve <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                                            rows={4}
                                            value={resolutionActionsTaken}
                                            onChange={(e) => setResolutionActionsTaken(e.target.value)}
                                            placeholder="Describe the specific actions you have taken or will take to resolve this deviation..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2">
                                            Additional Notes (Optional)
                                        </label>
                                        <textarea
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                                            rows={3}
                                            value={resolutionNotes}
                                            onChange={(e) => setResolutionNotes(e.target.value)}
                                            placeholder="Any additional information or clarifications..."
                                        />
                                    </div>

                                    {/* File Upload Section for Major Deviations requiring documents */}
                                    {requiresDocuments && (
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-2">
                                                Supporting Documents <span className="text-red-500">*</span>
                                                <span className="text-sm font-normal text-gray-500 block">
                                                    Upload documents as requested in the corrective action requirements
                                                </span>
                                            </label>
                                            
                                            {fileUploadError && (
                                                <div className="mb-2 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                                                    {fileUploadError}
                                                </div>
                                            )}
                                            
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                                                    onChange={(e) => handleFileUpload(e.target.files)}
                                                    className="hidden"
                                                    id="file-upload"
                                                    disabled={uploadingFiles}
                                                />
                                                <label 
                                                    htmlFor="file-upload" 
                                                    className="cursor-pointer flex flex-col items-center"
                                                >
                                                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <span className="text-sm text-gray-600">
                                                        {uploadingFiles ? 'Uploading...' : 'Click to upload files or drag and drop'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 mt-1">
                                                        PDF, DOC, XLS, images (max 20MB each)
                                                    </span>
                                                </label>
                                            </div>
                                            
                                            {/* Display uploaded files */}
                                            {uploadedFiles.length > 0 && (
                                                <div className="mt-3">
                                                    <span className="text-sm font-medium text-gray-700">Uploaded Files:</span>
                                                    <div className="mt-2 space-y-2">
                                                        {uploadedFiles.map((url, index) => (
                                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                    </svg>
                                                                    <span className="text-sm text-gray-700">Document {index + 1}</span>
                                                                    <a 
                                                                        href={url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-blue-600 hover:underline"
                                                                    >
                                                                        View
                                                                    </a>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveFile(url)}
                                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setShowResolutionForm(false)}
                                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitResolution}
                                            disabled={submittingResolution || !researcherResponse.trim() || !resolutionActionsTaken.trim() || (requiresDocuments && uploadedFiles.length === 0)}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submittingResolution ? 'Submitting...' : 'Submit Resolution'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!canResolve && (!deviation.severity || deviation.severity.trim() === '' || (!deviation.review?.trim() && !deviation.corrective_action_feedback?.trim())) && (
                        <div className="text-center text-gray-500">
                            <p>No resolution action is currently available for this deviation.</p>
                            {(!deviation.severity || deviation.severity.trim() === '') && (
                                <p className="text-sm mt-2">This deviation has not been assessed by staff yet.</p>
                            )}
                            {deviation.severity && deviation.severity.trim() !== '' && (!deviation.review?.trim() && !deviation.corrective_action_feedback?.trim()) && (
                                <p className="text-sm mt-2">Staff assessment is pending feedback.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackDetail;
