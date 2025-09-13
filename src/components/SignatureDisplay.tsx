import { useState, useEffect } from 'react';
import { Shield, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { DigitalSignatureService } from '../services/digitalSignatureService';

interface SignatureDisplayProps {
  deviationReportId: string;
  showAuditTrail?: boolean;
}

interface SignatureInfo {
  researcher: {
    isValid: boolean;
    signedBy?: string;
    signedAt?: string;
    documentIntegrityValid?: boolean;
    signatureImage?: string;
  };
  staff: {
    isValid: boolean;
    signedBy?: string;
    signedAt?: string;
    documentIntegrityValid?: boolean;
    signatureImage?: string;
  };
  documentIntegrity: boolean;
}

export default function SignatureDisplay({ 
  deviationReportId, 
  showAuditTrail = false 
}: SignatureDisplayProps) {
  const [signatures, setSignatures] = useState<SignatureInfo | null>(null);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadSignatureInfo();
    if (showAuditTrail) {
      loadAuditTrail();
    }
  }, [deviationReportId, showAuditTrail]);

  const loadSignatureInfo = async () => {
    try {
      const result = await DigitalSignatureService.verifySignatures(deviationReportId);
      setSignatures(result);
    } catch (err: any) {
      setError('Failed to load signature information');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditTrail = async () => {
    try {
      const result = await DigitalSignatureService.getSignatureAuditTrail(deviationReportId);
      if (result.success) {
        setAuditTrail(result.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load audit trail:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not signed';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading signatures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!signatures) {
    return null;
  }

  const getSignatureStatus = (isValid: boolean, role: string) => {
    if (isValid) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Signed</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Pending {role} signature</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Document Integrity Status */}
      <div className={`border rounded-lg p-4 ${
        signatures.documentIntegrity 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center">
          <Shield className={`h-5 w-5 mr-2 ${
            signatures.documentIntegrity ? 'text-green-600' : 'text-red-600'
          }`} />
          <h3 className={`font-medium ${
            signatures.documentIntegrity ? 'text-green-800' : 'text-red-800'
          }`}>
            Document Integrity: {signatures.documentIntegrity ? 'Verified' : 'Compromised'}
          </h3>
        </div>
        <p className={`mt-1 text-sm ${
          signatures.documentIntegrity ? 'text-green-700' : 'text-red-700'
        }`}>
          {signatures.documentIntegrity 
            ? 'Document content has not been modified since signing'
            : 'Warning: Document may have been modified after signing'
          }
        </p>
      </div>

      {/* Signature Status */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Researcher Signature */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-gray-900">Researcher Signature</h4>
            </div>
            {getSignatureStatus(signatures.researcher.isValid, 'researcher')}
          </div>
          
          {signatures.researcher.isValid ? (
            <div className="space-y-3">
              {signatures.researcher.signatureImage && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <p className="text-xs text-gray-600 mb-1">Signature:</p>
                  <img 
                    src={signatures.researcher.signatureImage} 
                    alt="Researcher signature" 
                    className="max-h-16 border border-gray-300 rounded bg-white"
                    style={{ maxWidth: '150px' }}
                  />
                </div>
              )}
              <div className="text-sm text-gray-600">
                <strong>Signed:</strong> {formatDate(signatures.researcher.signedAt)}
              </div>
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Stage 1 Complete ✓
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Waiting for researcher to submit and sign the deviation report
            </div>
          )}
        </div>

        {/* Staff Signature */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-gray-900">Staff Review Signature</h4>
            </div>
            {getSignatureStatus(signatures.staff.isValid, 'staff')}
          </div>
          
          {signatures.staff.isValid ? (
            <div className="space-y-3">
              {signatures.staff.signatureImage && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <p className="text-xs text-gray-600 mb-1">Signature:</p>
                  <img 
                    src={signatures.staff.signatureImage} 
                    alt="Staff signature" 
                    className="max-h-16 border border-gray-300 rounded bg-white"
                    style={{ maxWidth: '150px' }}
                  />
                </div>
              )}
              <div className="text-sm text-gray-600">
                <strong>Signed:</strong> {formatDate(signatures.staff.signedAt)}
              </div>
              <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                Stage 2 Complete ✓
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {signatures.researcher.isValid 
                ? 'Ready for staff review and signature'
                : 'Waiting for researcher signature first'
              }
            </div>
          )}
        </div>
      </div>

      {/* Process Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Signature Process Status</h4>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${
            signatures.researcher.isValid ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              signatures.researcher.isValid ? 'bg-green-600' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm">Stage 1: Researcher</span>
          </div>
          
          <div className={`w-8 h-0.5 ${
            signatures.researcher.isValid ? 'bg-green-600' : 'bg-gray-300'
          }`}></div>
          
          <div className={`flex items-center ${
            signatures.staff.isValid ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              signatures.staff.isValid ? 'bg-green-600' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm">Stage 2: Staff Review</span>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      {showAuditTrail && auditTrail.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Signature Audit Trail</h4>
          <div className="space-y-2">
            {auditTrail.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                <div>
                  <span className="font-medium capitalize">{entry.user_role}</span>
                  <span className="text-gray-600 ml-2">{entry.action}</span>
                </div>
                <div className="text-gray-500">
                  {formatDate(entry.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
