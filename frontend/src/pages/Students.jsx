import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Students({ setPage, setSelectedStudent }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      const data = response.data.data || response.data;
      setStudents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete student record for ${name}?`)) return;

    try {
      await api.delete(`/students/${id}`);
      loadStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  const handleEdit = (e, student) => {
    e.stopPropagation();
    if (setSelectedStudent) setSelectedStudent(student);
    setPage('edit-student');
  };

  const handleViewProfile = (student) => {
    if (setSelectedStudent) setSelectedStudent(student);
    setPage('student-profile');
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.toLowerCase();
    const admNo = (s.admission_number || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || admNo.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (s.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students Directory</h1>
          <p className="text-sm text-gray-500">Manage enrolled student profiles, class assignments, and academic status.</p>
        </div>
        <button
          onClick={() => setPage('add-student')}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          + Add New Student
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by student name or admission number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="all">All Academic Statuses</option>
          <option value="active">Active</option>
          <option value="graduated">Graduated</option>
          <option value="transferred">Transferred</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadStudents} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">No students found.</p>
            <p className="text-xs mt-1">Try adjusting your search criteria or add a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Admission No</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Class / Stream</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => handleViewProfile(student)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">
                      {student.admission_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                    </td>
                    <td className="px-6 py-4 capitalize">{student.gender || '—'}</td>
                    <td className="px-6 py-4">
                      {student.class?.name || student.class_name || 'Unassigned'}
                      {student.stream?.name ? ` (${student.stream.name})` : ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        (student.status || 'active').toLowerCase() === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={(e) => handleEdit(e, student)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, student.id, `${student.first_name} ${student.last_name}`)}
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
    </div>
  );
}
