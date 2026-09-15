export interface DeviationReportFormInput {
    protocolTitle: string;
    protocolCode: string;
    ethicalClearanceEffectivity: string;
    studySite: string;
    telephone: string;
    mobile: string;
    deviationDate: string;
    deviationDescription: string;
    rationale: string;
    impact: string;
    correctiveAction: string;
    supportingDocuments: string[];
    reportSubmissionDate: string;
    type: string;
    investigatorCorrectiveAction: string;
    severityAssessment: string;
}
export declare function submitDeviationReport(form: DeviationReportFormInput): Promise<{
    data: any[] | null;
    error: import("@supabase/postgrest-js").PostgrestError | null;
}>;
