import { supabase } from '../DB';
import type { FinalReportFilter, UpdateFinalReportPayload } from '../types/finalReport';

const TABLE = 'final_reports';

export async function listFinalReports(filter: FinalReportFilter = {}) {
  let query = supabase.from(TABLE).select('*').order('submitted_at', { ascending: false });
  if (filter.status && filter.status !== 'All') {
    query = query.eq('status', filter.status);
  }
  if (filter.search && filter.search.trim()) {
    // Basic ILIKE on title or stored researcher name (assuming a materialized column researcher_name)
    const term = `%${filter.search.trim()}%`;
    query = query.or(`title.ilike.${term},researcher_name.ilike.${term}`);
  }
  const { data, error } = await query;
  return { data, error };
}

export async function getFinalReport(id: string) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  return { data, error };
}

export async function updateFinalReport(payload: UpdateFinalReportPayload) {
  const { id, ...rest } = payload;
  const { data, error } = await supabase.from(TABLE).update({ ...rest, last_updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return { data, error };
}

export async function createFinalReportDraft(input: { proposal_date: string; title: string; attachments?: string[] }) {
  const { data: auth } = await supabase.auth.getUser();
  const researcherId = auth?.user?.id;
  const insertPayload: any = {
    proposal_date: input.proposal_date,
    title: input.title,
    attachments: input.attachments || [],
    researcher_id: researcherId,
    status: 'Pending Review',
    submitted_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE).insert([insertPayload]).select().single();
  return { data, error };
}
