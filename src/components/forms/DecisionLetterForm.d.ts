interface DecisionLetterFormProps {
    savedData?: Record<string, any>;
    onSave?: (patch: Record<string, any>) => void;
    isReadOnly?: boolean;
}
export default function DecisionLetterForm({ savedData, onSave, isReadOnly }: DecisionLetterFormProps): import("react/jsx-runtime").JSX.Element;
export {};
