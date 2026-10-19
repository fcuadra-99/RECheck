export interface UserSignature {
    id?: string;
    user_id: string;
    user_role: 'researcher' | 'chairperson';
    signature_image: string;
    signature_hash: string;
    created_at?: string;
    updated_at?: string;
}
export declare class UserSignatureService {
    /**
     * Save a user's signature for future reuse
     */
    static saveUserSignature(userId: string, userRole: 'researcher' | 'chairperson', signatureImage: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get a user's saved signature
     */
    static getUserSignature(userId: string, userRole: 'researcher' | 'chairperson'): Promise<{
        signature: UserSignature | null;
        error?: string;
    }>;
    /**
     * Check if user has a saved signature
     */
    static hasUserSignature(userId: string, userRole: 'researcher' | 'chairperson'): Promise<boolean>;
}
