interface Member {
    name: string;
    signature: string;
}
interface SubmittedByTableProps {
    members: Member[];
    onChange: (members: Member[]) => void;
    title?: string;
    readOnly?: boolean;
    proposalId?: number;
    formName?: string;
}
export default function SubmittedByTable({ members, onChange, title, readOnly, proposalId, formName }: SubmittedByTableProps): import("react/jsx-runtime").JSX.Element;
export declare function useSubmittedByMembers(initial?: {
    name: string;
    signature: string;
}[]): [{
    name: string;
    signature: string;
}[], import("react").Dispatch<import("react").SetStateAction<{
    name: string;
    signature: string;
}[]>>];
export {};
