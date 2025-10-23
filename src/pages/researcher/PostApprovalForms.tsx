import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import PDFFormFiller from '../../components/PDFFormFiller';
import { TemplateDownloadService } from '../../services/templateDownloadService';
import { TemplateSubmissionService } from '../../services/templateSubmissionService';
import { supabase } from '../../DB';

export default function FormsTemplates() {
  const [selectedAction, setSelectedAction] = useState<'fill-online' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // handleTemplateUploadComplete removed as upload functionality is no longer needed

  const handleCancel = () => {
    setSelectedAction(null);
    setSelectedTemplate('');
  };

  const handleFormSave = async (pdfBytes: Uint8Array, formData: Record<string, string | boolean>) => {
    console.log('=== handleFormSave called ===');
    console.log('Form filled and saved:', formData);
    console.log('PDF size:', pdfBytes.length, 'bytes');
    
    try {
      // Convert the PDF bytes to a File object - handle type safely by using Array.from
      const pdfArray = Array.from(pdfBytes);
      const pdfBlob = new Blob([new Uint8Array(pdfArray)], { type: 'application/pdf' });
      const pdfFile = new File(
        [pdfBlob], 
        `${selectedTemplate}_filled.pdf`, 
        { type: 'application/pdf', lastModified: Date.now() }
      );
      
      // Prepare the submission data
      // Find template by finding the template with matching name
      const allTemplates = TemplateDownloadService.getAllTemplates();
      const templateDetails = allTemplates.find(t => t.name === selectedTemplate);
      
      const submissionData = {
        submission_title: `${selectedTemplate} Submission`,
        template_name: selectedTemplate,
        template_category: templateDetails?.category || 'general',
        file: pdfFile,
        description: `Completed form for ${selectedTemplate}`,
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };
      
      // Submit the form
      const submissionService = new TemplateSubmissionService();
      const result = await submissionService.createSubmission(submissionData);
      
      if (result.success) {
        alert('Form submitted successfully! Your submission will be reviewed.');
      } else {
        throw new Error(result.error || 'Unknown error during submission');
      }
      
      // Reset view to go back to forms list
      setSelectedAction(null);
      setSelectedTemplate('');
      
      console.log('=== handleFormSave completed ===');
    } catch (error) {
      console.error('Error in handleFormSave:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fill Form Online View
  if (selectedAction === 'fill-online' && selectedTemplate) {
    const templateDetails = TemplateDownloadService.getUploadableTemplates().find(t => t.name === selectedTemplate);
    
    if (!templateDetails) {
      console.error('Template not found:', selectedTemplate);
      alert('Template configuration not found. Please try again.');
      setSelectedAction(null);
      setSelectedTemplate('');
      return null;
    }

    console.log('Loading template:', templateDetails);
    
    return (
      <PDFFormFiller
        templateUrl={templateDetails.templateUrl}
        templateName={templateDetails.name}
        onSave={handleFormSave}
        onCancel={handleCancel}
      />
    );
  }

  // Upload functionality removed as it's been replaced by the fill-online submission

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {!selectedAction && (
          <>
            {/* Header Section */}
            <div className="mb-16">
              <div className="inline-block mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Post Approval Forms</span>
                </div>
              </div>
              <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
               Post Approval Forms
              </h1>
         
            </div>

            {/* Main Form Selection */}
            <div className="space-y-6 mb-16">
              <div>
                <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-3">
                  Select Form Template
                </label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                >
                  <option value="">Choose a form...</option>
                  {TemplateDownloadService.getUploadableTemplates().map((template) => (
                    <option key={template.id} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => selectedTemplate && setSelectedAction('fill-online')}
                disabled={!selectedTemplate}
                className="w-full px-6 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {selectedTemplate ? 'Continue to Form' : 'Select a form to continue'}
              </button>
            </div>

            {/* Info Section */}
            <div className="border-t border-gray-200 pt-12">
              <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Select Form</h3>
                    <p className="text-sm text-gray-600">Choose the form template you need to complete</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Fill Information</h3>
                    <p className="text-sm text-gray-600">Complete the form fields directly in your browser</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Submit</h3>
                    <p className="text-sm text-gray-600">Save and submit your completed form for review</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Download functionality has been removed */}
      </div>
    </div>
  );
}
