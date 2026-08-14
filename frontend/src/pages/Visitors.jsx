import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    visitor_name: '',
    phone_number: '',
    purpose: '',
    whom_to_see: '',
    check_in_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
  });

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/visitors');
      const data = res.data.data || res.data || [];
      setVisitors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch visitor logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', form);
      setShowModal(false);
      setForm({
        visitor_name: '',
        phone_number: '',
        purpose: '',
        whom_to_see: '',
        check_in_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
      loadVisitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in visitor.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visitor & Reception Desk</h1>
          <p className="text-sm text-gray-500">Log school gate entries, visitor appointments, and front desk check-ins.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
        >
          + Check In Visitor
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadVisitors} className="underline font-semibold">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading visitor logs...</div>
        ) : visitors.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No visitors logged at reception. Click "+ Check In Visitor".</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Visitor Name</th>
                  <th className="px-6 py-3">Phone Number</th>
                  <th className="px-6 py-3">Purpose of Visit</th>
                  <th className="px-6 py-3">Whom to See</th>
                  <th className="px-6 py-3">Check-In Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{v.visitor_name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{v.phone_number || '—'}</td>
                    <td className="px-6 py-4 text-gray-800">{v.purpose || 'Official'}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium">{v.whom_to_see || 'Administration'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{v.check_in_time || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Check In New Visitor</h3>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.visitor_name}
                  onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
                  placeholder="e.g. Mr. David Okoro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="08030000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g. Enquire about admission"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Whom to See *</label>
                <input
                  type="text"
                  required
                  value={form.whom_to_see}
                  onChange={(e) => setForm({ ...form, whom_to_see: e.target.value })}
                  placeholder="e.g. Principal / Admissions Officer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                  Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
