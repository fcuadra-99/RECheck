export interface FinalReport {
    id: string;
    proposal_date: string;
    title: string;
    researcher_id: string;
    researcher_name?: string;
    reviewer_id?: string | null;
    status: FinalReportStatus;
    outcome?: string | null;
    submitted_at: string;
    last_updated_at: string;
    attachments: string[];
    remarks?: string | null;
    metadata?: {
        chairSignature?: string;
        assignedStaffIds?: string[];
        assignedById?: string;
        assignedByName?: string;
        assignedAt?: string;
        sharedFormPath?: string;
        staffSharedFormData?: Record<string, any>;
        staffSubmissions?: Record<string, {
            staffId: string;
            staffName: string;
            role?: string;
            filePath: string;
            fileName: string;
            comments?: string;
            submittedAt: string;
        }>;
        [key: string]: any;
    };
}
export type FinalReportStatus = 'Pending Review' | 'Under Review' | 'Requires Revision' | 'Approved' | 'Rejected';
export interface FinalReportWithMeta extends FinalReport {
    submission_code?: string;
    protocol_code?: string;
}
export interface FinalReportFilter {
    status?: FinalReportStatus | 'All';
    search?: string;
}
export interface UpdateFinalReportPayload {
    id: string;
    status?: FinalReportStatus;
    outcome?: string | null;
    remarks?: string | null;
    metadata?: Record<string, any>;
}
