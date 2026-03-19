interface Submission {
    proposal_id: number;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string | null;
    status: string;
    date: string;
}
interface Profile {
    id: string;
    fname: string | null;
    lname: string | null;
    category?: string | null;
}
interface SubmissionDetailsProps {
    activeSubmission: Submission | null;
    profiles: Profile[];
    userId: string | null;
    onSubmissionUpdate: (submission: Submission) => void;
}
export default function SubmissionDetails({ activeSubmission, profiles, userId, onSubmissionUpdate }: SubmissionDetailsProps): import("react/jsx-runtime").JSX.Element;
export {};
