import { supabase } from '../lib/supabase';

export async function getResearcherDeviationReports(researcherId: string) {
  const { data, error } = await supabase
    .from('deviation_reports')
    .select('*')
    .eq('reported_by', researcherId)
    .order('report_submission_date', { ascending: false });
  return { data, error };
}
