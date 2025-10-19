import { useState } from 'react';
import { Download, Upload, ArrowLeft, BookOpen } from 'lucide-react';
import TemplateDownload from '../../components/TemplateDownload';
import TemplateUploadAndSign from '../../components/TemplateUploadAndSign';
import { TemplateDownloadService } from '../../services/templateDownloadService';

export default function FormsTemplates() {
  const [selectedAction, setSelectedAction] = useState<'download' | 'upload' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleTemplateUploadComplete = (submissionId: string) => {
    console.log('Template upload and signature complete, submission ID:', submissionId);
    alert('Form submitted successfully with digital signature! Your submission is now being reviewed by REC Chairperson.');
    setSelectedAction(null);
    setSelectedTemplate('');
  };

  const handleCancel = () => {
    setSelectedAction(null);
    setSelectedTemplate('');
  };

  if (selectedAction === 'upload' && selectedTemplate) {
    const templateDetails = TemplateDownloadService.getUploadableTemplates().find(t => t.name === selectedTemplate);
    
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleCancel}
            className="mb-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </button>
          
          <TemplateUploadAndSign
            templateType={selectedTemplate}
            templateName={templateDetails?.name || selectedTemplate}
            templateCategory={templateDetails?.category || 'report'}
            onComplete={handleTemplateUploadComplete}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Post Approval Forms</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Download official research form templates to fill out offline, then upload and sign digitally for authentication and compliance.
          </p>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-3xl mx-auto">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Note:</span> You can download the "Protocol Final Report" template here, but it must be submitted through the dedicated "Final Report Submission" page, not uploaded here.
            </p>
          </div>
        </div>

        {!selectedAction && (
          <>
            {/* Action Selection */}
            <div className="mb-10 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
           
              <div className="grid md:grid-cols-2 gap-8">
                {/* Download Templates Option */}
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                      <Download className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Download Templates</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Download official PDF templates to fill out offline at your convenience. Perfect for detailed forms that require research or consultation.
                    </p>
                    <button
                      onClick={() => setSelectedAction('download')}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Browse Templates
                    </button>
                  </div>
                </div>

                {/* Upload Completed Forms Option */}
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Completed Forms</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Upload your completed forms and apply digital signatures for authentication. Secure and legally compliant.
                    </p>
                    <div className="space-y-3">
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select form type...</option>
                        {TemplateDownloadService.getUploadableTemplates().map((template) => (
                          <option key={template.id} value={template.name}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => selectedTemplate && setSelectedAction('upload')}
                        disabled={!selectedTemplate}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Upload & Sign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Download</h4>
                  <p className="text-sm text-gray-600">Choose and download the official PDF template you need</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Fill Out</h4>
                  <p className="text-sm text-gray-600">Complete the form offline using your preferred PDF editor</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Upload</h4>
                  <p className="text-sm text-gray-600">Upload your completed form back to the system</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">4</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sign</h4>
                  <p className="text-sm text-gray-600">Apply your digital signature for authentication and compliance</p>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedAction === 'download' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Download Post Approval Forms</h2>
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Options
              </button>
            </div>
            <TemplateDownload />
          </div>
        )}
      </div>
    </div>
  );
}
