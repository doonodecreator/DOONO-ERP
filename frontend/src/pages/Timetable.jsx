import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Timetable() {
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    class_id: '',
    day_of_week: 'Monday',
    period_number: 1,
    start_time: '08:00',
    end_time: '08:45',
    subject_id: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [tRes, cRes] = await Promise.allSettled([
        api.get('/timetables'),
        api.get('/classes'),
      ]);

      if (tRes.status === 'fulfilled') {
        const data = tRes.value.data.data || tRes.value.data || [];
        setTimetables(Array.isArray(data) ? data : []);
      }
      if (cRes.status === 'fulfilled') {
        const data = cRes.value.data.data || cRes.value.data || [];
        setClasses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timetable schedules.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/timetables', form);
      setShowModal(false);
      loadInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save timetable slot.');
    }
  };

  const filteredTimetable = timetables.filter((t) => {
    if (!selectedClass) return true;
    return String(t.class_id) === String(selectedClass);
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Timetable & Schedules</h1>
          <p className="text-sm text-gray-500">Configure daily school periods, lecture times, and subject allocations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
        >
          + Add Timetable Slot
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadInitialData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center space-x-4">
        <label className="text-xs font-semibold text-gray-600">Filter by Class:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading schedules...</div>
        ) : filteredTimetable.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No timetable periods recorded. Click "+ Add Timetable Slot".</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Day</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTimetable.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.day_of_week}</td>
                    <td className="px-6 py-4 font-mono">Period {item.period_number}</td>
                    <td className="px-6 py-4">{item.class?.name || 'Class #' + item.class_id}</td>
                    <td className="px-6 py-4 font-medium text-blue-600">{item.subject?.name || 'Subject #' + item.subject_id}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.start_time} - {item.end_time}</td>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Timetable Slot</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Class *</label>
                <select
                  required
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Day of Week</label>
                  <select
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Period Number</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.period_number}
                    onChange={(e) => setForm({ ...form, period_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
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
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
