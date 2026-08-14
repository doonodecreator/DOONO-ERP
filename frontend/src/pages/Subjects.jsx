import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Subjects({ setPage }) {
  const [subjects, setSubjects] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Core',
    division_id: '',
    pass_mark: 40,
    maximum_mark: 100,
    is_active: true,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subjRes, divRes] = await Promise.allSettled([
        api.get('/subjects'),
        api.get('/divisions'),
      ]);

      if (subjRes.status === 'fulfilled') {
        const sData = subjRes.value.data.data || subjRes.value.data;
        setSubjects(Array.isArray(sData) ? sData : []);
      }
      if (divRes.status === 'fulfilled') {
        const dData = divRes.value.data.data || divRes.value.data;
        setDivisions(Array.isArray(dData) ? dData : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subject list.');
    } fontFinally: {
      setLoading(false);
    }
  };

  const handleOpenModal = (subj = null) => {
    setErrors({});
    if (subj) {
      setEditingId(subj.id);
      setForm({
        name: subj.name || '',
        code: subj.code || '',
        category: subj.category || 'Core',
        division_id: subj.division_id || '',
        pass_mark: subj.pass_mark || 40,
        maximum_mark: subj.maximum_mark || 100,
        is_active: subj.is_active ?? true,
        description: subj.description || '',
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        code: '',
        category: 'Core',
        division_id: divisions[0]?.id || '',
        pass_mark: 40,
        maximum_mark: 100,
        is_active: true,
        description: '',
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
        await api.put(`/subjects/${editingId}`, form);
      } else {
        await api.post('/subjects', form);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        alert(err.response?.data?.message || 'Failed to save subject.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove subject "${name}"?`)) return;

    try {
      await api.delete(`/subjects/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete subject.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Academic Subjects</h1>
          <p className="text-sm text-gray-500">Manage curriculum subjects, pass marks, and subject categories.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          + Add New Subject
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading subject catalog...</div>
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">No subjects found in curriculum.</p>
            <p className="text-xs mt-1">Click above to add subjects like Mathematics, English, or Basic Science.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Subject Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Pass / Max Mark</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{s.code || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                        {s.category || 'Core'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="text-red-600 font-semibold">{s.pass_mark || 40}</span> / {s.maximum_mark || 100}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Mathematics"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Code</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. MATH101"
                    value={form.code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Trade">Trade</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Pass Mark</label>
                  <input
                    type="number"
                    name="pass_mark"
                    value={form.pass_mark}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Maximum Mark</label>
                  <input
                    type="number"
                    name="maximum_mark"
                    value={form.maximum_mark}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="subj_is_active"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="subj_is_active" className="text-sm text-gray-700 font-medium cursor-pointer">
                  Active Subject in Curriculum
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
                  {submitting ? 'Saving...' : editingId ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
