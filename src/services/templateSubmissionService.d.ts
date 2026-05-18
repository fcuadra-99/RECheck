export interface TemplateSubmission {
    id: string;
    submission_title: string;
    template_name: string;
    template_category: string;
    submission_type: string;
    researcher_id: string;
    researcher_name: string;
    researcher_email: string;
    file_url: string;
    file_name: string;
    file_size?: number;
    file_type: string;
    description?: string;
    submission_date: string;
    status: 'pending' | 'in_review' | 'under_review' | 'approved' | 'rejected' | 'revision_requested' | 'needs_revision';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reviewer_id?: string;
    reviewer_name?: string;
    review_date?: string;
    review_comments?: string;
    researcher_signature?: any;
    researcher_signature_hash?: string;
    researcher_signed_at?: string;
    chairperson_signature?: any;
    chairperson_signature_hash?: string;
    chairperson_signed_at?: string;
    document_hash?: string;
    signature_verification_status: 'pending' | 'valid' | 'invalid';
    created_at: string;
    updated_at: string;
    metadata?: any;
}
export interface ReviewerProfile {
    id: string;
    name: string;
    email: string;
    role?: string;
}
export interface CreateTemplateSubmissionData {
    submission_title: string;
    template_name: string;
    template_category: string;
    file: File;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}
export interface ReviewTemplateSubmissionData {
    status: 'approved' | 'rejected' | 'revision_requested' | 'needs_revision';
    review_comments?: string;
    reviewer_name: string;
}
export declare class TemplateSubmissionService {
    private static readonly CUSTOM_JSON_TEMPLATE_IDS;
    /**
     * Create a new template submission with file upload
     */
    createSubmission(data: CreateTemplateSubmissionData): Promise<{
        success: boolean;
        submissionId?: string;
        error?: string;
    }>;
    /**
     * Upload file to Supabase storage
     */
    private uploadFile;
    /**
     * Calculate SHA256 hash of file
     */
    private calculateFileHash;
    /**
     * Get all template submissions (for chairperson)
     */
    getAllSubmissions(filters?: {
        status?: string;
        category?: string;
        priority?: string;
        search?: string;
    }): Promise<{
        success: boolean;
        submissions?: TemplateSubmission[];
        error?: string;
    }>;
    /**
     * Get submissions for a specific researcher
     */
    getResearcherSubmissions(researcherId?: string): Promise<{
        success: boolean;
        submissions?: TemplateSubmission[];
        error?: string;
    }>;
    /**
     * Get all reviewers for chairperson assignment
     */
    getReviewerProfiles(): Promise<{
        success: boolean;
        reviewers?: ReviewerProfile[];
        error?: string;
    }>;
    /**
     * Assign one to four staff members to a submission
     */
    assignReviewers(submissionId: string, reviewerIds: string[], reviewerRoles?: Record<string, 'primary_1' | 'primary_2'>): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get submissions assigned to currently logged-in reviewer
     */
    getAssignedSubmissionsForReviewer(): Promise<{
        success: boolean;
        submissions?: TemplateSubmission[];
        error?: string;
    }>;
    /**
     * Submit reviewer-filled form and attach to submission metadata
     */
    submitReviewerUpdate(submissionId: string, file: File, comments?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get a specific template submission by ID
     */
    getSubmissionById(submissionId: string): Promise<{
        success: boolean;
        submission?: TemplateSubmission;
        error?: string;
    }>;
    /**
     * Generate signature hash
     */
    private generateSignatureHash;
    /**
     * Get client information for audit trail
     */
    private getClientInfo;
    /**
     * Sign a template submission as researcher
     */
    signAsResearcher(submissionId: string, signatureData: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Review a template submission (chairperson only)
     */
    reviewSubmission(submissionId: string, reviewData: ReviewTemplateSubmissionData): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Sign a template submission as chairperson (approval signature)
     */
    signAsChairperson(submissionId: string, signatureData: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Terminate a proposal based on early termination submission details
     */
    terminateProposalForEarlyTermination(input: {
        submissionId: string;
        protocolCode: string;
        proposalTitle: string;
    }): Promise<{
        success: boolean;
        error?: string;
        updatedCount?: number;
        alreadyArchivedCount?: number;
    }>;
    /**
     * Update submission status
     */
    updateStatus(submissionId: string, status: TemplateSubmission['status']): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Verify signatures for a template submission
     */
    verifySignatures(submissionId: string): Promise<{
        success: boolean;
        isValid?: boolean;
        error?: string;
    }>;
    /**
     * Get download URL for a template submission file
     */
    getDownloadUrl(fileUrl: string): Promise<{
        success: boolean;
        downloadUrl?: string;
        error?: string;
    }>;
}
