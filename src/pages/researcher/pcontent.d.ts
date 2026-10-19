interface Submission {
    proposal_id: number;
    protocol_id?: string | null;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string | null;
    status: string;
    date: string;
}
interface DocumentItem {
    name: string;
    templateUrl: string;
    required: boolean;
    needsSignature?: boolean;
    needsAnswer?: boolean;
    signStatus?: 'pending' | 'completed';
    answerStatus?: 'pending' | 'completed';
    pdfFileId?: string;
}
interface PhaseContentProps {
    phaseIndex: number;
    submission: Submission;
    userId: string | null;
    historyFiles: DocumentItem[] | null;
    latestComment: string | null;
    uploadedFiles: {
        [key: string]: File | null;
    };
    answeredDocuments: {
        [key: string]: boolean;
    };
    signedDocuments: {
        [key: string]: boolean;
    };
    onUploadedFilesChange: (files: {
        [key: string]: File | null;
    }) => void;
    onAnsweredDocumentsChange: (docs: {
        [key: string]: boolean;
    }) => void;
    onSignedDocumentsChange: (docs: {
        [key: string]: boolean;
    }) => void;
    onSubmissionUpdate: (submission: Submission) => void;
    onOpenPreview: (open: boolean) => void;
    onSetPreviewUrl: (url: string) => void;
    onSetPreviewTitle: (title: string) => void;
    onSetSignatureDialogOpen: (open: boolean) => void;
    onSetAnswerDialogOpen: (open: boolean) => void;
    onSetActiveDocument: (doc: string) => void;
    onSetPreviewPrintRequested: (requested: boolean) => void;
}
export default function PhaseContent({ phaseIndex, submission, userId, historyFiles, latestComment, uploadedFiles, answeredDocuments, signedDocuments, onUploadedFilesChange, onAnsweredDocumentsChange, onSignedDocumentsChange, onSubmissionUpdate, onOpenPreview, onSetPreviewUrl, onSetPreviewTitle, onSetSignatureDialogOpen, onSetAnswerDialogOpen, onSetActiveDocument, onSetPreviewPrintRequested }: PhaseContentProps): import("react/jsx-runtime").JSX.Element;
export {};
