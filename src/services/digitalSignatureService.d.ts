export interface SignatureData {
    signatureImage: string;
    userId: string;
    userRole: 'researcher' | 'chairperson';
    ipAddress?: string;
    userAgent?: string;
}
export interface SignatureVerification {
    isValid: boolean;
    signedBy?: string;
    signedAt?: string;
    documentIntegrityValid?: boolean;
    signatureImage?: string;
}
export declare class DigitalSignatureService {
    /**
     * Generate a hash of the signature for verification
     */
    private static generateSignatureHash;
    /**
     * Get client IP address (simplified - in production, use proper IP detection)
     */
    private static getClientInfo;
    /**
     * Stage 1: Researcher signs the deviation report
     */
    static signAsResearcher(deviationReportId: string, signatureData: SignatureData): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Stage 2: Chairperson signs the deviation report after review
     */
    static signAsChairperson(deviationReportId: string, signatureData: SignatureData): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Verify signatures on a deviation report
     */
    static verifySignatures(deviationReportId: string): Promise<{
        researcher: SignatureVerification;
        chairperson: SignatureVerification;
        documentIntegrity: boolean;
    }>;
    /**
     * Get signature audit trail for a deviation report
     */
    static getSignatureAuditTrail(deviationReportId: string): Promise<{
        success: boolean;
        data: any[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Check if user can sign the document
     */
    static canUserSign(deviationReportId: string, userId: string, userRole: 'researcher' | 'chairperson'): Promise<{
        canSign: boolean;
        reason?: string;
    }>;
}
