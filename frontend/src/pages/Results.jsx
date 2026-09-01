import { useEffect, useState } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

export default function Results({ setPage }) {
  const { permissions = [] } = useAuth();
  const [examinations, setExaminations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("submissions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reopenTarget, setReopenTarget] = useState(null);
  const [reopenReason, setReopenReason] = useState("");

  const canEnterScores = permissions.includes("manage_exam_scores");
  const canApprove = permissions.includes("approve_results");

  async function loadData() {
    try {
      setLoading(true); setError("");
      const [examResponse, submissionResponse] = await Promise.all([api.get("/examinations"), api.get("/result-submissions")]);
      setExaminations(arrayFromResponse(examResponse));
      setSubmissions(arrayFromResponse(submissionResponse));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load result submissions.");
      setSubmissions([]); setExaminations([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function transition(id, action, successMessage, payload = {}) {
    try { setError(""); setMessage(""); await api.post(`/result-submissions/${id}/${action}`, action === "approve" ? { approval_note: "Approved after academic review." } : payload); setMessage(successMessage); await loadData(); }
    catch (requestError) { setError(requestError?.response?.data?.message || `Unable to ${action} this submission.`); }
  }

  async function confirmReopen() {
    if (!reopenTarget || reopenReason.trim().length < 10) {
      setError("Please explain the correction in at least 10 characters before reopening.");
      return;
    }
    await transition(reopenTarget.id, "reopen", "Submission reopened for correction.", { reason: reopenReason.trim() });
    setReopenTarget(null);
    setReopenReason("");
  }

  return <PageContainer>
    <PageHeader title="Exams & Result Submissions" subtitle="Review teacher score submissions and publish approved results to student and parent portals." action={canEnterScores ? <button type="button" onClick={() => setPage?.("result-entry")} className="btn-primary">Open Score Entry</button> : null} />
    {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}<button type="button" onClick={loadData} className="ml-3 font-semibold underline">Retry</button></div>}
    {message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
    <div className="mb-5 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><button type="button" onClick={() => setActiveTab("submissions")} className={`min-h-11 whitespace-nowrap rounded-lg px-4 text-sm font-semibold ${activeTab === "submissions" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Result submissions ({submissions.length})</button><button type="button" onClick={() => setActiveTab("examinations")} className={`min-h-11 whitespace-nowrap rounded-lg px-4 text-sm font-semibold ${activeTab === "examinations" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Scheduled examinations ({examinations.length})</button></div>
    {reopenTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Reopen result submission</h2><p className="mt-1 text-sm text-slate-600">Explain why this locked or published submission needs correction. The reason is saved in the audit trail.</p><textarea autoFocus required minLength={10} maxLength={1000} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} placeholder="For example: corrected a transposed examination score after signed mark-sheet review" className="mt-4 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setReopenTarget(null); setReopenReason(""); }} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" onClick={confirmReopen} disabled={reopenReason.trim().length < 10} className="btn-primary disabled:opacity-50">Confirm reopen</button></div></div></div>}
    {loading ? <LoadingSpinner text="Loading academic records..." /> : activeTab === "submissions" ? <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">{submissions.length === 0 ? <EmptyState title="No result submissions" message="Teacher score sheets will appear here after they are saved and submitted." /> : <table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Class</th><th className="p-4">Subject</th><th className="p-4">Session / term</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody className="divide-y">{submissions.map((submission) => <tr key={submission.id}><td className="p-4 font-semibold">{submission.class?.name || "—"}</td><td className="p-4">{submission.subject?.name || "—"}</td><td className="p-4">{submission.academic_session?.name || submission.academicSession?.name || "—"} / {submission.term?.name || "—"}</td><td className="p-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{submission.status || "draft"}</span></td><td className="p-4"><div className="flex flex-wrap gap-2">{canApprove && submission.status === "submitted" && <button type="button" onClick={() => transition(submission.id, "approve", "Submission approved.")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve</button>}{canApprove && submission.status === "approved" && <button type="button" onClick={() => transition(submission.id, "publish", "Results published.")} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Publish</button>}{canApprove && ["submitted", "approved", "published"].includes(submission.status) && <button type="button" onClick={() => { setReopenTarget(submission); setReopenReason(""); setError(""); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Reopen</button>}</div></td></tr>)}</tbody></table>}</section> : <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">{examinations.length === 0 ? <EmptyState title="No scheduled examinations" message="Create an examination schedule before teachers enter results." /> : <table className="min-w-[680px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Dates</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y">{examinations.map((exam) => <tr key={exam.id}><td className="p-4 font-semibold">{exam.name}</td><td className="p-4">{exam.exam_type || "Examination"}</td><td className="p-4">{exam.start_date || "—"} – {exam.end_date || "—"}</td><td className="p-4">{exam.status || "Draft"}</td></tr>)}</tbody></table>}</section>}
  </PageContainer>;
}
