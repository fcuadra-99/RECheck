export declare const PLACEHOLDER_OFFSET: {
    x: number;
    y: number;
};
interface PdfFormViewerProps {
    document: string;
    onAnswersSubmit: (answers: Record<string, string>) => void;
    proposalId: number;
    status: string;
}
export declare function PdfFormViewer({ document, onAnswersSubmit, proposalId, status, }: PdfFormViewerProps): import("react/jsx-runtime").JSX.Element;
export {};
