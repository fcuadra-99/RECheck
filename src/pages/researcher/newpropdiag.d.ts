interface Profile {
    id: string;
    fname: string | null;
    lname: string | null;
    category?: string | null;
}
interface NewProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profiles: Profile[];
    userId: string | null;
    onProposalCreated: (proposal: any) => void;
}
export default function NewProposalDialog({ open, onOpenChange, profiles, userId, onProposalCreated }: NewProposalDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
