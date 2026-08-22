import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import { arrayFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const initialForm = { class_id: "", stream_id: "", subject_id: "", title: "", description: "", due_date: "", status: "Draft" };

function submissionFor(assignment) {
  return Array.isArray(assignment?.submissions) ? assignment.submissions[0] : null;
}

export default function Assignments() {
  const { permissions = [], roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canManage = permissions.includes("manage_assignments");
  const isStudent = role === "student" || (!canManage && permissions.includes("portal_student_access"));
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [submissionText, setSubmissionText] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      if (isStudent) {
        const response = await api.get("/student/assignments");
        setAssignments(arrayFromResponse(response));
      } else {
        const requests = await Promise.allSettled([api.get("/assignments", { params: { per_page: 100 } }), api.get("/classes"), api.get("/subjects"), api.get("/streams")]);
        const assignmentResponse = requests[0];
        if (assignmentResponse.status !== "fulfilled") throw assignmentResponse.reason;
        setAssignments(arrayFromResponse(assignmentResponse.value));
        if (requests[1].status === "fulfilled") setClasses(arrayFromResponse(requests[1].value));
        if (requests[2].status === "fulfilled") setSubjects(arrayFromResponse(requests[2].value));
        if (requests[3].status === "fulfilled") setStreams(arrayFromResponse(requests[3].value));
      }
    } catch (requestError) {
      setAssignments([]);
      setError(requestError?.response?.data?.message || (isStudent ? "Unable to load your assignments." : "Unable to load assignments."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [isStudent]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "class_id" ? value : value }));
  }

  async function saveAssignment(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post("/assignments", { ...form, class_id: Number(form.class_id), subject_id: Number(form.subject_id), stream_id: form.stream_id ? Number(form.stream_id) : null });
      setForm(initialForm);
      setShowForm(false);
      setMessage(response?.data?.message || "Assignment saved. Published assignments are now visible to matching students.");
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to save assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAssignment(assignment) {
    const answerText = submissionText[assignment.id]?.trim();
    if (!answerText) { setError("Write an answer before submitting."); return; }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post(`/assignments/${assignment.id}/submit`, { answer_text: answerText });
      setMessage(response?.data?.message || "Assignment submitted successfully.");
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to submit this assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function openSubmissions(assignment) {
    setSelectedAssignment(assignment);
    setError("");
    try {
      const response = await api.get(`/assignments/${assignment.id}/submissions`, { params: { per_page: 200 } });
      const records = arrayFromResponse(response);
      setSubmissions(records);
      setReviewDrafts(Object.fromEntries(records.map((item) => [item.id, { status: item.status === "Submitted" ? "Reviewed" : item.status, grade: item.grade ?? "", feedback: item.feedback ?? "" }])));
    } catch (requestError) {
      setSubmissions([]);
      setError(requestError?.response?.data?.message || "Unable to load assignment submissions.");
    }
  }

  async function saveReview(submission) {
    const draft = reviewDrafts[submission.id] || { status: "Reviewed", grade: "", feedback: "" };
    setReviewing(submission.id);
    setError("");
    try {
      await api.post(`/assignments/${selectedAssignment.id}/submissions/${submission.id}/review`, { ...draft, grade: draft.grade === "" ? null : Number(draft.grade) });
      setMessage("Submission review saved.");
      await openSubmissions(selectedAssignment);
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to save review.");
    } finally {
      setReviewing(null);
    }
  }

  const classStreams = streams.filter((stream) => String(stream.class_id) === String(form.class_id));

  if (isStudent) {
    return <PageContainer>
      <PageHeader title="My Assignments" subtitle="Published assignments for your current class and stream. Submit your work before the due date." />
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} <button type="button" onClick={loadData} className="ml-2 underline">Retry</button></div>}
      {message && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      {loading ? <LoadingSpinner text="Loading your assignments..." /> : assignments.length === 0 ? <EmptyState title="No published assignments" message="Your teachers have not published an assignment for your class yet." /> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{assignments.map((assignment) => { const submission = submissionFor(assignment); const answered = Boolean(submission?.answer_text); const locked = submission?.status === "Reviewed"; return <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-slate-900">{assignment.title}</h2><span className={`rounded-full px-2 py-1 text-xs font-semibold ${locked ? "bg-emerald-100 text-emerald-700" : answered ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{submission?.status || "Not submitted"}</span></div><p className="mt-2 text-sm text-slate-600">{assignment.subject?.name || "Subject"} · {assignment.class?.name || "Class"}{assignment.stream?.name ? ` · ${assignment.stream.name}` : ""}</p><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{assignment.description || "No additional instructions."}</p>{assignment.due_date && <p className="mt-4 text-xs font-semibold text-slate-500">Due {assignment.due_date}</p>}{submission?.feedback && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-700">Teacher feedback</p><p className="mt-1 text-slate-600">{submission.feedback}</p>{submission.grade !== null && submission.grade !== undefined && <p className="mt-1 font-semibold text-indigo-700">Grade: {submission.grade}%</p>}</div>}{!locked && <div className="mt-4"><textarea value={submissionText[assignment.id] ?? submission?.answer_text ?? ""} onChange={(event) => setSubmissionText((current) => ({ ...current, [assignment.id]: event.target.value }))} rows={5} placeholder="Type your answer here..." className="w-full rounded-lg border border-slate-300 p-3 text-sm" /><button type="button" disabled={saving} onClick={() => submitAssignment(assignment)} className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting..." : answered ? "Resubmit work" : "Submit work"}</button></div>}</article>; })}</div>}
    </PageContainer>;
  }

  return <PageContainer>
    <PageHeader title="Assignments" subtitle="Create assignments, publish them to a class or stream, and review student submissions." action={canManage ? <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{showForm ? "Close" : "New assignment"}</button> : null} />
    {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} <button type="button" onClick={loadData} className="ml-2 underline">Retry</button></div>}
    {message && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
    {showForm && canManage && <form onSubmit={saveAssignment} className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Create an assignment</h2><p className="text-sm text-slate-500">Save as Draft while preparing, or choose Published to send it immediately to matching students.</p><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><input required name="title" value={form.title} onChange={updateForm} placeholder="Assignment title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" /><select required name="class_id" value={form.class_id} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select target class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="stream_id" value={form.stream_id} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All streams in this class</option>{classStreams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select required name="subject_id" value={form.subject_id} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="date" name="due_date" value={form.due_date} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select name="status" value={form.status} onChange={updateForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="Draft">Draft</option><option value="Published">Publish now</option><option value="Closed">Closed</option></select><textarea name="description" value={form.description} onChange={updateForm} placeholder="Instructions for students" className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" /></div><button disabled={saving} type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save assignment"}</button></form>}
    {loading ? <LoadingSpinner text="Loading assignments..." /> : assignments.length === 0 ? <EmptyState title="No assignments found" message={canManage ? "Create your first assignment above." : "There are no assignments available to this role."} /> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{assignments.map((assignment) => <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-slate-900">{assignment.title}</h2><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{assignment.status}</span></div><p className="mt-2 text-sm text-slate-600">{assignment.subject?.name || "Subject"} · {assignment.class?.name || "Class"}{assignment.stream?.name ? ` · ${assignment.stream.name}` : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">{assignment.description || "No additional instructions."}</p>{assignment.due_date && <p className="mt-4 text-xs font-semibold text-slate-500">Due {assignment.due_date}</p>}<div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-slate-500"><span>{assignment.submitted_count ?? 0} submitted{assignment.submissions_count !== undefined ? ` of ${assignment.submissions_count}` : ""}</span>{canManage && <button type="button" onClick={() => openSubmissions(assignment)} className="rounded-lg border border-indigo-200 px-3 py-2 font-semibold text-indigo-700">Review submissions</button>}</div></article>)}</div>}

    {selectedAssignment && <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 md:items-center md:p-6"><section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-5 md:rounded-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Submissions: {selectedAssignment.title}</h2><p className="text-sm text-slate-500">Review answers and return feedback to students.</p></div><button type="button" onClick={() => setSelectedAssignment(null)} className="rounded-lg border px-3 py-2 text-sm">Close</button></div>{submissions.length === 0 ? <EmptyState title="No submissions yet" message="Students will appear here after they submit work." /> : <div className="mt-5 space-y-4">{submissions.map((submission) => { const draft = reviewDrafts[submission.id] || { status: "Reviewed", grade: "", feedback: "" }; return <article key={submission.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{submission.student?.full_name || [submission.student?.first_name, submission.student?.middle_name, submission.student?.last_name].filter(Boolean).join(" ") || submission.student?.admission_number || "Student"}</p><p className="text-xs text-slate-500">{submission.submitted_at ? `Submitted ${new Date(submission.submitted_at).toLocaleString()}` : "Not submitted"}{submission.is_late ? " · Late" : ""}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{submission.status}</span></div><div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{submission.answer_text || "No answer text."}</div><div className="mt-3 grid gap-2 md:grid-cols-[130px_1fr]"><select value={draft.status} onChange={(event) => setReviewDrafts((current) => ({ ...current, [submission.id]: { ...draft, status: event.target.value } }))} className="rounded-lg border p-2 text-sm"><option value="Reviewed">Reviewed</option><option value="Returned">Return for correction</option></select><input type="number" min="0" max="100" value={draft.grade} onChange={(event) => setReviewDrafts((current) => ({ ...current, [submission.id]: { ...draft, grade: event.target.value } }))} placeholder="Grade (%)" className="rounded-lg border p-2 text-sm" /><textarea value={draft.feedback} onChange={(event) => setReviewDrafts((current) => ({ ...current, [submission.id]: { ...draft, feedback: event.target.value } }))} rows={3} placeholder="Teacher feedback" className="rounded-lg border p-2 text-sm md:col-span-2" /></div><button type="button" disabled={reviewing === submission.id} onClick={() => saveReview(submission)} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{reviewing === submission.id ? "Saving..." : "Save review"}</button></article>; })}</div>}</section></div>}
  </PageContainer>;
}
