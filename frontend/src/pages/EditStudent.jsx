import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function EditStudent({ student, setPage }) {
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    admission_number: student?.admission_number || '',
    first_name: student?.first_name || '',
    middle_name: student?.middle_name || '',
    last_name: student?.last_name || '',
    gender: student?.gender || 'Male',
    date_of_birth: student?.date_of_birth || '',
    admission_date: student?.admission_date || '',
    class_id: student?.class_id || '',
    stream_id: student?.stream_id || '',
    academic_session_id: student?.academic_session_id || '',
    religion: student?.religion || '',
    nationality: student?.nationality || 'Nigerian',
    state_of_origin: student?.state_of_origin || '',
    local_government: student?.local_government || '',
    address: student?.address || '',
    blood_group: student?.blood_group || '',
    genotype: student?.genotype || '',
    medical_notes: student?.medical_notes || '',
    status: student?.status || 'Active',
  });

  useEffect(() => {
    fetchFormOptions();
    if (student?.id) {
      fetchStudentDetails(student.id);
    }
  }, [student]);

  const fetchStudentDetails = async (id) => {
    try {
      const res = await api.get(`/students/${id}`);
      const data = res.data.data || res.data;
      setForm((prev) => ({
        ...prev,
        admission_number: data.admission_number || prev.admission_number,
        first_name: data.first_name || prev.first_name,
        middle_name: data.middle_name || prev.middle_name,
        last_name: data.last_name || prev.last_name,
        gender: data.gender || prev.gender,
        date_of_birth: data.date_of_birth || prev.date_of_birth,
        admission_date: data.admission_date || prev.admission_date,
        class_id: data.class_id || prev.class_id,
        stream_id: data.stream_id || prev.stream_id,
        academic_session_id: data.academic_session_id || prev.academic_session_id,
        religion: data.religion || prev.religion,
        state_of_origin: data.state_of_origin || prev.state_of_origin,
        address: data.address || prev.address,
        blood_group: data.blood_group || prev.blood_group,
        genotype: data.genotype || prev.genotype,
        status: data.status || prev.status,
      }));
    } catch (err) {
      console.error('Failed to fetch full student record:', err);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [classRes, streamRes, sessionRes] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/streams'),
        api.get('/academic-sessions'),
      ]);

      if (classRes.status === 'fulfilled') {
        const cData = classRes.value.data.data || classRes.value.data;
        setClasses(Array.isArray(cData) ? cData : []);
      }
      if (streamRes.status === 'fulfilled') {
        const sData = streamRes.value.data.data || streamRes.value.data;
        setStreams(Array.isArray(sData) ? sData : []);
      }
      if (sessionRes.status === 'fulfilled') {
        const sessData = sessionRes.value.data.data || sessionRes.value.data;
        setSessions(Array.isArray(sessData) ? sessData : []);
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student?.id) return;
    setSubmitting(true);
    setErrors({});

    try {
      await api.put(`/students/${student.id}`, form);
      if (setPage) setPage('students');
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        alert(err.response?.data?.message || 'Failed to update student record.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Student</h1>
          <p className="text-sm text-gray-500">Update information for {form.first_name} {form.last_name}</p>
        </div>
        <button
          type="button"
          onClick={() => setPage && setPage('students')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Personal Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={form.middle_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Gender *</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Active">Active</option>
                <option value="Graduated">Graduated</option>
                <option value="Transferred">Transferred</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Academic Placement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Class</label>
              <select
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">Select Class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Stream</label>
              <select
                name="stream_id"
                value={form.stream_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">Select Stream...</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Session</label>
              <select
                name="academic_session_id"
                value={form.academic_session_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">Select Session...</option>
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.id}>{sess.name || sess.session_year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setPage && setPage('students')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
