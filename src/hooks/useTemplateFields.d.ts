import type { FormFieldData } from '@/services/pdfFormService';
/**
 * Hook to load predefined fields for a template
 * Handles async loading from database with localStorage fallback
 */
export declare function useTemplateFields(templateId: string | null): {
    fields: FormFieldData[];
    loading: boolean;
    error: Error | null;
};
/**
 * Synchronous version that uses only localStorage
 * Use this for immediate access without async
 */
export declare function useTemplateFieldsSync(templateId: string | null): FormFieldData[];
