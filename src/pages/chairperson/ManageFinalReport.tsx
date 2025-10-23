import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listFinalReports } from '../../services/finalReportService';
import type { FinalReport, FinalReportStatus } from '../../types/finalReport';

interface LocalFinalReport extends FinalReport {}

const statusBadge: Record<FinalReportStatus, string> = {
  'Pending Review': 'bg-gray-100 text-gray-700',
  'Under Review': 'bg-blue-100 text-blue-700',
  'Requires Revision': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
};

const ManageFinalReports: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<LocalFinalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | FinalReportStatus>('All');

  async function load() {
    setLoading(true);
    const { data } = await listFinalReports({ status: statusFilter, search });
    setItems((data as any) || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);

  const filtered = items.filter(i => {
    const term = search.toLowerCase();
    const matches = !term || i.title.toLowerCase().includes(term) || (i.researcher_name || '').toLowerCase().includes(term);
    const statusOk = statusFilter === 'All' || i.status === statusFilter;
    return matches && statusOk;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Manage Final Report Submission</h1>
      <p className="text-gray-500 mb-6">Monitor and adjudicate final study reports submitted after project completion.</p>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 flex-1">
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=> e.key==='Enter' && load()} placeholder="Search by title or researcher" className="flex-1 bg-transparent outline-none" />
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} className="border rounded-lg px-3 py-2">
          <option value="All">All Status</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Under Review">Under Review</option>
          <option value="Requires Revision">Requires Revision</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Researcher</th>
              <th className="px-4 py-3 text-left font-medium">Submitted</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Outcome</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-6 text-gray-400">Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-gray-400">No final reports found.</td></tr>}
            {filtered.map(fr => (
              <tr key={fr.id} className="even:bg-gray-50 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => navigate(`/chairperson/final-reports/${fr.id}`)}>
                <td className="px-4 py-3 font-medium text-blue-700">{fr.title}</td>
                <td className="px-4 py-3">{fr.researcher_name || fr.researcher_id}</td>
                <td className="px-4 py-3">{new Date(fr.submitted_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[fr.status]}`}>{fr.status}</span></td>
                <td className="px-4 py-3">{fr.outcome || '-'}</td>
                <td className="px-4 py-3">
                  <button 
                    className="text-blue-600 font-medium hover:underline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chairperson/final-reports/${fr.id}`);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageFinalReports;
