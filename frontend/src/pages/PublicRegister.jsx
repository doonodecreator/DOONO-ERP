import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function PublicRegister() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        organization_id: 1, // Default or generic organization ID
        country_id: 1,      // Default country ID
        name: '',
        short_name: '',
        school_type: 'Combined',
        school_code: '',
        email: '',
        phone: '',
        admin_name: '',
        admin_email: '',
        password: '',
        trial_days: 30, // Automatic free trial for self-registers
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Sends public registration request to backend API
            await api.post('/schools/register', formData);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
                    <h2 className="text-2xl font-bold text-green-600 mb-2">School Registered Successfully! 🎉</h2>
                    <p className="text-gray-600 mb-6">
                        Your school has been set up with a free trial. You can now log in using your administrator credentials.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
                    >
                        Proceed to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-extrabold text-gray-900">Register Your School</h2>
                    <p className="text-sm text-gray-600 mt-1">Start your automated trial on Dono School ERP instantly</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            placeholder="e.g. Apex High School"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">School Code / Slug</label>
                            <input
                                type="text"
                                name="school_code"
                                required
                                value={formData.school_code}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                placeholder="e.g. APEX-01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">School Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-md font-bold text-gray-900 mb-3">Administrator Account Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Admin Full Name</label>
                                <input
                                    type="text"
                                    name="admin_name"
                                    required
                                    value={formData.admin_name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                                    <input
                                        type="email"
                                        name="admin_email"
                                        required
                                        value={formData.admin_email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition shadow"
                        >
                            {loading ? 'Setting up your school...' : 'Complete Registration & Start Trial'}
                        </button>
                    </div>

                    <div className="text-center mt-4 text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">
                            Log in here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

