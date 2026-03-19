interface DigitalSignaturePadProps {
    deviationReportId: string;
    userRole: 'researcher' | 'chairperson';
    onSignatureComplete?: (success: boolean) => void;
    onCancel?: () => void;
    disabled?: boolean;
}
export default function DigitalSignaturePad({ deviationReportId, userRole, onSignatureComplete, onCancel, disabled }: DigitalSignaturePadProps): import("react/jsx-runtime").JSX.Element;
export {};
