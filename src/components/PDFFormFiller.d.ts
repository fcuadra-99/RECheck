import type { FormFieldData } from '../services/pdfFormService';
interface PDFFormFillerProps {
    templateUrl: string;
    templateName: string;
    onSave?: (pdfBytes: Uint8Array, formData: Record<string, any>) => void | Promise<void>;
    onCancel?: () => void;
    predefinedFields?: FormFieldData[];
    adminMode?: boolean;
    onFieldsChange?: (fields: FormFieldData[]) => void;
}
export default function PDFFormFiller({ templateUrl, templateName, onSave, onCancel, predefinedFields, adminMode, onFieldsChange }: PDFFormFillerProps): import("react/jsx-runtime").JSX.Element;
export {};
