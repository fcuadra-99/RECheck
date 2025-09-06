import React, { useState } from 'react';

type Proposal = {
  id: number;
  title: string;
  researcher: string;
  date: string;
  reviewer: string;
  outcome: string;
  status: string;
  feedback: string;
  documents: { name: string; size: string }[];
};

// dummy data sa proposals
const proposals: Proposal[] = [
  {
    id: 1,
    title: 'Exploring Genetic Markers for Heart Disease Risk',
    researcher: 'Aldwin Bucio',
    date: '2023-11-10',
    reviewer: 'Dr. Angelo Casana',
    outcome: 'Approved',
    status: 'Approved',
    feedback: 'After careful review, I find the research proposal to be ethically sound and methodologically appropriate. The informed consent process is clearly outlined, and potential risks to participants are minimal and well-managed. I recommend approval with no revisions.',
    documents: [
      { name: 'Project Proposal.pdf', size: '1.2 mb' },
      { name: 'Informed Consent Form.pdf', size: '150 kb' },
    ],
  },
  {
    id: 2,
    title: 'Efficacy of Novel Therapies for Alzheimer’s Disease',
    researcher: 'Jane Smith',
    date: '2023-11-12',
    reviewer: 'Dr. John Doe',
    outcome: 'Requires Revision',
    status: 'Requires Revision',
    feedback: 'Please clarify the participant selection criteria and provide more detail on risk mitigation.',
    documents: [
      { name: 'Alzheimer Proposal.pdf', size: '2.1 mb' },
    ],
  },
];


const ReviewSubmission = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Proposal | null>(null);

  const filtered = proposals.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.researcher.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Review Submission</h1>
      <p className="text-gray-500 mb-6">Track, review, and manage research proposals submitted for ethics review.</p>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
          <span className="material-icons text-gray-400 mr-2">search</span>
          <input
            type="text"
            placeholder="Search proposals by title or researcher"
            className="flex-1 bg-transparent outline-none text-base"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white mt-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Researcher</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Reviewer</th>
              <th className="px-4 py-3 text-left font-medium">Outcome</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">No proposals found.</td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="even:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-700 cursor-pointer hover:underline">{p.title}</td>
                <td className="px-4 py-3">{p.researcher}</td>
                <td className="px-4 py-3">{p.date}</td>
                <td className="px-4 py-3">{p.reviewer}</td>
                <td className="px-4 py-3">{p.outcome}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'Approved' ? 'bg-green-100 text-green-700' : p.status === 'Requires Revision' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 font-medium hover:underline" onClick={() => { setSelected(p); setShowModal(true); }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for View Details */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl p-4 md:p-8 relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl" onClick={() => setShowModal(false)}>&times;</button>
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <div className="flex text-xs text-gray-500">
                  <div className="w-32">Review Result</div>
                  <div className="font-medium text-black ml-2">{selected.outcome}</div>
                </div>
                <div className="flex text-xs text-gray-500">
                  <div className="w-32">Researcher Name</div>
                  <div className="ml-2">{selected.researcher}</div>
                </div>
                <div className="flex text-xs text-gray-500">
                  <div className="w-32">Submission Date</div>
                  <div className="ml-2">{selected.date}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex text-xs text-gray-500">
                  <div className="w-32">Project Title</div>
                  <div className="font-medium text-black ml-2">{selected.title}</div>
                </div>
                <div className="flex text-xs text-gray-500">
                  <div className="w-32">Researcher Email</div>
                  <div className="ml-2">{selected.researcher.toLowerCase().replace(/ /g, '') + '@gmail.com'}</div>
                </div>
                <div className="flex text-xs text-gray-500">
                  <div className="w-32">Reviewer Name</div>
                  <div className="ml-2">{selected.reviewer}</div>
                </div>
              </div>
            </div>
            {/* Documents */}
            <div className="mb-8">
              <div className="font-medium mb-2">Review Documents</div>
              <div className="space-y-2">
                {selected.documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-gray-400">description</span>
                      <span>{doc.name}</span>
                      <span className="text-xs text-gray-400">{doc.size}</span>
                    </div>
                    <button className="px-3 py-1 bg-gray-200 rounded text-sm font-medium hover:bg-gray-300" onClick={() => alert('Downloading ' + doc.name)}>Download</button>
                  </div>
                ))}
              </div>
            </div>
            {/* Feedback */}
            <div className="mb-8">
              <div className="font-medium mb-2">Reviewer FeedBack</div>
              <div className="border border-blue-300 bg-blue-50 rounded-lg p-4 text-sm text-gray-700 flex items-start gap-2">
                <span className="material-icons text-blue-400 mr-2">chat_bubble_outline</span>
                <span>{selected.feedback}</span>
              </div>
            </div>
            {/* Clearance Status Management */}
            <div className="mb-8">
              <div className="font-medium mb-2">Clearance Status Management</div>
              <div className="flex flex-col gap-4">
                <label className="flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-3">
                  <input type="radio" name="clearance" className="mt-1" defaultChecked />
                  <div>
                    <div className="font-medium">Approve</div>
                    <div className="text-xs text-gray-500">Issue ethics clearance</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-3">
                  <input type="radio" name="clearance" className="mt-1" />
                  <div>
                    <div className="font-medium">Request Revisions</div>
                    <div className="text-xs text-gray-500">Grant Decision Letter with Recommendations</div>
                  </div>
                </label>
              </div>
            </div>
            {/* Modal Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setShowModal(false); alert('Submitted!'); }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmission;
