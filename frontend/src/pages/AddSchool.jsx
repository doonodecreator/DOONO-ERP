import React, { useState } from 'react';
import api from '../services/api';

export default function AddSchool({ onSchoolAdded }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        short_name: '',
        school_type: 'Combined',
        has_primary: true,
        has_secondary: true,
        school_code: '',
        country_id: 1, // Default country ID
        email: '',
        phone: '',
        address: '',
        status: 'active',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/schools', formData);
            if (typeof onSchoolAdded === 'function') {
                onSchoolAdded();
            } else {
                window.location.reload();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 
                             (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) || 
                             'Failed to create school. Please check your inputs.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#ffffff', padding: '40px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>Setup Your First School 🏫</h2>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>Please register your school institution details to unlock your ERP dashboard.</p>
                </div>

                {error && <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>School Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Zenda Model Secondary School"
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>School Code</label>
                            <input
                                type="text"
                                name="school_code"
                                required
                                value={formData.school_code}
                                onChange={handleChange}
                                placeholder="e.g. ZMSS"
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>School Type</label>
                            <select
                                name="school_type"
                                value={formData.school_type}
                                onChange={handleChange}
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}
                            >
                                <option value="Primary">Primary</option>
                                <option value="Secondary">Secondary</option>
                                <option value="Combined">Combined</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Country ID</label>
                            <input
                                type="number"
                                name="country_id"
                                required
                                value={formData.country_id}
                                onChange={handleChange}
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>School Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="school@domain.com"
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone number"
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Address</label>
                        <textarea
                            name="address"
                            rows="2"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Physical location address..."
                            style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ paddingTop: '12px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '16px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}
                        >
                            {loading ? 'Registering School...' : 'Complete Setup & Open Dashboard'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

