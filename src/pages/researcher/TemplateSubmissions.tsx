import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileText, Calendar, Eye } from 'lucide-react';

interface TemplateSubmission {
  id: string;
  template_type: string;
  file_name: string;
  submitted_at: string;
  status: string;
}

export default function TemplateSubmissions() {
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setSubmissions([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('template_submissions')
        .select('id, template_name, file_name, submission_date, status')
        .eq('researcher_id', user.user.id)
        .order('submission_date', { ascending: false });
      if (error) {
        setSubmissions([]);
      } else {
        setSubmissions((data || []).map((row: any) => ({
          id: row.id,
          template_type: row.template_name,
          file_name: row.file_name,
          submitted_at: row.submission_date,
          status: row.status
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Submitted Forms</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No template submissions found.</div>
      ) : (
        <table className="min-w-full text-sm border rounded-xl bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Template Type</th>
              <th className="px-4 py-3 text-left font-medium">File Name</th>
              <th className="px-4 py-3 text-left font-medium">Submitted At</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => (
              <tr key={sub.id} className="even:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-700">{sub.template_type}</td>
                <td className="px-4 py-3">{sub.file_name}</td>
                <td className="px-4 py-3">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 border border-blue-400 text-blue-700">{sub.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="inline-flex items-center px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 text-xs font-semibold"
                    onClick={() => navigate(`/researcher/template-submissions/${sub.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
