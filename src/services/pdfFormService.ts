import { PDFDocument, PDFField, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, rgb } from 'pdf-lib';

export interface FormFieldData {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'signature';
  value: any;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  options?: string[];
  required?: boolean;
  readonly?: boolean;
}

class PDFFormService {
  /**
   * Extract form fields from a PDF document
   */
  async extractFormFields(pdfDoc: PDFDocument): Promise<FormFieldData[]> {
    const form = pdfDoc.getForm();
    const fields: FormFieldData[] = [];
    
    try {
      const formFields = form.getFields();
      
      for (const field of formFields) {
        const fieldData = this.extractFieldData(field, pdfDoc);
        if (fieldData) {
          fields.push(fieldData);
        }
      }
    } catch (error) {
      console.error('Error extracting form fields:', error);
      // If PDF has no form fields, we'll need to detect text areas manually
      // For now, return empty array
    }

    // If no fields found in form, try to detect fields from annotations
    if (fields.length === 0) {
      const detectedFields = await this.detectFieldsFromAnnotations(pdfDoc);
      fields.push(...detectedFields);
    }

    return fields;
  }

  /**
   * Extract data from a PDF field
   */
  private extractFieldData(field: PDFField, pdfDoc: PDFDocument): FormFieldData | null {
    try {
      const name = field.getName();
      const pages = pdfDoc.getPages();
      
      // Get field position (this is simplified, real implementation would need page-specific calculations)
      let x = 0;
      let y = 0;
      let width = 150;
      let height = 30;
      let pageIndex = 0;

      // Try to get widget annotations to determine position
      try {
        const widgets = (field as any).acroField.getWidgets();
        if (widgets && widgets.length > 0) {
          const widget = widgets[0];
          const rect = widget.getRectangle();
          if (rect) {
            x = rect.x || 0;
            y = rect.y || 0;
            width = rect.width || 150;
            height = rect.height || 30;
          }

          // Find which page this widget is on
          const widgetRef = widget.ref;
          for (let i = 0; i < pages.length; i++) {
            const pageAnnots = pages[i].node.Annots();
            if (pageAnnots && pageAnnots.asArray) {
              const annots = pageAnnots.asArray();
              if (annots.find((a: any) => a === widgetRef)) {
                pageIndex = i;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not get widget position for field:', name);
      }

      let fieldType: FormFieldData['type'] = 'text';
      let value: any = '';
      let options: string[] | undefined;

      // Determine field type and get value
      if (field instanceof PDFTextField) {
        fieldType = field.isMultiline() ? 'textarea' : 'text';
        try {
          value = field.getText() || '';
        } catch (e) {
          value = '';
        }
      } else if (field instanceof PDFCheckBox) {
        fieldType = 'checkbox';
        try {
          value = field.isChecked();
        } catch (e) {
          value = false;
        }
      } else if (field instanceof PDFDropdown) {
        fieldType = 'select';
        try {
          options = field.getOptions();
          value = field.getSelected() || [];
        } catch (e) {
          value = '';
        }
      } else if (field instanceof PDFRadioGroup) {
        fieldType = 'radio';
        try {
          options = field.getOptions();
          value = field.getSelected() || '';
        } catch (e) {
          value = '';
        }
      }

      return {
        name,
        type: fieldType,
        value,
        x,
        y,
        width,
        height,
        pageIndex,
        options,
        required: false,
        readonly: field.isReadOnly()
      };
    } catch (error) {
      console.error('Error extracting field data:', error);
      return null;
    }
  }

  /**
   * Detect fields from PDF annotations when no form fields exist
   */
  private async detectFieldsFromAnnotations(_pdfDoc: PDFDocument): Promise<FormFieldData[]> {
    const fields: FormFieldData[] = [];
    
    // For PDFs without form fields, we can create clickable areas manually
    // This is a simplified version - you might want to use OCR or manual configuration
    // In a real implementation, you'd want to detect these from the PDF content
    // or allow users to manually define field areas
    
    return fields;
  }

  /**
   * Fill PDF form with provided data
   */
  async fillPdfForm(pdfDoc: PDFDocument, formData: Record<string, any>): Promise<Uint8Array> {
    const form = pdfDoc.getForm();

    try {
      for (const [fieldName, value] of Object.entries(formData)) {
        try {
          const field = form.getField(fieldName);

          if (field instanceof PDFTextField) {
            field.setText(String(value || ''));
          } else if (field instanceof PDFCheckBox) {
            if (value) {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field instanceof PDFDropdown) {
            if (value) {
              field.select(String(value));
            }
          } else if (field instanceof PDFRadioGroup) {
            if (value) {
              field.select(String(value));
            }
          }
        } catch (fieldError) {
          console.warn(`Could not fill field ${fieldName}:`, fieldError);
        }
      }

      // Flatten the form to make it non-editable (optional)
      // form.flatten();

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error filling PDF form:', error);
      throw new Error('Failed to fill PDF form');
    }
  }

  /**
   * Create a new PDF with overlay fields for non-form PDFs
   */
  async createOverlayFields(
    pdfDoc: PDFDocument,
    formData: Record<string, any>,
    fieldDefinitions: FormFieldData[]
  ): Promise<Uint8Array> {
    try {
      const pages = pdfDoc.getPages();

      for (const fieldDef of fieldDefinitions) {
        const page = pages[fieldDef.pageIndex];
        if (!page) continue;

        const value = formData[fieldDef.name];
        if (!value) continue;

        const { height: pageHeight } = page.getSize();

        // Convert coordinates (PDF coordinates start at bottom-left)
        const y = pageHeight - fieldDef.y - fieldDef.height;

        // Draw the value on the PDF
        if (fieldDef.type === 'text' || fieldDef.type === 'textarea') {
          page.drawText(String(value), {
            x: fieldDef.x,
            y: y,
            size: 10,
            maxWidth: fieldDef.width
          });
        } else if (fieldDef.type === 'checkbox' && value === true) {
          // Draw a checkmark
          page.drawText('✓', {
            x: fieldDef.x,
            y: y,
            size: 14
          });
        }
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error creating overlay fields:', error);
      throw new Error('Failed to create overlay fields');
    }
  }

  /**
   * Manually define field areas for a PDF template
   * This would be used for PDFs without existing form fields
   */
  defineCustomFields(templateName: string): FormFieldData[] {
    // You can define custom field mappings for specific templates
    const fieldMappings: Record<string, FormFieldData[]> = {
      'Protocol Final Report': [
        {
          name: 'title_of_study',
          type: 'text',
          value: '',
          x: 150,
          y: 195,
          width: 840,
          height: 25,
          pageIndex: 0,
          required: true
        },
        {
          name: 'protocol_code',
          type: 'text',
          value: '',
          x: 150,
          y: 230,
          width: 470,
          height: 25,
          pageIndex: 0,
          required: true
        },
        {
          name: 'place_of_study',
          type: 'text',
          value: '',
          x: 645,
          y: 250,
          width: 345,
          height: 25,
          pageIndex: 0
        },
        {
          name: 'researcher_name',
          type: 'text',
          value: '',
          x: 150,
          y: 275,
          width: 470,
          height: 25,
          pageIndex: 0,
          required: true
        },
        {
          name: 'tel_no',
          type: 'text',
          value: '',
          x: 760,
          y: 283,
          width: 230,
          height: 20,
          pageIndex: 0
        },
        {
          name: 'mobile_no',
          type: 'text',
          value: '',
          x: 760,
          y: 295,
          width: 230,
          height: 20,
          pageIndex: 0
        },
        {
          name: 'email',
          type: 'text',
          value: '',
          x: 760,
          y: 320,
          width: 230,
          height: 20,
          pageIndex: 0
        },
        {
          name: 'summary_of_findings',
          type: 'textarea',
          value: '',
          x: 30,
          y: 495,
          width: 1010,
          height: 100,
          pageIndex: 0,
          required: true
        },
        {
          name: 'conclusions',
          type: 'textarea',
          value: '',
          x: 30,
          y: 550,
          width: 1010,
          height: 80,
          pageIndex: 0,
          required: true
        }
      ]
    };

    return fieldMappings[templateName] || [];
  }

  /**
   * Fill PDF with both embedded form fields AND custom overlay fields
   */
  async fillPdfWithOverlay(
    pdfDoc: PDFDocument,
    formData: Record<string, any>,
    allFields: FormFieldData[]
  ): Promise<Uint8Array> {
    try {
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();

      // First, fill embedded form fields
      for (const [fieldName, value] of Object.entries(formData)) {
        // Skip custom fields for now
        if (fieldName.startsWith('custom_field_')) continue;

        try {
          const field = form.getField(fieldName);

          if (field instanceof PDFTextField) {
            field.setText(String(value || ''));
          } else if (field instanceof PDFCheckBox) {
            if (value) {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field instanceof PDFDropdown) {
            if (value) {
              field.select(String(value));
            }
          } else if (field instanceof PDFRadioGroup) {
            if (value) {
              field.select(String(value));
            }
          }
        } catch (fieldError) {
          // Field doesn't exist in form, will be handled by overlay
          console.log(`Field ${fieldName} not in form, will use overlay`);
        }
      }

      // Then, draw custom overlay fields
      const customFields = allFields.filter(f => f.name.startsWith('custom_field_'));
      
      console.log('=== CUSTOM FIELDS TO DRAW ===');
      console.log(`Total custom fields count: ${customFields.length}`);
      customFields.forEach(f => {
        console.log(`Field: ${f.name}`);
        console.log(`  - field.value property: ${f.value}`);
        console.log(`  - formData[${f.name}]: ${formData[f.name]}`);
        console.log(`  - position: x:${f.x}, y:${f.y}, page:${f.pageIndex}`);
      });
      
      for (const fieldDef of customFields) {
        const page = pages[fieldDef.pageIndex];
        if (!page) {
          console.warn(`Page ${fieldDef.pageIndex} not found for field ${fieldDef.name}`);
          continue;
        }

        const value = formData[fieldDef.name];
        console.log(`About to draw field ${fieldDef.name}, value from formData: "${value}"`);
        
        // For debugging, verify the field is in formData
        if (!(fieldDef.name in formData)) {
          console.warn(`Field ${fieldDef.name} not found in formData! This may cause rendering issues.`);
        }
        
        // Skip empty values (null, undefined, empty string)
        if (!value && value !== 0) {
          console.log(`Skipping field ${fieldDef.name} because value is empty`);
          continue;
        }

        const { height: pageHeight } = page.getSize();

        // Convert coordinates (PDF coordinates start at bottom-left)
        const y = pageHeight - fieldDef.y - fieldDef.height;

        // Draw the value on the PDF with Adobe Acrobat-like precision
        if (fieldDef.type === 'text' || fieldDef.type === 'textarea') {
          const text = String(value);
          console.log(`Drawing text "${text}" at x:${fieldDef.x}, y:${y} on page ${fieldDef.pageIndex}`);
          
          // Calculate vertical center alignment (like Acrobat)
          const fontSize = 12;
          const verticalOffset = (fieldDef.height - fontSize) / 2;
          
          try {
            page.drawText(text, {
              x: fieldDef.x + 2, // Small left padding like Acrobat
              y: y + verticalOffset, // Vertically centered
              size: fontSize,
              color: rgb(0, 0, 0),
              maxWidth: fieldDef.width - 4, // Leave padding on both sides
              lineHeight: fontSize * 1.2
            });
            console.log(`Successfully drew text "${text}" on page ${fieldDef.pageIndex}`);
          } catch (error) {
            console.error(`Failed to draw text for field ${fieldDef.name}:`, error);
          }
        } else if (fieldDef.type === 'signature' && typeof value === 'string' && value.startsWith('data:image')) {
          // Draw signature image
          console.log(`Drawing signature image at x:${fieldDef.x}, y:${y} on page ${fieldDef.pageIndex}`);
          
          try {
            // Extract base64 data from data URL
            const base64Data = value.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Embed the signature image
            let image;
            if (value.includes('image/png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else if (value.includes('image/jpg') || value.includes('image/jpeg')) {
              image = await pdfDoc.embedJpg(imageBytes);
            } else {
              // Default to PNG
              image = await pdfDoc.embedPng(imageBytes);
            }
            
            // Calculate dimensions to fit within the field while maintaining aspect ratio
            const imgDims = image.scale(1);
            const scaleX = fieldDef.width / imgDims.width;
            const scaleY = fieldDef.height / imgDims.height;
            const imageScale = Math.min(scaleX, scaleY);
            
            const scaledWidth = imgDims.width * imageScale;
            const scaledHeight = imgDims.height * imageScale;
            
            // Center the image within the field
            const xOffset = (fieldDef.width - scaledWidth) / 2;
            const yOffset = (fieldDef.height - scaledHeight) / 2;
            
            page.drawImage(image, {
              x: fieldDef.x + xOffset,
              y: y + yOffset,
              width: scaledWidth,
              height: scaledHeight,
            });
            
            console.log(`Successfully drew signature image on page ${fieldDef.pageIndex}`);
          } catch (error) {
            console.error(`Failed to draw signature image for field ${fieldDef.name}:`, error);
          }
        } else if (fieldDef.type === 'checkbox' && value === true) {
          // Draw a checkmark centered in the box
          const checkSize = Math.min(fieldDef.width, fieldDef.height) * 0.7;
          const xOffset = (fieldDef.width - checkSize) / 2;
          const yOffset = (fieldDef.height - checkSize) / 2;
          
          page.drawText('✓', {
            x: fieldDef.x + xOffset,
            y: y + yOffset,
            size: checkSize,
            color: rgb(0, 0, 0)
          });
        }
      }

      console.log(`Filled ${customFields.length} custom overlay fields`);
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error filling PDF with overlay:', error);
      throw new Error(`Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const pdfFormService = new PDFFormService();
