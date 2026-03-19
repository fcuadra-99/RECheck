import type { FinalReportFilter, UpdateFinalReportPayload } from '../types/finalReport';
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
