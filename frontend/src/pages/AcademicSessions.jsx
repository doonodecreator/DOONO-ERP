import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const emptyForm = { name: "", start_date: "", end_date: "", is_current: true };
const listFromResponse = (response) => {
    const value = response?.data?.data?.data ?? response?.data?.data ?? response?.data;
    return Array.isArray(value) ? value : [];
};

export default function AcademicSessions() {
    const [sessions, setSessions] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadSessions = async () => {
        setLoading(true);
        setError("");
        try {
            setSessions(listFromResponse(await api.get("/academic-sessions")));
        } catch (err) {
            setSessions([]);
            setError(err.response?.data?.message || "Unable to load academic sessions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const saveSession = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await api.post("/academic-sessions", form);
            setForm(emptyForm);
            await loadSessions();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save academic session.");
        } finally {
            setSubmitting(false);
        }
    };

    return <div className="p-6">
        <PageHeader title="Academic Sessions" subtitle="Create the school year or academic cycle before adding terms." />
        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700"><span>{error}</span><button type="button" onClick={loadSessions} className="ml-4 font-semibold underline">Retry</button></div>}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Add Academic Session</h2>
            <form onSubmit={saveSession} className="grid gap-4 md:grid-cols-2">
                <input required name="name" value={form.name} onChange={handleChange} placeholder="e.g. 2026/2027" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
                <input required type="date" name="start_date" value={form.start_date} onChange={handleChange} className="rounded-lg border border-slate-300 px-3 py-2" />
                <input required type="date" name="end_date" value={form.end_date} onChange={handleChange} className="rounded-lg border border-slate-300 px-3 py-2" />
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" name="is_current" checked={form.is_current} onChange={handleChange} /> Current academic session</label>
                <button disabled={submitting} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50 md:w-fit">{submitting ? "Saving..." : "Save Session"}</button>
            </form>
        </div>
        {loading ? <LoadingSpinner text="Loading academic sessions..." /> : sessions.length === 0 ? <EmptyState title="No academic sessions yet" message="Create the first session for this school." /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Session</th><th className="px-5 py-3">Start</th><th className="px-5 py-3">End</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{sessions.map((session) => <tr key={session.id}><td className="px-5 py-4 font-semibold">{session.name}</td><td className="px-5 py-4">{session.start_date || "—"}</td><td className="px-5 py-4">{session.end_date || "—"}</td><td className="px-5 py-4">{session.is_current ? "Current" : "Archived"}</td></tr>)}</tbody></table></div>}
    </div>;
}
