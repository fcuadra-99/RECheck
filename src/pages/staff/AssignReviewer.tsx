import React, { useState } from 'react';

const reviewers = [
  {
    id: 1,
    name: 'Dr. Aldwin James Bucio',
    avatar: 'img.jpg',
    status: 'Available',
    assigned: false,
    specialty: 'Health & Medicine',
  },
  {
    id: 2,
    name: 'Prof. Angelo Casana',
    avatar: 'img.jpg',
    status: 'Available',
    assigned: false,
    specialty: 'Technology',
  },
  {
    id: 3,
    name: 'Dr. John Doe',
    avatar: 'img.jpg',
    status: 'Not Available',
    assigned: true,
    specialty: 'Public Health',
  },
  {
    id: 4,
    name: 'Prof. John Wick',
    avatar: 'img.jpg',
    status: 'Not Available',
    assigned: true,
    specialty: 'Law & Ethics',
  },
];

const AssignReviewer = () => {
  const [assigned, setAssigned] = useState(reviewers.map(r => r.assigned));
  const [status, setStatus] = useState(reviewers.map(r => r.status));
  const [showNotif, setShowNotif] = useState(false);
  const [notifAnim, setNotifAnim] = useState(false);

  const handleAssign = (idx: number) => {
    setAssigned(prev => prev.map((a, i) => (i === idx ? true : a)));
    setStatus(prev => prev.map((s, i) => (i === idx ? 'Not Available' : s)));
    setShowNotif(true);
    setTimeout(() => setNotifAnim(true), 10); 
  };

  const closeNotif = () => {
    setNotifAnim(false);
    setTimeout(() => setShowNotif(false), 200); 
  };

  return (
    <div className="p-6 relative min-h-[400px]">
      <h1 className="text-3xl font-semibold mb-6">Assign Reviewer</h1>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full bg-white rounded-lg">
          <thead>
            <tr>
              <th className="text-left px-6 py-3 text-lg font-bold">Reviewer</th>
              <th className="text-left px-6 py-3 text-lg font-bold">Specialty</th>
              <th className="text-left px-6 py-3 text-lg font-bold">Status</th>
              <th className="text-left px-6 py-3 text-lg font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {reviewers.map((rev, idx) => (
              <tr key={rev.id} className="border-b last:border-b-0">
                <td className="flex items-center gap-4 px-6 py-4">
                  <img src={rev.avatar} alt={rev.name} className="w-14 h-14 rounded-full object-cover" />
                  <span className="font-medium text-base">{rev.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700 font-medium">{rev.specialty}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={
                    status[idx] === 'Available'
                      ? 'text-blue-700 font-semibold'
                      : 'text-gray-500 font-semibold'
                  }>
                    {status[idx]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {assigned[idx] ? (
                    <button className="bg-red-700 text-white px-6 py-2 rounded-lg font-semibold cursor-not-allowed" disabled>
                      Assigned
                    </button>
                  ) : (
                    <button
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                      onClick={() => handleAssign(idx)}
                    >
                      Assign Reviewer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Animated Notification Modal */}
      {showNotif && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black/10 transition-opacity duration-200 ${notifAnim ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl p-10 min-w-[400px] min-h-[180px] flex items-center relative transition-all duration-200 ${notifAnim ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`} style={{ boxShadow: '0 8px 32px 0 rgba(60,60,60,0.12)' }}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={closeNotif}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex items-center gap-4 mx-auto">
              <span className="text-4xl bg-yellow-100 rounded-lg p-3">👍</span>
              <span className="font-semibold text-lg">Designated Reviewer Has<br />Been Assigned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignReviewer;
