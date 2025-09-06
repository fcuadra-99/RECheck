import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';


export type Deviation = {
  id: string;
  title: string;
  researcher: string;
  dateReported: string;
  type: string;
  severity: string;
  status: string;
};

// Map DB row to UI row
function mapDeviation(row: any): Deviation {
  const hasSeverity = row.severity && row.severity !== '';
  return {
    id: row.id,
    title: row.protocol_title,
    researcher: row.reported_by,
    dateReported: row.report_submission_date,
    type: row.type || '-',
    severity: hasSeverity ? row.severity : '-',
    status: hasSeverity ? 'Reviewed' : 'Pending / View',
  };
}

const PAGE_SIZE = 5;

const SDeviations = () => {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [typeOptions, setTypeOptions] = useState<string[]>(['All']);
  const navigate = useNavigate();

  const fetchDeviations = useCallback(async () => {
    const { data, error } = await supabase.from('deviation_reports').select('*').order('created_at', { ascending: false });
    if (error) {
      setDeviations([]);
      setTypeOptions(['All']);
    } else {
      setDeviations(data.map(mapDeviation));
      const uniqueTypes = Array.from(new Set(data.map((row: any) => row.type).filter((t: string) => t && t !== '')));
      setTypeOptions(['All', ...uniqueTypes]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDeviations();
  }, [fetchDeviations]);

  // Refetch when window regains focus (user returns from detail page)
  useEffect(() => {
    const onFocus = () => fetchDeviations();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchDeviations]);

  // Real-time subscription to update severity/status instantly
  useEffect(() => {
    const channel = supabase
      .channel('deviation_reports_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deviation_reports' }, (payload: any) => {
        setDeviations(prev => {
          const idx = prev.findIndex(d => d.id === payload.new.id);
            if (idx === -1) return prev; // not in current page yet
            const updatedRow = mapDeviation(payload.new);
            const next = [...prev];
            next[idx] = updatedRow;
            return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);


  const severityOptions = ['All', '-', 'Minor', 'Major', 'Not Assigned'];
  const statusOptions = ['All', 'Pending / View', 'Reviewed'];

  // Filter para sa deviations
  const filtered = deviations.filter(dev => {
    const matchesSearch = dev.title.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || dev.severity === severityFilter;
    const matchesType = typeFilter === 'All' || dev.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || dev.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

  useEffect(() => {
    // Reset to page 1 if filters/search change and current page is out of range
    if (page > totalPages) setPage(1);
  }, [filtered.length, totalPages]);

  return (
    <div>
      <h1 className="text-[30px] font-medium p-4">Deviation</h1>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 mb-4">
        <input
          type="text"
          className="w-full md:w-1/3 rounded-xl border border-gray-200 px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Search Deviation by Title"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <select
            className="rounded-full px-4 py-1 border border-gray-200 bg-white text-sm"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            {severityOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            className="rounded-full px-4 py-1 border border-gray-200 bg-white text-sm"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            {typeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            className="rounded-full px-4 py-1 border border-gray-200 bg-white text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading deviations...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No deviations found.</div>
      ) : (
        <>
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full text-sm border rounded-xl bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Study/Proposal Title</th>
                <th className="px-4 py-3 text-left font-medium">Researcher</th>
                <th className="px-4 py-3 text-left font-medium">Date Reported</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Severity</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((dev) => (
                <tr key={dev.id} className="even:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-700 cursor-pointer hover:underline">{dev.title}</td>
                  <td className="px-4 py-3">{dev.researcher}</td>
                  <td className="px-4 py-3 text-blue-700/80 font-medium">{dev.dateReported}</td>
                  <td className="px-4 py-3 font-semibold"><span className="bg-gray-100 px-2 py-1 rounded-md">{dev.type}</span></td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold bg-gray-100
                        ${dev.severity === 'Minor' ? 'ring-2 ring-blue-500 text-blue-700' : ''}
                        ${dev.severity === 'Major' ? 'ring-2 ring-red-500 text-red-700' : ''}
                        ${dev.severity !== 'Minor' && dev.severity !== 'Major' ? 'ring-2 ring-gray-300 text-gray-700' : ''}
                      `}
                    >
                      {dev.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className={`px-5 py-2 rounded-lg font-semibold border transition text-sm focus:outline-none bg-white text-blue-700 border-blue-400 hover:bg-blue-50`}
                      onClick={() => navigate(`/staff/deviations/${dev.id}`)}
                    >
                      {dev.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            className="text-gray-400 text-xl px-2 py-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
            onClick={handlePrev}
            disabled={page === 1}
            aria-label="Previous page"
          >
            {'<'}
          </button>
          <span className="bg-gray-200 text-gray-700 rounded-full px-4 py-1 font-semibold text-lg">{page}</span>
          <button
            className="text-gray-400 text-xl px-2 py-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
            onClick={handleNext}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            {'>'}
          </button>
        </div>
        </>
      )}
    </div>
  );
};

export default SDeviations;