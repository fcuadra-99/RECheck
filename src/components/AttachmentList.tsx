import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, Calendar } from 'lucide-react';
import { reviewAttachmentService } from '../services/reviewAttachmentService';
import { reviewAttachmentServiceFallback } from '../services/reviewAttachmentServiceFallback';
import type { ReviewAttachment } from '../services/reviewAttachmentService';

interface AttachmentListProps {
  submissionId: string;
  isChairperson?: boolean; // Whether the current user is chairperson (can delete attachments)
  refreshTrigger?: number; // Use this to trigger refresh from parent
}

export default function AttachmentList({ submissionId, isChairperson = false, refreshTrigger }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<ReviewAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [submissionId, refreshTrigger]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      
      // Try the main service first
      let result = isChairperson 
        ? await reviewAttachmentService.getAttachmentsBySubmission(submissionId)
        : await reviewAttachmentService.getAttachmentsForResearcher(submissionId);

      // If main service fails, try the fallback
      if (!result.success && (result.error?.includes('review_attachments') || result.error?.includes('403'))) {
        result = await reviewAttachmentServiceFallback.getAttachmentsBySubmission(submissionId);
      }

      if (result.success && result.attachments) {
        setAttachments(result.attachments);
      } else {
        setAttachments([]);
      }
    } catch (error) {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      setDeleting(attachmentId);
      
      // Try main service first
      let result = await reviewAttachmentService.deleteAttachment(attachmentId);
      
      // If main service fails, try fallback
      if (!result.success && (result.error?.includes('review_attachments') || result.error?.includes('403'))) {
        result = await reviewAttachmentServiceFallback.deleteAttachment(submissionId, attachmentId);
      }
      
      if (result.success) {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      } else {
        alert(result.error || 'Failed to delete attachment');
      }
    } catch (error) {
      alert('Failed to delete attachment');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPurposeColor = (purpose: string) => {
    const colors = {
      feedback: 'bg-blue-100 text-blue-800',
      correction: 'bg-orange-100 text-orange-800',
      reference: 'bg-green-100 text-green-800',
      requirement: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[purpose as keyof typeof colors] || colors.other;
  };

  const getPurposeLabel = (purpose: string) => {
    const labels = {
      feedback: 'Feedback',
      correction: 'Correction',
      reference: 'Reference',
      requirement: 'Requirement',
      other: 'Other'
    };
    return labels[purpose as keyof typeof labels] || purpose;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading attachments...</span>
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isChairperson 
              ? 'No files have been attached to this review yet.'
              : 'The reviewer has not attached any files to this submission.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Review Attachments ({attachments.length})
      </h3>
      
      <div className="space-y-4">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <FileText className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {attachment.original_filename}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(attachment.attachment_purpose)}`}>
                      {getPurposeLabel(attachment.attachment_purpose)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(attachment.created_at)}
                    </span>
                    <span>by {attachment.reviewer_name}</span>
                  </div>
                  
                  {attachment.description && (
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      {attachment.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => window.open(attachment.file_url, '_blank')}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  title="View file"
                >
                  <Eye className="w-3 h-3" />
                </button>
                
                <a
                  href={attachment.file_url}
                  download={attachment.original_filename}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  title="Download file"
                >
                  <Download className="w-3 h-3" />
                </a>
                
                {isChairperson && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deleting === attachment.id}
                    className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 disabled:bg-red-100"
                    title="Delete attachment"
                  >
                    {deleting === attachment.id ? (
                      <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
