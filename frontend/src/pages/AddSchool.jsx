import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AddSchool({ onSchoolAdded }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        short_name: '',
        school_type: 'Combined',
        has_primary: true,
        has_secondary: true,
        school_code: '',
        country_id: '',
        email: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        api.get('/countries')
            .then((res) => {
                setCountries(res.data.data || []);
            })
            .catch(() => {
                setCountries([]);
            })
            .finally(() => {
                setLoadingCountries(false);
            });
    }, []);

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
            const response = await api.post('/schools', {
                ...formData,
                country_id: formData.country_id ? Number(formData.country_id) : null,
            });

            if (typeof onSchoolAdded === 'function') {
                await onSchoolAdded(response.data);
            }

        } catch (err) {
            setError(
                JSON.stringify(err.message ?? err, null, 2)
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#090d16',
                color: '#ffffff',
                padding: '40px 16px',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            <div
                style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    padding: '32px',
                    borderRadius: '16px',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2>Setup Your First School</h2>
                    <p>Register your first school to continue.</p>
                </div>

                {error && (
                    <pre
                        style={{
                            whiteSpace: 'pre-wrap',
                            background: '#450a0a',
                            color: '#fca5a5',
                            padding: '12px',
                            borderRadius: '8px',
                            overflowX: 'auto',
                            marginBottom: '20px',
                        }}
                    >
                        {error}
                    </pre>
                )}

                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                    <input
                        name="name"
                        placeholder="School Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="short_name"
                        placeholder="Short Name"
                        value={formData.short_name}
                        onChange={handleChange}
                    />

                    <input
                        name="school_code"
                        placeholder="School Code"
                        value={formData.school_code}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="school_type"
                        value={formData.school_type}
                        onChange={handleChange}
                    >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Combined">Combined</option>
                    </select>

                    <select
                        name="country_id"
                        value={formData.country_id}
                        onChange={handleChange}
                        required
                        disabled={loadingCountries}
                    >
                        <option value="">
                            {loadingCountries ? 'Loading countries...' : 'Select country'}
                        </option>
                        {countries.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="email"
                        name="email"
                        placeholder="School Email"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <input
                        name="phone"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <textarea
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleChange}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating School...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
}
