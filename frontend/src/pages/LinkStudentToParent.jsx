import React, { useState } from 'react';
import api from '../services/api';

export default function LinkStudentToParent({ parent, setPage }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [form, setForm] = useState({
    student_id: '',
    relationship_type: 'Father',
    is_primary_contact: true,
  });

  const searchStudents = async (event) => {
    event.preventDefault();
    const search = searchTerm.trim();

    if (search.length < 2) {
      setStudents([]);
      setSearchError('Enter at least two characters to search for a student.');
      return;
    }

    try {
      setLoading(true);
      setSearchError('');
      const response = await api.get('/students', {
        params: { search, per_page: 25 },
      });
      const data = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : null;

      if (!data) {
        throw new Error('The student search response is not a valid collection.');
      }

      setStudents(data);
    } catch (err) {
      setStudents([]);
      setSearchError(err.message || 'Failed to search students.');
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setForm((current) => ({ ...current, student_id: student.id }));
    setStudents([]);
    setSearchTerm('');
    setErrors((current) => ({ ...current, student_id: undefined }));
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
        relationship_type: form.relationship_type,
        is_primary_contact: form.is_primary_contact,
      });

      alert('Student successfully linked to parent record.');
      setPage('parents');
    } catch (err) {
      setErrors(err.errors || err.responseData?.errors || {});
      if (!err.errors && !err.responseData?.errors) {
        alert(err.message || 'Failed to link student.');
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by admission number or student name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={searchStudents}
              disabled={loading}
              className="px-4 py-2 border border-blue-600 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {selectedStudent && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              Selected: {selectedStudent.full_name || `${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim()}
              {selectedStudent.admission_number ? ` (${selectedStudent.admission_number})` : ''}
            </div>
          )}
          {Array.isArray(students) && students.length > 0 && (
            <div className="mt-3 divide-y rounded-lg border border-gray-200">
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => selectStudent(student)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span>{student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}</span>
                  <span className="text-gray-500">{student.admission_number || 'No admission number'}</span>
                </button>
              ))}
            </div>
          )}
          {searchError && <p className="text-xs text-red-500 mt-1">{searchError}</p>}
          {errors.student_id && <p className="text-xs text-red-500 mt-1">{errors.student_id[0]}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Relationship Type *</label>
          <select
            value={form.relationship_type}
            onChange={(e) => setForm({ ...form, relationship_type: e.target.value })}
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
            id="is_primary_contact"
            checked={form.is_primary_contact}
            onChange={(e) => setForm({ ...form, is_primary_contact: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <label htmlFor="is_primary_contact" className="text-sm text-gray-700 font-medium cursor-pointer">
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
