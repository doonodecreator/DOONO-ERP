import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import PageContainer from "../components/layout/PageContainer";

export default function Organizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', short_name: '', email: '', phone: '', address: '' });

    useEffect(() => { loadOrganizations(); }, []);

    async function loadOrganizations() {
        try {
            setLoading(true);
            const res = await api.get("/organizations");
            const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
            setOrganizations(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleCreate(e) {
        e.preventDefault();
        try {
            await api.post("/organizations", formData);
            setShowForm(false);
            setFormData({ name: '', short_name: '', email: '', phone: '', address: '' });
            loadOrganizations();
        } catch (err) { alert("Failed to create organization."); }
    }

    if (loading && organizations.length === 0) return <PageContainer><LoadingSpinner /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader 
                title="Organizations" 
                subtitle="Platform-wide organization management" 
                action={<button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: showForm ? '#ef4444' : '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', border: 'none' }}>{showForm ? 'Cancel' : '+ New Organization'}</button>}
            />
            
            {showForm && (
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>New Organization</h3>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Full Organization Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Short Name (e.g. DOONO)" value={formData.short_name} onChange={e => setFormData({...formData, short_name: e.target.value})} required />
                        <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} type="email" placeholder="Contact Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Contact Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                        <textarea style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Office Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Create Organization</button>
                    </form>
                </div>
            )}

            <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <DataTable 
                    columns={[
                        { key: "name", label: "Organization" },
                        { key: "owner", label: "Owner", render: (row) => row.owner?.name || "—" },
                        { key: "status", label: "Status" }
                    ]} 
                    data={organizations} 
                    emptyMessage="No organizations found. Create your first one above." 
                />
            </div>
        </PageContainer>
    );
}
