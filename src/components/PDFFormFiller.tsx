import { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import { Save, Download, ZoomIn, ZoomOut, RotateCw, FileText, Edit3, Eye, X } from 'lucide-react';
import PDFFormField from './PDFFormField';
import SignatureModal from './SignatureModal';
import { pdfFormService } from '../services/pdfFormService';
import type { FormFieldData } from '../services/pdfFormService';

// Configure PDF.js worker - try multiple approaches
try {
  // Try using the worker from pdfjs-dist package
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} catch (error) {
  console.warn('Failed to set worker source:', error);
}

interface PDFFormFillerProps {
  templateUrl: string;
  templateName: string;
  onSave?: (pdfBytes: Uint8Array, formData: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  predefinedFields?: FormFieldData[]; // Admin-configured fields to pre-load
  adminMode?: boolean; // Enable admin field configuration mode
  onFieldsChange?: (fields: FormFieldData[]) => void; // Callback when fields change in admin mode
}

export default function PDFFormFiller({ 
  templateUrl, 
  templateName, 
  onSave, 
  onCancel,
  predefinedFields = [],
  adminMode = false,
  onFieldsChange
}: PDFFormFillerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [fields, setFields] = useState<FormFieldData[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [scale, setScale] = useState<number>(1.5);
  const [loading, setLoading] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [addFieldMode, setAddFieldMode] = useState<boolean>(false);
  const [fieldCounter, setFieldCounter] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewPdfBytes, setPreviewPdfBytes] = useState<Uint8Array | null>(null);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [highlightFields, setHighlightFields] = useState<boolean>(true);
  const [addSignatureMode, setAddSignatureMode] = useState<boolean>(false);
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [pendingSignatureField, setPendingSignatureField] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Memoize the file prop to prevent unnecessary reloads
  const pdfFile = useMemo(() => {
    return pdfBytes ? { data: pdfBytes } : null;
  }, [pdfBytes]);

  // Load PDF and extract form fields
  useEffect(() => {
    loadPDF();
  }, [templateUrl]);

  // Notify parent of field changes in admin mode
  useEffect(() => {
    if (adminMode && onFieldsChange) {
      onFieldsChange(fields);
    }
  }, [fields, adminMode, onFieldsChange]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      
      // Fetch PDF
      console.log('Loading PDF from:', templateUrl);
      const response = await fetch(templateUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfBytes(bytes);
      
      // Load with pdf-lib to extract fields
      const pdfDocument = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdfDocument);
      
      // Extract form fields from PDF
      const extractedFields = await pdfFormService.extractFormFields(pdfDocument);
      console.log('Extracted fields from PDF:', extractedFields);
      
      // Merge with predefined fields (admin-configured fields)
      const mergedFields = [...extractedFields];
      if (predefinedFields.length > 0) {
        console.log('Loading predefined fields:', predefinedFields);
        // Add predefined fields that don't conflict with extracted fields
        predefinedFields.forEach(predefinedField => {
          const exists = extractedFields.some(f => f.name === predefinedField.name);
          if (!exists) {
            mergedFields.push(predefinedField);
          }
        });
        console.log('Total fields after merge:', mergedFields.length);
      }
      
      setFields(mergedFields);
      
      // Initialize form values
      const initialValues: Record<string, string | boolean> = {};
      mergedFields.forEach((field: FormFieldData) => {
        initialValues[field.name] = field.value || '';
      });
      setFormValues(initialValues);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert(`Failed to load PDF template: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
      setLoading(false);
    }
  };

  const handleSignatureClick = (fieldName: string) => {
    console.log('Opening signature modal for field:', fieldName);
    setPendingSignatureField(fieldName);
    setShowSignatureModal(true);
  };

  const handleSignatureSave = (signatureData: string) => {
    if (!pendingSignatureField) return;
    
    console.log('Saving signature for field:', pendingSignatureField);
    setFormValues(prev => ({
      ...prev,
      [pendingSignatureField]: signatureData
    }));
    
    setPendingSignatureField(null);
    setShowSignatureModal(false);
  };

  const toggleAddSignatureMode = () => {
    setAddSignatureMode(prev => !prev);
    // Turn off regular field mode when turning on signature mode
    if (!addSignatureMode) {
      setAddFieldMode(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFieldChange = (fieldName: string, value: string | boolean) => {
    console.log('handleFieldChange called:', fieldName, '=', value);
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Auto-expand width for custom text fields to fit text exactly
    if (typeof value === 'string' && fieldName.startsWith('custom_field_')) {
      const field = fields.find(f => f.name === fieldName);
      if (field && field.type === 'text') {
        if (value.length === 0) {
          // Reset to minimum size when empty
          setFields(prev => prev.map(f => 
            f.name === fieldName ? { ...f, width: 20 } : f
          ));
        } else {
          // Create temporary canvas to measure actual text width at 12px font
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            context.font = '12px sans-serif'; // Match the input font
            const metrics = context.measureText(value);
            const textWidth = metrics.width;
            
            // Add minimal padding (4px total = 2px each side)
            const minWidth = 20;
            const padding = 4;
            const newWidth = Math.max(minWidth, textWidth + padding);
            
            console.log(`Text "${value}" measured width: ${textWidth}px, field width: ${newWidth}px`);
            
            // Update width to fit text exactly
            setFields(prev => prev.map(f => 
              f.name === fieldName ? { ...f, width: newWidth } : f
            ));
          }
        }
      }
    }
  };

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Handle adding signature fields
    if (addSignatureMode) {
      const target = event.target as HTMLElement;
      
      const isPageCanvas = 
        target === event.currentTarget || 
        target.classList.contains('react-pdf__Page__canvas') ||
        target.classList.contains('react-pdf__Page__textContent') ||
        target.classList.contains('react-pdf__Page__annotations');
      
      if (!isPageCanvas) return;
      
      const pageElement = event.currentTarget;
      const rect = pageElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const relativeX = x / scale;
      const relativeY = y / scale;
      
      // Signature field dimensions - wider for signature
      const fieldWidth = 150;
      const fieldHeight = 50;
      
      const centeredX = relativeX - (fieldWidth / 2);
      const centeredY = relativeY - (fieldHeight / 2);
      
      // Create a new signature field
      const newFieldName = `custom_field_${fieldCounter + 1}`;
      const newField: FormFieldData = {
        name: newFieldName,
        type: 'signature',
        value: '',
        x: centeredX,
        y: centeredY,
        width: fieldWidth,
        height: fieldHeight,
        pageIndex: currentPage - 1,
        required: false
      };
      
      setFields(prev => {
        const updatedFields = [...prev, newField];
        console.log(`Added signature field: now contains ${updatedFields.length} fields`);
        return updatedFields;
      });
      
      setFormValues(prev => ({
        ...prev,
        [newFieldName]: ''
      }));
      
      setFieldCounter(prev => prev + 1);
      console.log('Added new signature field:', newField);
      
      // Turn off signature mode after adding
      setAddSignatureMode(false);
      return;
    }
    
    // Handle adding regular text fields
    if (!addFieldMode) return;
    
    // Only add field if clicking directly on the page container or canvas layer
    // Ignore clicks on fields, buttons, inputs, or any interactive elements
    const target = event.target as HTMLElement;
    
    // Check if the target is the page container itself or the react-pdf canvas/text layer
    const isPageCanvas = 
      target === event.currentTarget || 
      target.classList.contains('react-pdf__Page__canvas') ||
      target.classList.contains('react-pdf__Page__textContent') ||
      target.classList.contains('react-pdf__Page__annotations');
    
    if (!isPageCanvas) {
      // Click was on a field or other element, don't add new field
      return;
    }
    
    const pageElement = event.currentTarget;
    const rect = pageElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate position relative to PDF dimensions (accounting for scale)
    const relativeX = x / scale;
    const relativeY = y / scale;
    
    // Field dimensions - smaller initial size
    const fieldWidth = 20;
    const fieldHeight = 20;
    
    // Position field so cursor is at the CENTER (not top-left corner)
    const centeredX = relativeX - (fieldWidth / 2);
    const centeredY = relativeY - (fieldHeight / 2);
    
    // Create a new field
    const newFieldName = `custom_field_${fieldCounter + 1}`;
    const newField: FormFieldData = {
      name: newFieldName,
      type: 'text',
      value: '',
      x: centeredX,
      y: centeredY,
      width: fieldWidth,
      height: fieldHeight,
      pageIndex: currentPage - 1,
      required: false
    };
    
    setFields(prev => {
      const updatedFields = [...prev, newField];
      console.log(`Updated fields array: now contains ${updatedFields.length} fields`);
      return updatedFields;
    });
    
    setFormValues(prev => {
      const updatedValues = {
        ...prev,
        [newFieldName]: ''
      };
      console.log(`Updated formValues:`, updatedValues);
      return updatedValues;
    });
    
    setFieldCounter(prev => {
      const newCounter = prev + 1;
      console.log(`Field counter increased to: ${newCounter}`);
      return newCounter;
    });
    
    console.log('Added new field at cursor center:', newField);
  };

  const toggleAddFieldMode = () => {
    setAddFieldMode(prev => !prev);
    // Turn off signature mode when turning on regular field mode
    if (!addFieldMode) {
      setAddSignatureMode(false);
    }
  };

  const handleDeleteField = (fieldName: string) => {
    setFields(prev => prev.filter(f => f.name !== fieldName));
    setFormValues(prev => {
      const newValues = { ...prev };
      delete newValues[fieldName];
      return newValues;
    });
  };

  const handleFieldPositionChange = (fieldName: string, x: number, y: number) => {
    setFields(prev => prev.map(f => 
      f.name === fieldName ? { ...f, x, y } : f
    ));
  };

  const handleFieldSizeChange = (fieldName: string, width: number, height: number) => {
    setFields(prev => prev.map(f => 
      f.name === fieldName ? { ...f, width, height } : f
    ));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleSave = async () => {
    if (!pdfDoc) return;

    try {
      console.log('Saving PDF with form data:', formValues);
      console.log('All fields:', fields);
      
      // Check if we have custom fields (fields that need overlay)
      const customFields = fields.filter(f => f.name.startsWith('custom_field_'));
      const hasCustomFields = customFields.length > 0;
      
      let filledPdfBytes: Uint8Array;
      
      if (hasCustomFields) {
        // Use combined method for both embedded fields + custom overlay
        console.log('Using combined fill method with custom fields:', customFields);
        filledPdfBytes = await pdfFormService.fillPdfWithOverlay(pdfDoc, formValues, fields);
      } else {
        // Just fill embedded form fields
        console.log('Using standard form fill');
        filledPdfBytes = await pdfFormService.fillPdfForm(pdfDoc, formValues);
      }
      
      if (onSave) {
        await onSave(filledPdfBytes, formValues);
        // Parent will handle success message
      } else {
        // Default: download the filled PDF
        const blob = new Blob([filledPdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${templateName}_filled.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        alert('PDF downloaded successfully!');
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = async () => {
    if (!pdfDoc) return;

    try {
      // Create a fresh copy of the PDF document for download
      const pdfBytes = await pdfDoc.save();
      const freshPdfDoc = await PDFDocument.load(pdfBytes);
      
      console.log('=== DOWNLOAD START ===');
      console.log('Form Values:', JSON.stringify(formValues, null, 2));
      console.log('Total Fields:', fields.length);
      console.log('Fields Detail:', fields.map(f => ({ 
        name: f.name, 
        value: formValues[f.name],
        type: f.type,
        pageIndex: f.pageIndex,
        x: f.x,
        y: f.y
      })));
      
      // Check if we have custom fields (fields that need overlay)
      const customFields = fields.filter(f => f.name.startsWith('custom_field_'));
      const hasCustomFields = customFields.length > 0;
      
      console.log(`Custom fields for download: ${customFields.length} fields found`);
      console.log('Custom fields detail:', customFields.map(f => ({ 
        name: f.name, 
        valueFromFormValues: formValues[f.name],
        x: f.x, 
        y: f.y,
        pageIndex: f.pageIndex
      })));
      
      let filledPdfBytes: Uint8Array;
      
      if (hasCustomFields) {
        // Use combined method for both embedded fields + custom overlay
        console.log('Using fillPdfWithOverlay with custom fields');
        filledPdfBytes = await pdfFormService.fillPdfWithOverlay(freshPdfDoc, formValues, fields);
      } else {
        // Just fill embedded form fields
        console.log('Using standard fillPdfForm (no custom fields)');
        filledPdfBytes = await pdfFormService.fillPdfForm(freshPdfDoc, formValues);
      }
      
      const blob = new Blob([filledPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateName}_filled.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log('PDF download completed successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePreview = async () => {
    if (!pdfDoc) return;

    try {
      // Create a fresh copy of the PDF document for preview
      const pdfBytes = await pdfDoc.save();
      const freshPdfDoc = await PDFDocument.load(pdfBytes);

      console.log('=== PREVIEW START ===');
      console.log('Form Values:', JSON.stringify(formValues, null, 2));
      console.log('Total Fields:', fields.length);
      console.log('Fields Detail:', fields.map(f => ({ 
        name: f.name, 
        value: formValues[f.name],
        type: f.type,
        pageIndex: f.pageIndex,
        x: f.x,
        y: f.y
      })));
      
      // Check if we have custom fields (fields that need overlay)
      const customFields = fields.filter(f => f.name.startsWith('custom_field_'));
      const hasCustomFields = customFields.length > 0;
      
      console.log(`Custom fields for preview: ${customFields.length} fields found`);
      console.log('Custom fields detail:', customFields.map(f => ({ 
        name: f.name, 
        valueFromFormValues: formValues[f.name],
        x: f.x, 
        y: f.y,
        pageIndex: f.pageIndex 
      })));
      
      let filledPdfBytes: Uint8Array;
      
      if (hasCustomFields) {
        // Use combined method for both embedded fields + custom overlay
        console.log('Using fillPdfWithOverlay with custom fields');
        filledPdfBytes = await pdfFormService.fillPdfWithOverlay(freshPdfDoc, formValues, fields);
      } else {
        // Just fill embedded form fields
        console.log('Using standard fillPdfForm (no custom fields)');
        filledPdfBytes = await pdfFormService.fillPdfForm(freshPdfDoc, formValues);
      }
      
      setPreviewPdfBytes(filledPdfBytes);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get fields for current page
  const getCurrentPageFields = () => {
    return fields.filter(field => field.pageIndex === currentPage - 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{templateName}</h2>
              <p className="text-sm text-gray-500">Fill out the form fields below</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5 text-gray-700" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Rotate */}
            <button
              onClick={handleRotate}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-5 h-5 text-gray-700" />
            </button>

            {/* Highlight Fields Toggle (Adobe Acrobat style) */}
            <button
              onClick={() => setHighlightFields(prev => !prev)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                highlightFields 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={highlightFields ? "Hide field highlights" : "Highlight existing fields (like Acrobat)"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
              </svg>
              <span className="text-xs font-medium">Highlight</span>
            </button>

            {/* Alignment Guides Toggle */}
            <button
              onClick={() => setShowGuides(prev => !prev)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showGuides 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={showGuides ? "Hide alignment guides" : "Show alignment guides"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16M4 12h16M4 20h16M12 4v16" />
              </svg>
              <span className="text-xs font-medium">Guides</span>
            </button>

            {/* Add Field Mode Toggle */}
            <button
              onClick={toggleAddFieldMode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                addFieldMode 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={addFieldMode ? "Click on PDF to add fields" : "Enable field adding"}
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {addFieldMode ? 'Click to Add Field' : 'Add Fields'}
              </span>
            </button>

            {/* Add Signature Mode Toggle */}
            <button
              onClick={toggleAddSignatureMode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                addSignatureMode 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={addSignatureMode ? "Click on PDF to add signature field" : "Enable signature adding"}
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {addSignatureMode ? 'Click to Add Signature' : 'Add Signature'}
              </span>
            </button>

            {/* Page Navigation */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                disabled={currentPage === numPages}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>

            {/* Action Buttons */}
            {adminMode ? (
              <>
                <button
                  onClick={() => {
                    if (onFieldsChange) {
                      onFieldsChange(fields);
                      alert(`Configuration updated: ${fields.length} field(s) ready to save`);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Configuration</span>
                </button>
                
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handlePreview}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Submit</span>
                </button>

                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer with Form Overlays */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-800 p-8"
      >
        {/* Add Field Mode Banner */}
        {addFieldMode && (
          <div className="max-w-5xl mx-auto mb-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Edit3 className="w-5 h-5" />
                <span className="font-medium">Add Field Mode Active</span>
                <span className="text-indigo-200">Click to place field center at cursor position ⊕</span>
              </div>
              <button
                onClick={toggleAddFieldMode}
                className="px-4 py-1 bg-white text-indigo-600 rounded hover:bg-indigo-50 transition-colors text-sm font-medium"
              >
                Exit Add Mode
              </button>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <div className="relative bg-white shadow-2xl" style={{ transform: `rotate(${rotation}deg)` }}>
            {pdfFile && (
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('PDF load error:', error);
                  alert('Failed to load PDF file. Please check if the file exists and is a valid PDF.');
                }}
                loading={
                  <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center p-20 text-center">
                    <div className="text-red-600">
                      <p className="text-lg font-semibold mb-2">Failed to load PDF file.</p>
                      <p className="text-sm">Please check if the template exists and is a valid PDF.</p>
                    </div>
                  </div>
                }
              >
                <div 
                  ref={(el) => { pageRefs.current[currentPage] = el; }} 
                  className={`relative ${addFieldMode ? 'cursor-crosshair' : ''}`}
                  onClick={handlePageClick}
                  style={{ 
                    cursor: addFieldMode ? 'crosshair' : 'default',
                    position: 'relative'
                  }}
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                  
                  {/* Alignment Guides Overlay */}
                  {showGuides && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: `${20 * scale}px ${20 * scale}px`
                      }}
                    >
                      {/* Ruler markers every 50px */}
                      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                        {/* Vertical ruler lines every 50px */}
                        {Array.from({ length: 20 }, (_, i) => i * 50 * scale).map((x, i) => (
                          <g key={`v-${i}`}>
                            <line
                              x1={x}
                              y1={0}
                              x2={x}
                              y2="100%"
                              stroke="rgba(59, 130, 246, 0.3)"
                              strokeWidth="1"
                            />
                          </g>
                        ))}
                        {/* Horizontal ruler lines every 50px */}
                        {Array.from({ length: 20 }, (_, i) => i * 50 * scale).map((y, i) => (
                          <g key={`h-${i}`}>
                            <line
                              x1={0}
                              y1={y}
                              x2="100%"
                              y2={y}
                              stroke="rgba(59, 130, 246, 0.3)"
                              strokeWidth="1"
                            />
                          </g>
                        ))}
                      </svg>
                    </div>
                  )}
                  
                  {/* Form Field Overlays */}
                  {getCurrentPageFields().map((field) => {
                    const isCustomField = field.name.startsWith('custom_field_');
                    const isSignatureField = field.type === 'signature';
                    
                    return (
                      <PDFFormField
                        key={field.name}
                        field={field}
                        value={formValues[field.name]}
                        onChange={(value: string | boolean) => handleFieldChange(field.name, value)}
                        scale={scale}
                        canDelete={isCustomField}
                        onDelete={() => handleDeleteField(field.name)}
                        isDraggable={isCustomField}
                        isResizable={isCustomField}
                        isTransparent={isCustomField && !highlightFields}
                        onPositionChange={(x: number, y: number) => handleFieldPositionChange(field.name, x, y)}
                        onSizeChange={(width: number, height: number) => handleFieldSizeChange(field.name, width, height)}
                        onSignatureClick={isSignatureField ? () => handleSignatureClick(field.name) : undefined}
                      />
                    );
                  })}
                </div>
              </Document>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields Summary Panel (Optional) */}
      {fields.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-indigo-600">{fields.length}</span> form fields detected.
              Click on any field in the PDF above to fill it out.
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewPdfBytes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Preview Filled PDF</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close Preview"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body - PDF Viewer */}
            <div className="flex-1 overflow-auto bg-gray-800 p-8">
              <div className="max-w-5xl mx-auto">
                <div className="relative bg-white shadow-2xl">
                  <Document
                    file={{ data: previewPdfBytes }}
                    loading={
                      <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      </div>
                    }
                  >
                    {Array.from(new Array(numPages), (_el, index) => (
                      <div key={`preview-page-${index + 1}`} className="mb-4">
                        <Page
                          pageNumber={index + 1}
                          scale={1.2}
                          renderTextLayer={false}
                          renderAnnotationLayer={true}
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleDownload();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setPendingSignatureField(null);
        }}
        onSave={handleSignatureSave}
        title="Add Your Signature"
      />
    </div>
  );
}
