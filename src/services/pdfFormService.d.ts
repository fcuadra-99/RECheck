import { PDFDocument } from 'pdf-lib';
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
declare class PDFFormService {
    /**
     * Extract form fields from a PDF document
     */
    extractFormFields(pdfDoc: PDFDocument): Promise<FormFieldData[]>;
    /**
     * Extract data from a PDF field
     */
    private extractFieldData;
    /**
     * Detect fields from PDF annotations when no form fields exist
     */
    private detectFieldsFromAnnotations;
    /**
     * Fill PDF form with provided data
     */
    fillPdfForm(pdfDoc: PDFDocument, formData: Record<string, any>): Promise<Uint8Array>;
    /**
     * Create a new PDF with overlay fields for non-form PDFs
     */
    createOverlayFields(pdfDoc: PDFDocument, formData: Record<string, any>, fieldDefinitions: FormFieldData[]): Promise<Uint8Array>;
    /**
     * Manually define field areas for a PDF template
     * This would be used for PDFs without existing form fields
     */
    defineCustomFields(templateName: string): FormFieldData[];
    /**
     * Fill PDF with both embedded form fields AND custom overlay fields
     */
    fillPdfWithOverlay(pdfDoc: PDFDocument, formData: Record<string, any>, allFields: FormFieldData[]): Promise<Uint8Array>;
}
export declare const pdfFormService: PDFFormService;
export {};
