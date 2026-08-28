import { supabase } from '../DB';

export interface UserSignature {
  id?: string;
  user_id: string;
  user_role: 'researcher' | 'chairperson';
  signature_image: string; // Base64 signature data
  signature_hash: string;
  created_at?: string;
  updated_at?: string;
}

export class UserSignatureService {
  
  /**
   * Save a user's signature for future reuse
   */
  static async saveUserSignature(
    userId: string, 
    userRole: 'researcher' | 'chairperson', 
    signatureImage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create signature hash for verification
      const crypto = await import('crypto-js');
      const signatureHash = crypto.default.SHA256(signatureImage).toString();

      // Check if user already has a signature
      const { data: existingSignature } = await supabase
        .from('user_signatures')
        .select('id')
        .eq('user_id', userId)
        .eq('user_role', userRole)
        .single();

      if (existingSignature) {
        // Update existing signature
        const { error } = await supabase
          .from('user_signatures')
          .update({
            signature_image: signatureImage,
            signature_hash: signatureHash,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('user_role', userRole);

        if (error) throw error;
      } else {
        // Insert new signature
        const { error } = await supabase
          .from('user_signatures')
          .insert({
            user_id: userId,
            user_role: userRole,
            signature_image: signatureImage,
            signature_hash: signatureHash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to save user signature:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save signature' 
      };
    }
  }

  /**
   * Get a user's saved signature
   */
  static async getUserSignature(
    userId: string, 
    userRole: 'researcher' | 'chairperson'
  ): Promise<{ signature: UserSignature | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_signatures')
        .select('*')
        .eq('user_id', userId)
        .eq('user_role', userRole)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return { signature: data || null };
    } catch (error: any) {
      console.error('Failed to get user signature:', error);
      return { 
        signature: null, 
        error: error.message || 'Failed to retrieve signature' 
      };
    }
  }

  /**
   * Check if user has a saved signature
   */
  static async hasUserSignature(
    userId: string, 
    userRole: 'researcher' | 'chairperson'
  ): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_signatures')
        .select('id')
        .eq('user_id', userId)
        .eq('user_role', userRole)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }
}
