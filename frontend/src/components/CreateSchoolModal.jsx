import React, { useState } from 'react';
import api from '../services/api';

export default function CreateSchoolModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        organization_id: '',
        country: '',
        name: '',
        short_name: '',
        school_type: 'Combined',
        has_primary: true,
        has_secondary: true,
        school_code: '',
        email: '',
        phone: '',
        status: 'active',
        trial_days: 30,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/schools', formData);
            if (response.data.success) {
                if (onSuccess) onSuccess(response.data.data);
                if (onClose) onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create school. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Create School</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-bold text-lg"
                    >
                        &times;
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter school name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Short Name / Acronym</label>
                        <input
                            type="text"
                            name="short_name"
                            value={formData.short_name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g., DSS"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Code</label>
                        <input
                            type="text"
                            name="school_code"
                            value={formData.school_code}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g., SCH001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Enter country"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Type</label>
                        <select
                            name="school_type"
                            value={formData.school_type}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="Combined">Combined</option>
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="school@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Phone number"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create School'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

