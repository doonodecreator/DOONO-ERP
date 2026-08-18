import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const emptyForm = { academic_session_id: "", name: "", start_date: "", end_date: "", is_current: true, status: "active" };
const listFromResponse = (response) => {
    const value = response?.data?.data?.data ?? response?.data?.data ?? response?.data;
    return Array.isArray(value) ? value : [];
};

export default function Terms() {
    const [terms, setTerms] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [termsResponse, sessionsResponse] = await Promise.all([api.get("/terms"), api.get("/academic-sessions")]);
            setTerms(listFromResponse(termsResponse));
            setSessions(listFromResponse(sessionsResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load terms and academic sessions.");
            setTerms([]);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const saveTerm = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/terms", form);
            setForm(emptyForm);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save term.");
        } finally {
            setSubmitting(false);
        }
    };

    return <div className="p-6">
        <PageHeader title="Terms" subtitle="Create the terms that belong to an academic session." />
        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700"><span>{error}</span><button type="button" onClick={loadData} className="ml-4 font-semibold underline">Retry</button></div>}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Add Term</h2>
            <form onSubmit={saveTerm} className="grid gap-4 md:grid-cols-2">
                <select required name="academic_session_id" value={form.academic_session_id} onChange={handleChange} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select academic session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}</select>
                <select required name="name" value={form.name} onChange={handleChange} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select term</option><option>First Term</option><option>Second Term</option><option>Third Term</option></select>
                <input required type="date" name="start_date" value={form.start_date} onChange={handleChange} className="rounded-lg border border-slate-300 px-3 py-2" />
                <input required type="date" name="end_date" value={form.end_date} onChange={handleChange} className="rounded-lg border border-slate-300 px-3 py-2" />
                <select name="status" value={form.status} onChange={handleChange} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="active">Active</option><option value="closed">Closed</option></select>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" name="is_current" checked={form.is_current} onChange={handleChange} /> Current term</label>
                <button disabled={submitting} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50 md:col-span-2 md:w-fit">{submitting ? "Saving..." : "Save Term"}</button>
            </form>
        </div>
        {loading ? <LoadingSpinner text="Loading terms..." /> : terms.length === 0 ? <EmptyState title="No terms yet" message="Create a term after adding an academic session." /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Session</th><th className="px-5 py-3">Term</th><th className="px-5 py-3">Start</th><th className="px-5 py-3">End</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{terms.map((term) => <tr key={term.id}><td className="px-5 py-4">{term.academic_session?.name || "—"}</td><td className="px-5 py-4 font-semibold">{term.name}</td><td className="px-5 py-4">{term.start_date || "—"}</td><td className="px-5 py-4">{term.end_date || "—"}</td><td className="px-5 py-4">{term.is_current ? "Current" : term.status || "Inactive"}</td></tr>)}</tbody></table></div>}
    </div>;
}
