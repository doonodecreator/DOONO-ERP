import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const initial = { student_id: "", leave_type: "Other", start_date: "", end_date: "", reason: "" };
const list = (response) => { const value = response?.data?.data ?? response?.data ?? []; if (Array.isArray(value)) return value; if (Array.isArray(value?.data)) return value.data; return []; };

export default function LeaveApplication() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const endpoint = role === "student" ? "/student/leave-applications" : "/portal/leave-applications";
      const response = await api.get(endpoint);
      const entries = list(response);
      setItems(entries);
      const owned = entries.map((entry) => entry.student).filter(Boolean);
      setStudents(owned.filter((student, index, all) => all.findIndex((item) => item.id === student.id) === index));
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.message || "Unable to load leave applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [role]);

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const endpoint = role === "student" ? "/student/leave-applications" : "/portal/leave-applications";
      await api.post(endpoint, { ...form, student_id: Number(form.student_id) });
      setForm(initial);
      setMessage("Leave application submitted for review.");
      await load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)?.[0]?.[0] : err.response?.data?.message || "Unable to submit leave application.");
    } finally { setSaving(false); }
  }

  return <PageContainer><PageHeader title="Apply for Leave" subtitle="Submit and track leave applications for linked students." />{error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></div>}{message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={submit} className="mb-6 space-y-4 rounded-xl border bg-white p-4 shadow-sm"><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-semibold">Student<select required value={form.student_id} onChange={(event) => setForm({ ...form, student_id: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal"><option value="">Select linked student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ")}</option>)}</select></label><label className="text-sm font-semibold">Leave type<select value={form.leave_type} onChange={(event) => setForm({ ...form, leave_type: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal"><option>Medical</option><option>Family</option><option>Religious</option><option>Other</option></select></label><label className="text-sm font-semibold">Start date<input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label><label className="text-sm font-semibold">End date<input required type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label></div><label className="block text-sm font-semibold">Reason<textarea required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-1 min-h-24 w-full rounded-lg border p-2 font-normal" /></label><button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Submitting..." : "Submit application"}</button></form>{loading ? <LoadingSpinner /> : items.length === 0 ? <EmptyState title="No leave applications" message="Submitted applications will appear here." /> : <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{item.student?.full_name || "Student leave"}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{item.status}</span></div><p className="mt-2 text-sm text-slate-600">{item.start_date} to {item.end_date}</p><p className="mt-1 text-sm text-slate-600">{item.reason}</p></article>)}</div>}</PageContainer>;
}
