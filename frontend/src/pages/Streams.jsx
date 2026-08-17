import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import DataTable from "../components/tables/DataTable";

export default function Streams() {
  const [streams, setStreams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ class_id: '', name: '', code: '', display_order: 1 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([api.get('/streams'), api.get('/classes')]);
      setStreams(sRes.data?.data?.data || sRes.data?.data || []);
      setClasses(cRes.data?.data?.data || cRes.data?.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/streams', formData);
      setShowForm(false); setFormData({ class_id: '', name: '', code: '', display_order: 1 });
      loadData();
    } catch (err) { alert("Failed to save stream."); }
  };

  return (
    <PageContainer>
      <PageHeader title="Academic Streams" subtitle="Manage class sections (e.g. Gold, Silver, A, B)" action={<button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">{showForm ? "Cancel" : "+ New Stream"}</button>} />
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <select className="w-full p-3 rounded-xl border border-slate-200" value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} required>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="w-full p-3 rounded-xl border border-slate-200" placeholder="Stream Name (e.g. Gold)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Stream</button>
          </form>
        </div>
      )}
      {loading ? <LoadingSpinner /> : <DataTable columns={[{ key: "name", label: "Stream" }, { key: "class", label: "Class", render: (row) => row.class?.name || "—" }]} data={streams} emptyMessage="No streams found." />}
    </PageContainer>
  );
}
