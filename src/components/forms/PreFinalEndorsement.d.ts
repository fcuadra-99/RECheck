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
    };
    isReadOnly?: boolean;
}
declare const PreFinalEndorsement: React.FC<EndorsementProps>;
export default PreFinalEndorsement;
