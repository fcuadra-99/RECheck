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

export class ReviewAttachmentServiceFallback {
  /**
   * Create a new review attachment using template_submissions table as fallback storage
   */
  async createAttachment(data: CreateReviewAttachmentData): Promise<{ success: boolean; attachmentId?: string; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Upload file to storage
      const timestamp = new Date().getTime();
      const fileExtension = data.file.name.split('.').pop();
      const fileName = `review_attachment_${data.submission_id}_${user.user.id}_${timestamp}.${fileExtension}`;
      const filePath = `review-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(filePath, data.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        return { success: false, error: 'Failed to get file URL' };
      }

   
      const attachmentMetadata: ReviewAttachment = {
        id: crypto.randomUUID(),
        submission_id: data.submission_id,
        reviewer_id: user.user.id,
        reviewer_name: user.user.email || 'Chairperson',
        file_url: urlData.publicUrl,
        file_name: data.file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
        original_filename: data.file.name,
        file_size: data.file.size,
        file_type: data.file.type,
        description: data.description,
        attachment_purpose: data.attachment_purpose,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get current submission to read existing attachments
      const { data: submission, error: fetchError } = await supabase
        .from('template_submissions')
        .select('review_attachments')
        .eq('id', data.submission_id)
        .single();

      if (fetchError) {
        return { success: false, error: 'Could not access submission' };
      }

      // Parse existing attachments or create new array
      let existingAttachments: ReviewAttachment[] = [];
      try {
        if (submission?.review_attachments) {
          existingAttachments = JSON.parse(submission.review_attachments);
        }
      } catch (e) {
        console.warn('Could not parse existing attachments, starting fresh');
      }

      // Add new attachment to the array
      existingAttachments.push(attachmentMetadata);

      // Update the submission with the new attachments JSON
      const { error: updateError } = await supabase
        .from('template_submissions')
        .update({
          review_attachments: JSON.stringify(existingAttachments),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.submission_id);

      if (updateError) {
        return { success: false, error: 'Could not save attachment metadata' };
      }

      return { success: true, attachmentId: attachmentMetadata.id };
    } catch (error) {
      return { success: false, error: 'Failed to create attachment' };
    }
  }

  /**
   * Get all attachments for a specific submission
   */
  async getAttachmentsBySubmission(submissionId: string): Promise<{ success: boolean; attachments?: ReviewAttachment[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('template_submissions')
        .select('review_attachments')
        .eq('id', submissionId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      let attachments: ReviewAttachment[] = [];
      try {
        if (data?.review_attachments) {
          attachments = JSON.parse(data.review_attachments);
        }
      } catch (e) {
        console.warn('Could not parse attachments JSON:', e);
      }

      return { success: true, attachments };
    } catch (error) {
      return { success: false, error: 'Failed to fetch attachments' };
    }
  }

  /**
   * Delete a review attachment
   */
  async deleteAttachment(submissionId: string, attachmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get current attachments
      const result = await this.getAttachmentsBySubmission(submissionId);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const attachments = result.attachments || [];
      const attachmentToDelete = attachments.find(att => att.id === attachmentId);
      
      if (!attachmentToDelete) {
        return { success: false, error: 'Attachment not found' };
      }

      // Check if user owns this attachment
      if (attachmentToDelete.reviewer_id !== user.user.id) {
        return { success: false, error: 'Not authorized to delete this attachment' };
      }

      // Remove attachment from array
      const updatedAttachments = attachments.filter(att => att.id !== attachmentId);

      // Update the submission
      const { error: updateError } = await supabase
        .from('template_submissions')
        .update({
          review_attachments: JSON.stringify(updatedAttachments),
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        return { success: false, error: 'Failed to update attachments' };
      }

      // Try to delete file from storage (optional - don't fail if this doesn't work)
      try {
        const fileName = attachmentToDelete.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('storage')
            .remove([`review-attachments/${submissionId}/${fileName}`]);
        }
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete attachment' };
    }
  }
}

export const reviewAttachmentServiceFallback = new ReviewAttachmentServiceFallback();