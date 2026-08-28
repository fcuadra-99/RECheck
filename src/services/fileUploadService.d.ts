export interface UploadResult {
    url: string;
    path: string;
    error?: string;
}
export interface UploadOptions {
    bucket: string;
    folder?: string;
    allowedTypes?: readonly string[];
    maxSize?: number;
    upsert?: boolean;
}
export declare class FileUploadService {
    private static readonly DEFAULT_MAX_SIZE;
    private static readonly DEFAULT_ALLOWED_TYPES;
    /**
     * Validate a file against the given options
     */
    static validateFile(file: File, options: UploadOptions): string | null;
    /**
     * Generate a unique file path
     */
    static generateFilePath(file: File, folder?: string): string;
    /**
     * Upload a single file
     */
    static uploadFile(file: File, options: UploadOptions): Promise<UploadResult>;
    /**
     * Upload multiple files
     */
    static uploadFiles(files: File[], options: UploadOptions): Promise<UploadResult[]>;
    /**
     * Delete a file from storage
     */
    static deleteFile(bucket: string, path: string): Promise<{
        error?: string;
    }>;
    /**
     * Get file info and metadata
     */
    static getFileInfo(bucket: string, path: string): Promise<{
        error: string;
        info?: undefined;
    } | {
        info: import("@supabase/storage-js").FileObject;
        error?: undefined;
    }>;
}
export declare const UPLOAD_CONFIGS: {
    readonly ANNOUNCEMENTS: {
        readonly bucket: "storage";
        readonly folder: "announcements";
        readonly maxSize: number;
        readonly allowedTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv"];
    };
    readonly DEVIATIONS: {
        readonly bucket: "storage";
        readonly folder: "deviations";
        readonly maxSize: number;
        readonly allowedTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv"];
    };
};
