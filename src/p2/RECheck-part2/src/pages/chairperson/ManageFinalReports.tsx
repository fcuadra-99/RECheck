import React, { useEffect, useState } from 'react';
import { listFinalReports, updateFinalReport } from '../../services/finalReportService';
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
  const [items, setItems] = useState<LocalFinalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | FinalReportStatus>('All');
  const [selected, setSelected] = useState<LocalFinalReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<FinalReportStatus | undefined>(undefined);
  const [editOutcome, setEditOutcome] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await listFinalReports({ status: statusFilter, search });
    setItems((data as any) || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);

  function openDetails(fr: LocalFinalReport) {
    setSelected(fr);
    setEditStatus(fr.status);
    setEditOutcome(fr.outcome || '');
    setEditRemarks(fr.remarks || '');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    await updateFinalReport({ id: selected.id, status: editStatus, outcome: editOutcome, remarks: editRemarks });
    setSaving(false);
    setModalOpen(false);
    load();
  }

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
              <tr key={fr.id} className="even:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-700 cursor-pointer hover:underline" onClick={()=>openDetails(fr)}>{fr.title}</td>
                <td className="px-4 py-3">{fr.researcher_name || fr.researcher_id}</td>
                <td className="px-4 py-3">{new Date(fr.submitted_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[fr.status]}`}>{fr.status}</span></td>
                <td className="px-4 py-3">{fr.outcome || '-'}</td>
                <td className="px-4 py-3"><button className="text-blue-600 font-medium hover:underline" onClick={()=>openDetails(fr)}>Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl" onClick={()=>setModalOpen(false)}>&times;</button>
            <h2 className="text-xl font-semibold mb-1">Final Report Details</h2>
            <p className="text-xs text-gray-500 mb-4">ID: {selected.id}</p>
            <div className="grid md:grid-cols-2 gap-4 mb-6 text-xs text-gray-600">
              <div>
                <div className="font-medium text-gray-900">Title</div>
                <div>{selected.title}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Researcher</div>
                <div>{selected.researcher_name || selected.researcher_id}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Submitted At</div>
                <div>{new Date(selected.submitted_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Current Status</div>
                <div>{selected.status}</div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={editStatus} onChange={e=>setEditStatus(e.target.value as FinalReportStatus)} className="border rounded px-3 py-2 w-full">
                <option value="Pending Review">Pending Review</option>
                <option value="Under Review">Under Review</option>
                <option value="Requires Revision">Requires Revision</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Outcome / Decision Summary</label>
              <textarea value={editOutcome} onChange={e=>setEditOutcome(e.target.value)} rows={4} className="border rounded px-3 py-2 w-full text-sm" placeholder="Provide summary of decision or requested revisions" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Internal Remarks (not visible to researcher)</label>
              <textarea value={editRemarks} onChange={e=>setEditRemarks(e.target.value)} rows={3} className="border rounded px-3 py-2 w-full text-sm" placeholder="Internal notes for chairperson tracking" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
              <button disabled={saving} onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFinalReports;
