import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import { arrayFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const makeRow = () => ({ question: "", options: ["", "", "", ""], correct_answer: "", marks: 1, question_order: 1 });
const initialBankForm = { subject_id: "", examination_id: "", section: "", topic: "", difficulty: "medium", marks: 1 };

function normalize(response) {
  return arrayFromResponse(response);
}

function parseTabSeparated(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const cells = line.split("\t").map((cell) => cell.trim());
    const options = [cells[1] || "", cells[2] || "", cells[3] || "", cells[4] || ""];
    return { question: cells[0] || "", options, correct_answer: cells[5] || options[0], marks: 1, question_order: index + 1 };
  }).filter((row) => row.question);
}

export default function CbtQuestionBank({ setPage }) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canManage = ["proprietor", "principal", "vice_principal_academic", "primary_headmaster", "secondary_principal", "teacher"].includes(role);
  const canReview = ["proprietor", "principal", "vice_principal_academic", "primary_headmaster", "secondary_principal"].includes(role);
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [bankForm, setBankForm] = useState(initialBankForm);
  const [rows, setRows] = useState([makeRow()]);
  const [pasteText, setPasteText] = useState("");
  const [filters, setFilters] = useState({ subject_id: "", section: "", topic: "", difficulty: "" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const questionRequest = api.get(role === "student" ? "/student/cbt-questions" : "/cbt-questions", { params: { per_page: 500, ...filters } });
      const requests = await Promise.allSettled([questionRequest, api.get("/subjects"), api.get("/examinations")]);
      const [questionResponse, subjectResponse, examinationResponse] = requests;
      if (questionResponse.status === "fulfilled") setItems(normalize(questionResponse.value));
      else throw questionResponse.reason;
      if (subjectResponse.status === "fulfilled") setSubjects(normalize(subjectResponse.value));
      if (examinationResponse.status === "fulfilled") setExaminations(normalize(examinationResponse.value));
    } catch (err) {
      setItems([]);
      setError(err?.response?.data?.message || "Unable to load CBT questions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [role, filters.subject_id, filters.section, filters.topic, filters.difficulty]);

  function updateBankForm(name, value) {
    setBankForm((current) => ({ ...current, [name]: value }));
  }

  function updateRow(index, field, value) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  }

  function updateOption(rowIndex, optionIndex, value) {
    setRows((current) => current.map((row, index) => index === rowIndex ? { ...row, options: row.options.map((option, optionIndexValue) => optionIndexValue === optionIndex ? value : option) } : row));
  }

  function addRow() {
    setRows((current) => [...current, { ...makeRow(), question_order: current.length + 1 }]);
  }

  function removeRow(index) {
    setRows((current) => current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({ ...row, question_order: rowIndex + 1 })));
  }

  function importRows() {
    const imported = parseTabSeparated(pasteText);
    if (!imported.length) {
      setError("Paste at least one tab-separated row: Question, Option A, Option B, Option C, Option D, Correct answer.");
      return;
    }
    setRows(imported.slice(0, 500));
    setPasteText("");
    setMessage(`${Math.min(imported.length, 500)} question rows loaded into the editor.`);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...bankForm,
        subject_id: bankForm.subject_id ? Number(bankForm.subject_id) : null,
        examination_id: bankForm.examination_id ? Number(bankForm.examination_id) : null,
        marks: Number(bankForm.marks),
        questions: rows.map((row, index) => ({ ...row, marks: Number(row.marks || bankForm.marks), question_order: Number(row.question_order || index + 1), options: row.options.filter(Boolean) })),
      };
      const response = await api.post("/cbt-questions/bulk", payload);
      setRows([makeRow()]);
      setBankForm(initialBankForm);
      setShowForm(false);
      setMessage(response?.data?.message || `${rows.length} questions added to the CBT bank.`);
      await load();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setError(errors ? Object.values(errors).flat()?.[0] : err?.response?.data?.message || "Unable to save question batch.");
    } finally {
      setSaving(false);
    }
  }

  async function reviewQuestion(id, approvalStatus) {
    try {
      setError("");
      setMessage("");
      await api.post(`/cbt-questions/${id}/review`, { approval_status: approvalStatus });
      setMessage(approvalStatus === "approved" ? "Question approved for assessment use." : "Question returned for correction.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Question review could not be saved.");
    }
  }

  const sections = [...new Set(items.map((item) => item.section).filter(Boolean))];

  return <PageContainer>
    <PageHeader title="Question Bank (CBT)" subtitle="Create and organize large subject question sets by section, topic, difficulty, and order." action={<div className="flex flex-wrap gap-2">{setPage && <button type="button" onClick={() => setPage("cbt-assessments")} className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700">Assessment setup</button>}{canManage ? <button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{showForm ? "Close" : "Add question set"}</button> : null}</div>} />
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></div>}
    {message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

    {showForm && canManage && <form onSubmit={submit} className="mb-6 max-h-[calc(100vh-10rem)] space-y-5 overflow-y-auto rounded-xl border bg-white p-4 shadow-sm">
      <div><h2 className="text-lg font-bold text-slate-900">Build a question set</h2><p className="mt-1 text-xs text-slate-500">Add one row at a time, add many rows, or paste up to 500 tab-separated questions at once.</p></div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><select value={bankForm.subject_id} onChange={(event) => updateBankForm("subject_id", event.target.value)} className="rounded-lg border p-2 text-sm"><option value="">Subject (optional)</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><select value={bankForm.examination_id} onChange={(event) => updateBankForm("examination_id", event.target.value)} className="rounded-lg border p-2 text-sm"><option value="">Assessment / examination (optional)</option>{examinations.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select><input value={bankForm.section} onChange={(event) => updateBankForm("section", event.target.value)} placeholder="Section e.g. Algebra" className="rounded-lg border p-2 text-sm" /><input value={bankForm.topic} onChange={(event) => updateBankForm("topic", event.target.value)} placeholder="Topic e.g. Linear equations" className="rounded-lg border p-2 text-sm" /><select value={bankForm.difficulty} onChange={(event) => updateBankForm("difficulty", event.target.value)} className="rounded-lg border p-2 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><input type="number" min="1" value={bankForm.marks} onChange={(event) => updateBankForm("marks", event.target.value)} placeholder="Default marks" className="rounded-lg border p-2 text-sm" /></div>
      <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-3"><label className="block text-sm font-semibold text-indigo-900">Paste many questions (optional)</label><p className="mt-1 text-xs text-indigo-700">One row per question: Question, Option A, Option B, Option C, Option D, Correct answer — separated with tabs.</p><textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} rows={4} placeholder="What is 2 + 2?\t3\t4\t5\t6\t4" className="mt-2 w-full rounded-lg border p-2 text-xs" /><button type="button" onClick={importRows} className="mt-2 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-700">Load pasted rows</button></div>
      <div className="space-y-4">{rows.map((row, rowIndex) => <div key={rowIndex} className="rounded-lg border border-slate-200 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-slate-700">Question {rowIndex + 1}</p><button type="button" onClick={() => removeRow(rowIndex)} disabled={rows.length === 1} className="text-xs font-semibold text-rose-600 disabled:opacity-40">Remove</button></div><textarea required value={row.question} onChange={(event) => updateRow(rowIndex, "question", event.target.value)} placeholder="Question text" className="mb-2 min-h-20 w-full rounded-lg border p-2 text-sm" /><div className="grid gap-2 md:grid-cols-2">{row.options.map((option, optionIndex) => <input key={optionIndex} required value={option} onChange={(event) => updateOption(rowIndex, optionIndex, event.target.value)} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} className="rounded-lg border p-2 text-sm" />)}</div><div className="mt-2 grid gap-2 md:grid-cols-3"><input required value={row.correct_answer} onChange={(event) => updateRow(rowIndex, "correct_answer", event.target.value)} placeholder="Correct answer exactly" className="rounded-lg border p-2 text-sm md:col-span-2" /><input type="number" min="1" value={row.marks} onChange={(event) => updateRow(rowIndex, "marks", event.target.value)} placeholder="Marks" className="rounded-lg border p-2 text-sm" /></div></div>)}</div>
      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t bg-white py-3"><button type="button" onClick={addRow} disabled={rows.length >= 500} className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50">+ Add another question</button><button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : `Save ${rows.length} question${rows.length === 1 ? "" : "s"}`}</button></div>
    </form>}

    <div className="mb-5 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4"><select value={filters.subject_id} onChange={(event) => setFilters({ ...filters, subject_id: event.target.value })} className="rounded-lg border p-2 text-sm"><option value="">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><select value={filters.section} onChange={(event) => setFilters({ ...filters, section: event.target.value })} className="rounded-lg border p-2 text-sm"><option value="">All sections</option>{sections.map((section) => <option key={section} value={section}>{section}</option>)}</select><input value={filters.topic} onChange={(event) => setFilters({ ...filters, topic: event.target.value })} placeholder="Filter topic" className="rounded-lg border p-2 text-sm" /><select value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })} className="rounded-lg border p-2 text-sm"><option value="">All difficulty levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>

    {loading ? <LoadingSpinner /> : items.length === 0 ? <EmptyState title="No CBT questions" message={canManage ? "Create a question set for a subject." : "Approved questions will appear here when available."} /> : <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.question}</p><p className="mt-1 text-xs text-slate-500">{item.subject?.name || "Subject not tagged"}{item.section ? ` · ${item.section}` : ""}{item.topic ? ` · ${item.topic}` : ""} · {item.difficulty || "medium"} · {item.marks ?? 1} mark(s)</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.approval_status || "draft"}</span></div><ol className="mt-2 list-decimal pl-5 text-sm text-slate-600">{(Array.isArray(item.options) ? item.options : []).map((option, index) => <li key={index}>{option}</li>)}</ol><div className="mt-2 flex flex-wrap items-center justify-between gap-2">{item.examination?.name && <p className="text-xs text-slate-500">Assessment: {item.examination.name}</p>}{canReview && item.approval_status !== "approved" && <button type="button" onClick={() => reviewQuestion(item.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve question</button>}{canReview && item.approval_status === "approved" && <button type="button" onClick={() => reviewQuestion(item.id, "draft")} className="rounded-lg border px-3 py-2 text-xs font-semibold">Return to draft</button>}</div></article>)}</div>}
  </PageContainer>;
}
