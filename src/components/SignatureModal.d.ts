interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signatureData: string) => void;
    title?: string;
}
export default function SignatureModal({ isOpen, onClose, onSave, title }: SignatureModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
