import React from 'react';
interface EndorsementProps {
    initialData?: {
        date?: string;
        name?: string;
        affiliation?: string;
        title?: string;
        protocolCode?: string;
        salutation?: string;
        receiptDate?: string;
        chairName?: string;
        chairTitle?: string;
        chairSignature?: string;
    };
    isReadOnly?: boolean;
    onSignatureChange?: (signature: string) => void;
    proposalId?: number;
}
declare const UndergradFinalEndorsement: React.FC<EndorsementProps>;
export default UndergradFinalEndorsement;
