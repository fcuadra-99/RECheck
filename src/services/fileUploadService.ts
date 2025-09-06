import { supabase } from '@/lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export interface UploadOptions {
  bucket: string;
  folder?: string;
  allowedTypes?: readonly string[];
  maxSize?: number; // in bytes
  upsert?: boolean;
}

export class FileUploadService {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  /**
   * Validate a file against the given options
   */
  static validateFile(file: File, options: UploadOptions): string | null {
    const maxSize = options.maxSize || this.DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES;

    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  }

  /**
   * Generate a unique file path
   */
  static generateFilePath(file: File, folder?: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const fileName = `${timestamp}_${randomStr}_${sanitizedName}`;
    
    if (folder) {
      return `${folder}/${fileName}`;
    }
    
    return fileName;
  }

  /**
   * Upload a single file
   */
  static async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    try {
      // Validate file
      const validationError = this.validateFile(file, options);
      if (validationError) {
        return { url: '', path: '', error: validationError };
      }

      // Generate file path
      const filePath = this.generateFilePath(file, options.folder);

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, { 
          upsert: options.upsert ?? true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          error: uploadError
        });
        return { 
          url: '', 
          path: '', 
          error: `Upload failed: ${uploadError.message}` 
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        error: undefined
      };
    } catch (error) {
      console.error('File upload service error:', error);
      return { 
        url: '', 
        path: '', 
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(files: File[], options: UploadOptions): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(bucket: string, path: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return { error: `Delete failed: ${error.message}` };
      }

      return {};
    } catch (error) {
      return { 
        error: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get file info and metadata
   */
  static async getFileInfo(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      if (error || !data || data.length === 0) {
        return { error: 'File not found' };
      }

      return { info: data[0] };
    } catch (error) {
      return { 
        error: `Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

// Predefined upload configurations
export const UPLOAD_CONFIGS = {
  ANNOUNCEMENTS: {
    bucket: 'storage',
    folder: 'announcements',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  },
  DEVIATIONS: {
    bucket: 'storage',
    folder: 'deviations',
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  }
} as const;
