interface PDFFormFillerProps {
    templateUrl: string;
    templateName: string;
    onSave?: (pdfBytes: Uint8Array, formData: Record<string, any>) => void | Promise<void>;
    onCancel?: () => void;
}
export default function PDFFormFiller({ templateUrl, templateName, onSave, onCancel }: PDFFormFillerProps): import("react/jsx-runtime").JSX.Element;
export {};
