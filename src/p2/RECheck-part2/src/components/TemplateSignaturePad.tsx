import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle, X, RotateCcw } from 'lucide-react';
import { UserSignatureService } from '../services/userSignatureService';
import { supabase } from '../lib/supabase';

interface TemplateSignaturePadProps {
  onSignatureComplete: (signatureData: string) => void;
  onCancel: () => void;
}

export default function TemplateSignaturePad({ 
  onSignatureComplete, 
  onCancel 
}: TemplateSignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string>('');

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setError('');
    }
  };

  const handleSubmitSignature = async () => {
    if (!signatureRef.current) {
      setError('Unable to capture signature');
      return;
    }

    if (signatureRef.current.isEmpty()) {
      setError('Please provide a signature before submitting');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      // Get signature data as base64
      const signatureDataURL = signatureRef.current.toDataURL();
      
      // Save signature for future use
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await UserSignatureService.saveUserSignature(
            user.user.id, 
            'researcher', 
            signatureDataURL
          );
        }
      } catch (saveError) {
        console.warn('Failed to save signature for future use:', saveError);
        // Don't fail the submission if signature saving fails
      }
      
      // Call the completion callback with signature data
      onSignatureComplete(signatureDataURL);
    } catch (error) {
      console.error('Error submitting signature:', error);
      setError('Failed to submit signature. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Signature Required</h3>
        <p className="text-gray-600">
          Please provide your digital signature to authenticate and complete this template submission. 
          Your signature confirms the accuracy and authenticity of the submitted document.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Signature
        </label>
        <div className="border-2 border-gray-300 rounded-lg p-2 bg-gray-50">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: 600,
              height: 200,
              className: 'signature-canvas bg-white rounded border border-gray-200'
            }}
            backgroundColor="white"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Sign above using your mouse, trackpad, or touch screen
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        
        <button
          type="button"
          onClick={handleSubmitSignature}
          disabled={isSigning}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400 flex-1 sm:flex-none justify-center"
        >
          {isSigning ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </div>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Submission
            </>
          )}
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Digital Signature Information</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your digital signature will be encrypted and stored securely. This signature legally 
              authenticates your submission and cannot be altered once submitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
