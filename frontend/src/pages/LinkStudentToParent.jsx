import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function LinkStudentToParent({ parent, setPage }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    student_id: '',
    relationship: 'Father',
    is_primary: true,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      const data = response.data.data || response.data;
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load students for linking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parent?.id) {
      alert('No valid parent record selected.');
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await api.post('/parent-students', {
        parent_id: parent.id,
        student_id: form.student_id,
        relationship: form.relationship,
        is_primary: form.is_primary,
      });

      alert('Student successfully linked to parent record.');
      setPage('parents');
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        alert(err.response?.data?.message || 'Failed to link student.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const parentDisplayName = parent?.father_name || parent?.mother_name || parent?.guardian_name || 'Selected Parent';

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Link Student to Parent</h1>
          <p className="text-sm text-gray-500">Connecting student profile to parent record: <span className="font-semibold text-gray-700">{parentDisplayName}</span></p>
        </div>
        <button
          type="button"
          onClick={() => setPage('parents')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
        >
          Back to Parent List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Select Student *</label>
          {loading ? (
            <div className="text-sm text-gray-400 py-2">Loading students...</div>
          ) : (
            <select
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">-- Choose Student --</option>
              {students.map((st) => {
                const fullName = `${st.first_name || ''} ${st.middle_name ? st.middle_name + ' ' : ''}${st.last_name || ''}`;
                const adm = st.admission_number ? ` (${st.admission_number})` : '';
                return (
                  <option key={st.id} value={st.id}>
                    {fullName} {adm}
                  </option>
                );
              })}
            </select>
          )}
          {errors.student_id && <p className="text-xs text-red-500 mt-1">{errors.student_id[0]}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Relationship Type *</label>
          <select
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Guardian">Guardian</option>
            <option value="Uncle">Uncle</option>
            <option value="Aunt">Aunt</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="is_primary"
            checked={form.is_primary}
            onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <label htmlFor="is_primary" className="text-sm text-gray-700 font-medium cursor-pointer">
            Set as Primary Parent / Emergency Contact
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setPage('parents')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !form.student_id}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Linking Student...' : 'Link Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
