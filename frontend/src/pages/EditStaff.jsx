import React, { useState, useEffect } from 'react';
import api from '../services/api';

const EditStaff = ({ staff, setPage }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        staff_number: staff?.staff_number || '',
        first_name: staff?.first_name || '',
        middle_name: staff?.middle_name || '',
        last_name: staff?.last_name || '',
        gender: staff?.gender || 'male',
        date_of_birth: staff?.date_of_birth || '',
        phone: staff?.phone || '',
        email: staff?.email || '',
        address: staff?.address || '',
        designation: staff?.designation || '',
        department: staff?.department || '',
        employment_date: staff?.employment_date || '',
        basic_salary: staff?.basic_salary || '',
        qualification: staff?.qualification || '',
        employment_status: staff?.employment_status || 'active'
    });

    useEffect(() => {
        if (staff?.id) {
            fetchStaffMember(staff.id);
        }
    }, [staff]);

    const fetchStaffMember = async (id) => {
        try {
            setLoading(true);
            const response = await api.get(`/staff/${id}`);
            const data = response.data.data || response.data;
            setFormData({
                staff_number: data.staff_number || '',
                first_name: data.first_name || '',
                middle_name: data.middle_name || '',
                last_name: data.last_name || '',
                gender: data.gender || 'male',
                date_of_birth: data.date_of_birth || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                designation: data.designation || '',
                department: data.department || '',
                employment_date: data.employment_date || '',
                basic_salary: data.basic_salary || '',
                qualification: data.qualification || '',
                employment_status: data.employment_status || 'active'
            });
        } catch (err) {
            console.error('Failed to fetch full staff profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            await api.put(`/staff/${staff.id}`, formData);
            setPage('staff');
        } catch (err) {
            if (err.response && err.response.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                alert(err.response?.data?.message || 'Failed to update staff member.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-gray-500 font-medium">Loading staff details...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Staff Member</h1>
                    <p className="text-sm text-gray-500">Update record for {formData.first_name} {formData.last_name}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setPage('staff')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
                >
                    Back to List
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Personal Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
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
                                value={formData.middle_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
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
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Employment & Position</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Staff ID / Number</label>
                            <input
                                type="text"
                                name="staff_number"
                                value={formData.staff_number}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Designation / Role</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Employment Status</label>
                            <select
                                name="employment_status"
                                value={formData.employment_status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                                <option value="active">Active</option>
                                <option value="on_leave">On Leave</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Employment Date</label>
                            <input
                                type="date"
                                name="employment_date"
                                value={formData.employment_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Basic Salary</label>
                            <input
                                type="number"
                                step="0.01"
                                name="basic_salary"
                                value={formData.basic_salary}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => setPage('staff')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition shadow-sm disabled:opacity-50"
                    >
                        {submitting ? 'Updating...' : 'Update Staff Member'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStaff;
