import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import DataTable from "../components/tables/DataTable";

export default function Divisions() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', display_order: 1, is_active: true });

  useEffect(() => { loadDivisions(); }, []);

  const loadDivisions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/divisions');
      const items = res.data?.data?.data || res.data?.data || res.data || [];
      setDivisions(Array.isArray(items) ? items : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/divisions/${editingId}`, formData);
      else await api.post('/divisions', formData);
      setShowForm(false); setEditingId(null); setFormData({ name: '', code: '', display_order: 1, is_active: true });
      loadDivisions();
    } catch (err) { alert("Failed to save division."); }
  };

  return (
    <PageContainer>
      <PageHeader title="Academic Divisions" subtitle="Manage school levels (e.g. Primary, Secondary)" action={<button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">{showForm ? "Cancel" : "+ New Division"}</button>} />
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full p-3 rounded-xl border border-slate-200" placeholder="Division Name (e.g. Primary School)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input className="w-full p-3 rounded-xl border border-slate-200" placeholder="Code (e.g. PRI)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Division</button>
          </form>
        </div>
      )}
      {loading ? <LoadingSpinner /> : <DataTable columns={[{ key: "name", label: "Division" }, { key: "code", label: "Code" }, { key: "actions", label: "Actions", render: (row) => <button onClick={() => { setEditingId(row.id); setFormData(row); setShowForm(true); }} className="text-indigo-600 font-bold">Edit</button> }]} data={divisions} emptyMessage="No divisions found." />}
    </PageContainer>
  );
}
