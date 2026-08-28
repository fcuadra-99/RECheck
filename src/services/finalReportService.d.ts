import type { FinalReportFilter, UpdateFinalReportPayload } from '../types/finalReport';
export interface AssignableStaffProfile {
    id: string;
    name: string;
    email: string;
    role?: string;
}
export interface FinalReportAssignment {
    id?: string;
    final_report_id: string;
    assignee_id: string;
    assignee_name: string;
    assignee_role?: string;
    assigned_by_id: string;
    assigned_by_name: string;
    assigned_at: string;
    status: 'assigned' | 'submitted';
    submitted_file_path?: string | null;
    submitted_file_name?: string | null;
    submitted_comments?: string | null;
    submitted_at?: string | null;
}
export declare function listFinalReports(filter?: FinalReportFilter): Promise<{
    data: any[] | null;
    error: import("@supabase/postgrest-js").PostgrestError | null;
}>;
export declare function getFinalReport(id: string): Promise<{
    data: any;
    error: import("@supabase/postgrest-js").PostgrestError | null;
}>;
export declare function updateFinalReport(payload: UpdateFinalReportPayload): Promise<{
    data: any;
    error: import("@supabase/postgrest-js").PostgrestError | null;
}>;
export declare function createFinalReportDraft(input: {
    proposal_date: string;
    title: string;
    attachments?: string[];
}): Promise<{
    data: any;
    error: import("@supabase/postgrest-js").PostgrestError | null;
}>;
export declare function getAssignableFinalReportStaff(): Promise<{
    success: true;
    staff: {
        id: string;
        name: string;
        email: string;
        role: string | undefined;
    }[];
    error?: undefined;
} | {
    success: false;
    error: any;
    staff?: undefined;
}>;
export declare function assignFinalReportToStaff(reportId: string, staffIds: string[]): Promise<{
    success: false;
    error: any;
} | {
    success: true;
    error?: undefined;
}>;
export declare function getAssignedFinalReportsForCurrentStaff(): Promise<{
    success: true;
    reports: any[];
    assignments: any[];
    error?: undefined;
} | {
    success: false;
    error: any;
    reports?: undefined;
    assignments?: undefined;
}>;
export declare function getFinalReportAssignments(reportId: string): Promise<{
    success: true;
    assignments: FinalReportAssignment[];
    error?: undefined;
} | {
    success: false;
    error: any;
    assignments?: undefined;
}>;
export declare function submitAssignedFinalReportUpdate(reportId: string, file: File, comments?: string, overwritePath?: string, mergedFormData?: Record<string, any>): Promise<{
    success: false;
    error: any;
    path?: undefined;
} | {
    success: true;
    path: string;
    error?: undefined;
}>;
