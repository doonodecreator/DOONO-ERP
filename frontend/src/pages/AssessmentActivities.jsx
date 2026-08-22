import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const initial = { type: "external_exam", name: "", exam_body: "", scheduled_date: "", candidate_count: "", notes: "" };
const values = (response) => { const value = response?.data?.data ?? response?.data ?? []; if (Array.isArray(value)) return value; if (Array.isArray(value?.data)) return value.data; return []; };

export default function AssessmentActivities({ mode = "external_exam" }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...initial, type: mode });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const title = mode === "practical" ? "Practicals" : "External Examinations (WAEC / NECO)";

  async function load() {
    try {
      setLoading(true); setError("");
      const response = await api.get("/assessment-activities", { params: { type: mode, per_page: 50 } });
      setItems(values(response));
    } catch (err) { setItems([]); setError(err.response?.data?.message || `Unable to load ${title.toLowerCase()}.`); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [mode]);

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      await api.post("/assessment-activities", { ...form, type: mode, candidate_count: form.candidate_count ? Number(form.candidate_count) : null });
      setForm({ ...initial, type: mode }); setShowForm(false); setMessage(`${title} record created.`); await load();
    } catch (err) { const errors = err.response?.data?.errors; setError(errors ? Object.values(errors)?.[0]?.[0] : err.response?.data?.message || "Unable to save assessment activity."); } finally { setSaving(false); }
  }

  return <PageContainer><PageHeader title={title} subtitle="Plan and track school-scoped assessment activities." action={<button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{showForm ? "Close" : `Add ${mode === "practical" ? "practical" : "external exam"}`}</button>} />{error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></div>}{message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}{showForm && <form onSubmit={submit} className="mb-6 space-y-4 rounded-xl border bg-white p-4 shadow-sm"><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label><label className="text-sm font-semibold">{mode === "practical" ? "Subject / practical area" : "Exam body"}<input value={mode === "practical" ? form.name : form.exam_body} onChange={(event) => setForm(mode === "practical" ? { ...form, name: event.target.value } : { ...form, exam_body: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label><label className="text-sm font-semibold">Scheduled date<input type="date" value={form.scheduled_date} onChange={(event) => setForm({ ...form, scheduled_date: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label><label className="text-sm font-semibold">Candidate count<input type="number" min="0" value={form.candidate_count} onChange={(event) => setForm({ ...form, candidate_count: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label></div><label className="block text-sm font-semibold">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 min-h-20 w-full rounded-lg border p-2 font-normal" /></label><button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save record"}</button></form>}{loading ? <LoadingSpinner /> : items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()}`} message="Create the first record for this school." /> : <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{item.name}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{item.status}</span></div><p className="mt-2 text-sm text-slate-600">{item.exam_body || "School assessment"}{item.scheduled_date ? ` · ${item.scheduled_date}` : ""}</p>{item.notes && <p className="mt-1 text-sm text-slate-600">{item.notes}</p>}</article>)}</div>}</PageContainer>;
}
