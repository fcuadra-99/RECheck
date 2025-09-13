import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Pen, RotateCcw, Check, X, FileCheck } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { DigitalSignatureService } from '../services/digitalSignatureService';
import { UserSignatureService } from '../services/userSignatureService';

interface DigitalSignaturePadProps {
  deviationReportId: string;
  userRole: 'researcher' | 'staff';
  onSignatureComplete?: (success: boolean) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export default function DigitalSignaturePad({
  deviationReportId,
  userRole,
  onSignatureComplete,
  onCancel,
  disabled = false
}: DigitalSignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [canSign, setCanSign] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [existingSignature, setExistingSignature] = useState<string | null>(null);
  const [useExistingSignature, setUseExistingSignature] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkSigningPermissions();
    loadExistingSignature();
  }, [deviationReportId, user, userRole]);

  const loadExistingSignature = async () => {
    if (!user) return;
    
    try {
      const result = await UserSignatureService.getUserSignature(user.id, userRole);
      if (result.signature && !result.error) {
        setExistingSignature(result.signature.signature_image);
        setUseExistingSignature(true); // Default to using existing signature
      }
    } catch (err) {
      console.log('No existing signature found');
    }
  };

  const checkSigningPermissions = async () => {
    if (!user) return;
    
    setCheckingPermissions(true);
    try {
      const result = await DigitalSignatureService.canUserSign(
        deviationReportId,
        user.id,
        userRole
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

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setError('');
  };

  const handleSign = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let signatureDataURL: string;
      
      if (useExistingSignature && existingSignature) {
        // Use existing signature
        signatureDataURL = existingSignature;
      } else {
        // Use new signature from canvas
        if (!signatureRef.current) {
          setError('Unable to capture signature');
          return;
        }

        if (signatureRef.current.isEmpty()) {
          setError('Please provide a signature before submitting');
          return;
        }

        signatureDataURL = signatureRef.current.toDataURL();
        
        // Save the new signature for future use
        await UserSignatureService.saveUserSignature(user.id, userRole, signatureDataURL);
      }
      
      const signatureData = {
        signatureImage: signatureDataURL,
        userId: user.id,
        userRole
      };

      let result;
      if (userRole === 'researcher') {
        result = await DigitalSignatureService.signAsResearcher(
          deviationReportId,
          signatureData
        );
      } else {
        result = await DigitalSignatureService.signAsStaff(
          deviationReportId,
          signatureData
        );
      }

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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Pen className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            {userRole === 'researcher' ? 'Researcher Signature' : 'Staff Review Signature'}
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          Stage {userRole === 'researcher' ? '1' : '2'} of 2
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          {userRole === 'researcher' 
            ? 'By signing below, I certify that the information provided in this deviation report is accurate and complete to the best of my knowledge.'
            : 'By signing below, I certify that I have reviewed this deviation report and my assessment is complete and accurate.'
          }
        </p>
      </div>

      {/* Existing Signature Option */}
      {existingSignature && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-green-800">Saved Signature Found</h4>
            <button
              type="button"
              onClick={() => setUseExistingSignature(!useExistingSignature)}
              className={`px-3 py-1 text-xs rounded-md ${
                useExistingSignature 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-600 border border-green-300'
              }`}
            >
              {useExistingSignature ? 'Using Saved' : 'Use Saved'}
            </button>
          </div>
          
          {useExistingSignature && (
            <div className="bg-white border border-green-300 rounded-md p-3">
              <p className="text-xs text-green-700 mb-2">Your saved signature:</p>
              <img 
                src={existingSignature} 
                alt="Saved signature" 
                className="max-h-20 border border-gray-200 rounded"
                style={{ maxWidth: '200px' }}
              />
            </div>
          )}
          
          <p className="text-xs text-green-600 mt-2">
            Click "Use Saved" to reuse your signature, or draw a new one below to update your saved signature.
          </p>
        </div>
      )}

      {/* Signature Canvas - Only show if not using existing signature */}
      {!useExistingSignature && (
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
              disabled={disabled || isLoading}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-4">
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
          disabled={disabled || isLoading}
          className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              {useExistingSignature ? 'Apply Saved Signature' : 'Sign Document'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-700">
          <strong>Legal Notice:</strong> Your electronic signature has the same legal effect as a handwritten signature. 
          By clicking "Sign Document", you agree that this constitutes your electronic signature and consent to conduct this transaction electronically.
        </p>
      </div>
    </div>
  );
}
