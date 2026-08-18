import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const emptyForm = { class_id: "", name: "", code: "", display_order: 1, is_active: true };
const listFromResponse = (response) => {
    const value = response?.data?.data?.data ?? response?.data?.data ?? response?.data;
    return Array.isArray(value) ? value : [];
};

export default function Streams() {
    const [streams, setStreams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [streamsResponse, classesResponse] = await Promise.all([api.get("/streams"), api.get("/classes")]);
            setStreams(listFromResponse(streamsResponse));
            setClasses(listFromResponse(classesResponse));
        } catch (err) {
            setStreams([]);
            setClasses([]);
            setError(err.response?.data?.message || "Unable to load streams and classes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const saveStream = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await api.post("/streams", form);
            setForm(emptyForm);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save stream.");
        } finally {
            setSubmitting(false);
        }
    };

    return <div className="p-6">
        <PageHeader title="Streams" subtitle="Create streams under the classes that already belong to your school." />
        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700"><span>{error}</span><button type="button" onClick={loadData} className="ml-4 font-semibold underline">Retry</button></div>}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Add Stream</h2>
            <form onSubmit={saveStream} className="grid gap-4 md:grid-cols-2">
                <select required name="class_id" value={form.class_id} onChange={handleChange} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input required name="name" value={form.name} onChange={handleChange} placeholder="Stream name" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="code" value={form.code} onChange={handleChange} placeholder="Code (optional)" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input type="number" min="1" name="display_order" value={form.display_order} onChange={handleChange} className="rounded-lg border border-slate-300 px-3 py-2" />
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active stream</label>
                <button disabled={submitting} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50 md:w-fit">{submitting ? "Saving..." : "Save Stream"}</button>
            </form>
        </div>
        {loading ? <LoadingSpinner text="Loading streams..." /> : streams.length === 0 ? <EmptyState title="No streams yet" message="Create a stream after adding classes." /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Stream</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{streams.map((stream) => <tr key={stream.id}><td className="px-5 py-4 font-semibold">{stream.name}</td><td className="px-5 py-4">{stream.class?.name || classes.find((item) => String(item.id) === String(stream.class_id))?.name || "—"}</td><td className="px-5 py-4">{stream.code || "—"}</td><td className="px-5 py-4">{stream.is_active ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>}
    </div>;
}
