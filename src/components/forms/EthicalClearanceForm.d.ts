interface EthicalClearanceFormProps {
    savedData?: Record<string, any>;
    onSave?: (patch: Record<string, any>) => void;
    isReadOnly?: boolean;
}
export default function EthicalClearanceForm({ savedData, onSave, isReadOnly }: EthicalClearanceFormProps): import("react/jsx-runtime").JSX.Element;
export {};
