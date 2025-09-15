import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import TemplateSignaturePad from './TemplateSignaturePad';
import { TemplateSubmissionService } from '../services/templateSubmissionService';
import { UserSignatureService } from '../services/userSignatureService';
import { supabase } from '../lib/supabase';

interface TemplateUploadAndSignProps {
  templateType: string;
  templateName: string;
  templateCategory: string;
  onComplete: (submissionId: string) => void;
  onCancel: () => void;
}

export default function TemplateUploadAndSign({ 
  templateType,
  templateName,
  templateCategory,
  onComplete, 
  onCancel 
}: TemplateUploadAndSignProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'signing' | 'completed' | 'error'>('idle');
  const [showSignature, setShowSignature] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [submissionTitle, setSubmissionTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isCheckingSignature, setIsCheckingSignature] = useState(false);

  const templateSubmissionService = new TemplateSubmissionService();

  // Check for saved signature on component mount
  useEffect(() => {
    checkForSavedSignature();
  }, []);

  const checkForSavedSignature = async () => {
    try {
      setIsCheckingSignature(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const result = await UserSignatureService.getUserSignature(user.user.id, 'researcher');
      if (result.signature) {
        setSavedSignature(result.signature.signature_image);
      }
    } catch (error) {
      console.error('Error checking for saved signature:', error);
    } finally {
      setIsCheckingSignature(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please upload a PDF or Word document');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !submissionTitle.trim()) return;

    setUploadStatus('uploading');
    try {
      const result = await templateSubmissionService.createSubmission({
        submission_title: submissionTitle,
        template_name: templateName,
        template_category: templateCategory,
        file: uploadedFile,
        description: description || undefined,
        priority: 'medium'
      });

      if (result.success && result.submissionId) {
        setSubmissionId(result.submissionId);
        setUploadStatus('uploaded');
        
        // If user has a saved signature, use it automatically
        if (savedSignature && result.submissionId) {
          setTimeout(() => handleAutoSign(result.submissionId!), 500);
        } else {
          // Show signature pad if no saved signature
          setTimeout(() => setShowSignature(true), 500);
        }
      } else {
        setUploadStatus('error');
        setUploadError(result.error || 'Failed to create submission');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setUploadError('Failed to upload file. Please try again.');
    }
  };

  const handleAutoSign = async (submissionId: string) => {
    if (!savedSignature) return;
    
    setUploadStatus('signing');
    try {
      const result = await templateSubmissionService.signAsResearcher(submissionId, savedSignature);
      
      if (result.success) {
        setUploadStatus('completed');
        onComplete(submissionId);
      } else {
        setUploadError(result.error || 'Failed to apply saved signature');
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Auto-sign failed:', error);
      setUploadError('Failed to apply saved signature. Please try signing manually.');
      setUploadStatus('error');
      // Fallback to showing signature pad
      setShowSignature(true);
    }
  };

  const handleSignatureComplete = async (signatureData: string) => {
    if (!signatureData || !submissionId) {
      setShowSignature(false);
      return;
    }

    setUploadStatus('signing');
    try {
      // Use the actual signature data from the signature pad
      const result = await templateSubmissionService.signAsResearcher(submissionId, signatureData);
      
      if (result.success) {
        setUploadStatus('completed');
        onComplete(submissionId);
      } else {
        setUploadError(result.error || 'Failed to sign submission');
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Signature failed:', error);
      setUploadError('Failed to sign submission. Please try again.');
      setUploadStatus('error');
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setSubmissionId('');
    setUploadStatus('idle');
    setShowSignature(false);
    setUploadError('');
    setSubmissionTitle('');
    setDescription('');
  };

  if (showSignature) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-900">File Uploaded Successfully</h3>
              <p className="text-sm text-green-700 mt-1">
                <strong>{uploadedFile?.name}</strong> has been uploaded. Please sign to complete the submission.
              </p>
            </div>
          </div>
        </div>

        <TemplateSignaturePad
          onSignatureComplete={handleSignatureComplete}
          onCancel={() => setShowSignature(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Upload Completed {templateType} Form
          </h2>
          <p className="text-gray-600">
            Upload your completed form and apply your digital signature for authentication
          </p>
          
          {/* Saved Signature Status */}
          {savedSignature && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Saved signature detected</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Your form will be automatically signed with your saved signature after upload
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-lg font-medium text-gray-900">
                  Upload your completed form
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  PDF or Word document up to 10MB
                </span>
                <span className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                  Select File
                </span>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Submission Details Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="submission-title" className="block text-sm font-medium text-gray-700 mb-1">
                Submission Title *
              </label>
              <input
                id="submission-title"
                type="text"
                value={submissionTitle}
                onChange={(e) => setSubmissionTitle(e.target.value)}
                placeholder={`${templateName} Submission - ${new Date().toLocaleDateString()}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional notes or comments about this submission..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* File Selected */}
          {uploadedFile && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type.includes('pdf') ? 'PDF' : 'Word'} Document
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus === 'uploaded' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700">
                  {savedSignature 
                    ? 'File uploaded successfully! Applying your saved signature...' 
                    : 'File uploaded successfully! Ready for signature.'
                  }
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'signing' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-blue-700">
                  {savedSignature 
                    ? 'Applying your saved digital signature...' 
                    : 'Processing digital signature...'
                  }
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700">
                  {savedSignature 
                    ? 'Form submitted successfully using your saved signature!' 
                    : 'Form submitted and signed successfully!'
                  }
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">Upload failed. Please try again.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {uploadedFile && uploadStatus !== 'uploaded' && (
              <button
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading' || !submissionTitle.trim()}
                className="flex-1 px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
              >
                {uploadStatus === 'uploading' ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </div>
                ) : !submissionTitle.trim() ? (
                  'Enter Submission Title to Continue'
                ) : (
                  'Upload and Continue to Signature'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
              <p className="mt-1 text-sm text-blue-800">
                Your file will be securely uploaded and encrypted. Digital signature is required for authentication and legal compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
