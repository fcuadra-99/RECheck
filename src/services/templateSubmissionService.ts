import { supabase } from '../DB';
import CryptoJS from 'crypto-js';

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

interface ReviewerAssignmentMetadata {
  assignedReviewerIds?: string[];
  assignedById?: string;
  assignedByName?: string;
  assignedAt?: string;
  reviewerSubmissions?: Record<string, {
    reviewerId: string;
    reviewerName: string;
    fileUrl: string;
    fileName: string;
    comments?: string;
    submittedAt: string;
  }>;
}

export interface ReviewerProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface ReviewerCandidate {
  id: string;
  name: string;
  email: string;
  role?: string;
  source: 'users' | 'profiles';
}

const normalizeRoleLabel = (value?: string | null) => {
  return (value || '').trim().toLowerCase().replace(/[_\-]+/g, ' ');
};

const isAssignableRoleLike = (value?: string | null) => {
  const normalized = normalizeRoleLabel(value);
  if (!normalized) return false;
  return normalized === 'reviewer' || normalized.includes('reviewer') || normalized === 'admin assistant' || normalized.includes('admin assistant');
};

const toDisplayRole = (value?: string | null) => {
  const normalized = normalizeRoleLabel(value);
  if (normalized.includes('admin assistant')) return 'Admin Assistant';
  if (normalized.includes('reviewer')) return 'Reviewer';
  return value || '';
};

const normalizeEmail = (value?: string | null) => (value || '').trim().toLowerCase();

const pickPreferredReviewer = (current: ReviewerCandidate | undefined, incoming: ReviewerCandidate) => {
  if (!current) return incoming;
  if (current.source !== 'profiles' && incoming.source === 'profiles') return incoming;

  const currentNameQuality = current.name && current.name !== 'Reviewer';
  const incomingNameQuality = incoming.name && incoming.name !== 'Reviewer';
  if (!currentNameQuality && incomingNameQuality) return incoming;

  return current;
};

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

export class TemplateSubmissionService {
  private static readonly CUSTOM_JSON_TEMPLATE_IDS = [
    'progress-report',
    'new-event-report',
    'protocol-amendment',
    'continuing-review',
    'early-termination'
  ];

  /**
   * Create a new template submission with file upload
   */
  async createSubmission(data: CreateTemplateSubmissionData): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Upload file to storage
      const fileUploadResult = await this.uploadFile(data.file, user.user.id);
      if (!fileUploadResult.success) {
        return { success: false, error: fileUploadResult.error };
      }

      // Get user info from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.user.id)
        .single();

      if (profileError) {
        console.warn('Could not fetch user from users table, using auth data:', profileError);
      }

      // Calculate document hash
      const documentHash = await this.calculateFileHash(data.file);

      // Prepare submission data
      const submissionData = {
        submission_title: data.submission_title,
        template_name: data.template_name,
        template_category: data.template_category,
        submission_type: 'template',
        researcher_id: user.user.id,
        researcher_name: profile?.name || user.user.email || 'Unknown User',
        researcher_email: profile?.email || user.user.email || '',
        file_url: fileUploadResult.fileUrl!,
        file_name: data.file.name,
        file_size: data.file.size,
        file_type: data.file.type,
        description: data.description,
        submission_date: new Date().toISOString(),
        priority: data.priority || 'medium',
        document_hash: documentHash,
        status: 'pending'
      };

      console.log('Creating template submission with data:', submissionData);

      // Create submission record
      const { data: submission, error } = await supabase
        .from('template_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        console.error('Database insertion error:', error);
        return { success: false, error: `Failed to create submission: ${error.message}` };
      }

      if (!submission) {
        console.error('No submission data returned from database');
        return { success: false, error: 'Failed to create submission - no data returned' };
      }

      console.log('Successfully created submission:', submission);
      return { success: true, submissionId: submission.id };
    } catch (error) {
      console.error('Error creating template submission:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Upload file to Supabase storage
   */
  private async uploadFile(file: File, userId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      
      const { error } = await supabase.storage
        .from('storage')
        .upload(fileName, file);

      if (error) {
        return { success: false, error: `File upload failed: ${error.message}` };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(fileName);

      return { success: true, fileUrl: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: 'File upload failed' };
    }
  }

  /**
   * Calculate SHA256 hash of file
   */
  private async calculateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const crypto = window.crypto || (window as any).msCrypto;
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get all template submissions (for chairperson)
   */
  async getAllSubmissions(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }): Promise<{ success: boolean; submissions?: TemplateSubmission[]; error?: string }> {
    try {
      console.log('📋 getAllSubmissions - Starting fetch with filters:', filters);
      
      let query = supabase
        .from('template_submissions')
        .select('*')
        .order('submission_date', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        console.log('📋 Applying status filter:', filters.status);
        query = query.eq('status', filters.status);
      }
      if (filters?.category && filters.category !== 'all') {
        console.log('📋 Applying category filter:', filters.category);
        query = query.eq('template_category', filters.category);
      }
      if (filters?.priority && filters.priority !== 'all') {
        console.log('📋 Applying priority filter:', filters.priority);
        query = query.eq('priority', filters.priority);
      }
      if (filters?.search) {
        console.log('📋 Applying search filter:', filters.search);
        query = query.or(`submission_title.ilike.%${filters.search}%,researcher_name.ilike.%${filters.search}%,template_name.ilike.%${filters.search}%`);
      }

      console.log('📋 Executing database query...');
      const { data, error } = await query;

      console.log('📋 Query result - data:', data);
      console.log('📋 Query result - error:', error);
      console.log('📋 Data type:', typeof data);
      console.log('📋 Is array:', Array.isArray(data));
      console.log('📋 Data length:', data?.length);

      if (error) {
        console.error('📋 Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { success: false, error: `Failed to fetch submissions: ${error.message}` };
      }

      console.log('📋 Returning success with data length:', data?.length || 0);
      return { success: true, submissions: data };
    } catch (error) {
      console.error('📋 Unexpected error in getAllSubmissions:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get submissions for a specific researcher
   */
  async getResearcherSubmissions(researcherId?: string): Promise<{ success: boolean; submissions?: TemplateSubmission[]; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = researcherId || user.user?.id;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('template_submissions')
        .select('*')
        .eq('researcher_id', userId)
        .order('submission_date', { ascending: false });

      if (error) {
        return { success: false, error: `Failed to fetch submissions: ${error.message}` };
      }

      return { success: true, submissions: data };
    } catch (error) {
      console.error('Error fetching researcher submissions:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get all reviewers for chairperson assignment
   */
  async getReviewerProfiles(): Promise<{ success: boolean; reviewers?: ReviewerProfile[]; error?: string }> {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name', { ascending: true });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, fname, lname, email, role, category');

      if (usersError && profilesError) {
        return { success: false, error: `Failed to load reviewers: ${usersError.message}` };
      }

      const identityMap = new Map<string, ReviewerCandidate>();

      (usersData || []).forEach((item: any) => {
        if (!isAssignableRoleLike(item.role)) return;
        const email = normalizeEmail(item.email);
        const key = email || String(item.id);
        const candidate: ReviewerCandidate = {
          id: item.id,
          name: item.name || item.email || 'Reviewer',
          email: item.email || '',
          role: toDisplayRole(item.role),
          source: 'users'
        };
        identityMap.set(key, pickPreferredReviewer(identityMap.get(key), candidate));
      });

      (profilesData || []).forEach((item: any) => {
        const isReviewer = isAssignableRoleLike(item.role) || isAssignableRoleLike(item.category);
        if (!isReviewer) return;

        const fullName = `${item.fname || ''} ${item.lname || ''}`.trim();
        const email = normalizeEmail(item.email);
        const key = email || String(item.id);
        const existing = identityMap.get(key);
        const candidate: ReviewerCandidate = {
          id: item.id,
          name: fullName || existing?.name || item.email || 'Reviewer',
          email: item.email || existing?.email || '',
          role: toDisplayRole(item.role || item.category || existing?.role),
          source: 'profiles'
        };
        identityMap.set(key, pickPreferredReviewer(existing, candidate));
      });

      const reviewers = Array.from(identityMap.values())
        .map((item) => ({ id: item.id, name: item.name, email: item.email, role: item.role }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { success: true, reviewers };
    } catch (error) {
      console.error('Error getting reviewer profiles:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Assign one to four staff members to a submission
   */
  async assignReviewers(
    submissionId: string,
    reviewerIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const uniqueReviewerIds = Array.from(new Set(reviewerIds.filter(Boolean)));
      if (uniqueReviewerIds.length < 1 || uniqueReviewerIds.length > 4) {
        return { success: false, error: 'Please assign 1 to 4 staff members' };
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: chairpersonProfile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.user.id)
        .single();

      const now = new Date().toISOString();

      const { data: submission, error: submissionError } = await supabase
        .from('template_submissions')
        .select('metadata')
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        return { success: false, error: `Failed to fetch submission: ${submissionError.message}` };
      }

      const existingMetadata = (submission?.metadata || {}) as ReviewerAssignmentMetadata;
      const mergedMetadata: ReviewerAssignmentMetadata = {
        ...existingMetadata,
        assignedReviewerIds: uniqueReviewerIds,
        assignedById: user.user.id,
        assignedByName: chairpersonProfile?.name || chairpersonProfile?.email || user.user.email || 'Chairperson',
        assignedAt: now
      };

      const updatePayload: any = {
        status: 'under_review',
        metadata: mergedMetadata,
        updated_at: now
      };

      if (uniqueReviewerIds.length === 1) {
        updatePayload.reviewer_id = uniqueReviewerIds[0];
      }

      const { error: updateError } = await supabase
        .from('template_submissions')
        .update(updatePayload)
        .eq('id', submissionId);

      if (updateError) {
        return { success: false, error: `Failed to assign reviewers: ${updateError.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get submissions assigned to currently logged-in reviewer
   */
  async getAssignedSubmissionsForReviewer(): Promise<{ success: boolean; submissions?: TemplateSubmission[]; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const aliasIds = new Set<string>([user.user.id]);
      const currentEmail = normalizeEmail(user.user.email);

      if (currentEmail) {
        const { data: profileAliases } = await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', currentEmail);

        (profileAliases || []).forEach((row: any) => {
          if (row?.id) aliasIds.add(row.id);
        });

        const { data: userAliases } = await supabase
          .from('users')
          .select('id, email')
          .ilike('email', currentEmail);

        (userAliases || []).forEach((row: any) => {
          if (row?.id) aliasIds.add(row.id);
        });
      }

      const { data, error } = await supabase
        .from('template_submissions')
        .select('*')
        .in('status', ['under_review', 'in_review', 'pending'])
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: `Failed to fetch reviewer assignments: ${error.message}` };
      }

      const reviewerSubmissions = (data || []).filter((submission: any) => {
        const metadata = (submission.metadata || {}) as ReviewerAssignmentMetadata;
        const assignedReviewerIds = metadata.assignedReviewerIds || [];
        return assignedReviewerIds.some((assignedId) => aliasIds.has(assignedId));
      });

      return { success: true, submissions: reviewerSubmissions };
    } catch (error) {
      console.error('Error getting reviewer submissions:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Submit reviewer-filled form and attach to submission metadata
   */
  async submitReviewerUpdate(
    submissionId: string,
    file: File,
    comments?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: reviewerProfile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.user.id)
        .single();

      const { data: submission, error: submissionError } = await supabase
        .from('template_submissions')
        .select('template_name, metadata')
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        return { success: false, error: `Failed to fetch submission: ${submissionError.message}` };
      }

      const metadata = (submission?.metadata || {}) as ReviewerAssignmentMetadata;
      const assignedReviewerIds = metadata.assignedReviewerIds || [];
      if (!assignedReviewerIds.includes(user.user.id)) {
        return { success: false, error: 'You are not assigned to this submission' };
      }

      const uploadPath = `${submissionId}/reviewer_${user.user.id}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(uploadPath, file);

      if (uploadError) {
        return { success: false, error: `Failed to upload reviewer file: ${uploadError.message}` };
      }

      const { data: publicUrlData } = supabase.storage
        .from('storage')
        .getPublicUrl(uploadPath);

      const reviewerSubmissions = {
        ...(metadata.reviewerSubmissions || {}),
        [user.user.id]: {
          reviewerId: user.user.id,
          reviewerName: reviewerProfile?.name || reviewerProfile?.email || user.user.email || 'Reviewer',
          fileUrl: publicUrlData.publicUrl,
          fileName: file.name,
          comments,
          submittedAt: new Date().toISOString()
        }
      };

      const allAssignedSubmitted = assignedReviewerIds.every((reviewerId) => Boolean(reviewerSubmissions[reviewerId]));
      const normalizedTemplateName = (submission?.template_name || '').toLowerCase();
      const isJsonTemplate = TemplateSubmissionService.CUSTOM_JSON_TEMPLATE_IDS.some((templateId) => normalizedTemplateName.includes(templateId.replace('-', ' ')));

      const updatedMetadata: ReviewerAssignmentMetadata = {
        ...metadata,
        reviewerSubmissions
      };

      const { error: updateError } = await supabase
        .from('template_submissions')
        .update({
          file_url: publicUrlData.publicUrl,
          file_name: file.name,
          status: allAssignedSubmitted ? 'under_review' : 'in_review',
          review_comments: comments || null,
          review_date: new Date().toISOString(),
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
          file_type: file.type || (isJsonTemplate ? 'application/json' : 'application/pdf'),
          file_size: file.size
        })
        .eq('id', submissionId);

      if (updateError) {
        return { success: false, error: `Failed to update submission: ${updateError.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error submitting reviewer update:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get a specific template submission by ID
   */
  async getSubmissionById(submissionId: string): Promise<{ success: boolean; submission?: TemplateSubmission; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('template_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) {
        return { success: false, error: `Failed to fetch submission: ${error.message}` };
      }

      return { success: true, submission: data };
    } catch (error) {
      console.error('Error fetching template submission:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Generate signature hash
   */
  private generateSignatureHash(signatureData: string): string {
    return CryptoJS.SHA256(signatureData + Date.now().toString()).toString();
  }

  /**
   * Get client information for audit trail
   */
  private async getClientInfo() {
    return {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Sign a template submission as researcher
   */
  async signAsResearcher(submissionId: string, signatureData: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const clientInfo = await this.getClientInfo();
      const signatureHash = this.generateSignatureHash(signatureData);
      
      const signatureRecord = {
        signatureImage: signatureData,
        userId: user.user.id,
        userEmail: user.user.email,
        timestamp: new Date().toISOString(),
        clientInfo,
        hash: signatureHash
      };

      // Update the template submission with signature data
      const { error } = await supabase
        .from('template_submissions')
        .update({
          researcher_signature: signatureRecord,
          researcher_signature_hash: signatureHash,
          researcher_signed_at: new Date().toISOString(),
          signature_verification_status: 'valid'
        })
        .eq('id', submissionId);

      if (error) {
        return { success: false, error: `Failed to update submission with signature: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing template submission as researcher:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Review a template submission (chairperson only)
   */
  async reviewSubmission(submissionId: string, reviewData: ReviewTemplateSubmissionData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('template_submissions')
        .update({
          status: reviewData.status,
          review_comments: reviewData.review_comments,
          reviewer_id: user.user.id,
          reviewer_name: reviewData.reviewer_name,
          review_date: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) {
        return { success: false, error: `Failed to update review: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error reviewing template submission:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Sign a template submission as chairperson (approval signature)
   */
  async signAsChairperson(submissionId: string, signatureData: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const clientInfo = await this.getClientInfo();
      const signatureHash = this.generateSignatureHash(signatureData);
      
      const signatureRecord = {
        signatureImage: signatureData,
        userId: user.user.id,
        userEmail: user.user.email,
        timestamp: new Date().toISOString(),
        clientInfo,
        hash: signatureHash
      };

      // Update the template submission with chairperson signature
      const { error } = await supabase
        .from('template_submissions')
        .update({
          chairperson_signature: signatureRecord,
          chairperson_signature_hash: signatureHash,
          chairperson_signed_at: new Date().toISOString(),
          status: 'approved'
        })
        .eq('id', submissionId);

      if (error) {
        return { success: false, error: `Failed to update submission with chairperson signature: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing template submission as chairperson:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update submission status
   */
  async updateStatus(submissionId: string, status: TemplateSubmission['status']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('template_submissions')
        .update({ status })
        .eq('id', submissionId);

      if (error) {
        return { success: false, error: `Failed to update status: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating submission status:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Verify signatures for a template submission
   */
  async verifySignatures(submissionId: string): Promise<{ success: boolean; isValid?: boolean; error?: string }> {
    try {
      const { data: submission, error } = await supabase
        .from('template_submissions')
        .select('researcher_signature, chairperson_signature, researcher_signature_hash, chairperson_signature_hash')
        .eq('id', submissionId)
        .single();

      if (error) {
        return { success: false, error: `Failed to fetch submission: ${error.message}` };
      }

      let isValid = true;

      // Verify researcher signature if present
      if (submission.researcher_signature && submission.researcher_signature_hash) {
        const calculatedHash = this.generateSignatureHash(submission.researcher_signature.signatureImage);
        if (calculatedHash !== submission.researcher_signature_hash) {
          isValid = false;
        }
      }

      // Verify chairperson signature if present
      if (submission.chairperson_signature && submission.chairperson_signature_hash) {
        const calculatedHash = this.generateSignatureHash(submission.chairperson_signature.signatureImage);
        if (calculatedHash !== submission.chairperson_signature_hash) {
          isValid = false;
        }
      }

      return { success: true, isValid };
    } catch (error) {
      console.error('Error verifying template submission signatures:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get download URL for a template submission file
   */
  async getDownloadUrl(fileUrl: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    try {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      const { data, error } = await supabase.storage
        .from('storage')
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (error) {
        return { success: false, error: `Failed to create download URL: ${error.message}` };
      }

      return { success: true, downloadUrl: data.signedUrl };
    } catch (error) {
      console.error('Error creating download URL:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}
