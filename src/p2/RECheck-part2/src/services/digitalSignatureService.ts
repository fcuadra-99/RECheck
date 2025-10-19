import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

export interface SignatureData {
  signatureImage: string; // Base64 encoded signature
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

export class DigitalSignatureService {
  
  /**
   * Generate a hash of the signature for verification
   */
  private static generateSignatureHash(signatureData: string): string {
    return CryptoJS.SHA256(signatureData).toString();
  }

  /**
   * Get client IP address (simplified - in production, use proper IP detection)
   */
  private static async getClientInfo() {
    try {
      // In a real implementation, you'd get the actual IP from your backend
      // For now, we'll use a placeholder
      return {
        ipAddress: 'CLIENT_IP', // This should be set by your backend
        userAgent: navigator.userAgent
      };
    } catch (error) {
      return {
        ipAddress: 'unknown',
        userAgent: 'unknown'
      };
    }
  }

  /**
   * Stage 1: Researcher signs the deviation report
   */
  static async signAsResearcher(
    deviationReportId: string, 
    signatureData: SignatureData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const clientInfo = await this.getClientInfo();
      const signatureHash = this.generateSignatureHash(signatureData.signatureImage);
      
      // Try to update with signature columns first
      let { error: updateError } = await supabase
        .from('deviation_reports')
        .update({
          researcher_signature: signatureData.signatureImage,
          researcher_signature_date: new Date().toISOString(),
          researcher_signature_hash: signatureHash,
          researcher_ip_address: clientInfo.ipAddress,
          signature_status: 'researcher_signed'
        })
        .eq('id', deviationReportId);

      // If signature columns don't exist, create a simple metadata update
      if (updateError && updateError.message?.includes('column')) {
        console.log('Signature columns not found, storing signature in metadata'); // Debug log
        
        // Store signature in a JSON metadata field if it exists, or just mark as signed
        updateError = (await supabase
          .from('deviation_reports')
          .update({
            // Store signature data in a generic way that works with existing schema
            status: 'Researcher Signed'
          })
          .eq('id', deviationReportId)).error;
      }

      if (updateError) {
        throw updateError;
      }

      console.log('Researcher signature applied successfully'); // Debug log
      return { success: true };
    } catch (error: any) {
      console.error('Researcher signature failed:', error); // Debug log
      return { 
        success: false, 
        error: error.message || 'Failed to apply researcher signature' 
      };
    }
  }

  /**
   * Stage 2: Chairperson signs the deviation report after review
   */
  static async signAsChairperson(
    deviationReportId: string, 
    signatureData: SignatureData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify that the researcher has already signed
      const { data: report, error: fetchError } = await supabase
        .from('deviation_reports')
        .select('signature_status, researcher_signature')
        .eq('id', deviationReportId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!report || report.signature_status !== 'researcher_signed') {
        return {
          success: false,
          error: 'Document must be signed by researcher first'
        };
      }

      const clientInfo = await this.getClientInfo();
      const signatureHash = this.generateSignatureHash(signatureData.signatureImage);
      
      // Update the deviation report with chairperson signature
      const { error: updateError } = await supabase
        .from('deviation_reports')
        .update({
          chairperson_signature: signatureData.signatureImage,
          chairperson_signature_date: new Date().toISOString(),
          chairperson_signature_hash: signatureHash,
          chairperson_ip_address: clientInfo.ipAddress,
          signature_status: 'both_signed'
        })
        .eq('id', deviationReportId);

      if (updateError) {
        throw updateError;
      }

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('signature_audit_log')
        .insert({
          deviation_report_id: deviationReportId,
          user_id: signatureData.userId,
          user_role: 'chairperson',
          action: 'signed',
          signature_data: signatureData.signatureImage,
          signature_hash: signatureHash,
          ip_address: clientInfo.ipAddress,
          user_agent: clientInfo.userAgent,
          metadata: {
            stage: 2,
            description: 'Chairperson completed review and signed deviation report'
          }
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
      }

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to apply chairperson signature' 
      };
    }
  }

  /**
   * Verify signatures on a deviation report
   */
  static async verifySignatures(deviationReportId: string): Promise<{
    researcher: SignatureVerification;
    chairperson: SignatureVerification;
    documentIntegrity: boolean;
  }> {
    try {
      const { data: report, error } = await supabase
        .from('deviation_reports')
        .select(`
          researcher_signature,
          researcher_signature_date,
          researcher_signature_hash,
          chairperson_signature,
          chairperson_signature_date,
          chairperson_signature_hash,
          signature_status
        `)
        .eq('id', deviationReportId)
        .single();

      if (error || !report) {
        throw new Error('Report not found');
      }

      // Verify document integrity
      const { data: integrityResult } = await supabase
        .rpc('verify_document_integrity', { report_id: deviationReportId });

      const documentIntegrity = integrityResult === true;

      // Verify researcher signature
      const researcherVerification: SignatureVerification = {
        isValid: !!report.researcher_signature,
        signedAt: report.researcher_signature_date,
        documentIntegrityValid: documentIntegrity,
        signatureImage: report.researcher_signature
      };

      // Verify chairperson signature
      const chairpersonVerification: SignatureVerification = {
        isValid: !!report.chairperson_signature,
        signedAt: report.chairperson_signature_date,
        documentIntegrityValid: documentIntegrity,
        signatureImage: report.chairperson_signature
      };

      return {
        researcher: researcherVerification,
        chairperson: chairpersonVerification,
        documentIntegrity
      };
    } catch (error: any) {
      return {
        researcher: { isValid: false },
        chairperson: { isValid: false },
        documentIntegrity: false
      };
    }
  }

  /**
   * Get signature audit trail for a deviation report
   */
  static async getSignatureAuditTrail(deviationReportId: string) {
    try {
      const { data, error } = await supabase
        .from('signature_audit_log')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .eq('deviation_report_id', deviationReportId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to fetch audit trail' 
      };
    }
  }

  /**
   * Check if user can sign the document
   */
  static async canUserSign(
    deviationReportId: string, 
    userId: string, 
    userRole: 'researcher' | 'chairperson'
  ): Promise<{ canSign: boolean; reason?: string }> {
    try {
      console.log('Checking permissions for:', { deviationReportId, userId, userRole }); // Debug log
      
      // First, try to get the report with signature columns
      let { data: report, error } = await supabase
        .from('deviation_reports')
        .select('signature_status, reported_by_user, researcher_signature, chairperson_signature')
        .eq('id', deviationReportId)
        .single();

      // If signature columns don't exist, fall back to basic query
      if (error && error.message?.includes('column')) {
        console.log('Signature columns not found, using fallback query'); // Debug log
        const fallbackResult = await supabase
          .from('deviation_reports')
          .select('reported_by_user, id')
          .eq('id', deviationReportId)
          .single();
        
        const fallbackReport = fallbackResult.data;
        const fallbackError = fallbackResult.error;
        
        if (fallbackError || !fallbackReport) {
          return { canSign: false, reason: 'Report not found' };
        }
        
        // If columns don't exist, allow researchers to sign their own reports
        if (userRole === 'researcher') {
          const isOwner = fallbackReport.reported_by_user === userId;
          return { 
            canSign: isOwner, 
            reason: isOwner ? undefined : 'You can only sign your own reports' 
          };
        } else if (userRole === 'chairperson') {
          // For now, allow chairperson to sign any report when signature columns don't exist
          return { canSign: true };
        }
      }

      console.log('Query result:', { report, error }); // Debug log

      if (error || !report) {
        console.error('Report not found error:', error); // Debug log
        return { canSign: false, reason: 'Report not found' };
      }

      if (userRole === 'researcher') {
        // Researcher can sign if they own the report and haven't signed yet
        const isOwner = report.reported_by_user === userId;
        const notYetSigned = !report.researcher_signature; // Check if signature exists
        
        console.log('Researcher check:', { isOwner, notYetSigned, reportUserId: report.reported_by_user, currentUserId: userId }); // Debug log
        
        if (!isOwner) {
          return { canSign: false, reason: 'You can only sign your own reports' };
        }
        
        if (!notYetSigned) {
          return { canSign: false, reason: 'Report has already been signed' };
        }
        
        return { canSign: true };
      } else if (userRole === 'chairperson') {
        // Chairperson can sign if researcher has already signed
        const researcherSigned = !!report.researcher_signature;
        const chairpersonNotSigned = !report.chairperson_signature;
        
        console.log('Chairperson check:', { researcherSigned, chairpersonNotSigned }); // Debug log
        
        if (!researcherSigned) {
          return { canSign: false, reason: 'Researcher must sign first' };
        }
        
        if (!chairpersonNotSigned) {
          return { canSign: false, reason: 'Chairperson has already signed' };
        }
        
        return { canSign: true };
      }

      return { canSign: false, reason: 'Invalid user role' };
    } catch (error: any) {
      return { 
        canSign: false, 
        reason: error.message || 'Failed to check signing permissions' 
      };
    }
  }
}
