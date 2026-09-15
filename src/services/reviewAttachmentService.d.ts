export interface ReviewAttachment {
    id: string;
    submission_id: string;
    reviewer_id: string;
    reviewer_name: string;
    file_url: string;
    file_name: string;
    original_filename: string;
    file_size?: number;
    file_type?: string;
    description?: string;
    attachment_purpose: 'feedback' | 'correction' | 'reference' | 'requirement' | 'other';
    created_at: string;
    updated_at: string;
}
export interface CreateReviewAttachmentData {
    submission_id: string;
    file: File;
    description?: string;
    attachment_purpose: 'feedback' | 'correction' | 'reference' | 'requirement' | 'other';
}
export declare class ReviewAttachmentService {
    /**
     * Upload a file to storage for review attachment
     */
    private uploadFile;
    /**
     * Create a new review attachment
     */
    createAttachment(data: CreateReviewAttachmentData): Promise<{
        success: boolean;
        attachmentId?: string;
        error?: string;
    }>;
    /**
     * Get all attachments for a specific submission
     */
    getAttachmentsBySubmission(submissionId: string): Promise<{
        success: boolean;
        attachments?: ReviewAttachment[];
        error?: string;
    }>;
    /**
     * Delete a review attachment
     */
    deleteAttachment(attachmentId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get attachments for researcher - only for their own submissions
     */
    getAttachmentsForResearcher(submissionId: string): Promise<{
        success: boolean;
        attachments?: ReviewAttachment[];
        error?: string;
    }>;
}
export declare const reviewAttachmentService: ReviewAttachmentService;
