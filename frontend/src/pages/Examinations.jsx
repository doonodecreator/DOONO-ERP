import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { arrayFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const initialForm = {
  name: "",
  exam_type: "Examination",
  total_marks: 100,
  start_date: "",
  end_date: "",
  academic_session_id: "",
  term_id: "",
  status: "Draft",
};

export default function Examinations() {
  const { permissions = [], school } = useAuth();
  const canManage = permissions.includes("manage_examinations");
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [examResponse, sessionResponse, termResponse] = await Promise.all([
        api.get("/examinations"),
        api.get("/academic-sessions"),
        api.get("/terms"),
      ]);
      setRecords(arrayFromResponse(examResponse));
      setSessions(arrayFromResponse(sessionResponse));
      setTerms(arrayFromResponse(termResponse));
    } catch (requestError) {
      setRecords([]);
      setError(requestError?.response?.data?.message || "Unable to load examinations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveExamination = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/examinations", {
        ...form,
        school_id: school?.id,
        total_marks: Number(form.total_marks),
      });
      setForm(initialForm);
      setShowForm(false);
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to save examination.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Examinations"
        subtitle={canManage ? "Create and manage school examinations." : "Review school examinations and their schedules."}
        action={canManage ? <button type="button" onClick={() => setShowForm((current) => !current)} className="btn-primary">{showForm ? "Close" : "New Examination"}</button> : null}
      />

      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {showForm && canManage && (
        <form onSubmit={saveExamination} className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <input required name="name" value={form.name} onChange={updateForm} placeholder="Examination name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="exam_type" value={form.exam_type} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {['CA1', 'CA2', 'Mid-Term', 'Examination', 'Mock', 'Promotion', 'Other'].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select required name="academic_session_id" value={form.academic_session_id} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select academic session</option>
            {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
          <select required name="term_id" value={form.term_id} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select term</option>
            {terms.filter((term) => !form.academic_session_id || String(term.academic_session_id) === String(form.academic_session_id)).map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
          </select>
          <input required type="number" min="1" max="1000" name="total_marks" value={form.total_marks} onChange={updateForm} placeholder="Total marks" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="status" value={form.status} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {['Draft', 'Scheduled', 'Ongoing', 'Completed'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input required type="date" name="start_date" value={form.start_date} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required type="date" name="end_date" value={form.end_date} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button disabled={saving} type="submit" className="btn-primary md:col-span-2">{saving ? "Saving..." : "Save Examination"}</button>
        </form>
      )}

      {loading ? <LoadingSpinner text="Loading examinations..." /> : records.length === 0 ? <EmptyState title="No examinations found" message="School examinations will appear here once they are registered." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody>{records.map((record) => <tr key={record.id} className="border-b border-slate-100"><td className="px-4 py-3 font-semibold text-slate-800">{record.name}</td><td className="px-4 py-3">{record.exam_type}</td><td className="px-4 py-3">{record.start_date} – {record.end_date}</td><td className="px-4 py-3">{record.status}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
