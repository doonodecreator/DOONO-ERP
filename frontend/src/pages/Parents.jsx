import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Parents({ setPage, setSelectedParent }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parents');
      const data = response.data.data || response.data;
      setParents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch parent records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the parent record for ${name}?`)) return;

    try {
      await api.delete(`/parents/${id}`);
      loadParents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete parent record.');
    }
  };

  const handleLinkStudent = (e, parent) => {
    e.stopPropagation();
    if (setSelectedParent) setSelectedParent(parent);
    setPage('link-student-parent');
  };

  const handleEdit = (e, parent) => {
    e.stopPropagation();
    if (setSelectedParent) setSelectedParent(parent);
    setPage('edit-parent');
  };

  const handleViewProfile = (parent) => {
    if (setSelectedParent) setSelectedParent(parent);
    setPage('parent-profile');
  };

  const filteredParents = parents.filter((p) => {
    const text = `${p.father_name || ''} ${p.father_phone || ''} ${p.mother_name || ''} ${p.guardian_name || ''} ${p.guardian_phone || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Parents & Guardians Directory</h1>
          <p className="text-sm text-gray-500">Manage parent profiles, emergency contacts, and student connections.</p>
        </div>
        <button
          onClick={() => setPage('add-parent')}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          + Add New Parent
        </button>
      </div>

      {/* Metrics & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg text-2xl">👨‍👩‍👧</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Registered Parents</p>
            <h3 className="text-2xl font-bold text-gray-800">{parents.length}</h3>
          </div>
        </div>
        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <input
            type="text"
            placeholder="Search by father name, mother name, guardian, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadParents} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading parent records...</div>
        ) : filteredParents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">No parent records found.</p>
            <p className="text-xs mt-1">Try adjusting your search query or register a new parent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Father Name / Phone</th>
                  <th className="px-6 py-3">Mother Name / Phone</th>
                  <th className="px-6 py-3">Guardian Info</th>
                  <th className="px-6 py-3">Residential Address</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParents.map((p) => {
                  const displayName = p.father_name || p.mother_name || p.guardian_name || 'Parent Record';
                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleViewProfile(p)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.father_name || '—'}</div>
                        <div className="text-xs text-gray-400">{p.father_phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.mother_name || '—'}</div>
                        <div className="text-xs text-gray-400">{p.mother_phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.guardian_name || '—'}</div>
                        <div className="text-xs text-gray-400">
                          {p.guardian_relationship ? `(${p.guardian_relationship}) ` : ''}
                          {p.guardian_phone || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-gray-500">
                        {p.address || '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={(e) => handleLinkStudent(e, p)}
                          className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium"
                        >
                          + Link Student
                        </button>
                        <button
                          onClick={(e) => handleEdit(e, p)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, p.id, displayName)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
