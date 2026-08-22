import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function EditStudent({ student, setPage }) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(student?.photo_url || student?.photo || "");

  const [form, setForm] = useState({
    admission_number: student?.admission_number || '',
    first_name: student?.first_name || '',
    middle_name: student?.middle_name || '',
    last_name: student?.last_name || '',
    gender: student?.gender || 'Male',
    date_of_birth: student?.date_of_birth || '',
    admission_date: student?.admission_date || '',
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
        religion: data.religion || prev.religion,
        nationality: data.nationality || prev.nationality,
        state_of_origin: data.state_of_origin || prev.state_of_origin,
        local_government: data.local_government || prev.local_government,
        address: data.address || prev.address,
        blood_group: data.blood_group || prev.blood_group,
        genotype: data.genotype || prev.genotype,
        medical_notes: data.medical_notes || prev.medical_notes,
        status: data.status || prev.status,
      }));
      setPhotoPreview(data.photo_url || data.photo || "");
    } catch (err) {
      console.error('Failed to fetch full student record:', err);
    }
  };

  useEffect(() => () => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handlePhoto = (event) => {
    const nextPhoto = event.target.files?.[0] || null;
    setPhoto(nextPhoto);
    setPhotoPreview(nextPhoto ? URL.createObjectURL(nextPhoto) : "");
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
      const payload = new FormData();
      payload.append("_method", "PUT");
      Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
      if (photo) payload.append("photo", photo);
      await api.post(`/students/${student.id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Student Photo</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="w-full text-sm" />
              {photoPreview && <img src={photoPreview} alt="Student preview" className="mt-2 h-16 w-16 rounded-full object-cover" />}
            </div>
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

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Academic placement is managed from <strong>Enrollment &amp; Placement</strong> to preserve complete enrollment history.
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
