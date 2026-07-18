/**
 * FormViewer — maps a document name to its React form component.
 * Handles local save/load per proposal+document, autofill, and read-only advisor fields.
 */
export interface ProposalOption {
    id: number;
    title: string;
    protocolCode?: string | null;
}
export interface FormProps {
    /** Proposal ID — used as localStorage key namespace */
    proposalId: number;
    /** Protocol code / control number to autofill */
    protocolCode?: string | null;
    /** Researcher's full name */
    researcherName?: string;
    /** Advisor's full name (read-only in form) */
    advisorName?: string;
    /** Proposal title */
    proposalTitle?: string;
    /** Proposal options for dropdown selection */
    proposalOptions?: ProposalOption[];
    /** Selected proposal ID for dropdowns */
    selectedProposalId?: number | null;
    /** Callback when a proposal is selected in a form */
    onSelectProposal?: (proposalId: number | null) => void;
    /** Type of review (e.g. "Full Board", "Expedited", "Exempt") */
    reviewType?: string | null;
    /** The document filename — used for storage path */
    formName?: string;
    /** Persisted form data loaded from localStorage */
    savedData?: Record<string, any>;
    /** Called whenever a field changes so we can persist */
    onSave?: (data: Record<string, any>) => void;
    /** Whether advisor-only fields should be locked */
    readOnlyAdvisor?: boolean;
    /** Advisor signing mode — all non-advisor fields are locked, only signature/name are editable */
    advisorMode?: boolean;
}
export type FormComponent = React.ComponentType<FormProps>;
export declare const DOC_COMPONENT_MAP: Record<string, FormComponent>;
interface FormViewerProps {
    documentName: string;
    proposalId: number;
    protocolCode?: string | null;
    researcherName?: string;
    advisorId?: string | null;
    proposalTitle?: string;
    reviewType?: string | null;
    readOnlyAdvisor?: boolean;
    /** Advisor signing mode — all non-advisor fields are locked, only signature/name are editable */
    advisorMode?: boolean;
    /** Fully read-only mode — no editing, no Done button */
    readOnly?: boolean;
    onDone: () => void;
}
export default function FormViewer({ documentName, proposalId, protocolCode, researcherName, advisorId, proposalTitle, reviewType, readOnlyAdvisor, advisorMode, readOnly, onDone, }: FormViewerProps): import("react/jsx-runtime").JSX.Element;
export {};
