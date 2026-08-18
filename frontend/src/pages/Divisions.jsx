import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const emptyForm = { name: "", code: "", display_order: 1, is_active: true };
const listFromResponse = (response) => {
    const value = response?.data?.data?.data ?? response?.data?.data ?? response?.data;
    return Array.isArray(value) ? value : [];
};

export default function Divisions() {
    const [divisions, setDivisions] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");

    const loadDivisions = async () => {
        setLoading(true);
        setError("");
        try {
            setDivisions(listFromResponse(await api.get("/divisions")));
        } catch (err) {
            setDivisions([]);
            setError(err.response?.data?.message || "Unable to load divisions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDivisions(); }, []);

    const openModal = (division = null) => {
        setEditingId(division?.id || null);
        setForm(division ? { name: division.name || "", code: division.code || "", display_order: division.display_order || 1, is_active: division.is_active ?? true } : emptyForm);
        setFormError("");
        setShowModal(true);
    };

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const saveDivision = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setFormError("");
        try {
            if (editingId) await api.put(`/divisions/${editingId}`, form);
            else await api.post("/divisions", form);
            setShowModal(false);
            setForm(emptyForm);
            await loadDivisions();
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            setFormError(validationErrors ? Object.values(validationErrors).flat().join(" ") : (err.response?.data?.message || "Unable to save division."));
        } finally {
            setSubmitting(false);
        }
    };

    const deleteDivision = async (division) => {
        if (!window.confirm(`Delete ${division.name}?`)) return;
        try {
            await api.delete(`/divisions/${division.id}`);
            await loadDivisions();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to delete division.");
        }
    };

    return <div className="p-6">
        <PageHeader title="Divisions" subtitle="Create the broad school sections before defining classes and streams." action={<button type="button" onClick={() => openModal()} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Add Division</button>} />
        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700"><span>{error}</span><button type="button" onClick={loadDivisions} className="ml-4 font-semibold underline">Retry</button></div>}
        {loading ? <LoadingSpinner text="Loading divisions..." /> : divisions.length === 0 ? <EmptyState title="No divisions yet" message="Create divisions such as Nursery, Primary, or Secondary." /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Order</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{divisions.map((division) => <tr key={division.id}><td className="px-5 py-4 font-semibold text-slate-900">{division.name}</td><td className="px-5 py-4">{division.code || "—"}</td><td className="px-5 py-4">{division.display_order || "—"}</td><td className="px-5 py-4">{division.is_active ? "Active" : "Inactive"}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => openModal(division)} className="mr-3 font-semibold text-indigo-600">Edit</button><button type="button" onClick={() => deleteDivision(division)} className="font-semibold text-rose-600">Delete</button></td></tr>)}</tbody></table></div>}
        {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{editingId ? "Edit Division" : "Add Division"}</h2><button type="button" onClick={() => setShowModal(false)} className="text-slate-500">×</button></div>{formError && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formError}</div>}<form onSubmit={saveDivision} className="space-y-4"><input required name="name" value={form.name} onChange={handleChange} placeholder="Division name" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input name="code" value={form.code} onChange={handleChange} placeholder="Code (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input required min="1" type="number" name="display_order" value={form.display_order} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active division</label><div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button disabled={submitting} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Saving..." : "Save Division"}</button></div></form></div></div>}
    </div>;
}
