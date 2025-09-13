// Quick database test to debug the signature issue
// Add this temporarily to your DeviationReportForm to debug

import { supabase } from '../lib/supabase';

export async function testDatabaseConnection(reportId: string) {
  console.log('🔍 Testing database connection for report:', reportId);
  
  try {
    // Test 1: Basic query to see if report exists
    const { data: basicData, error: basicError } = await supabase
      .from('deviation_reports')
      .select('id, reported_by_user')
      .eq('id', reportId)
      .single();
    
    console.log('Basic query result:', { basicData, basicError });
    
    // Test 2: Try to query signature columns
    const { data: sigData, error: sigError } = await supabase
      .from('deviation_reports')
      .select('researcher_signature, signature_status')
      .eq('id', reportId)
      .single();
    
    console.log('Signature columns query:', { sigData, sigError });
    
    // Test 3: Get table schema
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'deviation_reports')
      .order('ordinal_position');
    
    console.log('Table schema:', { columns, schemaError });
    
    return {
      reportExists: !!basicData,
      hasSignatureColumns: !sigError,
      columns: columns?.map(c => c.column_name) || []
    };
    
  } catch (error: any) {
    console.error('Database test failed:', error);
    return { error: error?.message || 'Unknown error' };
  }
}
