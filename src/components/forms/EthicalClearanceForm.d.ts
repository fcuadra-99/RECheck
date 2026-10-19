interface EthicalClearanceFormProps {
    proposalId?: number;
    protocolCode?: string | null;
    researcherName?: string;
    proposalTitle?: string;
    reviewType?: string | null;
    date?: string;
    savedData?: Record<string, any>;
    onSave?: (patch: Record<string, any>) => void;
    isReadOnly?: boolean;
}
export default function EthicalClearanceForm({ protocolCode, researcherName, proposalTitle, reviewType, date, savedData, onSave, isReadOnly, }: EthicalClearanceFormProps): import("react/jsx-runtime").JSX.Element;
export {};
