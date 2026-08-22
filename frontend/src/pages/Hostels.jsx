import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { arrayFromResponse } from '../utils/response';
import { useAuth } from '../context/AuthContext';

export default function Hostels({ setPage }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('hostels');
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Modal / Form state
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'Boys', warden_name: '', capacity: '' });

  useEffect(() => {
    loadHostelData();
  }, [activeTab]);

  const loadHostelData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'hostels') {
        const res = await api.get('/hostels');
        setHostels(arrayFromResponse(res));
      } else if (activeTab === 'rooms') {
        const res = await api.get('/hostel-rooms');
        setRooms(arrayFromResponse(res));
      } else if (activeTab === 'allocations') {
        const res = await api.get('/hostel-allocations');
        setAllocations(arrayFromResponse(res));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hostel management data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHostel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostels', hostelForm);
      setMessage('Hostel created successfully!');
      setShowHostelModal(false);
      setHostelForm({ name: '', type: 'Boys', warden_name: '', capacity: '' });
      loadHostelData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create hostel.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hostel & Accommodation Management</h1>
          <p className="text-sm text-gray-500">Manage boarding facilities, room capacities, and student bed assignments.</p>
        </div>
        <div>
          {activeTab === 'hostels' && (
            <button type="button"
              onClick={() => setShowHostelModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
            >
              + Add New Hostel
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm flex justify-between items-center">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} className="font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={loadHostelData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl p-1 shadow-sm">
        <button type="button"
          onClick={() => setActiveTab('hostels')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'hostels' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Hostels
        </button>
        <button type="button"
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'rooms' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Rooms & Beds
        </button>
        <button type="button"
          onClick={() => setActiveTab('allocations')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'allocations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Student Allocations
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading hostel records...</div>
        ) : activeTab === 'hostels' ? (
          hostels.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No hostels registered. Click "+ Add New Hostel" to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Hostel Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hostels.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{h.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          h.type === 'Boys' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{h.warden_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'rooms' ? (
          rooms.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No hostel rooms configured yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Room Number</th>
                    <th className="px-6 py-3">Hostel</th>
                    <th className="px-6 py-3">Capacity (Beds)</th>
                    <th className="px-6 py-3">Occupied Beds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{r.room_number}</td>
                      <td className="px-6 py-4 text-gray-700">{r.hostel?.name || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono">{r.capacity}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-blue-600">{r.occupied_beds || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          allocations.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No active student hostel allocations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Hostel Room</th>
                    <th className="px-6 py-3">Bed Space</th>
                    <th className="px-6 py-3">Allocation Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{a.student?.full_name || 'Student #' + a.student_id}</td>
                      <td className="px-6 py-4">{a.room?.room_number || 'Room #' + a.hostel_room_id}</td>
                      <td className="px-6 py-4 font-mono">{a.bed_space || '—'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{a.allocated_date || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                          {a.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Create Hostel Modal */}
      {showHostelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Hostel Facility</h3>
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hostel Name *</label>
                <input
                  type="text"
                  required
                  value={hostelForm.name}
                  onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                  placeholder="e.g. Mandela Hall"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hostel Type *</label>
                <select
                  value={hostelForm.type}
                  onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Boys">Boys Hostel</option>
                  <option value="Girls">Girls Hostel</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Warden Name</label>
                <input value={hostelForm.warden_name} onChange={(e) => setHostelForm({ ...hostelForm, warden_name: e.target.value })} placeholder="Optional warden name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity (students) *</label>
                <input required type="number" min="1" value={hostelForm.capacity} onChange={(e) => setHostelForm({ ...hostelForm, capacity: e.target.value })} placeholder="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHostelModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                  Save Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
