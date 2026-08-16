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
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

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
            setFormData({ name: '', email: '', phone: '' });
            loadOrganizations();
        } catch (err) { alert("Failed to create organization."); }
    }

    if (loading && organizations.length === 0) return <PageContainer><LoadingSpinner /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader 
                title="Organizations" 
                subtitle="Platform-wide organization management" 
                action={<button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">{showForm ? 'Cancel' : '+ New Organization'}</button>}
            />
            
            {showForm && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input className="border p-2 rounded-lg" placeholder="Org Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        <input className="border p-2 rounded-lg" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        <input className="border p-2 rounded-lg" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                        <button type="submit" className="bg-indigo-600 text-white py-2 rounded-lg font-bold">Create</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
