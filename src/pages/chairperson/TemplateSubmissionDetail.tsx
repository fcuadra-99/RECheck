import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../DB';
import PDFFormFiller from '../../components/PDFFormFiller';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Eye,
  Edit3
} from 'lucide-react';

interface TemplateSubmission {
  id: string;
  template_type: string;
  original_filename: string;
  file_url: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_revision';
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  digital_signature_status: 'signed' | 'unsigned';
  signature_date?: string;
  submission_notes?: string;
  signature_image?: string;
}

export default function TemplateSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<TemplateSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'needs_revision'>('approved');
  const [showPdfFiller, setShowPdfFiller] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch real data from database
      const { data, error } = await supabase
        .from('template_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching submission:', error);
        return;
      }

        if (data) {
        // Fetch researcher's signature
        let signatureImage = '';
        if (data.researcher_id) {
          const { data: signatureData } = await supabase
            .from('user_signatures')
            .select('signature_image')
            .eq('user_id', data.researcher_id)
            .single();
          
          if (signatureData?.signature_image) {
            signatureImage = signatureData.signature_image;
          }
        }
        // Transform database data to match component interface
        const transformedSubmission: TemplateSubmission = {
          id: data.id,
          template_type: data.template_name,
          original_filename: data.file_name,
          file_url: data.file_url,
          submitted_by: data.researcher_name,
          submitted_at: data.submission_date || data.created_at,
          status: data.status,
          digital_signature_status: data.researcher_signed_at ? 'signed' : 'unsigned',
          signature_date: data.researcher_signed_at,
          reviewed_by: data.reviewer_name,
          reviewed_at: data.review_date,
          reviewer_notes: data.review_comments,
          submission_notes: data.description,
          signature_image: signatureImage
        };

        setSubmission(transformedSubmission);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!submission) return;
    
    try {
      setReviewing(true);
      
      // Get current user info
      const { data: user } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.user?.id)
        .single();
      
      // Update the database
      const { error } = await supabase
        .from('template_submissions')
        .update({
          status: reviewDecision,
          review_comments: reviewNotes,
          reviewer_id: user.user?.id,
          reviewer_name: userProfile?.name || user.user?.email || 'Chairperson',
          review_date: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) {
        console.error('Error updating submission:', error);
        alert('Failed to submit review. Please try again.');
        return;
      }
      
      // Update local state
      setSubmission(prev => prev ? {
        ...prev,
        status: reviewDecision,
        reviewer_notes: reviewNotes,
        reviewed_by: userProfile?.name || user.user?.email || 'Chairperson',
        reviewed_at: new Date().toISOString()
      } : null);

      alert(`Submission ${reviewDecision} successfully!`);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  const handleFillPdf = () => {
    setShowPdfFiller(true);
  };

  const handleCancelPdfFiller = () => {
    setShowPdfFiller(false);
  };

  const handleSavePdf = async (pdfBytes: Uint8Array, formData: Record<string, string | boolean>) => {
    console.log('Chairperson filled PDF:', formData);
    console.log('PDF size:', pdfBytes.length, 'bytes');
    
    try {
      // Convert PDF bytes to File
      const pdfArray = Array.from(pdfBytes);
      const pdfBlob = new Blob([new Uint8Array(pdfArray)], { type: 'application/pdf' });
      const pdfFile = new File(
        [pdfBlob],
        `${submission?.template_type}_reviewed.pdf`,
        { type: 'application/pdf', lastModified: Date.now() }
      );

      // Upload the reviewed PDF back to storage
      const fileName = `${id}/reviewed_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(fileName);

      // Update the submission with the new file URL
      const { error: updateError } = await supabase
        .from('template_submissions')
        .update({ 
          file_url: urlData.publicUrl,
          file_name: pdfFile.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      alert('PDF filled and saved successfully!');
      setShowPdfFiller(false);
      fetchSubmission(); // Refresh the submission data
    } catch (error) {
      console.error('Error saving filled PDF:', error);
      alert(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      needs_revision: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    const icons = {
      pending: <AlertCircle className="w-4 h-4" />,
      under_review: <Eye className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      needs_revision: <AlertCircle className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading submission details...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Not Found</h1>
          <button
            onClick={() => navigate('/chairperson/template-submissions')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  // Show PDF Form Filler if requested
  if (showPdfFiller && submission) {
    return (
      <PDFFormFiller
        templateUrl={submission.file_url}
        templateName={submission.template_type}
        onSave={handleSavePdf}
        onCancel={handleCancelPdfFiller}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/chairperson/template-submissions')}
            className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{submission.template_type}</h1>
              <p className="mt-2 text-gray-600">Review and assess this form submission</p>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Template Type</p>
                    <p className="text-sm text-gray-600">{submission.template_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submitted By</p>
                    <p className="text-sm text-gray-600">{submission.submitted_by}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submission Date</p>
                    <p className="text-sm text-gray-600">{formatDate(submission.submitted_at)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-2">Original Filename</p>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded">
                  {submission.original_filename}
                </p>
              </div>
            </div>

            {/* Document Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Actions</h2>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleFillPdf}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Fill & Review
                </button>

                <button
                  onClick={() => window.open(submission.file_url, '_blank')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View PDF
                </button>
                
                <a
                  href={submission.file_url}
                  download={submission.original_filename}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </div>
            </div>

            {/* Submission Notes */}
            {submission.submission_notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Submission Notes</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.submission_notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Review Actions */}
          <div className="space-y-6">
            {/* Review Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              {submission.status === 'pending' || submission.status === 'under_review' ? (
                <>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Review Decision</h4>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value as any)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="approved">Approve</option>
                    <option value="needs_revision">Needs Revision</option>
                    <option value="rejected">Reject</option>
                  </select>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Review notes (optional)"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-3"
                  />
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewing}
                    className="w-full px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition"
                  >
                    {reviewing ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </div>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Review Complete</h4>
                  <div className="space-y-2">
                    <div>{getStatusBadge(submission.status)}</div>
                    {submission.reviewed_by && <div className="text-xs text-gray-500">Reviewed by {submission.reviewed_by}</div>}
                    {submission.reviewed_at && <div className="text-xs text-gray-500">{formatDate(submission.reviewed_at)}</div>}
                    {submission.reviewer_notes && <div className="bg-gray-50 rounded p-2 text-xs text-gray-700 whitespace-pre-wrap">{submission.reviewer_notes}</div>}
                  </div>
                </>
              )}
            </div>

            {/* Quick Stats - minimalist */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h4 className="text-base font-medium text-gray-900 mb-3">Quick Info</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Submission ID</span>
                  <span className="font-mono text-gray-900">{submission.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">File Size</span>
                  <span className="text-gray-900">2.3 MB</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Pages</span>
                  <span className="text-gray-900">15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
