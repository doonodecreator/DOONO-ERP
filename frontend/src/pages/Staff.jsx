import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Staff = ({ setPage, setSelectedStaff }) => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await api.get('/staff');
            const data = response.data.data || response.data;
            setStaffList(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load staff records.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name} from staff?`)) return;

        try {
            await api.delete(`/staff/${id}`);
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete staff member.');
        }
    };

    const handleEdit = (staffMember) => {
        if (setSelectedStaff) setSelectedStaff(staffMember);
        setPage('edit-staff');
    };

    const filteredStaff = staffList.filter((s) => {
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                              (s.staff_number && s.staff_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || s.employment_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Staff Directory</h1>
                    <p className="text-sm text-gray-500">Manage school teachers, administrators, and non-teaching personnel.</p>
                </div>
                <button
                    onClick={() => setPage('add-staff')}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                >
                    + Add New Staff
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by name, staff ID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                    <option value="all">All Employment Statuses</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                </select>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={fetchStaff} className="underline font-semibold">Retry</button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading staff records...</div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p className="text-base font-medium">No staff members found.</p>
                        <p className="text-xs mt-1">Try adjusting your search query or add a new staff member.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Staff ID</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Designation / Dept</th>
                                    <th className="px-6 py-3">Phone / Email</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStaff.map((staff) => (
                                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">
                                            {staff.staff_number || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {staff.first_name} {staff.middle_name ? staff.middle_name + ' ' : ''}{staff.last_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-800">{staff.designation || 'Unassigned'}</div>
                                            <div className="text-xs text-gray-400">{staff.department || 'General'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>{staff.phone || '—'}</div>
                                            <div className="text-xs text-gray-400">{staff.email || '—'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                                                staff.employment_status === 'active' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : staff.employment_status === 'on_leave'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {staff.employment_status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(staff)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(staff.id, `${staff.first_name} ${staff.last_name}`)}
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
};

export default Staff;
