import React, { useState } from 'react';
import api from '../services/api';

export default function PublicRegister() {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        admin_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
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
            await api.post('/register', formData);
            setSuccess(true);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 
                             (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) || 
                             err.message || 
                             'Registration failed. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80', marginBottom: '12px' }}>Organization Created! 🎉</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
                        Your institution account is ready. You can now log in to add your schools, choose countries, and set up divisions.
                    </p>
                    <a
                        href="/login"
                        style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none' }}
                    >
                        Proceed to Login Portal
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#ffffff', padding: '40px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: '540px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>Create Organization Account</h2>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>Set up your institutional group workspace on Dono ERP</p>
                </div>

                {error && <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', fontSize: '14px', lineHeight: '1.4' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Organization / Group Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                            placeholder="e.g. Zenda Educational Group"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Organization Code</label>
                            <input
                                type="text"
                                name="code"
                                required
                                value={formData.code}
                                onChange={handleChange}
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="e.g. ZEN"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="e.g. 07043617971"
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #334155', paddingTop: '16px', marginTop: '8px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>Super Admin Credentials</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Full Name</label>
                                <input
                                    type="text"
                                    name="admin_name"
                                    required
                                    value={formData.admin_name}
                                    onChange={handleChange}
                                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                    placeholder="e.g. Mvenda Joseph"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                    placeholder="e.g. mvenda@gmail.com"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    required
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ paddingTop: '12px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '16px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}
                        >
                            {loading ? 'Creating Organization...' : 'Create Organization Workspace'}
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: '#94a3b8' }}>
                        Already have an account?{' '}
                        <a href="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '600' }}>
                            Log in here
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

