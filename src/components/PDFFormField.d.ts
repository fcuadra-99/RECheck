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
interface PDFFormFieldProps {
    field: FormFieldData;
    value: any;
    onChange: (value: any) => void;
    scale: number;
    onDelete?: () => void;
    canDelete?: boolean;
    onPositionChange?: (x: number, y: number) => void;
    onSizeChange?: (width: number, height: number) => void;
    isDraggable?: boolean;
    isResizable?: boolean;
    isTransparent?: boolean;
    onSignatureClick?: () => void;
}
export default function PDFFormField({ field, value, onChange, scale, onDelete, canDelete, onPositionChange, onSizeChange, isDraggable, isResizable, isTransparent, onSignatureClick }: PDFFormFieldProps): import("react/jsx-runtime").JSX.Element;
export {};
