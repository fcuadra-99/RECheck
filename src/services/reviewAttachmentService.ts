import { supabase } from '../lib/supabase';

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

export class ReviewAttachmentService {
  /**
   * Upload a file to storage for review attachment
   */
  private async uploadFile(file: File, submissionId: string, reviewerId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      // Generate unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `review_attachment_${submissionId}_${reviewerId}_${timestamp}.${fileExtension}`;
      const filePath = `review-attachments/${fileName}`;

      const { error } = await supabase.storage
        .from('storage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        return { success: false, error: error.message };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(filePath);

      return { success: true, fileUrl: urlData.publicUrl };
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error: 'Failed to upload file' };
    }
  }

  /**
   * Create a new review attachment
   */
  async createAttachment(data: CreateReviewAttachmentData): Promise<{ success: boolean; attachmentId?: string; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get reviewer info
      const { data: reviewerProfile, error: profileError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.user.id)
        .single();

      if (profileError) {
        console.warn('Could not fetch reviewer profile:', profileError);
      }

      // Upload file
      const uploadResult = await this.uploadFile(data.file, data.submission_id, user.user.id);
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Create attachment record
      const attachmentData = {
        submission_id: data.submission_id,
        reviewer_id: user.user.id,
        reviewer_name: reviewerProfile?.name || user.user.email || 'Staff Member',
        file_url: uploadResult.fileUrl!,
        file_name: data.file.name.replace(/[^a-zA-Z0-9.-]/g, '_'), // Sanitize filename
        original_filename: data.file.name,
        file_size: data.file.size,
        file_type: data.file.type,
        description: data.description,
        attachment_purpose: data.attachment_purpose
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('review_attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        return { success: false, error: 'Failed to save attachment record' };
      }

      return { success: true, attachmentId: insertResult.id };
    } catch (error) {
      console.error('Error creating attachment:', error);
      return { success: false, error: 'Failed to create attachment' };
    }
  }

  /**
   * Get all attachments for a specific submission
   */
  async getAttachmentsBySubmission(submissionId: string): Promise<{ success: boolean; attachments?: ReviewAttachment[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('review_attachments')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attachments:', error);
        return { success: false, error: error.message };
      }

      return { success: true, attachments: data || [] };
    } catch (error) {
      console.error('Error fetching attachments:', error);
      return { success: false, error: 'Failed to fetch attachments' };
    }
  }

  /**
   * Delete a review attachment
   */
  async deleteAttachment(attachmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get attachment info first
      const { data: attachment, error: fetchError } = await supabase
        .from('review_attachments')
        .select('file_url, reviewer_id')
        .eq('id', attachmentId)
        .single();

      if (fetchError || !attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Check if user owns this attachment
      if (attachment.reviewer_id !== user.user.id) {
        return { success: false, error: 'Not authorized to delete this attachment' };
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('review_attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) {
        console.error('Error deleting attachment record:', deleteError);
        return { success: false, error: 'Failed to delete attachment record' };
      }

      // Delete file from storage
      try {
        const filePath = attachment.file_url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('storage')
            .remove([`review-attachments/${filePath}`]);
        }
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
        // Don't fail the operation if storage deletion fails
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return { success: false, error: 'Failed to delete attachment' };
    }
  }

  /**
   * Get attachments for researcher - only for their own submissions
   */
  async getAttachmentsForResearcher(submissionId: string): Promise<{ success: boolean; attachments?: ReviewAttachment[]; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // First verify that this submission belongs to the current user
      const { data: submission, error: submissionError } = await supabase
        .from('template_submissions')
        .select('researcher_id')
        .eq('id', submissionId)
        .single();

      if (submissionError || !submission) {
        return { success: false, error: 'Submission not found' };
      }

      if (submission.researcher_id !== user.user.id) {
        return { success: false, error: 'Not authorized to view attachments for this submission' };
      }

      // Get attachments
      return await this.getAttachmentsBySubmission(submissionId);
    } catch (error) {
      console.error('Error fetching attachments for researcher:', error);
      return { success: false, error: 'Failed to fetch attachments' };
    }
  }
}

export const reviewAttachmentService = new ReviewAttachmentService();
