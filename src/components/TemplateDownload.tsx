import { useState } from 'react';
import { Download, FileText, Eye, Calendar, User, FileCheck } from 'lucide-react';
import { TemplateDownloadService } from '../services/templateDownloadService';
import type { FormTemplate } from '../services/templateDownloadService';

interface TemplateDownloadProps {
  templates?: FormTemplate[];
  showCategory?: boolean;
  compact?: boolean;
}

export default function TemplateDownload({ 
  templates = TemplateDownloadService.getAllTemplates(),
  showCategory = true,
  compact = false 
}: TemplateDownloadProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (templateId: string) => {
    try {
      setDownloading(templateId);
      await TemplateDownloadService.downloadTemplate(templateId);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download template. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (templateId: string) => {
    TemplateDownloadService.previewTemplate(templateId);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'protocol': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'report': return 'bg-green-100 text-green-800 border-green-200';
      case 'application': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protocol': return <FileCheck className="w-4 h-4" />;
      case 'report': return <FileText className="w-4 h-4" />;
      case 'application': return <User className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-gray-500" />
              <div>
                <span className="font-medium text-sm text-gray-900">{template.name}</span>
                <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                {showCategory && (
                  <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
                    {getCategoryIcon(template.category)}
                    {template.category}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePreview(template.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
              <button
                onClick={() => handleDownload(template.id)}
                disabled={downloading === template.id}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {downloading === template.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900">Available Post Approval Forms</h3>
        <p className="text-gray-600 mt-2">Download PDF templates to fill out offline, then upload and sign digitally</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900 break-words">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {showCategory && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
                    {getCategoryIcon(template.category)}
                    {template.category}
                  </span>
                )}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  v{template.version} • {template.fileType.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handlePreview(template.id)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <button
                onClick={() => handleDownload(template.id)}
                disabled={downloading === template.id}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
              >
                {downloading === template.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">How to use templates:</h4>
            <ol className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-blue-900 min-w-[20px]">1.</span>
                <span>Download the appropriate template for your research form</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-blue-900 min-w-[20px]">2.</span>
                <span>Fill out the form completely using PDF reader or print and fill manually</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-blue-900 min-w-[20px]">3.</span>
                <span>Upload the completed form through our secure upload system</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-blue-900 min-w-[20px]">4.</span>
                <span>Apply your digital signature for authentication and legal compliance</span>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Important:</strong> All forms must be digitally signed within the system for validation and audit purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
