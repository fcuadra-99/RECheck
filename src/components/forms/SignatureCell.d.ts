interface SignatureCellProps {
    value: string;
    onChange: (val: string) => void;
    readOnly?: boolean;
    /** Storage context for organized uploads */
    proposalId?: number;
    formName?: string;
}
export default function SignatureCell({ value, onChange, readOnly, proposalId, formName }: SignatureCellProps): import("react/jsx-runtime").JSX.Element;
export {};
