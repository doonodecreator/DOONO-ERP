import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    division_id: '',
    name: '',
    code: '',
    display_order: 1,
    is_active: true,
  });

  useEffect(() => {
    loadClassesAndDivisions();
  }, []);

  const loadClassesAndDivisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classRes, divRes] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/divisions'),
      ]);

      if (classRes.status === 'fulfilled') {
        const cData = classRes.value.data.data || classRes.value.data;
        setClasses(Array.isArray(cData) ? cData : []);
      }
      if (divRes.status === 'fulfilled') {
        const dData = divRes.value.data.data || divRes.value.data;
        setDivisions(Array.isArray(dData) ? dData : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load class configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cls = null) => {
    setErrors({});
    if (cls) {
      setEditingId(cls.id);
      setForm({
        division_id: cls.division_id || '',
        name: cls.name || '',
        code: cls.code || '',
        display_order: cls.display_order || 1,
        is_active: cls.is_active ?? true,
      });
    } else {
      setEditingId(null);
      setForm({
        division_id: divisions[0]?.id || '',
        name: '',
        code: '',
        display_order: classes.length + 1,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      if (editingId) {
        await api.put(`/classes/${editingId}`, form);
      } else {
        await api.post('/classes', form);
      }
      setShowModal(false);
      loadClassesAndDivisions();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        alert(err.response?.data?.message || 'Failed to save class.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete class "${name}"?`)) return;

    try {
      await api.delete(`/classes/${id}`);
      loadClassesAndDivisions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete class.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Classes & Academic Streams</h1>
          <p className="text-sm text-gray-500">Define academic levels, grade sections, and stream allocations.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          + Add New Class
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadClassesAndDivisions} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Class Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading academic classes...</div>
        ) : classes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">No academic classes defined.</p>
            <p className="text-xs mt-1">Click above to add your school's first class (e.g., JSS 1 or Primary 1).</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Class Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Division</th>
                  <th className="px-6 py-3">Streams Count</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-500">
                      {cls.display_order || '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{cls.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{cls.code || '—'}</td>
                    <td className="px-6 py-4">{cls.division?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {cls.streams?.length || 0} Streams
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(cls)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id, cls.name)}
                        className="text-red-600 hover:text-red-800 font-medium text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Academic Class' : 'Add New Class'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Division / Level *</label>
                <select
                  name="division_id"
                  value={form.division_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Division...</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.division_id && <p className="text-xs text-red-500 mt-1">{errors.division_id[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Class Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Primary 1, JSS 2, SS 3"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Class Code</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. PR1"
                    value={form.code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={form.display_order}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 font-medium cursor-pointer">
                  Active Academic Class
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
