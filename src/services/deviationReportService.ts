import { supabase } from '../lib/supabase';

export interface DeviationReportFormInput {
  protocolTitle: string;
  protocolCode: string;
  deviationDate: string;
  deviationDescription: string;
  rationale: string;
  impact: string;
  correctiveAction: string;
  supportingDocuments: string[];
  reportSubmissionDate: string;
  type: string;
}

export async function submitDeviationReport(form: DeviationReportFormInput) {
  // Get current authenticated user to bind ownership (RLS user_id variant)
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;
  const base = {
    protocol_title: form.protocolTitle,
    protocol_code: form.protocolCode,
    deviation_date: form.deviationDate,
    deviation_description: form.deviationDescription,
    rationale: form.rationale,
    impact: form.impact,
    corrective_action: form.correctiveAction,
    supporting_documents: form.supportingDocuments || [],
    report_submission_date: form.reportSubmissionDate,
    type: form.type,
  } as any;
  if (userId) base.reported_by_user = userId; // let trigger fill if absent

  // eslint-disable-next-line no-console
  console.log('[submitDeviationReport] Attempt insert', { userId, payload: base });

  const { data, error } = await supabase.from('deviation_reports').insert([base]).select();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[submitDeviationReport] RLS insert failed', { message: error.message, details: error.details, hint: error.hint, code: (error as any).code, userId, payload: base });
  }
  return { data, error };
}
