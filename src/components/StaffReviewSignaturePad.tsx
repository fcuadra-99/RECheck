import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Shield, RotateCcw, Check, X, FileText } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { DigitalSignatureService } from '../services/digitalSignatureService';
import SignatureDisplay from './SignatureDisplay';

interface StaffReviewSignaturePadProps {
  deviationReportId: string;
  onSignatureComplete?: (success: boolean) => void;
  onCancel?: () => void;
  showReportSummary?: boolean;
}

export default function StaffReviewSignaturePad({
  deviationReportId,
  onSignatureComplete,
  onCancel,
  showReportSummary = true
}: StaffReviewSignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [canSign, setCanSign] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    checkSigningPermissions();
    if (showReportSummary) {
      loadReportData();
    }
  }, [deviationReportId, user]);

  const checkSigningPermissions = async () => {
    if (!user) return;
    
    setCheckingPermissions(true);
    try {
      const result = await DigitalSignatureService.canUserSign(
        deviationReportId,
        user.id,
        'staff'
      );
      
      setCanSign(result.canSign);
      if (!result.canSign && result.reason) {
        setError(result.reason);
      }
    } catch (err: any) {
      setError('Failed to check signing permissions');
    } finally {
      setCheckingPermissions(false);
    }
  };

  const loadReportData = async () => {
    try {
      // This would ideally come from your deviation report service
      // For now, we'll leave it as a placeholder
      // const data = await deviationReportService.getById(deviationReportId);
      // setReportData(data);
    } catch (err) {
      console.error('Failed to load report data:', err);
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setError('');
  };

  const handleSign = async () => {
    if (!signatureRef.current || !user) {
      setError('Unable to capture signature');
      return;
    }

    if (signatureRef.current.isEmpty()) {
      setError('Please provide a signature before submitting');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const signatureDataURL = signatureRef.current.toDataURL();
      
      const signatureData = {
        signatureImage: signatureDataURL,
        userId: user.id,
        userRole: 'staff' as const
      };

      const result = await DigitalSignatureService.signAsStaff(
        deviationReportId,
        signatureData
      );

      if (result.success) {
        onSignatureComplete?.(true);
      } else {
        setError(result.error || 'Failed to apply signature');
        onSignatureComplete?.(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply signature');
      onSignatureComplete?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingPermissions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking permissions...</span>
      </div>
    );
  }

  if (!canSign) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <X className="h-5 w-5 text-yellow-600 mr-2" />
          <h3 className="text-sm font-medium text-yellow-800">Cannot Sign Document</h3>
        </div>
        <p className="mt-2 text-sm text-yellow-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Signature Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">Staff Review Signature Required</h3>
        </div>
        <p className="text-sm text-blue-700">
          The deviation report has been submitted by the researcher and is ready for your review signature.
        </p>
      </div>

      {/* Show existing signatures */}
      <SignatureDisplay deviationReportId={deviationReportId} />

      {/* Report Summary (if enabled) */}
      {showReportSummary && reportData && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <FileText className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-medium text-gray-900">Report Summary</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Protocol:</span>
              <span className="ml-2 text-gray-600">{reportData.protocolCode}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-600">{reportData.type}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Description:</span>
              <p className="mt-1 text-gray-600">{reportData.deviationDescription}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Staff Review Signature</h3>
          </div>
          <div className="text-sm text-gray-500">
            Stage 2 of 2
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            By signing below, I certify that I have reviewed this deviation report and my assessment is complete and accurate.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-canvas bg-white border rounded-md',
              style: { width: '100%', height: '200px' }
            }}
            clearOnResize={false}
          />
          
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </button>
            
            <div className="flex items-center gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="button"
                onClick={handleSign}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Complete Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
          <p className="text-xs text-purple-700">
            <strong>Legal Notice:</strong> Your electronic signature has the same legal effect as a handwritten signature. 
            By clicking "Complete Review", you agree that this constitutes your electronic signature and consent to conduct this transaction electronically.
          </p>
        </div>
      </div>
    </div>
  );
}
