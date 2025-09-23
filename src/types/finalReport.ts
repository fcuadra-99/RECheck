// Final Report domain types
export interface FinalReport {
  id: string;
  submission_id: string; // link to original submission/proposal
  title: string;
  researcher_id: string;
  researcher_name?: string;
  reviewer_id?: string | null;
  status: FinalReportStatus;
  outcome?: string | null; // textual outcome / decision summary
  submitted_at: string; // ISO timestamp
  last_updated_at: string; // ISO timestamp
  attachments: string[]; // storage object paths
  remarks?: string | null; // internal chairperson remarks
}

export type FinalReportStatus =
  | 'Pending Review'
  | 'Under Review'
  | 'Requires Revision'
  | 'Approved'
  | 'Rejected';

export interface FinalReportWithMeta extends FinalReport {
  submission_code?: string;
  protocol_code?: string;
}

export interface FinalReportFilter {
  status?: FinalReportStatus | 'All';
  search?: string; // matches title / researcher
}

export interface UpdateFinalReportPayload {
  id: string;
  status?: FinalReportStatus;
  outcome?: string | null;
  remarks?: string | null;
}
