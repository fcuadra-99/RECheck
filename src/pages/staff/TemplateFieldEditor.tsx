import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PDFFormFiller from '../../components/PDFFormFiller';
import { TemplateDownloadService, type FormTemplate } from '../../services/templateDownloadService';
import { TemplateFieldConfigService } from '../../services/templateFieldConfigService';
import type { FormFieldData } from '../../services/pdfFormService';

export default function TemplateFieldEditor() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [savedFields, setSavedFields] = useState<FormFieldData[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [configuredTemplates, setConfiguredTemplates] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load all templates available for configuration (includes final report)
    const allTemplates = TemplateDownloadService.getConfigurableTemplates();
    setTemplates(allTemplates);

    // Check which templates have configurations
    const configured = new Set<string>();
    allTemplates.forEach(template => {
      if (TemplateFieldConfigService.hasConfiguration(template.id)) {
        configured.add(template.id);
      }
    });
    setConfiguredTemplates(configured);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      // Load existing configuration if available
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        const config = TemplateFieldConfigService.getConfiguration(template.id);
        if (config) {
          setSavedFields(config.fields);
        } else {
          setSavedFields([]);
        }
      }
    }
  }, [selectedTemplate, templates]);

  const handleStartEditing = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedTemplate('');
    setSavedFields([]);
  };

  // We use handleSaveFields to save the field configuration
  const handleSaveFields = (fields: FormFieldData[]) => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    try {
      setSaveStatus('saving');
      
      const config = {
        templateId: template.id,
        templateName: template.name,
        fields: fields,
        lastModified: new Date().toISOString()
      };

      TemplateFieldConfigService.saveConfiguration(config);
      setSavedFields(fields);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      // Update configured templates
      setConfiguredTemplates(prev => new Set(prev).add(template.id));
      
      alert(`Configuration saved for ${template.name}!\n${fields.length} field(s) configured.`);
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      alert('Failed to save configuration');
    }
  };

  const handleDeleteConfiguration = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    if (!confirm(`Delete field configuration for ${template.name}?`)) return;

    try {
      TemplateFieldConfigService.deleteConfiguration(template.id);
      setSavedFields([]);
      
      // Update configured templates
      setConfiguredTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(template.id);
        return newSet;
      });
      
      alert('Configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      alert('Failed to delete configuration');
    }
  };

  if (editMode && selectedTemplate) {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">
                Configure: {template.name}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {saveStatus === 'saved' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Saved</span>
                </div>
              )}
              {saveStatus === 'saving' && (
                <span className="text-sm text-gray-600">Saving...</span>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">Editor Mode Active</p>
              <p className="text-sm text-blue-700 mt-1">
                Click "Add Fields" to place text boxes on the template. Position and size them as needed. 
                These fields will automatically appear for researchers when they use this form.
              </p>
            </div>
          </div>
        </div>

        {/* PDF Editor - We need to modify PDFFormFiller to expose save fields method */}
        <div className="p-6">
          <PDFFormFillerWithSave
            templateUrl={template.templateUrl}
            templateName={template.name}
            predefinedFields={savedFields}
            onSaveFields={handleSaveFields}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Template Field Configuration</h1>
          </div>
          <p className="text-gray-600">
            Pre-configure text fields for post-approval form templates. 
            Fields you add here will automatically appear for researchers when they fill out forms.
          </p>
        </div>

        {/* Template Selection */}
        {!selectedTemplate && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Select Template to Configure</h2>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4">
                {templates.map(template => {
                  const isConfigured = configuredTemplates.has(template.id);
                  const config = isConfigured ? TemplateFieldConfigService.getConfiguration(template.id) : null;
                  
                  return (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        {isConfigured && config && (
                          <div className="flex items-center space-x-2 mt-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              {config.fields.length} field(s) configured
                            </span>
                            <span className="text-xs text-gray-500">
                              • Updated {new Date(config.lastModified).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setSelectedTemplate(template.id)}
                        className="ml-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        {isConfigured ? 'Edit' : 'Configure'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Template Selected - Show Options */}
        {selectedTemplate && !editMode && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <button
                onClick={() => setSelectedTemplate('')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to templates</span>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {templates.find(t => t.id === selectedTemplate)?.name}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {savedFields.length > 0 ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Configuration Active</span>
                    </div>
                    <p className="text-sm text-green-700">
                      This template has {savedFields.length} pre-configured field(s) that will appear for researchers.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleStartEditing}
                      className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Edit Field Configuration
                    </button>
                    <button
                      onClick={handleDeleteConfiguration}
                      className="px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      No fields configured yet. Click below to add pre-placed text fields to this template.
                    </p>
                  </div>

                  <button
                    onClick={handleStartEditing}
                    className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Start Configuring Fields
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component that will expose the save fields functionality
function PDFFormFillerWithSave({
  templateUrl,
  templateName,
  predefinedFields,
  onSaveFields,
  onCancel
}: {
  templateUrl: string;
  templateName: string;
  predefinedFields: FormFieldData[];
  onSaveFields: (fields: FormFieldData[]) => void;
  onCancel: () => void;
}) {
  const [currentFields, setCurrentFields] = useState<FormFieldData[]>(predefinedFields);

  const handleFieldsChange = (fields: FormFieldData[]) => {
    setCurrentFields(fields);
  };

  const handleSaveConfiguration = () => {
    onSaveFields(currentFields);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Field Configuration Editor</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add fields using the "Add Fields" button, position them, then click "Save Configuration"
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSaveConfiguration}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
      
      <PDFFormFiller
        templateUrl={templateUrl}
        templateName={templateName}
        predefinedFields={predefinedFields}
        adminMode={true}
        onFieldsChange={handleFieldsChange}
        onCancel={onCancel}
      />
      
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-1">Admin Mode Active</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Add Fields" to place text boxes on the PDF</li>
              <li>• Drag fields to reposition them</li>
              <li>• Resize fields by dragging corners</li>
              <li>• Click "Save Configuration" when done to save for researchers</li>
              <li>• Currently configured: <strong>{currentFields.length} field(s)</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
